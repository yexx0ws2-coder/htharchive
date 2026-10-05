(() => {
  const patchStyle = document.createElement('style');
  patchStyle.textContent = `
    .media-link-list{display:grid;gap:8px;margin-top:12px}
    .media-link{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;padding:11px 13px;border:1px solid var(--line,#e8e5ee);border-radius:12px;background:rgba(255,255,255,.55);color:inherit;text-decoration:none;font-size:13px}
    .media-link span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .media-link:hover{border-color:var(--accent,#9a8ed2)}
    .media-url-box textarea{min-height:76px;resize:vertical}
    .thread-header .thread-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    .thread-manage-posts{display:grid;gap:14px}
    .thread-manage-post{border:1px solid var(--line,#e8e5ee);border-radius:16px;padding:14px;display:grid;gap:12px;background:rgba(255,255,255,.35)}
    .thread-manage-post-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .thread-manage-post .field{margin:0}
    .thread-manage-danger{margin-top:10px;padding-top:18px;border-top:1px solid var(--line,#e8e5ee);display:flex;justify-content:space-between;gap:12px;align-items:center}
    .thread-manage-danger .btn{color:#a33}
    .thread-manage-viewings{display:flex;flex-wrap:wrap;gap:8px}
    .thread-manage-viewings .chip{cursor:pointer}
    .thread-manage-viewings input{margin-right:6px}
    .thread-manage-add-row{display:flex;gap:8px;flex-wrap:wrap}
  `;
  document.head.appendChild(patchStyle);

  const localPersist = persist;
  let archiveReady = false;
  let archiveSyncQueue = Promise.resolve();
  let archiveSyncErrorShown = false;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function cleanArchivePayload() {
    const workCast = (state.works || [])
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
      theater: viewing.theater || viewing.venue || '',
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
          ? { author: post.quote.author || '', text: post.quote.text || '' }
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
      while (
        document.documentElement.classList.contains('hth-auth-pending')
      ) {
        await sleep(60);
      }

      await sleep(180);
      await loadWorksFromDB();

      const response = await fetch('/api/archive');

      if (!response.ok) {
        throw new Error('서버 기록을 불러오지 못했어요.');
      }

      const archive = await response.json();

      state.accounts = Array.isArray(archive.accounts)
        ? archive.accounts
        : [];

      state.viewings = Array.isArray(archive.viewings)
        ? archive.viewings
        : [];

      state.threads = Array.isArray(archive.threads)
        ? archive.threads
        : [];

      const castByWork = new Map();

      for (
        const item of Array.isArray(archive.workCast)
          ? archive.workCast
          : []
      ) {
        const key = String(item.workId);

        if (!castByWork.has(key)) {
          castByWork.set(key, []);
        }

        castByWork.get(key).push({
          actor: item.actor || '',
          role: item.role || ''
        });
      }

      state.works = state.works.map(work => ({
        ...work,
        castPool:
          work.id === 'etc'
            ? []
            : castByWork.get(String(work.id)) || []
      }));

      archiveReady = true;

      try {
        localPersist();
      } catch (error) {
        console.error(
          'HTH local cache hydrate save failed:',
          error
        );
      }

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
      toast(
        '이미지 링크는 한 포스트에 최대 4개까지 저장할 수 있어요.'
      );
      return null;
    }

    const invalid = lines.find(
      url => !/^https?:\/\/\S+$/i.test(url)
    );

    if (invalid) {
      toast(
        '이미지 링크는 http:// 또는 https:// 주소로 입력해 주세요.'
      );
      return null;
    }

    return lines.map((url, i) => ({
      id: `link-${Date.now()}-${i}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      type: 'link',
      src: url,
      alt: `이미지 링크 ${i + 1}`,
      source: 'url',
      order: i
    }));
  }

  mediaGrid = function(media = []) {
    const links = media
      .filter(item =>
        /^https?:\/\//i.test(item?.src || '')
      )
      .slice(0, 4);

    if (!links.length) return '';

    return `
      <div class="media-link-list">
        ${links
          .map(
            (item, i) => `
          <a
            class="media-link"
            href="${esc(item.src)}"
            target="_blank"
            rel="noreferrer noopener"
          >
            <span>이미지 링크 ${i + 1}</span>
            <span>↗</span>
          </a>
        `
          )
          .join('')}
      </div>
    `;
  };

  threadCard = function(t) {
    const w = workBy(t.workId);

    const first =
      t.posts.find(p => p.owner)?.text || '';

    const linkCount = mediaCount(t);

    return `
      <button
        class="thread-card"
        data-thread="${t.id}"
      >
        <span class="thread-card-content">
          <span class="thread-top">
            <span class="work-label">
              ${esc(w?.title || '미분류')}
            </span>

            <span class="count-badge">
              ${t.posts.filter(p => p.owner).length} posts
              ${linkCount ? ` · 🔗 ${linkCount}` : ''}
            </span>
          </span>

          <h4>${esc(t.title)}</h4>
          <p>${esc(first)}</p>

          <span class="thread-foot">
            <span>
              ${esc(t.author)} ·
              ${fmtLongDate(t.createdAt)}
            </span>

            <span>
              ${
                t.source === 'x'
                  ? 'X 링크'
                  : '직접 추가'
              }
            </span>
          </span>
        </span>
      </button>
    `;
  };

  renderThread = function(id, focus) {
    const t = state.threads.find(
      x => x.id === id
    );

    if (!t) {
      routeTo('home');
      return;
    }

    const w =
      workBy(t.workId) ||
      workBy('etc') || {
        id: 'etc',
        title: '미분류'
      };

    const linkedViewings = (
      t.viewingIds || []
    )
      .map(viewingBy)
      .filter(Boolean);

    const backButton =
      w.id === 'etc'
        ? `
          <button
            class="detail-back"
            data-route="library"
          >
            ‹ 기록 목록
          </button>
        `
        : `
          <button
            class="detail-back"
            data-work="${w.id}"
          >
            ‹ ${esc(w.title)}
          </button>
        `;

    view.innerHTML = `
      <section class="page thread-detail">
        ${backButton}

        <div class="thread-header">
          <div class="thread-top">
            <span class="work-label">
              ${esc(w.title || '미분류')}
            </span>

            <div class="toolbar">
              <button
                class="btn"
                id="manageThread"
              >
                타래 관리
              </button>

              ${
                t.urls?.[0]
                  ? `
                    <a
                      class="btn"
                      href="${esc(t.urls[0])}"
                      target="_blank"
                      rel="noreferrer"
                    >
                      원문 ↗
                    </a>
                  `
                  : ''
              }
            </div>
          </div>

          <h1>${esc(t.title)}</h1>

          <div class="meta">
            ${esc(t.author)} ·
            ${fmtLongDate(t.createdAt)} ·
            ${
              t.posts.filter(p => p.owner).length
            } posts
          </div>

          ${
            linkedViewings.length
              ? `
                <div
                  class="chips"
                  style="margin-top:13px"
                >
                  ${linkedViewings
                    .map(
                      v => `
                    <span class="chip mint">
                      ${fmtDate(v.date)}
                      ${esc(v.session || '')}
                    </span>
                  `
                    )
                    .join('')}
                </div>
              `
              : ''
          }
        </div>

        <div class="thread-posts">
          ${t.posts
            .map((p, i) =>
              postView(p, i, focus)
            )
            .join('')}
        </div>
      </section>
    `;

    bindCommon();

    $('#manageThread')?.addEventListener(
      'click',
      () => openThreadManager(t.id)
    );

    if (focus != null) {
      setTimeout(
        () =>
          document
            .querySelector(
              `[data-post-index="${focus}"]`
            )
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            }),
        200
      );
    }
  };

  function threadDateValue(createdAt) {
    const raw = String(createdAt || '');

    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      return raw.slice(0, 10);
    }

    const d = new Date(
      createdAt || Date.now()
    );

    if (Number.isNaN(d.getTime())) {
      return new Date()
        .toISOString()
        .slice(0, 10);
    }

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }

  function managerDraftFromPost(post) {
    const owner = Boolean(post.owner);

    return {
      owner,
      text: post.text || '',
      author: post.author || '',
      quoteAuthor: owner
        ? post.quote?.author || ''
        : '',
      quoteText: owner
        ? post.quote?.text || ''
        : '',
      mediaRaw: owner
        ? (
            Array.isArray(post.media)
              ? post.media
              : []
          )
            .filter(item =>
              /^https?:\/\//i.test(
                item?.src || ''
              )
            )
            .slice(0, 4)
            .map(item => item.src)
            .join('\n')
        : ''
    };
  }

  function openThreadManager(threadId) {
    const t = state.threads.find(
      x => x.id === threadId
    );

    if (!t) {
      toast('타래를 찾지 못했어요.');
      return;
    }

    let draftPosts = (
      t.posts || []
    ).map(managerDraftFromPost);

    let selectedViewingIds = new Set(
      Array.isArray(t.viewingIds)
        ? t.viewingIds.map(String)
        : []
    );

    const workOptions = [
      state.works.find(
        w => w.id === 'etc'
      ),
      ...state.works.filter(
        w => w.id !== 'etc'
      )
    ]
      .filter(Boolean)
      .map(
        w => `
          <option
            value="${esc(String(w.id))}"
            ${
              String(w.id) ===
              String(t.workId)
                ? 'selected'
                : ''
            }
          >
            ${esc(w.title)}
          </option>
        `
      )
      .join('');

    modalLayer.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h2>타래 관리</h2>

          <button
            class="close-btn"
            data-close
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="field">
              <label>타래 제목</label>

              <input
                id="manageThreadTitle"
                value="${esc(
                  t.title || ''
                )}"
              >
            </div>

            <div class="field">
              <label>작품</label>

              <select id="manageThreadWork">
                ${workOptions}
              </select>

              <span class="field-hint">
                작품을 옮기면 새 작품과 맞지 않는
                관극 연결은 자동으로 해제돼요.
              </span>
            </div>

            <div class="field">
              <label>작성 계정</label>

              <input
                id="manageThreadAuthor"
                value="${esc(
                  t.author || ''
                )}"
                placeholder="@계정"
              >
            </div>

            <div class="field">
              <label>작성일</label>

              <input
                id="manageThreadDate"
                type="date"
                value="${threadDateValue(
                  t.createdAt
                )}"
              >
            </div>

            <div class="field">
              <label>관극 연결</label>

              <div
                id="manageThreadViewings"
                class="thread-manage-viewings"
              ></div>
            </div>

            <div class="field">
              <label>포스트</label>

              <div
                id="manageThreadPosts"
                class="thread-manage-posts"
              ></div>

              <div class="thread-manage-add-row">
                <button
                  type="button"
                  class="btn"
                  id="addOwnerPost"
                >
                  ＋ 내 포스트
                </button>

                <button
                  type="button"
                  class="btn"
                  id="addContextPost"
                >
                  ＋ 맥락 답글
                </button>
              </div>
            </div>

            <div class="thread-manage-danger">
              <button
                type="button"
                class="btn"
                id="deleteThread"
              >
                타래 삭제
              </button>

              <div class="footer-actions">
                <button
                  type="button"
                  class="btn"
                  data-close
                >
                  취소
                </button>

                <button
                  type="button"
                  class="btn primary"
                  id="saveThreadManager"
                >
                  변경사항 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    bindModalClose();

    function syncDraftPostsFromDom() {
      $$('#manageThreadPosts .thread-manage-post')
        .forEach(box => {
          const index = Number(
            box.dataset.index
          );

          const draft =
            draftPosts[index];

          if (!draft) return;

          draft.text =
            $('.manage-post-text', box)
              ?.value ?? '';

          if (draft.owner) {
            draft.quoteAuthor =
              $('.manage-quote-author', box)
                ?.value ?? '';

            draft.quoteText =
              $('.manage-quote-text', box)
                ?.value ?? '';

            draft.mediaRaw =
              $('.manage-media-urls', box)
                ?.value ?? '';
          } else {
            draft.author =
              $('.manage-context-author', box)
                ?.value ?? '';
          }
        });
    }

    function renderPostEditors() {
      const host =
        $('#manageThreadPosts');

      host.innerHTML = draftPosts.length
        ? draftPosts
            .map((p, index) =>
              p.owner
                ? `
                  <div
                    class="thread-manage-post"
                    data-index="${index}"
                  >
                    <div class="thread-manage-post-head">
                      <b>
                        POST ${
                          index + 1
                        } · 내 원문
                      </b>

                      <button
                        type="button"
                        class="mini-btn"
                        data-manager-remove="${index}"
                      >
                        삭제
                      </button>
                    </div>

                    <div class="field">
                      <label>본문</label>

                      <textarea
                        class="manage-post-text"
                      >${esc(
                        p.text
                      )}</textarea>
                    </div>

                    <div class="field media-url-box">
                      <label>
                        이미지 링크
                      </label>

                      <textarea
                        class="manage-media-urls"
                        placeholder="https://..."
                      >${esc(
                        p.mediaRaw
                      )}</textarea>

                      <span class="field-hint">
                        한 줄에 하나씩, 최대 4개.
                      </span>
                    </div>

                    <div class="field">
                      <label>
                        인용 작성자 (선택)
                      </label>

                      <input
                        class="manage-quote-author"
                        value="${esc(
                          p.quoteAuthor
                        )}"
                      >
                    </div>

                    <div class="field">
                      <label>
                        인용 내용 (선택)
                      </label>

                      <textarea
                        class="manage-quote-text"
                      >${esc(
                        p.quoteText
                      )}</textarea>
                    </div>
                  </div>
                `
                : `
                  <div
                    class="thread-manage-post"
                    data-index="${index}"
                  >
                    <div class="thread-manage-post-head">
                      <b>
                        POST ${
                          index + 1
                        } · 맥락 답글
                      </b>

                      <button
                        type="button"
                        class="mini-btn"
                        data-manager-remove="${index}"
                      >
                        삭제
                      </button>
                    </div>

                    <div class="field">
                      <label>작성자</label>

                      <input
                        class="manage-context-author"
                        value="${esc(
                          p.author
                        )}"
                        placeholder="@아이디"
                      >
                    </div>

                    <div class="field">
                      <label>본문</label>

                      <textarea
                        class="manage-post-text"
                      >${esc(
                        p.text
                      )}</textarea>
                    </div>
                  </div>
                `
            )
            .join('')
        : `
          <div class="empty">
            포스트가 없어요.
            아래 버튼으로 추가해 주세요.
          </div>
        `;

      $$(
        '[data-manager-remove]',
        host
      ).forEach(button => {
        button.addEventListener(
          'click',
          () => {
            syncDraftPostsFromDom();

            draftPosts.splice(
              Number(
                button.dataset
                  .managerRemove
              ),
              1
            );

            renderPostEditors();
          }
        );
      });
    }

    function captureViewingChecks() {
      selectedViewingIds = new Set(
        $$(
          '#manageThreadViewings input[name="threadViewing"]:checked'
        ).map(input => input.value)
      );
    }

    function renderViewingChoices() {
      const workId =
        $('#manageThreadWork').value;

      const list = (
        state.viewings || []
      )
        .filter(
          v =>
            String(v.workId) ===
            String(workId)
        )
        .sort((a, b) =>
          String(b.date || '').localeCompare(
            String(a.date || '')
          )
        );

      const validIds = new Set(
        list.map(v => String(v.id))
      );

      selectedViewingIds =
        new Set(
          [...selectedViewingIds].filter(
            id =>
              validIds.has(
                String(id)
              )
          )
        );

      $('#manageThreadViewings').innerHTML =
        list.length
          ? list
              .map(
                v => `
                  <label class="chip">
                    <input
                      type="checkbox"
                      name="threadViewing"
                      value="${esc(
                        String(v.id)
                      )}"
                      ${
                        selectedViewingIds.has(
                          String(v.id)
                        )
                          ? 'checked'
                          : ''
                      }
                    >

                    ${fmtDate(v.date)}
                    ${esc(v.session || '')}

                    ${
                      v.theater ||
                      v.venue
                        ? ` · ${esc(
                            v.theater ||
                              v.venue
                          )}`
                        : ''
                    }
                  </label>
                `
              )
              .join('')
          : `
            <span class="field-hint">
              이 작품에 연결할 관극이 없어요.
            </span>
          `;
    }

    renderPostEditors();
    renderViewingChoices();

    $('#manageThreadWork')
      .addEventListener(
        'change',
        () => {
          captureViewingChecks();
          renderViewingChoices();
        }
      );

    $('#addOwnerPost')
      .addEventListener(
        'click',
        () => {
          syncDraftPostsFromDom();

          draftPosts.push({
            owner: true,
            text: '',
            author: '',
            quoteAuthor: '',
            quoteText: '',
            mediaRaw: ''
          });

          renderPostEditors();

          setTimeout(
            () =>
              $$(
                '#manageThreadPosts .manage-post-text'
              )
                .at(-1)
                ?.focus(),
            0
          );
        }
      );

    $('#addContextPost')
      .addEventListener(
        'click',
        () => {
          syncDraftPostsFromDom();

          draftPosts.push({
            owner: false,
            text: '',
            author: '',
            quoteAuthor: '',
            quoteText: '',
            mediaRaw: ''
          });

          renderPostEditors();

          setTimeout(
            () =>
              $$(
                '#manageThreadPosts .manage-post-text'
              )
                .at(-1)
                ?.focus(),
            0
          );
        }
      );

    $('#saveThreadManager')
      .addEventListener(
        'click',
        () => {
          syncDraftPostsFromDom();
          captureViewingChecks();

          if (!draftPosts.length) {
            toast(
              '포스트를 한 개 이상 남겨 주세요.'
            );
            return;
          }

          if (
            draftPosts.some(
              p => !p.text.trim()
            )
          ) {
            toast(
              '빈 포스트가 있어요. 내용을 입력하거나 삭제해 주세요.'
            );
            return;
          }

          if (
            !draftPosts.some(
              p => p.owner
            )
          ) {
            toast(
              '내 원문 포스트를 한 개 이상 남겨 주세요.'
            );
            return;
          }

          const posts = [];

          for (const p of draftPosts) {
            if (p.owner) {
              const media =
                parseMediaUrls(
                  p.mediaRaw || ''
                );

              if (media === null) {
                return;
              }

              const quoteText =
                p.quoteText.trim();

              posts.push({
                owner: true,
                text: p.text.trim(),
                media,
                ...(quoteText
                  ? {
                      quote: {
                        author:
                          p.quoteAuthor.trim(),
                        text:
                          quoteText
                      }
                    }
                  : {})
              });
            } else {
              posts.push({
                owner: false,
                author:
                  p.author.trim() ||
                  '@context',
                text: p.text.trim(),
                context: true,
                media: []
              });
            }
          }

          const oldDate =
            threadDateValue(
              t.createdAt
            );

          const newDate =
            $('#manageThreadDate')
              .value || oldDate;

          const newWorkId =
            $('#manageThreadWork')
              .value || 'etc';

          const firstOwner =
            posts.find(
              p => p.owner
            );

          t.title =
            $('#manageThreadTitle')
              .value.trim() ||
            firstOwner.text.slice(
              0,
              34
            );

          t.workId =
            newWorkId;

          t.author =
            cleanHandle(
              $('#manageThreadAuthor')
                .value
            ) ||
            t.author ||
            '';

          t.viewingIds = [
            ...selectedViewingIds
          ];

          t.posts = posts;

          if (
            newDate !== oldDate
          ) {
            t.createdAt =
              `${newDate}T12:00:00.000Z`;
          }

          persist();
          closeModal();

          routeTo(
            'thread',
            { id: t.id }
          );

          toast(
            '타래를 수정했어요.'
          );
        }
      );

    $('#deleteThread')
      .addEventListener(
        'click',
        () => {
          const ok = confirm(
            `“${t.title}” 타래를 삭제할까요?\n삭제 후 복구할 수 없습니다.`
          );

          if (!ok) return;

          const destinationWorkId =
            t.workId;

          state.threads =
            state.threads.filter(
              thread =>
                thread.id !== t.id
            );

          persist();
          closeModal();

          toast(
            '타래를 삭제했어요.'
          );

          if (
            destinationWorkId &&
            destinationWorkId !==
              'etc' &&
            workBy(
              destinationWorkId
            )
          ) {
            routeTo(
              'work',
              {
                id:
                  destinationWorkId,
                tab: 'threads'
              }
            );
          } else {
            routeTo('home');
          }
        }
      );
  }

  openManual = function() {
    modalLayer.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h2>직접 추가하기</h2>

          <button
            class="close-btn"
            data-close
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <form
            class="form-grid"
            id="manualForm"
          >
            <div class="field">
              <label>작품</label>

              <select id="manualWork">
                <option value="etc">
                  미분류
                </option>

                ${state.works
                  .filter(
                    w =>
                      w.id !== 'etc'
                  )
                  .map(
                    w => `
                      <option
                        value="${w.id}"
                      >
                        ${esc(
                          w.title
                        )}
                      </option>
                    `
                  )
                  .join('')}
              </select>
            </div>

            <div class="field">
              <label>작성 계정</label>

              ${
                state.accounts.length
                  ? `
                    <select
                      id="manualAuthor"
                    >
                      ${accountOptions(
                        defaultAccount()
                          ?.handle ||
                          '',
                        false
                      )}
                    </select>
                  `
                  : `
                    <input
                      id="manualAuthor"
                      placeholder="@내계정 (선택)"
                    >
                  `
              }
            </div>

            <div class="field">
              <label>타래 제목</label>

              <input
                id="manualTitle"
                placeholder="예: 캐릭터 해석 메모"
              >
            </div>

            <div id="manualPosts"></div>

            <button
              type="button"
              class="btn"
              id="addManualPost"
            >
              ＋ 다음 포스트 추가
            </button>

            <div class="footer-actions">
              <button
                type="button"
                class="btn"
                data-close
              >
                취소
              </button>

              <button
                type="button"
                class="btn primary"
                id="saveManual"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    bindModalClose();

    let n = 0;

    function addEditor() {
      n++;

      const box =
        document.createElement(
          'div'
        );

      box.className =
        'post-editor';

      box.innerHTML = `
        <div class="post-editor-head">
          <b>POST ${n}</b>

          <div class="inline-actions">
            <button
              type="button"
              class="mini-btn"
              data-quote
            >
              ＋ 인용
            </button>

            <button
              type="button"
              class="mini-btn"
              data-context
            >
              ＋ 답글 맥락
            </button>

            ${
              n > 1
                ? `
                  <button
                    type="button"
                    class="mini-btn"
                    data-remove
                  >
                    삭제
                  </button>
                `
                : ''
            }
          </div>
        </div>

        <textarea
          class="manual-text"
          placeholder="텍스트를 붙여넣어 주세요…"
        ></textarea>

        <div class="field media-url-box">
          <label>
            이미지 링크 (선택)
          </label>

          <textarea
            class="manual-media-urls"
            placeholder="https://example.com/image-1.jpg&#10;https://example.com/image-2.jpg"
          ></textarea>

          <span class="field-hint">
            한 줄에 하나씩, 최대 4개.
            이미지는 HTH 안에서 불러오지 않고
            링크만 저장해요.
          </span>
        </div>

        <div class="manual-extras"></div>
      `;

      $('#manualPosts').append(
        box
      );

      $('[data-remove]', box)
        ?.addEventListener(
          'click',
          () => box.remove()
        );

      $('[data-quote]', box)
        .addEventListener(
          'click',
          () => {
            $('.manual-extras', box)
              .insertAdjacentHTML(
                'beforeend',
                `
                  <div class="extra-editor quote-editor">
                    <input
                      class="quote-author"
                      placeholder="인용 작성자 (선택)"
                    >

                    <textarea
                      class="quote-text"
                      placeholder="인용 내용을 붙여넣어 주세요"
                    ></textarea>
                  </div>
                `
              );
          }
        );

      $('[data-context]', box)
        .addEventListener(
          'click',
          () => {
            $('.manual-extras', box)
              .insertAdjacentHTML(
                'beforeend',
                `
                  <div class="extra-editor context-editor">
                    <input
                      class="context-author"
                      placeholder="답글 작성자 @아이디"
                    >

                    <textarea
                      class="context-text"
                      placeholder="맥락용 답글"
                    ></textarea>
                  </div>
                `
              );
          }
        );

      $('.manual-text', box)
        .focus();
    }

    addEditor();

    $('#addManualPost')
      .addEventListener(
        'click',
        addEditor
      );

    $('#saveManual')
      .addEventListener(
        'click',
        () => {
          const editors =
            $$(
              '#manualPosts .post-editor'
            );

          const posts = [];

          for (const box of editors) {
            const text =
              $('.manual-text', box)
                .value.trim();

            if (!text) continue;

            const media =
              parseMediaUrls(
                $(
                  '.manual-media-urls',
                  box
                )?.value || ''
              );

            if (media === null) {
              return;
            }

            const qText =
              $('.quote-text', box)
                ?.value.trim();

            const cText =
              $('.context-text', box)
                ?.value.trim();

            posts.push({
              owner: true,
              text,
              media,
              ...(qText
                ? {
                    quote: {
                      author:
                        $(
                          '.quote-author',
                          box
                        )?.value.trim() ||
                        '',
                      text:
                        qText
                    }
                  }
                : {})
            });

            if (cText) {
              posts.push({
                owner: false,
                author:
                  $(
                    '.context-author',
                    box
                  )?.value.trim() ||
                  '@context',
                text:
                  cText,
                context: true,
                media: []
              });
            }
          }

          if (
            !posts.some(
              p => p.owner
            )
          ) {
            toast(
              '포스트를 한 개 이상 입력해 주세요.'
            );
            return;
          }

          const firstOwner =
            posts.find(
              p => p.owner
            );

          const t = {
            id:
              't' +
              Date.now(),

            workId:
              $('#manualWork')
                ?.value ||
              'etc',

            viewingIds: [],

            title:
              $('#manualTitle')
                .value.trim() ||
              firstOwner.text.slice(
                0,
                34
              ),

            author:
              cleanHandle(
                $('#manualAuthor')
                  .value
              ) ||
              defaultAccount()
                ?.handle ||
              '',

            createdAt:
              new Date()
                .toISOString(),

            source:
              'manual',

            urls: [],

            posts
          };

          if (
            !Array.isArray(
              state.threads
            )
          ) {
            state.threads = [];
          }

          state.threads.unshift(
            t
          );

          persist();
          closeModal();

          toast(
            '기록을 저장했어요.'
          );

          routeTo(
            'thread',
            { id: t.id }
          );
        }
      );
  };

  openImportPreview = function() {
    const rawUrls =
      $('#importUrls')
        ?.value.trim() || '';

    if (!rawUrls) {
      toast(
        'X 타래 URL을 입력해 주세요.'
      );
      return;
    }

    const urls = rawUrls
      .split(/\n+/)
      .map(x => x.trim())
      .filter(Boolean);

    const valid =
      urls.every(u =>
        /(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/[^\/\s]+\/status\/\d+/i.test(
          u
        )
      );

    if (!valid) {
      toast(
        '올바른 X 게시물 URL인지 확인해 주세요.'
      );
      return;
    }

    modalLayer.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h2>링크 가져오기</h2>

          <button
            class="close-btn"
            data-close
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="setup-notice">
            <span class="setup-icon">
              ↗
            </span>

            <h3>
              X API 연결 전 단계예요.
            </h3>

            <p>
              X 개발자 앱과 OAuth를 연결하면
              실제 원문을 가져오고,
              첨부 이미지는 파일로 저장하거나
              화면에 직접 띄우지 않고
              원본 이미지 URL만 기록하게 됩니다.
            </p>

            <div class="footer-actions">
              <button
                class="btn"
                data-close
              >
                닫기
              </button>

              <button
                class="btn primary"
                id="goManual"
              >
                직접 추가하기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindModalClose();

    $('#goManual')
      ?.addEventListener(
        'click',
        openManual
      );
  };

  hydrateArchiveFromD1();
})();
