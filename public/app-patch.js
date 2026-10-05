(() => {
  const patchStyle = document.createElement('style');

  patchStyle.textContent = `
    .media-link-list{
      display:grid;
      gap:8px;
      margin-top:12px
    }

    .media-link{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      min-width:0;
      padding:11px 13px;
      border:1px solid var(--line,#e8e5ee);
      border-radius:12px;
      background:rgba(255,255,255,.55);
      color:inherit;
      text-decoration:none;
      font-size:13px
    }

    .media-link span:first-child{
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap
    }

    .media-link:hover{
      border-color:var(--accent,#9a8ed2)
    }

    .media-url-box textarea{
      min-height:76px;
      resize:vertical
    }

    .thread-header .thread-top{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:12px
    }

    .thread-manage-posts{
      display:grid;
      gap:14px
    }

    .thread-manage-post{
      border:1px solid var(--line,#e8e5ee);
      border-radius:16px;
      padding:14px;
      display:grid;
      gap:12px;
      background:rgba(255,255,255,.35)
    }

    .thread-manage-post-head{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px
    }

    .thread-manage-post .field{
      margin:0
    }

    .thread-manage-danger{
      margin-top:10px;
      padding-top:18px;
      border-top:1px solid var(--line,#e8e5ee);
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:center
    }

    .thread-manage-danger > #deleteThread{
      color:#a33
    }

    .thread-manage-danger .footer-actions [data-close]{
      color:var(--accent-strong)
    }

    .thread-manage-danger .footer-actions #saveThreadManager{
      color:#fff
    }

    .thread-manage-viewings{
      display:flex;
      flex-wrap:wrap;
      gap:8px
    }

    .thread-manage-add-row{
      display:flex;
      gap:8px;
      flex-wrap:wrap
    }

    /* ─────────────────────────────
       관극 연결 pill
    ───────────────────────────── */

    .viewing-choice{
      position:relative;
      display:inline-flex !important;
      align-items:center;
      gap:8px;
      min-height:38px;
      padding:7px 13px 7px 9px !important;
      border:1px solid var(--line,#e4e1e9) !important;
      border-radius:999px !important;
      background:var(--surface,#fff) !important;
      color:var(--text,#242329);
      cursor:pointer;
      font-size:12px;
      line-height:1.35;
      transition:
        border-color .15s ease,
        background .15s ease,
        transform .15s ease;
    }

    .viewing-choice:hover{
      border-color:var(--accent,#9a8ed2) !important;
      transform:translateY(-1px)
    }

    .viewing-choice input{
      position:absolute;
      opacity:0;
      pointer-events:none;
      width:1px;
      height:1px;
      margin:0 !important
    }

    .viewing-choice::before{
      content:'+';
      flex:0 0 22px;
      width:22px;
      height:22px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:var(--surface-2,#f1eff5);
      color:var(--muted,#77727f);
      font-size:14px;
      font-weight:700
    }

    .viewing-choice:has(input:checked){
      border-color:var(--accent,#9a8ed2) !important;
      background:var(--accent-soft,#f0edff) !important
    }

    .viewing-choice:has(input:checked)::before{
      content:'✓';
      background:var(--accent,#8f7fea);
      color:#fff
    }

    .viewing-choice-main{
      display:flex;
      align-items:center;
      flex-wrap:wrap;
      gap:4px
    }

    .viewing-choice-main b{
      font-size:12px;
      font-weight:700
    }

    .viewing-choice-main span{
      color:var(--muted,#77727f);
      font-size:11px
    }

    /* ─────────────────────────────
       새 관극 - 캐스트/배역 UI
    ───────────────────────────── */

    .cast-role-line{
      display:grid !important;
      grid-template-columns:minmax(0,1fr) auto;
      gap:10px;
      align-items:center;
      padding:0 !important;
      border:0 !important;
      background:transparent !important
    }

    .cast-role-line .cast-row{
      display:grid !important;
      grid-template-columns:minmax(130px,.9fr) minmax(160px,1.1fr);
      gap:8px;
      align-items:stretch;
      min-width:0
    }

    .cast-role-line .actor-name{
      min-height:44px;
      display:flex;
      align-items:center;
      padding:0 14px;
      box-sizing:border-box;
      border:1px solid var(--line,#e4e1e9);
      border-radius:13px;
      background:var(--surface-2,#f4f2f8);
      color:var(--text,#242329);
      font-size:13px;
      font-weight:650;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap
    }

    .cast-role-line .role-input-wrap{
      position:relative;
      min-width:0
    }

    .cast-role-line .role-input-wrap input{
      width:100% !important;
      min-height:44px !important;
      box-sizing:border-box !important;
      padding:0 42px 0 14px !important;
      border:1px solid var(--line,#e4e1e9) !important;
      border-radius:13px !important;
      background:var(--surface,#fff) !important;
      color:var(--text,#242329) !important;
      font:inherit !important;
      font-size:13px !important;
      outline:none !important;
      box-shadow:none !important
    }

    .cast-role-line .role-input-wrap input:hover{
      border-color:#cbc5d8 !important
    }

    .cast-role-line .role-input-wrap input:focus{
      border-color:var(--accent,#9a8ed2) !important;
      box-shadow:0 0 0 3px rgba(143,127,234,.10) !important
    }

    .cast-role-line .auto-role-badge{
      position:absolute;
      right:10px;
      top:50%;
      transform:translateY(-50%);
      padding:3px 6px;
      border-radius:999px;
      background:var(--accent-soft,#f0edff);
      color:var(--accent-strong,#6d5be7);
      font-size:9px;
      pointer-events:none
    }

    .cast-role-line .cast-remove{
      width:42px;
      min-width:42px;
      height:42px;
      margin:0 !important;
      border-radius:12px !important;
      color:var(--muted,#8a8591)
    }

    /* ─────────────────────────────
       타래 상세 관극 + 캐스트
    ───────────────────────────── */

    .thread-viewings{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-top:13px
    }

    .thread-viewing-chip{
      display:inline-flex !important;
      align-items:center;
      flex-wrap:wrap;
      gap:5px;
      max-width:100%;
      padding:7px 11px !important;
      border-radius:999px !important;
      line-height:1.4
    }

    .thread-viewing-date{
      font-weight:700
    }

    .thread-viewing-cast{
      color:inherit;
      opacity:.78;
      font-size:10px
    }

    /* ─────────────────────────────
       X 수집기 설치 카드
    ───────────────────────────── */

    .collector-install-card{
      position:relative;
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      gap:22px;
      align-items:center;
      margin:22px 0 30px;
      padding:22px 24px;
      border:1px solid var(--line,#e5e2ea);
      border-radius:22px;
      background:
        linear-gradient(
          135deg,
          rgba(239,235,255,.82),
          rgba(255,255,255,.92) 52%,
          rgba(239,248,244,.72)
        );
      overflow:hidden
    }

    .collector-install-card::after{
      content:'';
      position:absolute;
      width:140px;
      height:140px;
      right:-55px;
      top:-70px;
      border-radius:50%;
      background:rgba(158,139,234,.09);
      pointer-events:none
    }

    .collector-install-copy{
      position:relative;
      z-index:1
    }

    .collector-install-eyebrow{
      display:inline-flex;
      align-items:center;
      gap:6px;
      margin-bottom:6px;
      color:var(--accent-strong,#6d5be7);
      font-size:10px;
      font-weight:800;
      letter-spacing:.04em;
      text-transform:uppercase
    }

    .collector-install-copy h3{
      margin:0;
      font-size:17px;
      line-height:1.35
    }

    .collector-install-copy p{
      margin:7px 0 0;
      max-width:650px;
      color:var(--muted,#77727f);
      font-size:12px;
      line-height:1.65
    }

    .collector-install-actions{
      position:relative;
      z-index:1;
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
      justify-content:flex-end
    }

    .collector-bookmarklet{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:7px;
      min-height:42px;
      padding:0 15px;
      border-radius:13px;
      border:1px solid var(--accent,#9a8ed2);
      background:var(--accent-soft,#f0edff);
      color:var(--accent-strong,#6754d8);
      font-size:12px;
      font-weight:800;
      text-decoration:none;
      cursor:grab;
      user-select:none
    }

    .collector-bookmarklet:active{
      cursor:grabbing
    }

    .collector-install-card.is-installed{
      grid-template-columns:minmax(0,1fr) auto;
      padding:16px 20px;
      margin-bottom:24px
    }

    .collector-install-card.is-installed .collector-install-copy p{
      margin-top:4px
    }

    .collector-install-steps{
      display:grid;
      gap:10px;
      margin:18px 0
    }

    .collector-install-step{
      display:grid;
      grid-template-columns:28px minmax(0,1fr);
      gap:10px;
      align-items:start;
      padding:12px 13px;
      border-radius:14px;
      background:var(--surface-2,#f6f4f9)
    }

    .collector-install-step > b{
      width:28px;
      height:28px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:var(--accent-soft,#f0edff);
      color:var(--accent-strong,#6754d8);
      font-size:11px
    }

    .collector-install-step div{
      font-size:12px;
      line-height:1.6
    }

    .collector-install-step small{
      display:block;
      margin-top:2px;
      color:var(--muted,#77727f);
      font-size:10px
    }

    .collector-install-drag{
      display:flex;
      justify-content:center;
      padding:18px 0 6px
    }

    .collector-install-drag .collector-bookmarklet{
      min-height:50px;
      padding:0 22px;
      border-radius:16px;
      font-size:14px;
      box-shadow:0 8px 24px rgba(117,99,207,.10)
    }

    .collector-security-note{
      margin-top:14px;
      padding:12px 14px;
      border:1px solid var(--line,#e5e2ea);
      border-radius:14px;
      color:var(--muted,#77727f);
      font-size:10px;
      line-height:1.6
    }

    /* ─────────────────────────────
       브라우저 가져오기
    ───────────────────────────── */

    .collector-json{
      min-height:210px;
      resize:vertical;
      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Monaco,
        Consolas,
        monospace;
      font-size:12px;
      line-height:1.6
    }

    .collector-note{
      border:1px solid var(--line,#e8e5ee);
      border-radius:16px;
      padding:14px;
      background:var(--surface-2,#f7f6fa);
      font-size:12px;
      line-height:1.65;
      color:var(--muted,#777)
    }

    .collector-note b{
      color:var(--text,#222)
    }

    .collector-preview{
      display:grid;
      gap:10px
    }

    .collector-post{
      border:1px solid var(--line,#e8e5ee);
      border-radius:16px;
      padding:14px;
      background:var(--surface,#fff);
      display:grid;
      gap:10px
    }

    .collector-post[data-mode="context"]{
      background:
        color-mix(
          in srgb,
          var(--accent-soft,#efecff) 42%,
          var(--surface,#fff)
        )
    }

    .collector-post[data-mode="exclude"]{
      opacity:.55
    }

    .collector-post-head{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px
    }

    .collector-post-meta{
      display:grid;
      gap:3px;
      min-width:0
    }

    .collector-post-meta b{
      font-size:12px
    }

    .collector-post-meta small{
      font-size:10px;
      color:var(--muted,#777);
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap
    }

    .collector-post-body{
      white-space:pre-wrap;
      font-size:13px;
      line-height:1.72
    }

    .collector-post-foot{
      display:flex;
      gap:8px;
      align-items:center;
      flex-wrap:wrap;
      color:var(--muted,#777);
      font-size:10px
    }

    .collector-mode{
      border:1px solid var(--line,#e8e5ee);
      background:var(--surface,#fff);
      border-radius:10px;
      padding:7px 9px;
      font-size:11px
    }

    .collector-summary{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-bottom:12px
    }

    @media (max-width:720px){
      .collector-install-card,
      .collector-install-card.is-installed{
        grid-template-columns:1fr
      }

      .collector-install-actions{
        justify-content:flex-start
      }

      .cast-role-line .cast-row{
        grid-template-columns:1fr
      }
    }
  `;

  document.head.appendChild(
    patchStyle
  );

  const localPersist =
    persist;

  let archiveReady =
    false;

  let archiveSyncQueue =
    Promise.resolve();

  let archiveSyncErrorShown =
    false;

  const HTH_COLLECTOR_BOOKMARKLET =
    `javascript:(()=>{if(window.__HTH_COLLECTOR__){window.__HTH_COLLECTOR__.show();return;}const S={posts:new Map(),seq:0,observer:null,panel:null};function info(a){const t=a.querySelector('time');const l=t?.closest('a[href*="/status/"]');const h=l?.getAttribute('href')||'';const m=h.match(/^\\/([^/]+)\\/status\\/(\\d+)/);if(!m)return null;return{handle:'@'+m[1],id:m[2],url:'https://x.com/'+m[1]+'/status/'+m[2],createdAt:t?.getAttribute('datetime')||''};}function scan(){document.querySelectorAll('article[data-testid="tweet"]').forEach(a=>{const meta=info(a);if(!meta||S.posts.has(meta.id))return;const texts=[...a.querySelectorAll('[data-testid="tweetText"]')];const text=texts[0]?.innerText?.trim()||'';if(!text)return;const media=[...a.querySelectorAll('img[src*="pbs.twimg.com/media/"]')].map(i=>i.src).filter(Boolean).filter((v,i,r)=>r.indexOf(v)===i).slice(0,4);let quote=null;if(texts.length>1){const qt=texts[1]?.innerText?.trim()||'';if(qt)quote={author:'',text:qt};}S.posts.set(meta.id,{...meta,text,media,quote,order:S.seq++});});update();}function update(){if(!S.panel)return;const c=S.panel.querySelector('[data-hth-count]');if(c)c.textContent=S.posts.size+'개 수집됨';}function copy(){const posts=[...S.posts.values()].sort((a,b)=>a.order-b.order).map(({order,...p})=>p);const payload={version:1,pageUrl:location.href,collectedAt:new Date().toISOString(),posts};const text=JSON.stringify(payload);navigator.clipboard?.writeText(text).then(()=>flash('복사 완료! HTH에 붙여넣기')).catch(()=>{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();flash('복사 완료! HTH에 붙여넣기');});}function flash(msg){const el=S.panel?.querySelector('[data-hth-msg]');if(!el)return;el.textContent=msg;setTimeout(()=>{if(el)el.textContent='';},2200);}function show(){if(S.panel){S.panel.style.display='block';return;}const p=document.createElement('div');p.id='hth-x-collector';p.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2147483647;width:260px;padding:14px;border-radius:16px;background:#fff;color:#222;border:1px solid #ddd;box-shadow:0 14px 40px rgba(0,0,0,.18);font:13px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';p.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>HTH 타래 수집</b><button data-hth-hide style="border:0;background:none;font-size:18px;cursor:pointer">×</button></div><div data-hth-count style="margin-top:8px;font-weight:700">0개 수집됨</div><div style="margin-top:5px;color:#777;font-size:11px">첫 글부터 끝까지 천천히 스크롤하세요.</div><div data-hth-msg style="min-height:18px;margin-top:8px;color:#6d5be7;font-size:11px"></div><div style="display:flex;gap:7px;margin-top:8px"><button data-hth-copy style="flex:1;border:0;border-radius:10px;padding:9px;background:#19191d;color:#fff;font-weight:700;cursor:pointer">JSON 복사</button><button data-hth-clear style="border:1px solid #ddd;border-radius:10px;padding:9px;background:#fff;cursor:pointer">초기화</button></div>';document.body.appendChild(p);S.panel=p;p.querySelector('[data-hth-hide]').onclick=()=>p.style.display='none';p.querySelector('[data-hth-copy]').onclick=copy;p.querySelector('[data-hth-clear]').onclick=()=>{S.posts.clear();S.seq=0;scan();flash('수집 목록 초기화');};update();}S.observer=new MutationObserver(()=>scan());S.observer.observe(document.body,{childList:true,subtree:true});S.show=show;S.scan=scan;S.copy=copy;window.__HTH_COLLECTOR__=S;show();scan();})();`;

  function sleep(ms) {
    return new Promise(
      resolve =>
        setTimeout(
          resolve,
          ms
        )
    );
  }

  function cleanArchivePayload() {
    const workCast =
      (
        state.works ||
        []
      )
        .filter(
          work =>
            work.id !==
            'etc'
        )
        .flatMap(
          work =>
            (
              Array.isArray(
                work.castPool
              )
                ? work.castPool
                : []
            )
              .filter(
                member =>
                  (
                    member.actor ||
                    ''
                  ).trim()
              )
              .map(
                (
                  member,
                  index
                ) => ({
                  workId:
                    String(
                      work.id
                    ),
                  actor:
                    member.actor ||
                    '',
                  role:
                    member.role ||
                    '',
                  sortOrder:
                    index
                })
              )
        );

    const accounts =
      (
        state.accounts ||
        []
      ).map(
        (
          account,
          index
        ) => ({
          id:
            account.id ||
            `account-${index}`,
          handle:
            account.handle ||
            '',
          label:
            account.label ||
            '',
          isDefault:
            Boolean(
              account.isDefault
            )
        })
      );

    const viewings =
      (
        state.viewings ||
        []
      ).map(
        viewing => ({
          id:
            viewing.id,

          workId:
            viewing.workId ||
            'etc',

          date:
            viewing.date ||
            '',

          session:
            viewing.session ||
            '',

          theater:
            viewing.theater ||
            viewing.venue ||
            '',

          cast:
            Array.isArray(
              viewing.cast
            )
              ? viewing.cast.map(
                  member => ({
                    actor:
                      member.actor ||
                      '',
                    role:
                      member.role ||
                      ''
                  })
                )
              : []
        })
      );

    const threads =
      (
        state.threads ||
        []
      ).map(
        thread => ({
          id:
            thread.id,

          workId:
            thread.workId ||
            'etc',

          viewingIds:
            Array.isArray(
              thread.viewingIds
            )
              ? thread.viewingIds
              : [],

          title:
            thread.title ||
            '',

          author:
            thread.author ||
            '',

          createdAt:
            thread.createdAt ||
            new Date()
              .toISOString(),

          source:
            thread.source ||
            'manual',

          urls:
            Array.isArray(
              thread.urls
            )
              ? thread.urls
              : [],

          posts:
            (
              Array.isArray(
                thread.posts
              )
                ? thread.posts
                : []
            ).map(
              post => ({
                owner:
                  Boolean(
                    post.owner
                  ),

                author:
                  post.author ||
                  '',

                text:
                  post.text ||
                  '',

                context:
                  Boolean(
                    post.context
                  ),

                quote:
                  post.quote
                    ? {
                        author:
                          post.quote
                            .author ||
                          '',
                        text:
                          post.quote
                            .text ||
                          ''
                      }
                    : null,

                media:
                  (
                    Array.isArray(
                      post.media
                    )
                      ? post.media
                      : []
                  )
                    .filter(
                      item =>
                        /^https?:\/\//i.test(
                          item?.src ||
                            ''
                        )
                    )
                    .slice(
                      0,
                      4
                    )
                    .map(
                      (
                        item,
                        index
                      ) => ({
                        type:
                          'link',
                        src:
                          item.src,
                        alt:
                          item.alt ||
                          '',
                        source:
                          'url',
                        order:
                          index
                      })
                    )
              })
            )
        })
      );

    return {
      accounts,
      workCast,
      viewings,
      threads
    };
  }

  async function pushArchiveSnapshot(
    payload
  ) {
    const response =
      await fetch(
        '/api/archive',
        {
          method:
            'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    if (
      !response.ok
    ) {
      let message =
        '기록을 서버에 저장하지 못했어요.';

      try {
        const data =
          await response.json();

        if (
          data?.error
        ) {
          message =
            data.error;
        }
      } catch {}

      throw new Error(
        message
      );
    }
  }

  function queueArchiveSync() {
    if (
      !archiveReady
    ) {
      return;
    }

    const payload =
      JSON.parse(
        JSON.stringify(
          cleanArchivePayload()
        )
      );

    archiveSyncQueue =
      archiveSyncQueue
        .catch(
          () => {}
        )
        .then(
          () =>
            pushArchiveSnapshot(
              payload
            )
        )
        .then(
          () => {
            archiveSyncErrorShown =
              false;
          }
        )
        .catch(
          error => {
            console.error(
              'HTH D1 sync failed:',
              error
            );

            if (
              !archiveSyncErrorShown
            ) {
              archiveSyncErrorShown =
                true;

              toast(
                '서버 저장에 실패했어요. 인터넷 연결 후 다시 저장해 주세요.'
              );
            }
          }
        );
  }

  persist = function() {
    try {
      localPersist();
    } catch (error) {
      console.error(
        'HTH local cache save failed:',
        error
      );
    }

    queueArchiveSync();
  };

  async function hydrateArchiveFromD1() {
    try {
      while (
        document
          .documentElement
          .classList
          .contains(
            'hth-auth-pending'
          )
      ) {
        await sleep(
          60
        );
      }

      await sleep(
        180
      );

      await loadWorksFromDB();

      const response =
        await fetch(
          '/api/archive'
        );

      if (
        !response.ok
      ) {
        throw new Error(
          '서버 기록을 불러오지 못했어요.'
        );
      }

      const archive =
        await response.json();

      state.accounts =
        Array.isArray(
          archive.accounts
        )
          ? archive.accounts
          : [];

      state.viewings =
        Array.isArray(
          archive.viewings
        )
          ? archive.viewings
          : [];

      state.threads =
        Array.isArray(
          archive.threads
        )
          ? archive.threads
          : [];

      const castByWork =
        new Map();

      for (
        const item of
        Array.isArray(
          archive.workCast
        )
          ? archive.workCast
          : []
      ) {
        const key =
          String(
            item.workId
          );

        if (
          !castByWork.has(
            key
          )
        ) {
          castByWork.set(
            key,
            []
          );
        }

        castByWork
          .get(
            key
          )
          .push({
            actor:
              item.actor ||
              '',
            role:
              item.role ||
              ''
          });
      }

      state.works =
        state.works.map(
          work => ({
            ...work,

            castPool:
              work.id ===
              'etc'
                ? []
                : castByWork.get(
                    String(
                      work.id
                    )
                  ) ||
                  []
          })
        );

      archiveReady =
        true;

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
      console.error(
        'HTH D1 hydrate failed:',
        error
      );

      toast(
        '서버 기록을 불러오지 못했어요.'
      );
    }
  }

  function parseMediaUrls(
    raw = ''
  ) {
    const lines =
      raw
        .split(
          /\n+/
        )
        .map(
          x =>
            x.trim()
        )
        .filter(
          Boolean
        );

    if (
      lines.length >
      4
    ) {
      toast(
        '이미지 링크는 한 포스트에 최대 4개까지 저장할 수 있어요.'
      );

      return null;
    }

    const invalid =
      lines.find(
        url =>
          !/^https?:\/\/\S+$/i.test(
            url
          )
      );

    if (
      invalid
    ) {
      toast(
        '이미지 링크는 http:// 또는 https:// 주소로 입력해 주세요.'
      );

      return null;
    }

    return lines.map(
      (
        url,
        i
      ) => ({
        id:
          `link-${Date.now()}-${i}-${Math.random()
            .toString(
              36
            )
            .slice(
              2,
              7
            )}`,

        type:
          'link',

        src:
          url,

        alt:
          `이미지 링크 ${i + 1}`,

        source:
          'url',

        order:
          i
      })
    );
  }

  function collectorHandle(
    value = ''
  ) {
    const raw =
      String(
        value ||
          ''
      ).trim();

    if (
      !raw
    ) {
      return '';
    }

    const match =
      raw.match(
        /@?([A-Za-z0-9_]{1,15})/
      );

    return match
      ? `@${match[1]}`
      : cleanHandle(
          raw
        );
  }

  function normalizeCollectorMedia(
    value
  ) {
    const list =
      Array.isArray(
        value
      )
        ? value
        : [];

    const urls =
      [];

    for (
      const item of
      list
    ) {
      const url =
        typeof item ===
        'string'
          ? item.trim()
          : String(
              item?.url ||
                item?.src ||
                ''
            ).trim();

      if (
        /^https?:\/\/\S+$/i.test(
          url
        ) &&
        !urls.includes(
          url
        )
      ) {
        urls.push(
          url
        );
      }

      if (
        urls.length >=
        4
      ) {
        break;
      }
    }

    return urls;
  }

  function normalizeCollectorQuote(
    value
  ) {
    if (
      !value ||
      typeof value !==
        'object'
    ) {
      return null;
    }

    const text =
      String(
        value.text ||
          value.body ||
          ''
      ).trim();

    if (
      !text
    ) {
      return null;
    }

    return {
      author:
        collectorHandle(
          value.author ||
            value.handle ||
            ''
        ),

      text
    };
  }

  function parseCollectorPayload(
    raw
  ) {
    let parsed;

    try {
      parsed =
        JSON.parse(
          raw
        );
    } catch {
      throw new Error(
        '수집 데이터가 JSON 형식이 아니에요.'
      );
    }

    const sourcePosts =
      Array.isArray(
        parsed
      )
        ? parsed
        : Array.isArray(
            parsed?.posts
          )
          ? parsed.posts
          : [];

    if (
      !sourcePosts.length
    ) {
      throw new Error(
        '수집된 포스트가 없어요.'
      );
    }

    const seen =
      new Set();

    const posts =
      [];

    for (
      const item of
      sourcePosts
    ) {
      if (
        !item ||
        typeof item !==
          'object'
      ) {
        continue;
      }

      const text =
        String(
          item.text ||
            item.body ||
            ''
        ).trim();

      const url =
        String(
          item.url ||
            item.href ||
            ''
        ).trim();

      const id =
        String(
          item.id ||
            item.statusId ||
            ''
        ).trim();

      const author =
        collectorHandle(
          item.author ||
            item.handle ||
            item.username ||
            ''
        );

      const createdAt =
        String(
          item.createdAt ||
            item.datetime ||
            item.date ||
            ''
        ).trim();

      if (
        !text
      ) {
        continue;
      }

      const dedupeKey =
        id ||
        url ||
        `${author}|${createdAt}|${text}`;

      if (
        seen.has(
          dedupeKey
        )
      ) {
        continue;
      }

      seen.add(
        dedupeKey
      );

      posts.push({
        id,

        url:
          /^https?:\/\//i.test(
            url
          )
            ? url
            : '',

        author,

        text,

        createdAt,

        media:
          normalizeCollectorMedia(
            item.media ||
              item.images ||
              []
          ),

        quote:
          normalizeCollectorQuote(
            item.quote ||
              item.quoted ||
              null
          )
      });
    }

    if (
      !posts.length
    ) {
      throw new Error(
        '본문이 있는 포스트를 찾지 못했어요.'
      );
    }

    return {
      version:
        parsed?.version ||
        1,

      pageUrl:
        /^https?:\/\//i.test(
          String(
            parsed?.pageUrl ||
              ''
          )
        )
          ? String(
              parsed.pageUrl
            )
          : '',

      collectedAt:
        String(
          parsed?.collectedAt ||
            ''
        ),

      posts
    };
  }

  function mediaFromCollector(
    urls
  ) {
    return normalizeCollectorMedia(
      urls
    ).map(
      (
        url,
        index
      ) => ({
        id:
          `x-link-${Date.now()}-${index}-${Math.random()
            .toString(
              36
            )
            .slice(
              2,
              7
            )}`,

        type:
          'link',

        src:
          url,

        alt:
          `X 첨부 이미지 링크 ${index + 1}`,

        source:
          'url',

        order:
          index
      })
    );
  }

  function viewingCastText(
    viewing
  ) {
    const cast =
      Array.isArray(
        viewing?.cast
      )
        ? viewing.cast
        : [];

    return cast
      .filter(
        member =>
          (
            member.actor ||
            ''
          ).trim()
      )
      .map(
        member => {
          const actor =
            (
              member.actor ||
              ''
            ).trim();

          const role =
            (
              member.role ||
              ''
            ).trim();

          return role
            ? `${actor} ${role}`
            : actor;
        }
      )
      .join(
        ' · '
      );
  }

  async function copyCollectorCode() {
    try {
      await navigator.clipboard.writeText(
        HTH_COLLECTOR_BOOKMARKLET
      );

      toast(
        '수집기 코드를 복사했어요.'
      );
    } catch {
      const textarea =
        document.createElement(
          'textarea'
        );

      textarea.value =
        HTH_COLLECTOR_BOOKMARKLET;

      textarea.style.position =
        'fixed';

      textarea.style.opacity =
        '0';

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand(
        'copy'
      );

      textarea.remove();

      toast(
        '수집기 코드를 복사했어요.'
      );
    }
  }

  function bindBookmarkletLink(
    link
  ) {
    if (
      !link
    ) {
      return;
    }

    link.setAttribute(
      'href',
      HTH_COLLECTOR_BOOKMARKLET
    );

    link.setAttribute(
      'draggable',
      'true'
    );

    link.addEventListener(
      'click',
      event => {
        event.preventDefault();

        toast(
          '이 버튼을 북마크바로 끌어다 놓아 주세요.'
        );
      }
    );

    link.addEventListener(
      'dragstart',
      event => {
        event.dataTransfer?.setData(
          'text/uri-list',
          HTH_COLLECTOR_BOOKMARKLET
        );

        event.dataTransfer?.setData(
          'text/plain',
          HTH_COLLECTOR_BOOKMARKLET
        );
      }
    );
  }

  function openCollectorInstallGuide() {
    modalLayer.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h2>
            HTH X 수집기 설치
          </h2>

          <button
            class="close-btn"
            data-close
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="collector-note">
            수집기는 X에서
            <b>
              현재 브라우저에 표시된 포스트
            </b>
            만 읽어요.
            X 비밀번호나 로그인 정보는 가져오지 않습니다.
          </div>

          <div
            class="collector-install-steps"
          >
            <div
              class="collector-install-step"
            >
              <b>1</b>

              <div>
                북마크바를 켜 주세요.

                <small>
                  Mac:
                  ⌘ + Shift + B
                  · Windows:
                  Ctrl + Shift + B
                </small>
              </div>
            </div>

            <div
              class="collector-install-step"
            >
              <b>2</b>

              <div>
                아래
                <strong>
                  HTH 수집
                </strong>
                버튼을
                북마크바로 끌어다 놓으세요.

                <small>
                  Chrome / Whale / Edge 등
                  Chromium 브라우저 권장
                </small>
              </div>
            </div>

            <div
              class="collector-install-drag"
            >
              <a
                class="collector-bookmarklet"
                id="collectorInstallBookmarklet"
                href="#"
              >
                ☷ HTH 수집
              </a>
            </div>

            <div
              class="collector-install-step"
            >
              <b>3</b>

              <div>
                X 타래 첫 글을 연 뒤
                북마크바의
                <strong>
                  HTH 수집
                </strong>
                을 누르고,
                타래 끝까지 스크롤하세요.

                <small>
                  마지막에 JSON 복사 →
                  HTH 브라우저 가져오기에 붙여넣기
                </small>
              </div>
            </div>
          </div>

          <div
            class="collector-security-note"
          >
            드래그 설치가 되지 않으면
            일반 북마크를 하나 만든 뒤
            URL을 지우고
            ‘수집기 코드 복사’로 복사한 코드를
            URL 칸에 붙여넣어도 됩니다.
          </div>

          <div
            class="footer-actions"
          >
            <button
              type="button"
              class="btn"
              id="copyCollectorCode"
            >
              수집기 코드 복사
            </button>

            <button
              type="button"
              class="btn primary"
              id="collectorInstalled"
            >
              설치 완료
            </button>
          </div>
        </div>
      </div>
    `;

    bindModalClose();

    bindBookmarkletLink(
      $(
        '#collectorInstallBookmarklet'
      )
    );

    $('#copyCollectorCode')
      ?.addEventListener(
        'click',
        copyCollectorCode
      );

    $('#collectorInstalled')
      ?.addEventListener(
        'click',
        () => {
          localStorage.setItem(
            'hth-collector-installed',
            '1'
          );

          closeModal();

          if (
            route ===
            'home'
          ) {
            renderHome();
          }

          toast(
            'HTH 수집기 설치 완료!'
          );
        }
      );
  }

  function injectCollectorInstallCard() {
    if (
      route !==
      'home'
    ) {
      return;
    }

    const page =
      view.querySelector(
        '.page'
      );

    if (
      !page ||
      page.querySelector(
        '.collector-install-card'
      )
    ) {
      return;
    }

    const installed =
      localStorage.getItem(
        'hth-collector-installed'
      ) ===
      '1';

    const card =
      document.createElement(
        'section'
      );

    card.className =
      `collector-install-card${
        installed
          ? ' is-installed'
          : ''
      }`;

    card.innerHTML =
      installed
        ? `
          <div
            class="collector-install-copy"
          >
            <div
              class="collector-install-eyebrow"
            >
              X Collector
            </div>

            <h3>
              HTH 수집기가 설치되어 있어요
            </h3>

            <p>
              X에서 타래를 열고
              북마크바의
              ‘HTH 수집’을 누르면 됩니다.
            </p>
          </div>

          <div
            class="collector-install-actions"
          >
            <button
              class="btn"
              id="reopenCollectorGuide"
              type="button"
            >
              설치 방법 / 다시 설치
            </button>
          </div>
        `
        : `
          <div
            class="collector-install-copy"
          >
            <div
              class="collector-install-eyebrow"
            >
              X Collector · API 없이 무료
            </div>

            <h3>
              긴 X 타래도 스크롤 한 번으로 백업해요
            </h3>

            <p>
              HTH 수집기를 북마크바에 한 번만 추가하면,
              X에서 타래를 끝까지 스크롤하며
              포스트를 모을 수 있어요.
              설치는 1분이면 끝나요.
            </p>
          </div>

          <div
            class="collector-install-actions"
          >
            <a
              class="collector-bookmarklet"
              id="homeCollectorBookmarklet"
              href="#"
            >
              ☷ HTH 수집
            </a>

            <button
              class="btn"
              id="openCollectorGuide"
              type="button"
            >
              설치 방법 보기
            </button>
          </div>
        `;

    const hero =
      page.querySelector(
        '.hero-search'
      );

    if (
      hero
    ) {
      hero.insertAdjacentElement(
        'afterend',
        card
      );
    } else {
      page.prepend(
        card
      );
    }

    if (
      installed
    ) {
      $('#reopenCollectorGuide')
        ?.addEventListener(
          'click',
          openCollectorInstallGuide
        );
    } else {
      bindBookmarkletLink(
        $(
          '#homeCollectorBookmarklet'
        )
      );

      $('#openCollectorGuide')
        ?.addEventListener(
          'click',
          openCollectorInstallGuide
        );
    }
  }

  const originalRenderHome =
    renderHome;

  renderHome = function() {
    originalRenderHome();

    injectCollectorInstallCard();
  };

  mediaGrid = function(
    media = []
  ) {
    const links =
      media
        .filter(
          item =>
            /^https?:\/\//i.test(
              item?.src ||
                ''
            )
        )
        .slice(
          0,
          4
        );

    if (
      !links.length
    ) {
      return '';
    }

    return `
      <div class="media-link-list">
        ${links
          .map(
            (
              item,
              i
            ) => `
              <a
                class="media-link"
                href="${esc(
                  item.src
                )}"
                target="_blank"
                rel="noreferrer noopener"
              >
                <span>
                  이미지 링크 ${i + 1}
                </span>

                <span>
                  ↗
                </span>
              </a>
            `
          )
          .join('')}
      </div>
    `;
  };

  threadCard = function(
    t
  ) {
    const w =
      workBy(
        t.workId
      );

    const first =
      t.posts.find(
        p =>
          p.owner
      )?.text ||
      '';

    const linkCount =
      mediaCount(
        t
      );

    return `
      <button
        class="thread-card"
        data-thread="${t.id}"
      >
        <span
          class="thread-card-content"
        >
          <span
            class="thread-top"
          >
            <span
              class="work-label"
            >
              ${esc(
                w?.title ||
                  '미분류'
              )}
            </span>

            <span
              class="count-badge"
            >
              ${
                t.posts.filter(
                  p =>
                    p.owner
                ).length
              }
              posts

              ${
                linkCount
                  ? ` · 🔗 ${linkCount}`
                  : ''
              }
            </span>
          </span>

          <h4>
            ${esc(
              t.title
            )}
          </h4>

          <p>
            ${esc(
              first
            )}
          </p>

          <span
            class="thread-foot"
          >
            <span>
              ${esc(
                t.author
              )}
              ·
              ${fmtLongDate(
                t.createdAt
              )}
            </span>

            <span>
              ${
                t.source ===
                'x'
                  ? 'X 수집'
                  : '직접 추가'
              }
            </span>
          </span>
        </span>
      </button>
    `;
  };

  renderThread = function(
    id,
    focus
  ) {
    const t =
      state.threads.find(
        x =>
          x.id ===
          id
      );

    if (
      !t
    ) {
      routeTo(
        'home'
      );

      return;
    }

    const w =
      workBy(
        t.workId
      ) ||
      workBy(
        'etc'
      ) || {
        id:
          'etc',
        title:
          '미분류'
      };

    const linkedViewings =
      (
        t.viewingIds ||
        []
      )
        .map(
          viewingBy
        )
        .filter(
          Boolean
        );

    const backButton =
      w.id ===
      'etc'
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
            ‹ ${esc(
              w.title
            )}
          </button>
        `;

    view.innerHTML = `
      <section
        class="page thread-detail"
      >
        ${backButton}

        <div
          class="thread-header"
        >
          <div
            class="thread-top"
          >
            <span
              class="work-label"
            >
              ${esc(
                w.title ||
                  '미분류'
              )}
            </span>

            <div
              class="toolbar"
            >
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
                      href="${esc(
                        t.urls[0]
                      )}"
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

          <h1>
            ${esc(
              t.title
            )}
          </h1>

          <div
            class="meta"
          >
            ${esc(
              t.author
            )}
            ·
            ${fmtLongDate(
              t.createdAt
            )}
            ·
            ${
              t.posts.filter(
                p =>
                  p.owner
              ).length
            }
            posts
          </div>

          ${
            linkedViewings.length
              ? `
                <div
                  class="thread-viewings"
                >
                  ${linkedViewings
                    .map(
                      v => {
                        const cast =
                          viewingCastText(
                            v
                          );

                        return `
                          <span
                            class="chip mint thread-viewing-chip"
                          >
                            <span
                              class="thread-viewing-date"
                            >
                              ${fmtDate(
                                v.date
                              )}
                              ${esc(
                                v.session ||
                                  ''
                              )}
                            </span>

                            ${
                              cast
                                ? `
                                  <span
                                    class="thread-viewing-cast"
                                  >
                                    · ${esc(
                                      cast
                                    )}
                                  </span>
                                `
                                : ''
                            }
                          </span>
                        `;
                      }
                    )
                    .join('')}
                </div>
              `
              : ''
          }
        </div>

        <div
          class="thread-posts"
        >
          ${t.posts
            .map(
              (
                p,
                i
              ) =>
                postView(
                  p,
                  i,
                  focus
                )
            )
            .join('')}
        </div>
      </section>
    `;

    bindCommon();

    $('#manageThread')
      ?.addEventListener(
        'click',
        () =>
          openThreadManager(
            t.id
          )
      );

    if (
      focus != null
    ) {
      setTimeout(
        () =>
          document
            .querySelector(
              `[data-post-index="${focus}"]`
            )
            ?.scrollIntoView({
              behavior:
                'smooth',

              block:
                'center'
            }),
        200
      );
    }
  };

  function threadDateValue(
    createdAt
  ) {
    const raw =
      String(
        createdAt ||
          ''
      );

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        raw
      )
    ) {
      return raw.slice(
        0,
        10
      );
    }

    const d =
      new Date(
        createdAt ||
          Date.now()
      );

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return new Date()
        .toISOString()
        .slice(
          0,
          10
        );
    }

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(
      2,
      '0'
    )}-${String(
      d.getDate()
    ).padStart(
      2,
      '0'
    )}`;
  }

  function managerDraftFromPost(
    post
  ) {
    const owner =
      Boolean(
        post.owner
      );

    return {
      owner,

      text:
        post.text ||
        '',

      author:
        post.author ||
        '',

      quoteAuthor:
        owner
          ? post.quote
              ?.author ||
            ''
          : '',

      quoteText:
        owner
          ? post.quote
              ?.text ||
            ''
          : '',

      mediaRaw:
        owner
          ? (
              Array.isArray(
                post.media
              )
                ? post.media
                : []
            )
              .filter(
                item =>
                  /^https?:\/\//i.test(
                    item?.src ||
                      ''
                  )
              )
              .slice(
                0,
                4
              )
              .map(
                item =>
                  item.src
              )
              .join(
                '\n'
              )
          : ''
    };
  }

  function openThreadManager(
    threadId
  ) {
    const t =
      state.threads.find(
        x =>
          x.id ===
          threadId
      );

    if (
      !t
    ) {
      toast(
        '타래를 찾지 못했어요.'
      );

      return;
    }

    let draftPosts =
      (
        t.posts ||
        []
      ).map(
        managerDraftFromPost
      );

    let selectedViewingIds =
      new Set(
        Array.isArray(
          t.viewingIds
        )
          ? t.viewingIds.map(
              String
            )
          : []
      );

    const workOptions =
      [
        state.works.find(
          w =>
            w.id ===
            'etc'
        ),

        ...state.works.filter(
          w =>
            w.id !==
            'etc'
        )
      ]
        .filter(
          Boolean
        )
        .map(
          w => `
            <option
              value="${esc(
                String(
                  w.id
                )
              )}"

              ${
                String(
                  w.id
                ) ===
                String(
                  t.workId
                )
                  ? 'selected'
                  : ''
              }
            >
              ${esc(
                w.title
              )}
            </option>
          `
        )
        .join('');

    modalLayer.innerHTML = `
      <div class="modal">
        <div
          class="modal-head"
        >
          <h2>
            타래 관리
          </h2>

          <button
            class="close-btn"
            data-close
          >
            ×
          </button>
        </div>

        <div
          class="modal-body"
        >
          <div
            class="form-grid"
          >
            <div
              class="field"
            >
              <label>
                타래 제목
              </label>

              <input
                id="manageThreadTitle"
                value="${esc(
                  t.title ||
                    ''
                )}"
              >
            </div>

            <div
              class="field"
            >
              <label>
                작품
              </label>

              <select
                id="manageThreadWork"
              >
                ${workOptions}
              </select>

              <span
                class="field-hint"
              >
                작품을 옮기면 새 작품과 맞지 않는
                관극 연결은 자동으로 해제돼요.
              </span>
            </div>

            <div
              class="field"
            >
              <label>
                작성 계정
              </label>

              <input
                id="manageThreadAuthor"
                value="${esc(
                  t.author ||
                    ''
                )}"
                placeholder="@계정"
              >
            </div>

            <div
              class="field"
            >
              <label>
                작성일
              </label>

              <input
                id="manageThreadDate"
                type="date"
                value="${threadDateValue(
                  t.createdAt
                )}"
              >
            </div>

            <div
              class="field"
            >
              <label>
                관극 연결
              </label>

              <div
                id="manageThreadViewings"
                class="thread-manage-viewings"
              ></div>
            </div>

            <div
              class="field"
            >
              <label>
                포스트
              </label>

              <div
                id="manageThreadPosts"
                class="thread-manage-posts"
              ></div>

              <div
                class="thread-manage-add-row"
              >
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

            <div
              class="thread-manage-danger"
            >
              <button
                type="button"
                class="btn"
                id="deleteThread"
              >
                타래 삭제
              </button>

              <div
                class="footer-actions"
              >
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
      $$(
        '#manageThreadPosts .thread-manage-post'
      ).forEach(
        box => {
          const index =
            Number(
              box.dataset
                .index
            );

          const draft =
            draftPosts[
              index
            ];

          if (
            !draft
          ) {
            return;
          }

          draft.text =
            $(
              '.manage-post-text',
              box
            )?.value ??
            '';

          if (
            draft.owner
          ) {
            draft.quoteAuthor =
              $(
                '.manage-quote-author',
                box
              )?.value ??
              '';

            draft.quoteText =
              $(
                '.manage-quote-text',
                box
              )?.value ??
              '';

            draft.mediaRaw =
              $(
                '.manage-media-urls',
                box
              )?.value ??
              '';
          } else {
            draft.author =
              $(
                '.manage-context-author',
                box
              )?.value ??
              '';
          }
        }
      );
    }

    function renderPostEditors() {
      const host =
        $(
          '#manageThreadPosts'
        );

      host.innerHTML =
        draftPosts.length
          ? draftPosts
              .map(
                (
                  p,
                  index
                ) =>
                  p.owner
                    ? `
                      <div
                        class="thread-manage-post"
                        data-index="${index}"
                      >
                        <div
                          class="thread-manage-post-head"
                        >
                          <b>
                            POST ${index + 1}
                            · 내 원문
                          </b>

                          <button
                            type="button"
                            class="mini-btn"
                            data-manager-remove="${index}"
                          >
                            삭제
                          </button>
                        </div>

                        <div
                          class="field"
                        >
                          <label>
                            본문
                          </label>

                          <textarea
                            class="manage-post-text"
                          >${esc(
                            p.text
                          )}</textarea>
                        </div>

                        <div
                          class="field media-url-box"
                        >
                          <label>
                            이미지 링크
                          </label>

                          <textarea
                            class="manage-media-urls"
                            placeholder="https://..."
                          >${esc(
                            p.mediaRaw
                          )}</textarea>

                          <span
                            class="field-hint"
                          >
                            한 줄에 하나씩, 최대 4개.
                          </span>
                        </div>

                        <div
                          class="field"
                        >
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

                        <div
                          class="field"
                        >
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
                        <div
                          class="thread-manage-post-head"
                        >
                          <b>
                            POST ${index + 1}
                            · 맥락 답글
                          </b>

                          <button
                            type="button"
                            class="mini-btn"
                            data-manager-remove="${index}"
                          >
                            삭제
                          </button>
                        </div>

                        <div
                          class="field"
                        >
                          <label>
                            작성자
                          </label>

                          <input
                            class="manage-context-author"
                            value="${esc(
                              p.author
                            )}"
                            placeholder="@아이디"
                          >
                        </div>

                        <div
                          class="field"
                        >
                          <label>
                            본문
                          </label>

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
            <div
              class="empty"
            >
              포스트가 없어요.
              아래 버튼으로 추가해 주세요.
            </div>
          `;

      $$(
        '[data-manager-remove]',
        host
      ).forEach(
        button => {
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
        }
      );
    }

    function captureViewingChecks() {
      selectedViewingIds =
        new Set(
          $$(
            '#manageThreadViewings input[name="threadViewing"]:checked'
          ).map(
            input =>
              input.value
          )
        );
    }

    function renderViewingChoices() {
      const workId =
        $('#manageThreadWork')
          .value;

      const list =
        (
          state.viewings ||
          []
        )
          .filter(
            v =>
              String(
                v.workId
              ) ===
              String(
                workId
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                b.date ||
                  ''
              ).localeCompare(
                String(
                  a.date ||
                    ''
                )
              )
          );

      const validIds =
        new Set(
          list.map(
            v =>
              String(
                v.id
              )
          )
        );

      selectedViewingIds =
        new Set(
          [
            ...selectedViewingIds
          ].filter(
            id =>
              validIds.has(
                String(
                  id
                )
              )
          )
        );

      $(
        '#manageThreadViewings'
      ).innerHTML =
        list.length
          ? list
              .map(
                v => {
                  const cast =
                    viewingCastText(
                      v
                    );

                  return `
                    <label
                      class="viewing-choice"
                    >
                      <input
                        type="checkbox"
                        name="threadViewing"
                        value="${esc(
                          String(
                            v.id
                          )
                        )}"
                        ${
                          selectedViewingIds.has(
                            String(
                              v.id
                            )
                          )
                            ? 'checked'
                            : ''
                        }
                      >

                      <span
                        class="viewing-choice-main"
                      >
                        <b>
                          ${fmtDate(
                            v.date
                          )}
                          ${esc(
                            v.session ||
                              ''
                          )}
                        </b>

                        ${
                          v.theater ||
                          v.venue
                            ? `
                              <span>
                                · ${esc(
                                  v.theater ||
                                    v.venue
                                )}
                              </span>
                            `
                            : ''
                        }

                        ${
                          cast
                            ? `
                              <span>
                                · ${esc(
                                  cast
                                )}
                              </span>
                            `
                            : ''
                        }
                      </span>
                    </label>
                  `;
                }
              )
              .join('')
          : `
            <span
              class="field-hint"
            >
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
            owner:
              true,

            text:
              '',

            author:
              '',

            quoteAuthor:
              '',

            quoteText:
              '',

            mediaRaw:
              ''
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
            owner:
              false,

            text:
              '',

            author:
              '',

            quoteAuthor:
              '',

            quoteText:
              '',

            mediaRaw:
              ''
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

          if (
            !draftPosts.length
          ) {
            toast(
              '포스트를 한 개 이상 남겨 주세요.'
            );

            return;
          }

          if (
            draftPosts.some(
              p =>
                !p.text.trim()
            )
          ) {
            toast(
              '빈 포스트가 있어요. 내용을 입력하거나 삭제해 주세요.'
            );

            return;
          }

          if (
            !draftPosts.some(
              p =>
                p.owner
            )
          ) {
            toast(
              '내 원문 포스트를 한 개 이상 남겨 주세요.'
            );

            return;
          }

          const posts =
            [];

          for (
            const p of
            draftPosts
          ) {
            if (
              p.owner
            ) {
              const media =
                parseMediaUrls(
                  p.mediaRaw ||
                    ''
                );

              if (
                media ===
                null
              ) {
                return;
              }

              const quoteText =
                p.quoteText
                  .trim();

              posts.push({
                owner:
                  true,

                text:
                  p.text
                    .trim(),

                media,

                ...(quoteText
                  ? {
                      quote: {
                        author:
                          p.quoteAuthor
                            .trim(),

                        text:
                          quoteText
                      }
                    }
                  : {})
              });
            } else {
              posts.push({
                owner:
                  false,

                author:
                  p.author
                    .trim() ||
                  '@context',

                text:
                  p.text
                    .trim(),

                context:
                  true,

                media:
                  []
              });
            }
          }

          const oldDate =
            threadDateValue(
              t.createdAt
            );

          const newDate =
            $(
              '#manageThreadDate'
            ).value ||
            oldDate;

          const newWorkId =
            $(
              '#manageThreadWork'
            ).value ||
            'etc';

          const firstOwner =
            posts.find(
              p =>
                p.owner
            );

          t.title =
            $(
              '#manageThreadTitle'
            )
              .value
              .trim() ||
            firstOwner.text
              .slice(
                0,
                34
              );

          t.workId =
            newWorkId;

          t.author =
            cleanHandle(
              $(
                '#manageThreadAuthor'
              ).value
            ) ||
            t.author ||
            '';

          t.viewingIds =
            [
              ...selectedViewingIds
            ];

          t.posts =
            posts;

          if (
            newDate !==
            oldDate
          ) {
            t.createdAt =
              `${newDate}T12:00:00.000Z`;
          }

          persist();

          closeModal();

          routeTo(
            'thread',
            {
              id:
                t.id
            }
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
          const ok =
            confirm(
              `“${t.title}” 타래를 삭제할까요?\n삭제 후 복구할 수 없습니다.`
            );

          if (
            !ok
          ) {
            return;
          }

          const destinationWorkId =
            t.workId;

          state.threads =
            state.threads.filter(
              thread =>
                thread.id !==
                t.id
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

                tab:
                  'threads'
              }
            );
          } else {
            routeTo(
              'home'
            );
          }
        }
      );
  }

  openManual = function() {
    modalLayer.innerHTML = `
      <div
        class="modal"
      >
        <div
          class="modal-head"
        >
          <h2>
            직접 추가하기
          </h2>

          <button
            class="close-btn"
            data-close
          >
            ×
          </button>
        </div>

        <div
          class="modal-body"
        >
          <form
            class="form-grid"
            id="manualForm"
          >
            <div
              class="field"
            >
              <label>
                작품
              </label>

              <select
                id="manualWork"
              >
                <option
                  value="etc"
                >
                  미분류
                </option>

                ${state.works
                  .filter(
                    w =>
                      w.id !==
                      'etc'
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

            <div
              class="field"
            >
              <label>
                작성 계정
              </label>

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

            <div
              class="field"
            >
              <label>
                타래 제목
              </label>

              <input
                id="manualTitle"
                placeholder="예: 캐릭터 해석 메모"
              >
            </div>

            <div
              id="manualPosts"
            ></div>

            <button
              type="button"
              class="btn"
              id="addManualPost"
            >
              ＋ 다음 포스트 추가
            </button>

            <div
              class="footer-actions"
            >
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

    let n =
      0;

    function addEditor() {
      n++;

      const box =
        document.createElement(
          'div'
        );

      box.className =
        'post-editor';

      box.innerHTML = `
        <div
          class="post-editor-head"
        >
          <b>
            POST ${n}
          </b>

          <div
            class="inline-actions"
          >
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

        <div
          class="field media-url-box"
        >
          <label>
            이미지 링크 (선택)
          </label>

          <textarea
            class="manual-media-urls"
            placeholder="https://example.com/image-1.jpg&#10;https://example.com/image-2.jpg"
          ></textarea>

          <span
            class="field-hint"
          >
            한 줄에 하나씩, 최대 4개.
            이미지는 HTH 안에서 불러오지 않고
            링크만 저장해요.
          </span>
        </div>

        <div
          class="manual-extras"
        ></div>
      `;

      $('#manualPosts')
        .append(
          box
        );

      $(
        '[data-remove]',
        box
      )
        ?.addEventListener(
          'click',
          () =>
            box.remove()
        );

      $(
        '[data-quote]',
        box
      )
        .addEventListener(
          'click',
          () => {
            $(
              '.manual-extras',
              box
            )
              .insertAdjacentHTML(
                'beforeend',
                `
                  <div
                    class="extra-editor quote-editor"
                  >
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

      $(
        '[data-context]',
        box
      )
        .addEventListener(
          'click',
          () => {
            $(
              '.manual-extras',
              box
            )
              .insertAdjacentHTML(
                'beforeend',
                `
                  <div
                    class="extra-editor context-editor"
                  >
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

      $(
        '.manual-text',
        box
      )
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

          const posts =
            [];

          for (
            const box of
            editors
          ) {
            const text =
              $(
                '.manual-text',
                box
              )
                .value
                .trim();

            if (
              !text
            ) {
              continue;
            }

            const media =
              parseMediaUrls(
                $(
                  '.manual-media-urls',
                  box
                )?.value ||
                  ''
              );

            if (
              media ===
              null
            ) {
              return;
            }

            const qText =
              $(
                '.quote-text',
                box
              )
                ?.value
                .trim();

            const cText =
              $(
                '.context-text',
                box
              )
                ?.value
                .trim();

            posts.push({
              owner:
                true,

              text,

              media,

              ...(qText
                ? {
                    quote: {
                      author:
                        $(
                          '.quote-author',
                          box
                        )
                          ?.value
                          .trim() ||
                        '',

                      text:
                        qText
                    }
                  }
                : {})
            });

            if (
              cText
            ) {
              posts.push({
                owner:
                  false,

                author:
                  $(
                    '.context-author',
                    box
                  )
                    ?.value
                    .trim() ||
                  '@context',

                text:
                  cText,

                context:
                  true,

                media:
                  []
              });
            }
          }

          if (
            !posts.some(
              p =>
                p.owner
            )
          ) {
            toast(
              '포스트를 한 개 이상 입력해 주세요.'
            );

            return;
          }

          const firstOwner =
            posts.find(
              p =>
                p.owner
            );

          const t = {
            id:
              't' +
              Date.now(),

            workId:
              $(
                '#manualWork'
              )?.value ||
              'etc',

            viewingIds:
              [],

            title:
              $(
                '#manualTitle'
              )
                .value
                .trim() ||
              firstOwner
                .text
                .slice(
                  0,
                  34
                ),

            author:
              cleanHandle(
                $(
                  '#manualAuthor'
                ).value
              ) ||
              defaultAccount()
                ?.handle ||
              '',

            createdAt:
              new Date()
                .toISOString(),

            source:
              'manual',

            urls:
              [],

            posts
          };

          if (
            !Array.isArray(
              state.threads
            )
          ) {
            state.threads =
              [];
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
            {
              id:
                t.id
            }
          );
        }
      );
  };

  openImport = function() {
    const def =
      defaultAccount();

    modalLayer.innerHTML = `
      <div
        class="modal"
      >
        <div
          class="modal-head"
        >
          <h2>
            브라우저에서 가져오기
          </h2>

          <button
            class="close-btn"
            data-close
          >
            ×
          </button>
        </div>

        <div
          class="modal-body"
        >
          <form
            class="form-grid"
            id="collectorImportForm"
          >
            <div
              class="collector-note"
            >
              <b>
                무료 브라우저 수집 방식
              </b>

              <br>

              X에서 HTH 수집기를 실행하고
              타래 끝까지 스크롤한 뒤,
              수집기가 복사해 준 JSON을
              아래 칸에 붙여넣어요.
              X API는 사용하지 않습니다.

              <div
                style="margin-top:10px"
              >
                <button
                  type="button"
                  class="text-btn"
                  id="showCollectorInstallFromImport"
                >
                  아직 수집기가 없나요?
                  설치 방법 보기 ›
                </button>
              </div>
            </div>

            <div
              class="field"
            >
              <label>
                수집 데이터
              </label>

              <textarea
                id="collectorData"
                class="collector-json"
                placeholder='{"version":1,"posts":[...]}'
              ></textarea>

              <span
                class="field-hint"
              >
                JSON은 저장 전에 브라우저 안에서만 읽고,
                선택한 포스트만 HTH에 저장해요.
              </span>
            </div>

            <div
              class="field"
            >
              <label>
                내 X 계정
              </label>

              ${
                state.accounts.length
                  ? `
                    <select
                      id="collectorOwner"
                    >
                      ${accountOptions(
                        def?.handle ||
                          '',
                        false
                      )}
                    </select>
                  `
                  : `
                    <input
                      id="collectorOwner"
                      placeholder="@내계정"
                    >
                  `
              }

              <span
                class="field-hint"
              >
                이 계정의 포스트를
                ‘내 원문’으로 자동 선택해요.
              </span>
            </div>

            <div
              class="field"
            >
              <label>
                작품
              </label>

              <select
                id="collectorWork"
              >
                <option
                  value="etc"
                >
                  미분류
                </option>

                ${state.works
                  .filter(
                    w =>
                      w.id !==
                      'etc'
                  )
                  .map(
                    w =>
                      `
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

            <div
              class="field"
            >
              <label>
                타래 제목
              </label>

              <input
                id="collectorTitle"
                placeholder="비워두면 첫 포스트에서 자동 생성"
              >
            </div>

            <div
              class="field"
            >
              <label>
                관극 연결 (선택)
              </label>

              <div
                id="collectorViewingChips"
                style="
                  display:flex;
                  flex-wrap:wrap;
                  gap:8px
                "
              ></div>
            </div>

            <div
              class="footer-actions"
            >
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
                id="previewImport"
              >
                가져올 포스트 확인
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    bindModalClose();

    $('#showCollectorInstallFromImport')
      ?.addEventListener(
        'click',
        openCollectorInstallGuide
      );

    const work =
      $('#collectorWork');

    function refreshViewings() {
      const list =
        (
          state.viewings ||
          []
        )
          .filter(
            v =>
              String(
                v.workId
              ) ===
              String(
                work.value
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                b.date ||
                  ''
              ).localeCompare(
                String(
                  a.date ||
                    ''
                )
              )
          );

      $(
        '#collectorViewingChips'
      ).innerHTML =
        list.length
          ? list
              .map(
                v => {
                  const cast =
                    viewingCastText(
                      v
                    );

                  return `
                    <label
                      class="viewing-choice"
                    >
                      <input
                        type="checkbox"
                        name="collectorViewing"
                        value="${esc(
                          String(
                            v.id
                          )
                        )}"
                      >

                      <span
                        class="viewing-choice-main"
                      >
                        <b>
                          ${fmtDate(
                            v.date
                          )}
                          ${esc(
                            v.session ||
                              ''
                          )}
                        </b>

                        ${
                          v.theater ||
                          v.venue
                            ? `
                              <span>
                                · ${esc(
                                  v.theater ||
                                    v.venue
                                )}
                              </span>
                            `
                            : ''
                        }

                        ${
                          cast
                            ? `
                              <span>
                                · ${esc(
                                  cast
                                )}
                              </span>
                            `
                            : ''
                        }
                      </span>
                    </label>
                  `;
                }
              )
              .join('')
          : `
            <span
              class="field-hint"
            >
              연결할 관극이 아직 없어요.
            </span>
          `;
    }

    work.addEventListener(
      'change',
      refreshViewings
    );

    refreshViewings();

    $('#previewImport')
      .addEventListener(
        'click',
        openImportPreview
      );
  };

  openImportPreview = function() {
    const raw =
      $(
        '#collectorData'
      )
        ?.value
        .trim() ||
      '';

    if (
      !raw
    ) {
      toast(
        '수집기에서 복사한 JSON을 붙여넣어 주세요.'
      );

      return;
    }

    let payload;

    try {
      payload =
        parseCollectorPayload(
          raw
        );
    } catch (error) {
      toast(
        error.message ||
          '수집 데이터를 읽지 못했어요.'
      );

      return;
    }

    const workId =
      $(
        '#collectorWork'
      )?.value ||
      'etc';

    const titleDraft =
      $(
        '#collectorTitle'
      )
        ?.value
        .trim() ||
      '';

    const ownerHandle =
      collectorHandle(
        $(
          '#collectorOwner'
        )?.value ||
          ''
      ) ||
      collectorHandle(
        defaultAccount()
          ?.handle ||
          ''
      );

    if (
      !ownerHandle
    ) {
      toast(
        '내 X 계정을 먼저 입력해 주세요.'
      );

      return;
    }

    const selectedViewingIds =
      $$(
        'input[name="collectorViewing"]:checked'
      ).map(
        input =>
          input.value
      );

    const ownerKey =
      ownerHandle
        .toLowerCase();

    const drafts =
      payload.posts.map(
        (
          post,
          index
        ) => ({
          ...post,

          index,

          mode:
            post.author &&
            post.author
              .toLowerCase() ===
              ownerKey
              ? 'owner'
              : 'exclude'
        })
      );

    const autoOwnerCount =
      drafts.filter(
        post =>
          post.mode ===
          'owner'
      ).length;

    modalLayer.innerHTML = `
      <div
        class="modal"
      >
        <div
          class="modal-head"
        >
          <h2>
            가져올 포스트 확인
          </h2>

          <button
            class="close-btn"
            data-close
          >
            ×
          </button>
        </div>

        <div
          class="modal-body"
        >
          <div
            class="collector-summary"
          >
            <span
              class="chip accent"
            >
              수집 ${drafts.length}개
            </span>

            <span
              class="chip mint"
            >
              내 원문 자동 선택
              ${autoOwnerCount}개
            </span>

            <span
              class="chip"
            >
              내 계정
              ${esc(
                ownerHandle
              )}
            </span>
          </div>

          <div
            class="collector-note"
          >
            내 계정과 일치하는 글은
            <b>
              내 원문
            </b>
            으로 자동 선택했어요.

            다른 사람 글은 기본적으로 제외되어 있고,
            필요한 답글만
            <b>
              맥락 답글
            </b>
            로 바꾸면 됩니다.
          </div>

          <div
            class="collector-preview"
            id="collectorPreview"
          ></div>

          <div
            class="footer-actions"
          >
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
              id="saveCollectorImport"
            >
              선택한 포스트 저장
            </button>
          </div>
        </div>
      </div>
    `;

    bindModalClose();

    function renderPreview() {
      $(
        '#collectorPreview'
      ).innerHTML =
        drafts
          .map(
            post => `
              <div
                class="collector-post"
                data-collector-index="${post.index}"
                data-mode="${post.mode}"
              >
                <div
                  class="collector-post-head"
                >
                  <div
                    class="collector-post-meta"
                  >
                    <b>
                      ${esc(
                        post.author ||
                          '@unknown'
                      )}
                    </b>

                    <small>
                      ${
                        post.createdAt
                          ? esc(
                              post.createdAt
                            )
                          : '작성일 정보 없음'
                      }

                      ${
                        post.url
                          ? ` · ${esc(
                              post.url
                            )}`
                          : ''
                      }
                    </small>
                  </div>

                  <select
                    class="collector-mode"
                    data-collector-mode="${post.index}"
                  >
                    <option
                      value="owner"
                      ${
                        post.mode ===
                        'owner'
                          ? 'selected'
                          : ''
                      }
                    >
                      내 원문
                    </option>

                    <option
                      value="context"
                      ${
                        post.mode ===
                        'context'
                          ? 'selected'
                          : ''
                      }
                    >
                      맥락 답글
                    </option>

                    <option
                      value="exclude"
                      ${
                        post.mode ===
                        'exclude'
                          ? 'selected'
                          : ''
                      }
                    >
                      제외
                    </option>
                  </select>
                </div>

                <div
                  class="collector-post-body"
                >
                  ${esc(
                    post.text
                  )}
                </div>

                <div
                  class="collector-post-foot"
                >
                  ${
                    post.quote
                      ? `
                        <span>
                          인용 있음
                        </span>
                      `
                      : ''
                  }

                  ${
                    post.media.length
                      ? `
                        <span>
                          이미지 링크
                          ${post.media.length}
                        </span>
                      `
                      : ''
                  }
                </div>
              </div>
            `
          )
          .join('');

      $$(
        '[data-collector-mode]'
      ).forEach(
        select => {
          select.addEventListener(
            'change',
            () => {
              const index =
                Number(
                  select.dataset
                    .collectorMode
                );

              drafts[
                index
              ].mode =
                select.value;

              select
                .closest(
                  '.collector-post'
                )
                ?.setAttribute(
                  'data-mode',
                  select.value
                );
            }
          );
        }
      );
    }

    renderPreview();

    $('#saveCollectorImport')
      .addEventListener(
        'click',
        () => {
          const selected =
            drafts.filter(
              post =>
                post.mode !==
                'exclude'
            );

          const ownerPosts =
            selected.filter(
              post =>
                post.mode ===
                'owner'
            );

          if (
            !ownerPosts.length
          ) {
            toast(
              '내 원문으로 저장할 포스트를 한 개 이상 선택해 주세요.'
            );

            return;
          }

          const posts =
            selected.map(
              post => {
                if (
                  post.mode ===
                  'owner'
                ) {
                  return {
                    owner:
                      true,

                    text:
                      post.text,

                    media:
                      mediaFromCollector(
                        post.media
                      ),

                    ...(post.quote
                      ? {
                          quote: {
                            author:
                              post.quote
                                .author ||
                              '',

                            text:
                              post.quote
                                .text
                          }
                        }
                      : {})
                  };
                }

                return {
                  owner:
                    false,

                  author:
                    post.author ||
                    '@context',

                  text:
                    post.text,

                  context:
                    true,

                  media:
                    []
                };
              }
            );

          const firstOwnerDraft =
            ownerPosts[
              0
            ];

          const createdCandidate =
            new Date(
              firstOwnerDraft
                .createdAt ||
                ''
            );

          const createdAt =
            Number.isNaN(
              createdCandidate
                .getTime()
            )
              ? new Date()
                  .toISOString()
              : createdCandidate
                  .toISOString();

          const urls =
            [
              ...new Set([
                ...(
                  payload.pageUrl
                    ? [
                        payload.pageUrl
                      ]
                    : []
                ),

                ...ownerPosts
                  .map(
                    post =>
                      post.url
                  )
                  .filter(
                    Boolean
                  )
              ])
            ];

          const thread = {
            id:
              't' +
              Date.now(),

            workId,

            viewingIds:
              selectedViewingIds,

            title:
              titleDraft ||
              firstOwnerDraft
                .text
                .slice(
                  0,
                  34
                ),

            author:
              ownerHandle,

            createdAt,

            source:
              'x',

            urls,

            posts
          };

          if (
            !Array.isArray(
              state.threads
            )
          ) {
            state.threads =
              [];
          }

          state.threads.unshift(
            thread
          );

          persist();

          closeModal();

          toast(
            `${ownerPosts.length}개 원문을 백업했어요.`
          );

          routeTo(
            'thread',
            {
              id:
                thread.id
            }
          );
        }
      );
  };

  hydrateArchiveFromD1();
})();
