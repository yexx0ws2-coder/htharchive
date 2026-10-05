(() => {
  const originalFetch = window.fetch.bind(window);

  let lastVersion = null;
  let lastStats = null;
  let loadingSnapshot = null;

  function showSafetyToast(message) {
    const region = document.querySelector('#toastRegion');

    if (!region) {
      console.warn('[HTH Sync Safety]', message);
      return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    region.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function archiveStats(payload) {
    const accounts = asArray(payload?.accounts);
    const workCast = asArray(payload?.workCast);
    const viewings = asArray(payload?.viewings);
    const threads = asArray(payload?.threads);

    let viewingCast = 0;
    let posts = 0;
    let media = 0;

    for (const viewing of viewings) {
      viewingCast += asArray(viewing?.cast).length;
    }

    for (const thread of threads) {
      const threadPosts = asArray(thread?.posts);

      posts += threadPosts.length;

      for (const post of threadPosts) {
        media += asArray(post?.media).length;
      }
    }

    return {
      accounts: accounts.length,
      workCast: workCast.length,
      viewings: viewings.length,
      viewingCast,
      threads: threads.length,
      posts,
      media,
      total:
        accounts.length +
        workCast.length +
        viewings.length +
        viewingCast +
        threads.length +
        posts +
        media
    };
  }

  function rememberServerState(data) {
    if (!data || typeof data !== 'object') {
      return;
    }

    if (typeof data._version === 'string' && data._version) {
      lastVersion = data._version;
    }

    if (data._stats && typeof data._stats === 'object') {
      lastStats = data._stats;
    } else if (
      Array.isArray(data.accounts) ||
      Array.isArray(data.viewings) ||
      Array.isArray(data.threads)
    ) {
      lastStats = archiveStats(data);
    }
  }

  async function loadCurrentServerState() {
    if (loadingSnapshot) {
      return loadingSnapshot;
    }

    loadingSnapshot = (async () => {
      try {
        const response = await originalFetch('/api/archive', {
          method: 'GET',
          cache: 'no-store'
        });

        if (!response.ok) {
          return;
        }

        const data = await response.clone().json();

        rememberServerState(data);
      } catch (error) {
        console.error(
          'HTH sync safety snapshot failed:',
          error
        );
      } finally {
        loadingSnapshot = null;
      }
    })();

    return loadingSnapshot;
  }

  function suspiciousReplacement(previous, next) {
    if (!previous) {
      return null;
    }

    if (previous.total > 0 && next.total === 0) {
      return (
        '기존 기록이 있는데 빈 데이터로 덮어쓰려는 요청을 막았어요. ' +
        '새로고침하면 서버 기록을 다시 불러올 수 있어요.'
      );
    }

    if (
      previous.threads >= 2 &&
      next.threads === 0
    ) {
      return (
        `기존 타래 ${previous.threads}개가 한 번에 0개가 되려 해서 ` +
        '서버 동기화를 중단했어요.'
      );
    }

    if (
      previous.viewings >= 2 &&
      next.viewings === 0
    ) {
      return (
        `기존 관극 ${previous.viewings}개가 한 번에 0개가 되려 해서 ` +
        '서버 동기화를 중단했어요.'
      );
    }

    if (
      previous.posts >= 5 &&
      next.threads > 0 &&
      next.posts === 0
    ) {
      return (
        `기존 포스트 ${previous.posts}개가 한 번에 사라지려 해서 ` +
        '서버 동기화를 중단했어요.'
      );
    }

    if (
      previous.accounts >= 1 &&
      next.accounts === 0 &&
      (
        previous.threads > 0 ||
        previous.viewings > 0
      )
    ) {
      return (
        '기존 기록이 남아 있는데 계정 정보가 전부 사라지려 해서 ' +
        '서버 동기화를 중단했어요.'
      );
    }

    return null;
  }

  function syntheticError(message, code) {
    return new Response(
      JSON.stringify({
        error: message,
        code
      }),
      {
        status: 409,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }

  function getRequestUrl(input) {
    try {
      return new URL(
        typeof input === 'string' || input instanceof URL
          ? input
          : input.url,
        window.location.href
      );
    } catch {
      return null;
    }
  }

  function getRequestMethod(input, init) {
    return String(
      init?.method ||
      (
        input instanceof Request
          ? input.method
          : 'GET'
      )
    ).toUpperCase();
  }

  window.fetch = async (input, init = {}) => {
    const url = getRequestUrl(input);

    if (
      !url ||
      url.origin !== window.location.origin ||
      url.pathname !== '/api/archive'
    ) {
      return originalFetch(input, init);
    }

    const method = getRequestMethod(input, init);

    if (method === 'GET') {
      const response = await originalFetch(input, init);

      if (response.ok) {
        try {
          const data = await response.clone().json();
          rememberServerState(data);
        } catch (error) {
          console.error(
            'HTH sync safety could not read GET response:',
            error
          );
        }
      }

      return response;
    }

    if (method !== 'PUT') {
      return originalFetch(input, init);
    }

    if (!lastVersion) {
      await loadCurrentServerState();
    }

    if (!lastVersion) {
      const message =
        '서버 기록 버전을 확인하지 못해서 저장을 중단했어요. 새로고침 후 다시 시도해 주세요.';

      showSafetyToast(message);

      return syntheticError(
        message,
        'ARCHIVE_VERSION_UNKNOWN'
      );
    }

    let rawBody = init?.body;

    if (
      rawBody == null &&
      input instanceof Request
    ) {
      try {
        rawBody = await input.clone().text();
      } catch {}
    }

    let payload;

    try {
      payload =
        typeof rawBody === 'string'
          ? JSON.parse(rawBody)
          : rawBody;
    } catch {
      const message =
        '저장 데이터 형식을 확인할 수 없어 서버 동기화를 중단했어요.';

      showSafetyToast(message);

      return syntheticError(
        message,
        'ARCHIVE_INVALID_PAYLOAD'
      );
    }

    if (
      !payload ||
      typeof payload !== 'object'
    ) {
      const message =
        '저장 데이터가 비어 있어 서버 동기화를 중단했어요.';

      showSafetyToast(message);

      return syntheticError(
        message,
        'ARCHIVE_INVALID_PAYLOAD'
      );
    }

    const nextStats = archiveStats(payload);

    const suspicious =
      suspiciousReplacement(
        lastStats,
        nextStats
      );

    if (suspicious) {
      console.error(
        'HTH sync safety blocked a destructive snapshot.',
        {
          previous: lastStats,
          next: nextStats
        }
      );

      showSafetyToast(suspicious);

      return syntheticError(
        suspicious,
        'ARCHIVE_SAFETY_BLOCK'
      );
    }

    const safePayload = {
      ...payload,
      _baseVersion: lastVersion
    };

    const headers = new Headers(
      input instanceof Request
        ? input.headers
        : undefined
    );

    new Headers(
      init?.headers || {}
    ).forEach((value, key) => {
      headers.set(key, value);
    });

    headers.set(
      'Content-Type',
      'application/json'
    );

    const response = await originalFetch(
      url.href,
      {
        ...init,
        method: 'PUT',
        headers,
        body: JSON.stringify(safePayload)
      }
    );

    try {
      const data =
        await response.clone().json();

      if (response.ok) {
        rememberServerState(data);
      } else if (
        response.status === 409 ||
        response.status === 428
      ) {
        const message =
          data?.error ||
          '다른 탭의 변경사항과 충돌해서 저장을 중단했어요.';

        showSafetyToast(message);

        console.warn(
          'HTH archive sync rejected:',
          data
        );
      }
    } catch {}

    return response;
  };

  window.__HTH_SYNC_SAFETY__ = {
    getState() {
      return {
        version: lastVersion,
        stats: lastStats
      };
    },

    async refresh() {
      await loadCurrentServerState();

      return {
        version: lastVersion,
        stats: lastStats
      };
    }
  };

  console.info(
    'HTH archive sync safety enabled.'
  );
})();
