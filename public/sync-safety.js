(() => {
  const originalFetch = window.fetch.bind(window);
  const nativeConfirm = window.confirm.bind(window);

  let lastVersion = null;
  let lastStats = null;
  let lastSnapshot = null;
  let loadingSnapshot = null;

  const PERMIT_TTL_MS = 30000;

  const pendingPermits = {
    threads: new Map(),
    viewings: new Map(),
    accounts: new Map()
  };

  function showSafetyToast(message) {
    const region =
      document.querySelector(
        '#toastRegion'
      );

    if (!region) {
      console.warn(
        '[HTH Sync Safety]',
        message
      );
      return;
    }

    const node =
      document.createElement(
        'div'
      );

    node.className =
      'toast';

    node.textContent =
      message;

    region.appendChild(
      node
    );

    setTimeout(
      () =>
        node.remove(),
      3200
    );
  }

  function asArray(value) {
    return Array.isArray(
      value
    )
      ? value
      : [];
  }

  function normalizeKey(
    kind,
    value
  ) {
    const key =
      String(
        value ?? ''
      ).trim();

    if (!key) {
      return '';
    }

    return kind ===
      'accounts'
      ? key.toLowerCase()
      : key;
  }

  function archiveStats(
    payload
  ) {
    const accounts =
      asArray(
        payload?.accounts
      );

    const workCast =
      asArray(
        payload?.workCast
      );

    const viewings =
      asArray(
        payload?.viewings
      );

    const threads =
      asArray(
        payload?.threads
      );

    let viewingCast = 0;
    let posts = 0;
    let media = 0;

    for (
      const viewing of
      viewings
    ) {
      viewingCast +=
        asArray(
          viewing?.cast
        ).length;
    }

    for (
      const thread of
      threads
    ) {
      const threadPosts =
        asArray(
          thread?.posts
        );

      posts +=
        threadPosts.length;

      for (
        const post of
        threadPosts
      ) {
        media +=
          asArray(
            post?.media
          ).length;
      }
    }

    return {
      accounts:
        accounts.length,

      workCast:
        workCast.length,

      viewings:
        viewings.length,

      viewingCast,

      threads:
        threads.length,

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

  function snapshotFromPayload(
    payload
  ) {
    return {
      threads:
        new Set(
          asArray(
            payload?.threads
          )
            .map(
              item =>
                normalizeKey(
                  'threads',
                  item?.id
                )
            )
            .filter(
              Boolean
            )
        ),

      viewings:
        new Set(
          asArray(
            payload?.viewings
          )
            .map(
              item =>
                normalizeKey(
                  'viewings',
                  item?.id
                )
            )
            .filter(
              Boolean
            )
        ),

      accounts:
        new Set(
          asArray(
            payload?.accounts
          )
            .map(
              item =>
                normalizeKey(
                  'accounts',
                  item?.handle
                )
            )
            .filter(
              Boolean
            )
        )
    };
  }

  function rememberServerState(
    data
  ) {
    if (
      !data ||
      typeof data !==
        'object'
    ) {
      return;
    }

    if (
      typeof data._version ===
        'string' &&
      data._version
    ) {
      lastVersion =
        data._version;
    }

    if (
      data._stats &&
      typeof data._stats ===
        'object'
    ) {
      lastStats =
        data._stats;
    } else if (
      Array.isArray(
        data.accounts
      ) ||
      Array.isArray(
        data.viewings
      ) ||
      Array.isArray(
        data.threads
      )
    ) {
      lastStats =
        archiveStats(
          data
        );
    }

    if (
      Array.isArray(
        data.accounts
      ) &&
      Array.isArray(
        data.viewings
      ) &&
      Array.isArray(
        data.threads
      )
    ) {
      lastSnapshot =
        snapshotFromPayload(
          data
        );
    }
  }

  async function loadCurrentServerState() {
    if (
      loadingSnapshot
    ) {
      return loadingSnapshot;
    }

    loadingSnapshot =
      (async () => {
        try {
          const response =
            await originalFetch(
              '/api/archive',
              {
                method:
                  'GET',

                cache:
                  'no-store'
              }
            );

          if (
            !response.ok
          ) {
            return;
          }

          const data =
            await response
              .clone()
              .json();

          rememberServerState(
            data
          );
        } catch (
          error
        ) {
          console.error(
            'HTH sync safety snapshot failed:',
            error
          );
        } finally {
          loadingSnapshot =
            null;
        }
      })();

    return loadingSnapshot;
  }

  function permitDelete(
    kind,
    value
  ) {
    if (
      !pendingPermits[
        kind
      ]
    ) {
      return false;
    }

    const key =
      normalizeKey(
        kind,
        value
      );

    if (
      !key ||
      !lastVersion
    ) {
      return false;
    }

    pendingPermits[
      kind
    ].set(
      key,
      {
        version:
          lastVersion,

        expiresAt:
          Date.now() +
          PERMIT_TTL_MS
      }
    );

    return true;
  }

  function hasValidPermit(
    kind,
    key
  ) {
    const entry =
      pendingPermits[
        kind
      ]?.get(
        key
      );

    if (!entry) {
      return false;
    }

    if (
      entry.version !==
        lastVersion ||
      entry.expiresAt <
        Date.now()
    ) {
      pendingPermits[
        kind
      ].delete(
        key
      );

      return false;
    }

    return true;
  }

  function removedKeys(
    previousSet,
    nextSet
  ) {
    if (
      !previousSet
    ) {
      return [];
    }

    return [
      ...previousSet
    ].filter(
      key =>
        !nextSet.has(
          key
        )
    );
  }

  function getRemovals(
    nextSnapshot
  ) {
    return {
      threads:
        removedKeys(
          lastSnapshot
            ?.threads,
          nextSnapshot
            .threads
        ),

      viewings:
        removedKeys(
          lastSnapshot
            ?.viewings,
          nextSnapshot
            .viewings
        ),

      accounts:
        removedKeys(
          lastSnapshot
            ?.accounts,
          nextSnapshot
            .accounts
        )
    };
  }

  function unpermittedRemovals(
    removals
  ) {
    const blocked = {};

    for (
      const kind of
      [
        'threads',
        'viewings',
        'accounts'
      ]
    ) {
      blocked[kind] =
        removals[
          kind
        ].filter(
          key =>
            !hasValidPermit(
              kind,
              key
            )
        );
    }

    return blocked;
  }

  function hasAnyBlocked(
    blocked
  ) {
    return (
      blocked
        .threads
        .length >
        0 ||
      blocked
        .viewings
        .length >
        0 ||
      blocked
        .accounts
        .length >
        0
    );
  }

  function clearUsedPermits(
    removals
  ) {
    for (
      const kind of
      [
        'threads',
        'viewings',
        'accounts'
      ]
    ) {
      for (
        const key of
        removals[
          kind
        ]
      ) {
        pendingPermits[
          kind
        ].delete(
          key
        );
      }
    }
  }

  function syntheticError(
    message,
    code,
    detail = {}
  ) {
    return new Response(
      JSON.stringify({
        error:
          message,

        code,

        ...detail
      }),
      {
        status:
          409,

        headers: {
          'Content-Type':
            'application/json; charset=utf-8'
        }
      }
    );
  }

  function getRequestUrl(
    input
  ) {
    try {
      return new URL(
        typeof input ===
            'string' ||
          input instanceof URL
          ? input
          : input.url,

        window.location
          .href
      );
    } catch {
      return null;
    }
  }

  function getRequestMethod(
    input,
    init
  ) {
    return String(
      init?.method ||
        (
          input instanceof
          Request
            ? input.method
            : 'GET'
        )
    ).toUpperCase();
  }

  window.fetch =
    async (
      input,
      init = {}
    ) => {
      const url =
        getRequestUrl(
          input
        );

      if (
        !url ||
        url.origin !==
          window.location
            .origin ||
        url.pathname !==
          '/api/archive'
      ) {
        return originalFetch(
          input,
          init
        );
      }

      const method =
        getRequestMethod(
          input,
          init
        );

      if (
        method ===
        'GET'
      ) {
        const response =
          await originalFetch(
            input,
            init
          );

        if (
          response.ok
        ) {
          try {
            rememberServerState(
              await response
                .clone()
                .json()
            );
          } catch (
            error
          ) {
            console.error(
              'HTH sync safety could not read GET response:',
              error
            );
          }
        }

        return response;
      }

      if (
        method !==
        'PUT'
      ) {
        return originalFetch(
          input,
          init
        );
      }

      if (
        !lastVersion ||
        !lastSnapshot
      ) {
        await loadCurrentServerState();
      }

      if (
        !lastVersion ||
        !lastSnapshot
      ) {
        const message =
          '서버 기록 상태를 확인하지 못해서 저장을 중단했어요. 새로고침 후 다시 시도해 주세요.';

        showSafetyToast(
          message
        );

        return syntheticError(
          message,
          'ARCHIVE_STATE_UNKNOWN'
        );
      }

      let rawBody =
        init?.body;

      if (
        rawBody ==
          null &&
        input instanceof
          Request
      ) {
        try {
          rawBody =
            await input
              .clone()
              .text();
        } catch {}
      }

      let payload;

      try {
        payload =
          typeof rawBody ===
          'string'
            ? JSON.parse(
                rawBody
              )
            : rawBody;
      } catch {
        const message =
          '저장 데이터 형식을 확인할 수 없어 서버 동기화를 중단했어요.';

        showSafetyToast(
          message
        );

        return syntheticError(
          message,
          'ARCHIVE_INVALID_PAYLOAD'
        );
      }

      if (
        !payload ||
        typeof payload !==
          'object'
      ) {
        const message =
          '저장 데이터가 비어 있어 서버 동기화를 중단했어요.';

        showSafetyToast(
          message
        );

        return syntheticError(
          message,
          'ARCHIVE_INVALID_PAYLOAD'
        );
      }

      const nextStats =
        archiveStats(
          payload
        );

      const nextSnapshot =
        snapshotFromPayload(
          payload
        );

      const removals =
        getRemovals(
          nextSnapshot
        );

      const blocked =
        unpermittedRemovals(
          removals
        );

      if (
        hasAnyBlocked(
          blocked
        )
      ) {
        const message =
          '사용자가 삭제하지 않은 기존 기록이 사라지려 해서 서버 저장을 막았어요. 새로고침하면 서버 기록을 다시 불러올 수 있어요.';

        console.error(
          'HTH sync safety blocked unapproved deletion.',
          {
            previous:
              lastStats,

            next:
              nextStats,

            blocked
          }
        );

        showSafetyToast(
          message
        );

        return syntheticError(
          message,
          'ARCHIVE_UNAPPROVED_DELETE',
          {
            blocked
          }
        );
      }

      if (
        lastStats?.total >
          0 &&
        nextStats.total ===
          0
      ) {
        const message =
          '기존 기록 전체가 빈 데이터로 바뀌려 해서 서버 저장을 막았어요.';

        showSafetyToast(
          message
        );

        return syntheticError(
          message,
          'ARCHIVE_EMPTY_REPLACEMENT'
        );
      }

      const safePayload = {
        ...payload,

        _baseVersion:
          lastVersion,

        _deletePermit: {
          baseVersion:
            lastVersion,

          threads:
            removals
              .threads,

          viewings:
            removals
              .viewings,

          accounts:
            removals
              .accounts
        }
      };

      const headers =
        new Headers(
          input instanceof
          Request
            ? input.headers
            : undefined
        );

      new Headers(
        init?.headers ||
          {}
      ).forEach(
        (
          value,
          key
        ) => {
          headers.set(
            key,
            value
          );
        }
      );

      headers.set(
        'Content-Type',
        'application/json'
      );

      let response;

      try {
        response =
          await originalFetch(
            url.href,
            {
              ...init,

              method:
                'PUT',

              headers,

              body:
                JSON.stringify(
                  safePayload
                )
            }
          );
      } finally {
        clearUsedPermits(
          removals
        );
      }

      try {
        const data =
          await response
            .clone()
            .json();

        if (
          response.ok
        ) {
          rememberServerState(
            data
          );

          lastSnapshot =
            nextSnapshot;

          lastStats =
            data?._stats ||
            nextStats;
        } else if (
          response.status ===
            409 ||
          response.status ===
            428
        ) {
          const message =
            data?.error ||
            '기록 충돌 또는 안전장치 때문에 저장을 중단했어요.';

          showSafetyToast(
            message
          );

          console.warn(
            'HTH archive sync rejected:',
            data
          );
        }
      } catch {}

      return response;
    };

  /*
    타래 삭제는 app-patch.js 안에서 confirm()을 사용함.
    confirm에서 실제로 "확인"을 눌렀을 때만
    해당 타래에 1회 삭제 허가를 줌.
  */

  window.confirm =
    function(
      message
    ) {
      const result =
        nativeConfirm(
          message
        );

      if (
        result
      ) {
        const text =
          String(
            message ||
              ''
          );

        if (
          text.includes(
            '타래를 삭제할까요'
          ) ||
          text.includes(
            '삭제 후 복구할 수 없습니다'
          )
        ) {
          try {
            if (
              typeof routeParams !==
                'undefined' &&
              routeParams?.id
            ) {
              permitDelete(
                'threads',
                routeParams
                  .id
              );
            }
          } catch (
            error
          ) {
            console.warn(
              'HTH could not register thread delete permit:',
              error
            );
          }
        }
      }

      return result;
    };

  /*
    X 계정 삭제는 현재 confirm 없이 바로 실행되므로
    삭제 버튼 클릭 순간 정확한 계정만 1회 허가.
  */

  document.addEventListener(
    'click',
    event => {
      const accountButton =
        event.target
          .closest?.(
            '[data-remove-account]'
          );

      if (
        !accountButton
      ) {
        return;
      }

      try {
        if (
          typeof state ===
          'undefined'
        ) {
          return;
        }

        const index =
          Number(
            accountButton
              .dataset
              .removeAccount
          );

        const handle =
          state.accounts?.[
            index
          ]?.handle;

        if (
          handle
        ) {
          permitDelete(
            'accounts',
            handle
          );
        }
      } catch (
        error
      ) {
        console.warn(
          'HTH could not register account delete permit:',
          error
        );
      }
    },
    true
  );

  window.__HTH_SYNC_SAFETY__ =
    {
      getState() {
        return {
          version:
            lastVersion,

          stats:
            lastStats,

          snapshot:
            lastSnapshot
              ? {
                  threads: [
                    ...lastSnapshot
                      .threads
                  ],

                  viewings: [
                    ...lastSnapshot
                      .viewings
                  ],

                  accounts: [
                    ...lastSnapshot
                      .accounts
                  ]
                }
              : null
        };
      },

      async refresh() {
        await loadCurrentServerState();

        return this.getState();
      },

      permitDelete(
        kind,
        value
      ) {
        return permitDelete(
          kind,
          value
        );
      }
    };

  console.info(
    'HTH archive sync safety v2 enabled.'
  );
})();
