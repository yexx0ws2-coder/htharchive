(() => {
  /*
    HTH QA PATCH
    2026-10-09

    1. 타래: 실제 작성일 최신순
    2. 작품: 첫공일 최신순
    3. 모바일 한글 검색 IME 대응
       - 검색 입력 중 전체 DOM 재렌더 금지
       - composition 종료 후 결과 갱신
  */

  function workStartSort(a, b) {
    const aDate =
      (a?.seasonStart || '').trim();

    const bDate =
      (b?.seasonStart || '').trim();

    if (aDate && bDate) {
      return bDate.localeCompare(
        aDate
      );
    }

    if (aDate) {
      return -1;
    }

    if (bDate) {
      return 1;
    }

    return (
      a?.title || ''
    ).localeCompare(
      b?.title || '',
      'ko'
    );
  }

  function threadDateSort(a, b) {
    return (
      b?.createdAt || ''
    ).localeCompare(
      a?.createdAt || ''
    );
  }

  function visibleWorksSorted() {
    return (
      state.works || []
    )
      .filter(
        work =>
          work.id !==
          'etc'
      )
      .slice()
      .sort(
        workStartSort
      );
  }

  /*
    ─────────────────────────
    HOME
    ─────────────────────────
  */

  renderHome = function() {
    const recentWorks =
      visibleWorksSorted()
        .slice(
          0,
          4
        );

    const recentViewings =
      [
        ...(
          state.viewings ||
          []
        )
      ]
        .sort(
          (
            a,
            b
          ) =>
            (
              b.date ||
              ''
            ).localeCompare(
              a.date ||
              ''
            )
        )
        .slice(
          0,
          4
        );

    const recentThreads =
      [
        ...(
          state.threads ||
          []
        )
      ]
        .sort(
          threadDateSort
        )
        .slice(
          0,
          6
        );

    view.innerHTML = `
      <section class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">
              HTH Archive
            </div>

            <h1 class="page-title">
              했던 얘기, 또 찾기!
            </h1>

            <p class="page-sub">
              나만의 관극 감상 외장 드라이브
            </p>
          </div>

          <div class="toolbar">
            <button
              class="btn"
              data-action="new-viewing"
            >
              ＋ 새 관극
            </button>

            <button
              class="btn primary"
              data-action="open-add"
            >
              ＋ 기록 추가
            </button>
          </div>
        </div>

        <form
          class="hero-search"
          id="homeSearch"
        >
          <span>
            ⌕
          </span>

          <input
            id="homeSearchInput"
            placeholder="기록에서 단어, 문장 검색하기…"
            autocomplete="off"
          >

          <button
            class="search-go"
            aria-label="검색"
          >
            →
          </button>
        </form>

        <section class="section">
          <div class="section-head">
            <h2 class="section-title">
              최근 작품
            </h2>

            <button
              class="text-btn"
              data-route="library"
            >
              전체 보기 ›
            </button>
          </div>

          <div class="work-grid">
            ${
              recentWorks.length
                ? recentWorks
                    .map(
                      work =>
                        workCard(
                          work
                        )
                    )
                    .join('')
                : `
                  <div class="empty empty-action">
                    <b>
                      아직 등록된 작품이 없어요.
                    </b>

                    <span>
                      첫 작품을 추가하면 관극과 감상을 작품별로 모아볼 수 있어요.
                    </span>

                    <button
                      class="btn"
                      data-action="new-work"
                    >
                      ＋ 첫 작품 추가
                    </button>
                  </div>
                `
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="section-title">
              최근 관극
            </h2>

            <button
              class="text-btn"
              data-action="new-viewing"
            >
              ＋ 새 관극
            </button>
          </div>

          <div class="viewing-list">
            ${
              recentViewings.length
                ? recentViewings
                    .map(
                      viewing =>
                        viewingCard(
                          viewing
                        )
                    )
                    .join('')
                : `
                  <div class="empty">
                    아직 저장된 관극이 없어요.
                  </div>
                `
            }
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2 class="section-title">
              최근 백업된 타래
            </h2>

            <button
              class="text-btn"
              data-route="search"
            >
              검색으로 찾기 ›
            </button>
          </div>

          <div class="thread-grid">
            ${
              recentThreads.length
                ? recentThreads
                    .map(
                      thread =>
                        threadCard(
                          thread
                        )
                    )
                    .join('')
                : `
                  <div class="empty">
                    아직 백업된 타래가 없어요. 기록을 추가하면 여기에 나타나요.
                  </div>
                `
            }
          </div>
        </section>
      </section>
    `;

    bindCommon();

    $('#homeSearch')
      ?.addEventListener(
        'submit',
        event => {
          event.preventDefault();

          searchState.q =
            $(
              '#homeSearchInput'
            )?.value
              .trim() ||
            '';

          routeTo(
            'search'
          );
        }
      );
  };

  /*
    ─────────────────────────
    SEARCH
    ─────────────────────────
  */

  function searchFilteredThreads() {
    return (
      state.threads ||
      []
    )
      .filter(
        thread => {
          const query =
            (
              searchState.q ||
              ''
            )
              .toLowerCase();

          const queryOk =
            !query ||
            getThreadText(
              thread
            )
              .toLowerCase()
              .includes(
                query
              );

          const workOk =
            searchState.work ===
              'all' ||
            thread.workId ===
              searchState.work;

          const date =
            (
              thread.createdAt ||
              ''
            ).slice(
              0,
              10
            );

          const fromOk =
            !searchState.from ||
            date >=
              searchState.from;

          const toOk =
            !searchState.to ||
            date <=
              searchState.to;

          return (
            queryOk &&
            workOk &&
            fromOk &&
            toOk
          );
        }
      )
      .sort(
        threadDateSort
      );
  }

  renderSearch = function() {
    const filtered =
      searchFilteredThreads();

    view.innerHTML = `
      <section class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">
              Search
            </div>

            <h1 class="page-title">
              기록 검색
            </h1>

            <p class="page-sub">
              타래 제목과 내가 쓴 포스트 원문만 검색합니다.
              인용·친구 답글은 검색에서 제외돼요.
            </p>
          </div>
        </div>

        <div class="search-panel">
          <div class="search-box">
            <span>
              ⌕
            </span>

            <input
              id="searchInput"
              value="${esc(
                searchState.q
              )}"
              placeholder="원하는 단어, 문장, 키워드를 검색하세요!"
              autocomplete="off"
            >

            <button
              class="icon-btn"
              id="clearSearch"
              type="button"
            >
              ×
            </button>
          </div>

          <div class="filter-row">
            <select
              class="filter-select"
              id="workFilter"
            >
              <option value="all">
                작품 전체
              </option>

              ${
                visibleWorksSorted()
                  .map(
                    work => `
                      <option
                        value="${work.id}"
                        ${
                          searchState.work ===
                          work.id
                            ? 'selected'
                            : ''
                        }
                      >
                        ${esc(
                          work.title
                        )}
                      </option>
                    `
                  )
                  .join('')
              }
            </select>

            <input
              class="filter-select"
              type="date"
              id="fromFilter"
              value="${searchState.from}"
            >

            <input
              class="filter-select"
              type="date"
              id="toFilter"
              value="${searchState.to}"
            >
          </div>
        </div>

        <div class="results-meta">
          검색 결과 ${filtered.length}개
        </div>

        <div class="search-results">
          ${
            filtered.length
              ? filtered
                  .map(
                    resultCard
                  )
                  .join('')
              : `
                <div class="empty">
                  찾는 기록이 없어요. 다른 단어로 검색해볼까요?
                </div>
              `
          }
        </div>
      </section>
    `;

    bindCommon();

    const input =
      $('#searchInput');

    /*
      검색 input 자체는 절대로
      타이핑 도중 다시 만들지 않는다.

      모바일 한글 키보드의
      조합 중인 글자를 보호함.
    */

    const updateResults =
      () => {
        const next =
          searchFilteredThreads();

        const meta =
          $('.results-meta');

        const results =
          $('.search-results');

        if (meta) {
          meta.textContent =
            `검색 결과 ${next.length}개`;
        }

        if (!results) {
          return;
        }

        results.innerHTML =
          next.length
            ? next
                .map(
                  resultCard
                )
                .join('')
            : `
              <div class="empty">
                찾는 기록이 없어요. 다른 단어로 검색해볼까요?
              </div>
            `;

        $$(
          '[data-thread]',
          results
        ).forEach(
          element =>
            element.addEventListener(
              'click',
              () => {
                routeTo(
                  'thread',
                  {
                    id:
                      element
                        .dataset
                        .thread,

                    focus:
                      element
                        .dataset
                        .focus
                  }
                );
              }
            )
        );
      };

    let composing =
      false;

    input
      ?.addEventListener(
        'compositionstart',
        () => {
          composing =
            true;
        }
      );

    input
      ?.addEventListener(
        'compositionend',
        event => {
          composing =
            false;

          searchState.q =
            event.target
              .value;

          updateResults();
        }
      );

    input
      ?.addEventListener(
        'input',
        event => {
          searchState.q =
            event.target
              .value;

          if (
            !composing
          ) {
            updateResults();
          }
        }
      );

    $('#clearSearch')
      ?.addEventListener(
        'click',
        () => {
          searchState.q =
            '';

          if (
            input
          ) {
            input.value =
              '';
          }

          updateResults();

          input
            ?.focus();
        }
      );

    $('#workFilter')
      ?.addEventListener(
        'change',
        event => {
          searchState.work =
            event.target
              .value;

          renderSearch();
        }
      );

    $('#fromFilter')
      ?.addEventListener(
        'change',
        event => {
          searchState.from =
            event.target
              .value;

          renderSearch();
        }
      );

    $('#toFilter')
      ?.addEventListener(
        'change',
        event => {
          searchState.to =
            event.target
              .value;

          renderSearch();
        }
      );
  };

  /*
    ─────────────────────────
    LIBRARY
    ─────────────────────────
  */

  renderLibrary = function() {
    const works =
      visibleWorksSorted();

    view.innerHTML = `
      <section class="page">
        <div class="page-head">
          <div>
            <div class="eyebrow">
              Library
            </div>

            <h1 class="page-title">
              작품 목록
            </h1>

            <p class="page-sub">
              작품명·시즌·배우/배역·대표 아이콘은 언제든 가볍게 수정할 수 있어요.
            </p>
          </div>

          <div class="toolbar">
            <button
              class="btn"
              data-action="new-work"
            >
              ＋ 새 작품
            </button>

            <button
              class="btn primary"
              data-action="new-viewing"
            >
              ＋ 새 관극
            </button>
          </div>
        </div>

        <div class="library-grid">
          ${
            works.length
              ? works
                  .map(
                    work => {
                      const stats =
                        workStats(
                          work.id
                        );

                      const actors =
                        inferredWorkCast(
                          work.id
                        );

                      return `
                        <div class="library-card-shell">
                          <button
                            class="library-card"
                            data-work="${work.id}"
                          >
                            <span class="mini-icon">
                              ${esc(
                                work.icon ||
                                  '✦'
                              )}
                            </span>

                            <h3>
                              ${esc(
                                work.title
                              )}
                            </h3>

                            ${
                              seasonText(
                                work
                              )
                                ? `
                                  <div class="library-season">
                                    ${seasonText(
                                      work
                                    )}
                                  </div>
                                `
                                : ''
                            }

                            <div class="stat-row">
                              <span>
                                관극 ${stats.viewings}
                              </span>

                              <span>
                                타래 ${stats.threads}
                              </span>
                            </div>

                            <div
                              class="chips"
                              style="margin-top:14px"
                            >
                              ${
                                actors
                                  .slice(
                                    0,
                                    4
                                  )
                                  .map(
                                    actor => `
                                      <span class="chip accent">
                                        ${esc(
                                          actor.actor
                                        )}

                                        ${
                                          actor.role
                                            ? ` · ${esc(
                                                actor.role
                                              )}`
                                            : ''
                                        }
                                      </span>
                                    `
                                  )
                                  .join('')
                              }
                            </div>
                          </button>

                          <button
                            class="work-edit-btn"
                            data-action="edit-work"
                            data-work-id="${work.id}"
                            aria-label="${esc(
                              work.title
                            )} 작품 정보 수정"
                          >
                            ✎
                          </button>
                        </div>
                      `;
                    }
                  )
                  .join('')
              : `
                <div class="empty empty-action">
                  <b>
                    작품 보관함이 비어 있어요.
                  </b>

                  <span>
                    작품을 하나 추가해 아카이브를 시작해보세요.
                  </span>

                  <button
                    class="btn primary"
                    data-action="new-work"
                  >
                    ＋ 새 작품
                  </button>
                </div>
              `
          }
        </div>
      </section>
    `;

    bindCommon();
  };

  /*
    ─────────────────────────
    WORK DETAIL
    ─────────────────────────
  */

  renderWork = function(id) {
    const work =
      workBy(
        id
      );

    if (
      !work
    ) {
      routeTo(
        'library'
      );

      return;
    }

    const active =
      routeParams.tab ||
      'all';

    const viewings =
      (
        state.viewings ||
        []
      )
        .filter(
          viewing =>
            viewing.workId ===
            id
        )
        .sort(
          (
            a,
            b
          ) =>
            (
              b.date ||
              ''
            ).localeCompare(
              a.date ||
              ''
            )
        );

    /*
      핵심:
      백업 등록 순서가 아니라
      실제 트윗 작성일 기준.
    */

    const threads =
      (
        state.threads ||
        []
      )
        .filter(
          thread =>
            thread.workId ===
            id
        )
        .sort(
          threadDateSort
        );

    const actors =
      inferredWorkCast(
        id
      );

    const sections =
      [];

    if (
      active ===
        'all' ||
      active ===
        'viewings'
    ) {
      sections.push(`
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">
              관극 기록
            </h2>

            <button
              class="text-btn"
              data-action="new-viewing"
              data-work-id="${work.id}"
            >
              ＋ 새 관극
            </button>
          </div>

          <div class="viewing-list">
            ${
              viewings.length
                ? viewings
                    .map(
                      viewing =>
                        viewingCard(
                          viewing
                        )
                    )
                    .join('')
                : `
                  <div class="empty">
                    아직 연결된 관극이 없어요.
                  </div>
                `
            }
          </div>
        </section>
      `);
    }

    if (
      active ===
        'all' ||
      active ===
        'threads'
    ) {
      sections.push(`
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">
              이 작품의 타래
            </h2>
          </div>

          <div class="thread-grid">
            ${
              threads.length
                ? threads
                    .map(
                      thread =>
                        threadCard(
                          thread
                        )
                    )
                    .join('')
                : `
                  <div class="empty">
                    아직 저장된 타래가 없어요.
                  </div>
                `
            }
          </div>
        </section>
      `);
    }

    if (
      active ===
      'actors'
    ) {
      sections.push(`
        <section class="section">
          <div class="section-head">
            <h2 class="section-title">
              배우 · 배역
            </h2>

            <button
              class="text-btn"
              data-action="edit-work"
              data-work-id="${work.id}"
            >
              ✎ 작품 정보 수정
            </button>
          </div>

          <div class="actor-directory">
            ${
              actors.length
                ? actors
                    .map(
                      actor => `
                        <div class="actor-directory-row">
                          <b>
                            ${esc(
                              actor.actor
                            )}
                          </b>

                          <span>
                            ${esc(
                              actor.role ||
                                '배역 미지정'
                            )}
                          </span>
                        </div>
                      `
                    )
                    .join('')
                : `
                  <div class="empty">
                    아직 등록된 배우 정보가 없어요.
                  </div>
                `
            }
          </div>
        </section>
      `);
    }

    view.innerHTML = `
      <section class="page">
        <button
          class="detail-back"
          data-route="library"
        >
          ‹ 작품 목록
        </button>

        <div class="work-hero">
          <div class="work-hero-top">
            <div>
              <div class="eyebrow">
                Work Archive
              </div>

              <h1>
                ${esc(
                  work.title
                )}
              </h1>

              ${
                seasonText(
                  work
                )
                  ? `
                    <div class="season-line">
                      ${seasonText(
                        work
                      )}
                    </div>
                  `
                  : ''
              }
            </div>

            <button
              class="work-hero-edit"
              data-action="edit-work"
              data-work-id="${work.id}"
              aria-label="작품 정보 수정"
            >
              ✎
            </button>
          </div>

          <div class="hero-stats">
            <button
              data-work-tab="viewings"
              data-work-id="${work.id}"
            >
              관극 ${viewings.length}
            </button>

            <button
              data-work-tab="threads"
              data-work-id="${work.id}"
            >
              타래 ${threads.length}
            </button>

            <button
              data-work-tab="actors"
              data-work-id="${work.id}"
            >
              배우 ${actors.length}
            </button>
          </div>

          <div
            class="chips"
            style="margin-top:16px"
          >
            ${
              actors
                .slice(
                  0,
                  8
                )
                .map(
                  actor => `
                    <span class="chip">
                      ${esc(
                        actor.actor
                      )}

                      ${
                        actor.role
                          ? ` · ${esc(
                              actor.role
                            )}`
                          : ''
                      }
                    </span>
                  `
                )
                .join('')
            }
          </div>
        </div>

        <div class="tabs">
          <button
            class="tab ${
              active ===
              'all'
                ? 'is-active'
                : ''
            }"
            data-work-tab="all"
            data-work-id="${work.id}"
          >
            전체
          </button>

          <button
            class="tab ${
              active ===
              'viewings'
                ? 'is-active'
                : ''
            }"
            data-work-tab="viewings"
            data-work-id="${work.id}"
          >
            관극 ${viewings.length}
          </button>

          <button
            class="tab ${
              active ===
              'threads'
                ? 'is-active'
                : ''
            }"
            data-work-tab="threads"
            data-work-id="${work.id}"
          >
            타래 ${threads.length}
          </button>

          <button
            class="tab ${
              active ===
              'actors'
                ? 'is-active'
                : ''
            }"
            data-work-tab="actors"
            data-work-id="${work.id}"
          >
            배우
          </button>
        </div>

        ${sections.join('')}
      </section>
    `;

    bindCommon();
  };

  console.info(
    'HTH QA patch 2026-10-09 enabled.'
  );
})();
