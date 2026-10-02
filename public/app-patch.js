(() => {
  const patchStyle = document.createElement('style');
  patchStyle.textContent = `
    .media-link-list {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }

    .media-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-width: 0;
      padding: 11px 13px;
      border: 1px solid var(--line, #e8e5ee);
      border-radius: 12px;
      background: rgba(255,255,255,.55);
      color: inherit;
      text-decoration: none;
      font-size: 13px;
    }

    .media-link span:first-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .media-link:hover {
      border-color: var(--accent, #9a8ed2);
    }

    .media-url-box textarea {
      min-height: 76px;
      resize: vertical;
    }
  `;
  document.head.appendChild(patchStyle);

  /*
   * D1 archive sync
   * 작품(works)은 기존 API를 그대로 사용하고,
   * 계정/작품 캐스트/관극/타래/포스트/이미지 URL은 /api/archive로 동기화합니다.
   */
  const localPersist = persist;
  let archiveReady = false;
  let archiveSyncQueue = Promise.resolve();
  let archiveSyncErrorShown = false;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function cleanArchivePayload() {
    const workCast = state.works
      .filter(work => work.id !== 'etc')
      .flatMap(work =>
        (Array.isArray(work.castPool) ? work.castPool : [])
          .filter(member => (member.actor || '').trim())
          .map((member, index) => ({
            workId: String(work.id),
            actor: member.actor || '',
            role: member.role || '',
            sortOrder: index
          }))
      );

    const accounts = (state.accounts || []).map((account, index) => ({
      id: account.id || `account-${index}`,
      handle: account.handle || '',
      label: account.label || '',
      isDefault: Boolean(account.isDefault)
    }));

    const viewings = (state.viewings || []).map(viewing => ({
      id: viewing.id,
      workId: viewing.workId || 'etc',
      date: viewing.date || '',
      session: viewing.session || '',
      theater: viewing.theater || '',
      cast: Array.isArray(viewing.cast)
        ? viewing.cast.map(member => ({
            actor: member.actor || '',
            role: member.role || ''
          }))
        : []
    }));

    const threads = (state.threads || []).map(thread => ({
      id: thread.id,
      workId: thread.workId || 'etc',
      viewingIds: Array.isArray(thread.viewingIds) ? thread.viewingIds : [],
      title: thread.title || '',
      author: thread.author || '',
      createdAt: thread.createdAt || new Date().toISOString(),
      source: thread.source || 'manual',
      urls: Array.isArray(thread.urls) ? thread.urls : [],
      posts: (Array.isArray(thread.posts) ? thread.posts : []).map(post => ({
        owner: Boolean(post.owner),
        author: post.author || '',
        text: post.text || '',
        context: Boolean(post.context),
        quote: post.quote
          ? {
              author: post.quote.author || '',
              text: post.quote.text || ''
            }
          : null,
        media: (Array.isArray(post.media) ? post.media : [])
          .filter(item => /^https?:\/\//i.test(item?.src || ''))
          .slice(0, 4)
          .map((item, index) => ({
            type: 'link',
            src: item.src,
            alt: item.alt || '',
            source: 'url',
            order: index
          }))
      }))
    }));

    return { accounts, workCast, viewings, threads };
  }

  async function pushArchiveSnapshot(payload) {
    const response = await fetch('/api/archive', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let message = '기록을 서버에 저장하지 못했어요.';
      try {
        const data = await response.json();
        if (data?.error) message = data.error;
      } catch {}
      throw new Error(message);
    }
  }

  function queueArchiveSync() {
    if (!archiveReady) return;

    const payload = JSON.parse(JSON.stringify(cleanArchivePayload()));

    archiveSyncQueue = archiveSyncQueue
      .catch(() => {})
      .then(() => pushArchiveSnapshot(payload))
      .then(() => {
        archiveSyncErrorShown = false;
      })
      .catch(error => {
        console.error('HTH D1 sync failed:', error);
        if (!archiveSyncErrorShown) {
          archiveSyncErrorShown = true;
          toast('서버 저장에 실패했어요. 인터넷 연결 후 다시 저장해 주세요.');
        }
      });
  }

 persist = function() {
  try {
    localPersist();
  } catch (error) {
    console.error('HTH local cache save failed:', error);
  }

  queueArchiveSync();
};

  async function hydrateArchiveFromD1() {
    try {
      // auth.js가 로그인 확인을 끝내고, 기존 boot()의 works 로딩도 끝날 시간을 줍니다.
      while (document.documentElement.classList.contains('hth-auth-pending')) {
        await sleep(60);
      }
      await sleep(180);

      // 항상 최신 작품 목록을 먼저 받은 뒤 castPool을 얹습니다.
      await loadWorksFromDB();

      const response = await fetch('/api/archive');
      if (!response.ok) {
        throw new Error('서버 기록을 불러오지 못했어요.');
      }

      const archive = await response.json();

      state.accounts = Array.isArray(archive.accounts) ? archive.accounts : [];
      state.viewings = Array.isArray(archive.viewings) ? archive.viewings : [];
      state.threads = Array.isArray(archive.threads) ? archive.threads : [];

      const castByWork = new Map();
      for (const item of Array.isArray(archive.workCast) ? archive.workCast : []) {
        const key = String(item.workId);
        if (!castByWork.has(key)) castByWork.set(key, []);
        castByWork.get(key).push({
          actor: item.actor || '',
          role: item.role || ''
        });
      }

      state.works = state.works.map(work => ({
        ...work,
        castPool: work.id === 'etc'
          ? []
          : (castByWork.get(String(work.id)) || [])
      }));

      archiveReady = true;
      localPersist();
      render();
    } catch (error) {
      console.error('HTH D1 hydrate failed:', error);
      toast('서버 기록을 불러오지 못했어요.');
    }
  }

  function parseMediaUrls(raw = '') {
    const lines = raw
      .split(/\n+/)
      .map(x => x.trim())
      .filter(Boolean);

    if (lines.length > 4) {
      toast('이미지 링크는 한 포스트에 최대 4개까지 저장할 수 있어요.');
      return null;
    }

    const invalid = lines.find(url => !/^https?:\/\/\S+$/i.test(url));

    if (invalid) {
      toast('이미지 링크는 http:// 또는 https:// 주소로 입력해 주세요.');
      return null;
    }

    return lines.map((url, i) => ({
      id: `link-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'link',
      src: url,
      alt: `이미지 링크 ${i + 1}`,
      source: 'url',
      order: i
    }));
  }

  // 이미지는 HTH 안에서 직접 로딩하지 않고 링크만 표시합니다.
  mediaGrid = function(media = []) {
    const links = media
      .filter(item => /^https?:\/\//i.test(item?.src || ''))
      .slice(0, 4);

    if (!links.length) return '';

    return `
      <div class="media-link-list">
        ${links.map((item, i) => `
          <a
            class="media-link"
            href="${esc(item.src)}"
            target="_blank"
            rel="noreferrer noopener"
          >
            <span>이미지 링크 ${i + 1}</span>
            <span>↗</span>
          </a>
        `).join('')}
      </div>
    `;
  };

  // 카드 썸네일도 만들지 않습니다.
  threadCard = function(t) {
    const w = workBy(t.workId);
    const first = t.posts.find(p => p.owner)?.text || '';
    const linkCount = mediaCount(t);

    return `
      <button class="thread-card" data-thread="${t.id}">
        <span class="thread-card-content">
          <span class="thread-top">
            <span class="work-label">${esc(w?.title || '미분류')}</span>
            <span class="count-badge">
              ${t.posts.filter(p => p.owner).length} posts
              ${linkCount ? ` · 🔗 ${linkCount}` : ''}
            </span>
          </span>
          <h4>${esc(t.title)}</h4>
          <p>${esc(first)}</p>
          <span class="thread-foot">
            <span>${esc(t.author)} · ${fmtLongDate(t.createdAt)}</span>
            <span>${t.source === 'x' ? 'X 링크' : '직접 추가'}</span>
          </span>
        </span>
      </button>
    `;
  };

  // 직접 추가: 이미지 파일 업로드 없이 URL만 저장합니다.
  openManual = function() {
    modalLayer.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h2>직접 추가하기</h2>
          <button class="close-btn" data-close>×</button>
        </div>

        <div class="modal-body">
          <form class="form-grid" id="manualForm">
            <div class="field">
              <label>작품</label>
              <select id="manualWork">
                <option value="etc">미분류</option>
                ${state.works
                  .filter(w => w.id !== 'etc')
                  .map(w => `<option value="${w.id}">${esc(w.title)}</option>`)
                  .join('')}
              </select>
            </div>

            <div class="field">
              <label>작성 계정</label>
              ${
                state.accounts.length
                  ? `<select id="manualAuthor">${accountOptions(defaultAccount()?.handle || '', false)}</select>`
                  : `<input id="manualAuthor" placeholder="@내계정 (선택)">`
              }
            </div>

            <div class="field">
              <label>타래 제목</label>
              <input id="manualTitle" placeholder="예: 캐릭터 해석 메모">
            </div>

            <div id="manualPosts"></div>

            <button type="button" class="btn" id="addManualPost">
              ＋ 다음 포스트 추가
            </button>

            <div class="footer-actions">
              <button type="button" class="btn" data-close>취소</button>
              <button type="button" class="btn primary" id="saveManual">저장</button>
            </div>
          </form>
        </div>
      </div>
    `;

    bindModalClose();

    let n = 0;

    function addEditor() {
      n++;

      const box = document.createElement('div');
      box.className = 'post-editor';

      box.innerHTML = `
        <div class="post-editor-head">
          <b>POST ${n}</b>
          <div class="inline-actions">
            <button type="button" class="mini-btn" data-quote>＋ 인용</button>
            <button type="button" class="mini-btn" data-context>＋ 답글 맥락</button>
            ${n > 1 ? '<button type="button" class="mini-btn" data-remove>삭제</button>' : ''}
          </div>
        </div>

        <textarea
          class="manual-text"
          placeholder="텍스트를 붙여넣어 주세요…"
        ></textarea>

        <div class="field media-url-box">
          <label>이미지 링크 (선택)</label>
          <textarea
            class="manual-media-urls"
            placeholder="https://example.com/image-1.jpg&#10;https://example.com/image-2.jpg"
          ></textarea>
          <span class="field-hint">
            한 줄에 하나씩, 최대 4개. 이미지는 HTH 안에서 불러오지 않고 링크만 저장해요.
          </span>
        </div>

        <div class="manual-extras"></div>
      `;

      $('#manualPosts').append(box);

      $('[data-remove]', box)?.addEventListener('click', () => box.remove());

      $('[data-quote]', box).addEventListener('click', () => {
        $('.manual-extras', box).insertAdjacentHTML(
          'beforeend',
          `
            <div class="extra-editor quote-editor">
              <input class="quote-author" placeholder="인용 작성자 (선택)">
              <textarea class="quote-text" placeholder="인용 내용을 붙여넣어 주세요"></textarea>
            </div>
          `
        );
      });

      $('[data-context]', box).addEventListener('click', () => {
        $('.manual-extras', box).insertAdjacentHTML(
          'beforeend',
          `
            <div class="extra-editor context-editor">
              <input class="context-author" placeholder="답글 작성자 @아이디">
              <textarea class="context-text" placeholder="맥락용 답글"></textarea>
            </div>
          `
        );
      });

      $('.manual-text', box).focus();
    }

    addEditor();
    $('#addManualPost').addEventListener('click', addEditor);

  $('#saveManual').addEventListener('click', () => {
  const editors = $$('.post-editor', '#manualPosts');
  const posts = [];

  for (const box of editors) {
    const text = $('.manual-text', box).value.trim();
    if (!text) continue;

    const media = parseMediaUrls(
      $('.manual-media-urls', box)?.value || ''
    );

    if (media === null) return;

    const qText = $('.quote-text', box)?.value.trim();
    const cText = $('.context-text', box)?.value.trim();

    posts.push({
      owner: true,
      text,
      media,
      ...(qText
        ? {
            quote: {
              author: $('.quote-author', box)?.value.trim() || '',
              text: qText
            }
          }
        : {})
    });

    if (cText) {
      posts.push({
        owner: false,
        author: $('.context-author', box)?.value.trim() || '@context',
        text: cText,
        context: true,
        media: []
      });
    }
  }

  if (!posts.some(p => p.owner)) {
    toast('포스트를 한 개 이상 입력해 주세요.');
    return;
  }

  const firstOwner = posts.find(p => p.owner);
  const title =
    $('#manualTitle').value.trim() ||
    firstOwner.text.slice(0, 34);

  const t = {
    id: 't' + Date.now(),
    workId: $('#manualWork').value,
    viewingIds: [],
    title,
    author:
      cleanHandle($('#manualAuthor').value) ||
      defaultAccount()?.handle ||
      '',
    createdAt: new Date().toISOString(),
    source: 'manual',
    urls: [],
    posts
  };

  state.threads.unshift(t);
  persist();
  closeModal();
  toast('기록을 저장했어요.');
  routeTo('thread', { id: t.id });
});
};

// X API가 붙기 전 안내. 이후에도 첨부 이미지는 URL만 기록합니다.
openImportPreview = function() {
  const rawUrls = $('#importUrls')?.value.trim() || '';

  if (!rawUrls) {
    toast('X 타래 URL을 입력해 주세요.');
    return;
  }

  const urls = rawUrls
    .split(/\n+/)
    .map(x => x.trim())
    .filter(Boolean);

  const valid = urls.every(u =>
    /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/[^\/\s]+\/status\/\d+/i.test(u)
  );

  if (!valid) {
    toast('올바른 X 게시물 URL인지 확인해 주세요.');
    return;
  }

  modalLayer.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h2>링크 가져오기</h2>
        <button class="close-btn" data-close>×</button>
      </div>

      <div class="modal-body">
        <div class="setup-notice">
          <span class="setup-icon">↗</span>
          <h3>X API 연결 전 단계예요.</h3>
          <p>
            X 개발자 앱과 OAuth를 연결하면 실제 원문을 가져오고,
            첨부 이미지는 파일로 저장하거나 화면에 직접 띄우지 않고
            원본 이미지 URL만 기록하게 됩니다.
          </p>

          <div class="footer-actions">
            <button class="btn" data-close>닫기</button>
            <button class="btn primary" id="goManual">직접 추가하기</button>
          </div>
        </div>
      </div>
    </div>
  `;

  bindModalClose();
  $('#goManual')?.addEventListener('click', openManual);
};

hydrateArchiveFromD1();
})();
