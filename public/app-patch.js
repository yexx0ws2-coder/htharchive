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

  // 이미지는 직접 렌더링하지 않고 URL 링크만 표시합니다.
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

  // 카드에서도 썸네일 이미지를 만들지 않습니다.
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

  // 직접 추가에서는 파일 업로드 대신 이미지 URL만 저장합니다.
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
            context: true
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
      toast('텍스트와 이미지 링크를 저장했어요.');
      routeTo('thread', { id: t.id });
    });
  };

  // X 가져오기도 향후 "첨부 이미지 파일 저장"이 아니라 "원본 URL 기록" 방향으로 안내합니다.
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

  // 이미 로그인된 상태에서 기존 화면이 먼저 그려졌어도 패치된 카드로 한 번 다시 렌더링합니다.
  queueMicrotask(() => {
    try {
      render();
    } catch (error) {
      console.debug('HTH app patch render skipped:', error);
    }
  });
})();
