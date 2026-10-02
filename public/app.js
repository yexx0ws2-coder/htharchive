const seed = {
  // 실제 서비스용 초기 상태: 데모 콘텐츠 없이 시작합니다.
  // 'etc'는 작품에 아직 분류하지 않은 기록을 위한 내부 항목이며 작품 목록에는 노출되지 않습니다.
  works: [
    {id:'etc',title:'미분류',tone:'blue',icon:'⌁',seasonStart:'',seasonEnd:'',castPool:[]}
  ],
  accounts: [],
  viewings: [],
  threads: []
};

const saved = JSON.parse(localStorage.getItem('hth-state-v6-clean') || 'null');
function normalizeState(input){
  const x=input || structuredClone(seed);
  if(!Array.isArray(x.accounts)) x.accounts=[];
  if(x.accounts.length && !x.accounts.some(a=>a.isDefault)) x.accounts[0].isDefault=true;
  x.works=(x.works||[]).map(w=>({...w,seasonStart:w.seasonStart||'',seasonEnd:w.seasonEnd||'',castPool:Array.isArray(w.castPool)?w.castPool:[]}));
  return x;
}
const state = normalizeState(saved || structuredClone(seed));
let route = 'home';
let routeParams = {};
let selectedCalendarDate = new Date().toISOString().slice(0,10);
let calendarCursor = selectedCalendarDate.slice(0,7);
let searchState = {q:'',work:'all',from:'',to:''};

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const view = $('#view');
const modalLayer = $('#modalLayer');

function persist(){ localStorage.setItem('hth-state-v6-clean', JSON.stringify(state)); }
async function loadWorksFromDB() {
  try {
    const response = await fetch('/api/works');

    if (!response.ok) {
      throw new Error('작품 목록을 불러오지 못했어요.');
    }

    const rows = await response.json();
    const tones = ['lavender', 'peach', 'mint', 'blue'];

    const works = rows.map((row, i) => ({
      id: String(row.id),
      title: row.title,
      tone: tones[i % tones.length],
      icon: row.icon || '✦',
      seasonStart: row.season_start || '',
      seasonEnd: row.season_end || '',
      castPool: []
    }));

    const etc =
      state.works.find(x => x.id === 'etc') ||
      {
        id: 'etc',
        title: '미분류',
        tone: 'blue',
        icon: '⌁',
        seasonStart: '',
        seasonEnd: '',
        castPool: []
      };

    state.works = [...works, etc];
    persist();

  } catch (error) {
    console.error(error);
  }
}

async function boot() {
  await loadWorksFromDB();
  render();
}
function workBy(id){ return state.works.find(w=>w.id===id); }
function viewingBy(id){ return state.viewings.find(v=>v.id===id); }
function fmtDate(d){ const x=new Date(d); return `${x.getMonth()+1}.${x.getDate()}`; }
function fmtLongDate(d){ const x=new Date(d); return `${x.getFullYear()}.${String(x.getMonth()+1).padStart(2,'0')}.${String(x.getDate()).padStart(2,'0')}`; }
function esc(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;$('#toastRegion').append(t);setTimeout(()=>t.remove(),2300);}
function routeTo(next, params={}){route=next;routeParams=params;render();window.scrollTo({top:0,behavior:'smooth'});}
function getThreadText(t){ return `${t.title} ${t.posts.filter(p=>p.owner).map(p=>p.text).join(' ')}`; }
function postMedia(p){ return Array.isArray(p.media)?p.media:[]; }
function firstThreadMedia(t){ for(const p of t.posts||[]){ if(p.owner&&postMedia(p).length) return postMedia(p)[0]; } return null; }
function mediaCount(t){ return (t.posts||[]).filter(p=>p.owner).reduce((n,p)=>n+postMedia(p).length,0); }
function defaultAccount(){ return state.accounts.find(a=>a.isDefault) || state.accounts[0] || null; }
function cleanHandle(v=''){ const t=v.trim(); if(!t)return ''; return t.startsWith('@')?t:`@${t}`; }
function detectAuthorFromUrls(raw=''){ const m=raw.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([^\/\s]+)\/status\/\d+/i); return m?cleanHandle(m[1]):''; }
function accountOptions(selected='',allowAuto=false,detected=''){ const savedOptions=state.accounts.map(a=>`<option value="${esc(a.handle)}" ${selected===a.handle?'selected':''}>${esc(a.handle)}${a.isDefault?' · 기본':''}${a.label?` · ${esc(a.label)}`:''}</option>`).join(''); const empty=!state.accounts.length&&!allowAuto?'<option value="">설정에서 X 계정을 추가해 주세요</option>':''; return `${allowAuto?`<option value="auto">자동 인식${detected?` (${esc(detected)})`:''}</option>`:''}${empty}${savedOptions}`; }
function seasonText(w){ if(!w?.seasonStart&&!w?.seasonEnd)return ''; const a=w.seasonStart?fmtLongDate(w.seasonStart):'미정'; const b=w.seasonEnd?fmtLongDate(w.seasonEnd):'미정'; return `${a} — ${b}`; }
function inferredWorkCast(workId){ const w=workBy(workId); const seen=new Map(); (w?.castPool||[]).forEach(c=>seen.set(`${c.actor}|${c.role||''}`,{...c})); state.viewings.filter(v=>v.workId===workId).flatMap(v=>v.cast||[]).forEach(c=>{ const key=`${c.actor}|${c.role||''}`; if(!seen.has(key))seen.set(key,{...c}); }); return [...seen.values()]; }
function actorKey(name=''){ return name.trim().toLocaleLowerCase(); }
function rememberedRole(workId, actor){
  const key=actorKey(actor); if(!key)return '';
  const w=workBy(workId);
  const preset=(w?.castPool||[]).find(c=>actorKey(c.actor)===key && (c.role||'').trim());
  if(preset) return preset.role.trim();
  const recent=[...state.viewings].filter(v=>v.workId===workId).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  for(const v of recent){
    const hit=(v.cast||[]).find(c=>actorKey(c.actor)===key && (c.role||'').trim());
    if(hit) return hit.role.trim();
  }
  return '';
}
function syncProfile(){ const a=defaultAccount(); const h=$('#profileHandle'); if(h)h.textContent=a?.handle||'X 계정 추가'; const av=$('#profileAvatar'); if(av)av.textContent=a?(a.handle.replace('@','')[0]||'H').toUpperCase():'+'; const note=document.querySelector('.profile-card small'); if(note)note.textContent=a?(a.isDefault?'기본 X 계정':'X 계정'):'설정에서 계정을 등록하세요'; }
function mediaGrid(media=[]){ if(!media.length)return ''; const items=media.slice(0,4); return `<div class="media-grid media-${Math.min(items.length,4)}">${items.map((m,i)=>`<button type="button" class="media-item" data-media-src="${esc(m.src)}" data-media-alt="${esc(m.alt||'첨부 이미지')}"><img src="${esc(m.src)}" alt="${esc(m.alt||'첨부 이미지')}" loading="lazy">${media.length>4&&i===3?`<span class="media-more">+${media.length-4}</span>`:''}</button>`).join('')}</div>`; }
function fileToMedia(file){ return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onerror=reject; reader.onload=()=>{ const img=new Image(); img.onload=()=>{ const max=1400,scale=Math.min(1,max/Math.max(img.width,img.height)); const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale)); canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height); const mime=file.type==='image/png'?'image/png':'image/jpeg'; const src=canvas.toDataURL(mime,mime==='image/png'?undefined:.84); resolve({id:'m'+Date.now()+Math.random().toString(36).slice(2,7),type:'image',src,alt:file.name.replace(/\.[^.]+$/,''),source:'manual',order:0}); }; img.onerror=reject; img.src=reader.result; }; reader.readAsDataURL(file); }); }
async function filesToMedia(fileList){ const files=[...fileList].slice(0,4); return Promise.all(files.map(fileToMedia)); }
function relatedThreadCount(viewingId){return state.threads.filter(t=>t.viewingIds.includes(viewingId)).length;}
function workStats(workId){return {threads:state.threads.filter(t=>t.workId===workId).length,viewings:state.viewings.filter(v=>v.workId===workId).length};}
function navSync(){
  $$('.nav-item,.bottom-item').forEach(el=>el.classList.toggle('is-active',el.dataset.route===route));
}

function render(){
  navSync();
  syncProfile();
  if(route==='home') renderHome();
  if(route==='search') renderSearch();
  if(route==='calendar') renderCalendar();
  if(route==='library') renderLibrary();
  if(route==='work') renderWork(routeParams.id);
  if(route==='thread') renderThread(routeParams.id,routeParams.focus);
}

function renderHome(){
  const recentWorks=state.works.filter(w=>w.id!=='etc').slice(0,4);
  const recentViewings=[...state.viewings].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  const recentThreads=[...state.threads].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,6);
  view.innerHTML=`<section class="page">
    <div class="page-head"><div><div class="eyebrow">HTH Archive</div><h1 class="page-title">했던 얘기, 또 찾기!</h1><p class="page-sub">나만의 관극 감상 외장 드라이브</p></div><div class="toolbar"><button class="btn" data-action="new-viewing">＋ 새 관극</button><button class="btn primary" data-action="open-add">＋ 기록 추가</button></div></div>
    <form class="hero-search" id="homeSearch"><span>⌕</span><input id="homeSearchInput" placeholder="기록에서 단어, 문장 검색하기…" autocomplete="off"><button class="search-go" aria-label="검색">→</button></form>
    <section class="section"><div class="section-head"><h2 class="section-title">최근 작품</h2><button class="text-btn" data-route="library">전체 보기 ›</button></div><div class="work-grid">${recentWorks.length?recentWorks.map(w=>workCard(w)).join(''):`<div class="empty empty-action"><b>아직 등록된 작품이 없어요.</b><span>첫 작품을 추가하면 관극과 감상을 작품별로 모아볼 수 있어요.</span><button class="btn" data-action="new-work">＋ 첫 작품 추가</button></div>`}</div></section>
    <section class="section"><div class="section-head"><h2 class="section-title">최근 관극</h2><button class="text-btn" data-action="new-viewing">＋ 새 관극</button></div><div class="viewing-list">${recentViewings.length?recentViewings.map(v=>viewingCard(v)).join(''):`<div class="empty">아직 저장된 관극이 없어요.</div>`}</div></section>
    <section class="section"><div class="section-head"><h2 class="section-title">최근 백업된 타래</h2><button class="text-btn" data-route="search">검색으로 찾기 ›</button></div><div class="thread-grid">${recentThreads.length?recentThreads.map(t=>threadCard(t)).join(''):`<div class="empty">아직 백업된 타래가 없어요. 기록을 추가하면 여기에 나타나요.</div>`}</div></section>
  </section>`;
  bindCommon();
  $('#homeSearch').addEventListener('submit',e=>{e.preventDefault();searchState.q=$('#homeSearchInput').value.trim();routeTo('search');});
}

function workCard(w){const s=workStats(w.id);const season=seasonText(w);return `<button class="work-card ${w.tone}" data-work="${w.id}"><span class="mini-icon">${esc(w.icon||'✦')}</span><span class="arrow">↗</span><h3>${esc(w.title)}</h3>${season?`<div class="work-season">${season}</div>`:''}<div class="work-meta"><span>타래 ${s.threads}</span><span>관극 ${s.viewings}</span></div></button>`;}

function viewingCard(v){const w=workBy(v.workId);const cast=v.cast.map(c=>`${esc(c.actor)}${c.role?` · ${esc(c.role)}`:''}`).join(' · ');return `<button class="viewing-card" data-work="${w.id}"><span class="date-tile"><small>${v.session}</small><b>${new Date(v.date).getDate()}</b></span><span><h4>${fmtDate(v.date)} ${v.session} · ${esc(w.title)}</h4><div class="chips">${v.cast.slice(0,3).map(c=>`<span class="chip">${esc(c.actor)}${c.role?` ${esc(c.role)}`:''}</span>`).join('')}</div></span><span class="count-badge">타래 ${relatedThreadCount(v.id)}</span></button>`;}
function threadCard(t){const w=workBy(t.workId);const first=t.posts.find(p=>p.owner)?.text||'';const thumb=firstThreadMedia(t);const mCount=mediaCount(t);return `<button class="thread-card ${thumb?'has-thumb':''}" data-thread="${t.id}">${thumb?`<span class="thread-thumb"><img src="${esc(thumb.src)}" alt=""></span>`:''}<span class="thread-card-content"><span class="thread-top"><span class="work-label">${esc(w?.title||'미분류')}</span><span class="count-badge">${t.posts.filter(p=>p.owner).length} posts${mCount?` · 🖼 ${mCount}`:''}</span></span><h4>${esc(t.title)}</h4><p>${esc(first)}</p><span class="thread-foot"><span>${esc(t.author)} · ${fmtLongDate(t.createdAt)}</span><span>${t.source==='x'?'X 링크':'직접 추가'}</span></span></span></button>`;}

function renderSearch(){
  const filtered=state.threads.filter(t=>{
    const q=searchState.q.toLowerCase();
    const qok=!q || getThreadText(t).toLowerCase().includes(q);
    const wok=searchState.work==='all'||t.workId===searchState.work;
    const d=t.createdAt.slice(0,10);const fromok=!searchState.from||d>=searchState.from;const took=!searchState.to||d<=searchState.to;
    return qok&&wok&&fromok&&took;
  });
  view.innerHTML=`<section class="page"><div class="page-head"><div><div class="eyebrow">Search</div><h1 class="page-title">기록 검색</h1><p class="page-sub">타래 제목과 내가 쓴 포스트 원문만 검색합니다. 인용·친구 답글은 검색에서 제외돼요.</p></div></div>
    <div class="search-panel"><div class="search-box"><span>⌕</span><input id="searchInput" value="${esc(searchState.q)}" placeholder="원하는 단어, 문장, 키워드를 검색하세요!"><button class="icon-btn" id="clearSearch">×</button></div><div class="filter-row"><select class="filter-select" id="workFilter"><option value="all">작품 전체</option>${state.works.filter(w=>w.id!=='etc').map(w=>`<option value="${w.id}" ${searchState.work===w.id?'selected':''}>${esc(w.title)}</option>`).join('')}</select><input class="filter-select" type="date" id="fromFilter" value="${searchState.from}"><input class="filter-select" type="date" id="toFilter" value="${searchState.to}"></div></div>
    <div class="results-meta">검색 결과 ${filtered.length}개</div><div class="search-results">${filtered.length?filtered.map(resultCard).join(''):`<div class="empty">찾는 기록이 없어요. 다른 단어로 검색해볼까요?</div>`}</div>
  </section>`;
  bindCommon();
  $('#searchInput').addEventListener('input',e=>{searchState.q=e.target.value;renderSearch();setTimeout(()=>$('#searchInput')?.focus(),0)});
  $('#clearSearch').addEventListener('click',()=>{searchState.q='';renderSearch();});
  $('#workFilter').addEventListener('change',e=>{searchState.work=e.target.value;renderSearch();});
  $('#fromFilter').addEventListener('change',e=>{searchState.from=e.target.value;renderSearch();});
  $('#toFilter').addEventListener('change',e=>{searchState.to=e.target.value;renderSearch();});
}
function resultCard(t){const q=searchState.q.trim();let postIndex=Math.max(0,t.posts.findIndex(p=>p.owner&&(!q||p.text.toLowerCase().includes(q.toLowerCase()))));let text=t.posts[postIndex]?.text||t.posts.find(p=>p.owner)?.text||'';const snippet=highlight(esc(text),q);return `<button class="result-card" data-thread="${t.id}" data-focus="${postIndex}"><div class="result-head"><div><h3>${highlight(esc(t.title),q)}</h3><div class="result-meta">${esc(workBy(t.workId)?.title||'미분류')} · ${fmtLongDate(t.createdAt)} · ${esc(t.author)}</div></div><span class="count-badge">${postIndex+1} / ${t.posts.length}</span></div><p class="result-snippet">${snippet}</p></button>`;}
function highlight(html,q){if(!q)return html;const safe=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return html.replace(new RegExp(safe,'gi'),m=>`<mark>${m}</mark>`)}

function renderCalendar(){
  const [yearStr,monthStr]=calendarCursor.split('-');
  const year=Number(yearStr), month=Number(monthStr)-1;
  const first=new Date(year,month,1).getDay();
  const days=new Date(year,month+1,0).getDate();
  let cells='';
  for(let i=0;i<first;i++)cells+='<span class="day"></span>';
  for(let d=1;d<=days;d++){
    const date=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const has=state.threads.some(t=>t.createdAt.startsWith(date));
    cells+=`<button class="day ${has?'has-record':''} ${selectedCalendarDate===date?'selected':''}" data-date="${date}">${d}</button>`;
  }
  const agenda=state.threads.filter(t=>t.createdAt.startsWith(selectedCalendarDate));
  view.innerHTML=`<section class="page"><div class="page-head"><div><div class="eyebrow">Calendar</div><h1 class="page-title">작성일로 보기</h1><p class="page-sub">관극일이 아니라 실제로 기록을 작성한 날짜 기준이에요.</p></div></div><div class="calendar-layout"><div class="calendar-card"><div class="calendar-head"><h3>${year}년 ${month+1}월</h3><div><button class="calendar-nav" id="prevMonth" aria-label="이전 달">‹</button><button class="calendar-nav" id="nextMonth" aria-label="다음 달">›</button></div></div><div class="calendar-grid">${['일','월','화','수','목','금','토'].map(x=>`<span class="dow">${x}</span>`).join('')}${cells}</div></div><aside class="agenda"><h3>${fmtLongDate(selectedCalendarDate)}</h3><div class="agenda-list">${agenda.length?agenda.map(t=>`<button class="agenda-item" data-thread="${t.id}"><b>${esc(t.title)}</b><small>${esc(workBy(t.workId)?.title||'미분류')} · ${t.posts.filter(p=>p.owner).length} posts</small></button>`).join(''):`<div class="empty">이날 작성한 기록이 없어요.</div>`}</div></aside></div></section>`;
  bindCommon();
  $$('[data-date]').forEach(b=>b.addEventListener('click',()=>{selectedCalendarDate=b.dataset.date;renderCalendar()}));
  $('#prevMonth')?.addEventListener('click',()=>{const d=new Date(year,month-1,1);calendarCursor=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;selectedCalendarDate=`${calendarCursor}-01`;renderCalendar();});
  $('#nextMonth')?.addEventListener('click',()=>{const d=new Date(year,month+1,1);calendarCursor=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;selectedCalendarDate=`${calendarCursor}-01`;renderCalendar();});
}

function renderLibrary(){
  view.innerHTML=`<section class="page"><div class="page-head"><div><div class="eyebrow">Library</div><h1 class="page-title">작품 목록</h1><p class="page-sub">작품명·시즌·배우/배역·대표 아이콘은 언제든 가볍게 수정할 수 있어요.</p></div><div class="toolbar"><button class="btn" data-action="new-work">＋ 새 작품</button><button class="btn primary" data-action="new-viewing">＋ 새 관극</button></div></div><div class="library-grid">${state.works.filter(w=>w.id!=='etc').length?state.works.filter(w=>w.id!=='etc').map(w=>{const s=workStats(w.id);const actors=inferredWorkCast(w.id);return `<div class="library-card-shell"><button class="library-card" data-work="${w.id}"><span class="mini-icon">${esc(w.icon||'✦')}</span><h3>${esc(w.title)}</h3>${seasonText(w)?`<div class="library-season">${seasonText(w)}</div>`:''}<div class="stat-row"><span>관극 ${s.viewings}</span><span>타래 ${s.threads}</span></div><div class="chips" style="margin-top:14px">${actors.slice(0,4).map(c=>`<span class="chip accent">${esc(c.actor)}${c.role?` · ${esc(c.role)}`:''}</span>`).join('')}</div></button><button class="work-edit-btn" data-action="edit-work" data-work-id="${w.id}" aria-label="${esc(w.title)} 작품 정보 수정">✎</button></div>`}).join(''):`<div class="empty empty-action"><b>작품 보관함이 비어 있어요.</b><span>작품을 하나 추가해 아카이브를 시작해보세요.</span><button class="btn primary" data-action="new-work">＋ 새 작품</button></div>`}</div></section>`;bindCommon();
}

function renderWork(id){
  const w=workBy(id);if(!w){routeTo('library');return}
  const active=routeParams.tab||'all';
  const viewings=state.viewings.filter(v=>v.workId===id).sort((a,b)=>b.date.localeCompare(a.date));
  const threads=state.threads.filter(t=>t.workId===id);
  const actors=inferredWorkCast(id);
  const sections=[];
  if(active==='all'||active==='viewings') sections.push(`<section class="section"><div class="section-head"><h2 class="section-title">관극 기록</h2><button class="text-btn" data-action="new-viewing" data-work-id="${w.id}">＋ 새 관극</button></div><div class="viewing-list">${viewings.length?viewings.map(v=>viewingCard(v)).join(''):'<div class="empty">아직 연결된 관극이 없어요.</div>'}</div></section>`);
  if(active==='all'||active==='threads') sections.push(`<section class="section"><div class="section-head"><h2 class="section-title">이 작품의 타래</h2></div><div class="thread-grid">${threads.length?threads.map(t=>threadCard(t)).join(''):'<div class="empty">아직 저장된 타래가 없어요.</div>'}</div></section>`);
  if(active==='actors') sections.push(`<section class="section"><div class="section-head"><h2 class="section-title">배우 · 배역</h2><button class="text-btn" data-action="edit-work" data-work-id="${w.id}">✎ 작품 정보 수정</button></div><div class="actor-directory">${actors.length?actors.map(c=>`<div class="actor-directory-row"><b>${esc(c.actor)}</b><span>${esc(c.role||'배역 미지정')}</span></div>`).join(''):'<div class="empty">아직 등록된 배우 정보가 없어요.</div>'}</div></section>`);
  view.innerHTML=`<section class="page"><button class="detail-back" data-route="library">‹ 작품 목록</button><div class="work-hero"><div class="work-hero-top"><div><div class="eyebrow">Work Archive</div><h1>${esc(w.title)}</h1>${seasonText(w)?`<div class="season-line">${seasonText(w)}</div>`:''}</div><button class="work-hero-edit" data-action="edit-work" data-work-id="${w.id}" aria-label="작품 정보 수정">✎</button></div><div class="hero-stats"><button data-work-tab="viewings" data-work-id="${w.id}">관극 ${viewings.length}</button><button data-work-tab="threads" data-work-id="${w.id}">타래 ${threads.length}</button><button data-work-tab="actors" data-work-id="${w.id}">배우 ${actors.length}</button></div><div class="chips" style="margin-top:16px">${actors.slice(0,8).map(c=>`<span class="chip">${esc(c.actor)}${c.role?` · ${esc(c.role)}`:''}</span>`).join('')}</div></div><div class="tabs"><button class="tab ${active==='all'?'is-active':''}" data-work-tab="all" data-work-id="${w.id}">전체</button><button class="tab ${active==='viewings'?'is-active':''}" data-work-tab="viewings" data-work-id="${w.id}">관극 ${viewings.length}</button><button class="tab ${active==='threads'?'is-active':''}" data-work-tab="threads" data-work-id="${w.id}">타래 ${threads.length}</button><button class="tab ${active==='actors'?'is-active':''}" data-work-tab="actors" data-work-id="${w.id}">배우</button></div>${sections.join('')}</section>`;
  bindCommon();
}

function renderThread(id,focus){const t=state.threads.find(x=>x.id===id);if(!t){routeTo('home');return}const w=workBy(t.workId);const viewings=t.viewingIds.map(viewingBy).filter(Boolean);view.innerHTML=`<section class="page thread-detail"><button class="detail-back" data-work="${w.id}">‹ ${esc(w.title)}</button><div class="thread-header"><div class="thread-top"><span class="work-label">${esc(w.title)}</span><div class="toolbar"><button class="btn" data-action="edit-title" data-thread-id="${t.id}">제목 수정</button>${t.urls[0]?`<a class="btn" href="${t.urls[0]}" target="_blank" rel="noreferrer">원문 ↗</a>`:''}</div></div><h1>${esc(t.title)}</h1><div class="meta">${esc(t.author)} · ${fmtLongDate(t.createdAt)} · ${t.posts.filter(p=>p.owner).length} posts</div>${viewings.length?`<div class="chips" style="margin-top:13px">${viewings.map(v=>`<span class="chip mint">${fmtDate(v.date)} ${v.session}</span>`).join('')}</div>`:''}</div><div class="thread-posts">${t.posts.map((p,i)=>postView(p,i,focus)).join('')}</div></section>`;bindCommon();if(focus!=null){setTimeout(()=>document.querySelector(`[data-post-index="${focus}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),200)}}
function postView(p,i,focus){const media=p.owner?postMedia(p):[];return `<article class="post" data-post-index="${i}" style="${Number(focus)===i?'outline:2px solid var(--accent);outline-offset:2px':''}"><div class="post-head"><span>${p.owner?`POST ${i+1}`:`↳ ${esc(p.author||'context')}`}</span><span>${p.owner?(media.length?`내 원문 · 이미지 ${media.length}`:'내 원문'):'검색 제외'}</span></div><div class="post-body">${esc(p.text)}</div>${mediaGrid(media)}${p.quote?`<blockquote class="quote-block"><b>${esc(p.quote.author||'인용')}</b><br>${esc(p.quote.text)}${p.quote.mediaCount?`<span class="quote-media-note">이미지 ${p.quote.mediaCount}개 · 원문 맥락만 표시</span>`:''}</blockquote>`:''}${p.context?`<div class="context-reply">맥락용 친구 답글 · 검색에서는 제외</div>`:''}</article>`}

function bindCommon(){
  $$('[data-route]').forEach(el=>el.addEventListener('click',()=>routeTo(el.dataset.route)));
  $$('[data-work]').forEach(el=>el.addEventListener('click',()=>routeTo('work',{id:el.dataset.work,tab:'all'})));
  $$('[data-thread]').forEach(el=>el.addEventListener('click',()=>routeTo('thread',{id:el.dataset.thread,focus:el.dataset.focus})));
  $$('[data-action="open-add"]').forEach(el=>el.addEventListener('click',openAdd));
  $$('[data-action="new-viewing"]').forEach(el=>el.addEventListener('click',()=>openViewing(el.dataset.workId)));
  $$('[data-action="new-work"]').forEach(el=>el.addEventListener('click',openWorkCreator));
  $$('[data-action="open-settings"]').forEach(el=>el.addEventListener('click',openSettings));
  $$('[data-action="edit-title"]').forEach(el=>el.addEventListener('click',()=>editTitle(el.dataset.threadId)));
  $$('[data-action="edit-work"]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();openWorkEditor(el.dataset.workId)}));
  $$('[data-work-tab]').forEach(el=>el.addEventListener('click',()=>routeTo('work',{id:el.dataset.workId,tab:el.dataset.workTab})));
  $$('[data-media-src]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();openImageViewer(el.dataset.mediaSrc,el.dataset.mediaAlt)}));
}

function openAdd(){modalLayer.innerHTML=`<div class="sheet"><div class="modal-head"><h2>새 기록 추가하기</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><div class="choice-grid"><button class="choice-card" data-add-mode="link"><span class="choice-icon">↗</span><div><h3>링크로 가져오기</h3><p>X URL을 여러 개 붙여넣고 타래를 자동으로 가져옵니다.</p></div></button><button class="choice-card" data-add-mode="manual"><span class="choice-icon">✎</span><div><h3>직접 추가하기</h3><p>텍스트를 포스트 단위로 붙여넣어 직접 백업합니다.</p></div></button></div></div></div>`;bindModalClose();$$('[data-add-mode]').forEach(b=>b.addEventListener('click',()=>b.dataset.addMode==='link'?openImport():openManual()));}

function openImport(){
  const def=defaultAccount();
  modalLayer.innerHTML=`<div class="modal"><div class="modal-head"><h2>링크로 가져오기</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><form class="form-grid" id="importForm"><div class="field"><label>타래 URL</label><textarea id="importUrls" placeholder="https://x.com/username/status/…\nhttps://x.com/username/status/…"></textarea><span class="field-hint">여러 URL을 한 번에 붙여넣을 수 있어요.</span></div><div class="field"><label>작성 계정</label><select id="importAuthor">${accountOptions(def?.handle||'',true,'')}</select><span class="field-hint" id="authorDetectHint">URL에서 작성 계정을 감지해요. 필요하면 다른 내 계정으로 바꿀 수 있어요.</span></div><div class="field"><label>작품</label><select id="importWork">${state.works.filter(w=>w.id!=='etc').map(w=>`<option value="${w.id}">${esc(w.title)}</option>`).join('')}</select></div><div class="field"><label>타래 제목</label><input id="importTitle" placeholder="예: 오늘 공연 감상"><span class="field-hint">첫 포스트에서 자동으로 만들고, 원하는 제목으로 고칠 수 있어요.</span></div><div class="field"><label>관극 연결 (선택)</label><div class="chips" id="importViewingChips"></div></div><div class="footer-actions"><button type="button" class="btn" data-close>취소</button><button type="button" class="btn primary" id="previewImport">가져올 포스트 확인</button></div></form></div></div>`;
  bindModalClose();
  const urls=$('#importUrls'), author=$('#importAuthor'), work=$('#importWork');
  function refreshDetected(){const detected=detectAuthorFromUrls(urls.value); const auto=author.querySelector('option[value="auto"]'); if(auto)auto.textContent=`자동 인식${detected?` (${detected})`:''}`; $('#authorDetectHint').textContent=detected?`URL에서 ${detected} 계정을 감지했어요. 필요하면 다른 내 계정으로 바꿀 수 있어요.`:'URL에서 계정을 자동으로 인식하거나 드롭다운에서 선택할 수 있어요.';}
  function refreshViewings(){const list=state.viewings.filter(v=>v.workId===work.value).sort((a,b)=>b.date.localeCompare(a.date)); $('#importViewingChips').innerHTML=list.length?list.map(v=>`<label class="chip"><input type="checkbox" name="importViewing" value="${v.id}"> ${fmtDate(v.date)} ${v.session}</label>`).join(''):'<span class="field-hint">연결할 관극이 아직 없어요.</span>';}
  urls.addEventListener('input',refreshDetected);work.addEventListener('change',refreshViewings);refreshDetected();refreshViewings();
  $('#previewImport').addEventListener('click',openImportPreview);
}

function openImportPreview(){
  const rawUrls=$('#importUrls')?.value.trim()||'';
  if(!rawUrls){ toast('X 타래 URL을 입력해 주세요.'); return; }
  const urls=rawUrls.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const valid=urls.every(u=>/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/[^\/\s]+\/status\/\d+/i.test(u));
  if(!valid){ toast('올바른 X 게시물 URL인지 확인해 주세요.'); return; }
  modalLayer.innerHTML=`<div class="modal"><div class="modal-head"><h2>링크 가져오기</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><div class="setup-notice"><span class="setup-icon">↗</span><h3>X API 연결 전 단계예요.</h3><p>현재 배포본에는 가짜 타래를 생성하지 않도록 데모 가져오기 기능을 제거해 두었어요. X 개발자 앱과 OAuth를 연결하면 이 화면에서 실제 원문과 첨부 이미지를 불러오게 됩니다.</p><div class="footer-actions"><button class="btn" data-close>닫기</button><button class="btn primary" id="goManual">직접 추가하기</button></div></div></div></div>`;
  bindModalClose();
  $('#goManual')?.addEventListener('click',openManual);
}

function openManual(){modalLayer.innerHTML=`<div class="modal"><div class="modal-head"><h2>직접 추가하기</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><form class="form-grid" id="manualForm"><div class="field"><label>작품</label><select id="manualWork"><option value="etc">미분류</option>${state.works.filter(w=>w.id!=='etc').map(w=>`<option value="${w.id}">${esc(w.title)}</option>`).join('')}</select></div><div class="field"><label>작성 계정</label>${state.accounts.length?`<select id="manualAuthor">${accountOptions(defaultAccount()?.handle||'',false)}</select>`:`<input id="manualAuthor" placeholder="@내계정 (선택)">`}</div><div class="field"><label>타래 제목</label><input id="manualTitle" placeholder="예: 캐릭터 해석 메모"></div><div id="manualPosts"></div><button type="button" class="btn" id="addManualPost">＋ 다음 포스트 추가</button><div class="footer-actions"><button type="button" class="btn" data-close>취소</button><button type="button" class="btn primary" id="saveManual">저장</button></div></form></div></div>`;bindModalClose();let n=0;function addEditor(){n++;const box=document.createElement('div');box.className='post-editor';box.innerHTML=`<div class="post-editor-head"><b>POST ${n}</b><div class="inline-actions"><button type="button" class="mini-btn" data-quote>＋ 인용</button><button type="button" class="mini-btn" data-context>＋ 답글 맥락</button>${n>1?'<button type="button" class="mini-btn" data-remove>삭제</button>':''}</div></div><textarea class="manual-text" placeholder="텍스트를 붙여넣어 주세요…"></textarea><div class="post-media-editor"><label class="media-upload">🖼 이미지 추가<input class="manual-media-input" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden></label><small>한 포스트에 최대 4장 · OCR 없이 이미지 그대로 보관</small><div class="media-draft-preview"></div></div><div class="manual-extras"></div>`;$('#manualPosts').append(box);const input=$('.manual-media-input',box),preview=$('.media-draft-preview',box);input.addEventListener('change',()=>{const files=[...input.files].slice(0,4);preview.innerHTML=files.map(f=>`<span>${esc(f.name)}</span>`).join('');});$('[data-remove]',box)?.addEventListener('click',()=>box.remove());$('[data-quote]',box).addEventListener('click',()=>{$('.manual-extras',box).insertAdjacentHTML('beforeend',`<div class="extra-editor quote-editor"><input class="quote-author" placeholder="인용 작성자 (선택)"><textarea class="quote-text" placeholder="인용 내용을 붙여넣어 주세요"></textarea></div>`)});$('[data-context]',box).addEventListener('click',()=>{$('.manual-extras',box).insertAdjacentHTML('beforeend',`<div class="extra-editor context-editor"><input class="context-author" placeholder="답글 작성자 @아이디"><textarea class="context-text" placeholder="맥락용 답글"></textarea></div>`)});$('.manual-text',box).focus();}addEditor();$('#addManualPost').addEventListener('click',addEditor);$('#saveManual').addEventListener('click',async()=>{const editors=$$('.post-editor','#manualPosts');const posts=[];for(const box of editors){const text=$('.manual-text',box).value.trim();if(!text)continue;const media=await filesToMedia($('.manual-media-input',box).files);const qText=$('.quote-text',box)?.value.trim();const cText=$('.context-text',box)?.value.trim();posts.push({owner:true,text,media,...(qText?{quote:{author:$('.quote-author',box)?.value.trim()||'',text:qText}}:{})});if(cText)posts.push({owner:false,author:$('.context-author',box)?.value.trim()||'@context',text:cText,context:true});}if(!posts.some(p=>p.owner)){toast('포스트를 한 개 이상 입력해 주세요.');return}const firstOwner=posts.find(p=>p.owner);const title=$('#manualTitle').value.trim()||firstOwner.text.slice(0,34);const t={id:'t'+Date.now(),workId:$('#manualWork').value,viewingIds:[],title,author:cleanHandle($('#manualAuthor').value)||defaultAccount()?.handle||'',createdAt:new Date().toISOString(),source:'manual',urls:[],posts};state.threads.unshift(t);persist();closeModal();toast('텍스트와 이미지를 함께 저장했어요.');routeTo('thread',{id:t.id});});}

function openViewing(prefWork){
  const availableWorks=state.works.filter(w=>w.id!=='etc');
  if(!availableWorks.length){ toast('먼저 작품을 하나 추가해 주세요.'); openWorkCreator(); return; }
  let castEntries=[];
  let session='낮공';

  modalLayer.innerHTML=`<div class="modal"><div class="modal-head"><h2>새 관극 추가</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><form class="form-grid">
    <div class="field"><label>작품</label><select id="viewWork">${state.works.filter(w=>w.id!=='etc').map(w=>`<option value="${w.id}" ${prefWork===w.id?'selected':''}>${esc(w.title)}</option>`).join('')}</select></div>
    <div class="field"><label>관극일</label><input type="date" id="viewDate" value="${new Date().toISOString().slice(0,10)}"></div>
    <div class="field"><label>회차</label><div class="segment" id="sessionSegment"><button type="button" class="is-active" data-session="낮공">낮공</button><button type="button" data-session="밤공">밤공</button><button type="button" data-session="직접입력">직접 입력</button></div></div>
    <div class="field"><label>극장 (선택)</label><input id="viewVenue" placeholder="예: 공연장 이름"></div>
    <div class="field">
      <label>캐스트</label>
      <div id="castEntryArea"></div>
      <span class="field-hint" id="castModeHint"></span>
    </div>
    <div id="castRoles" class="form-grid"></div>
    <div class="footer-actions"><button type="button" class="btn" data-close>취소</button><button type="button" class="btn primary" id="saveViewing">관극 저장</button></div>
  </form></div></div>`;
  bindModalClose();

  $$('#sessionSegment button').forEach(b=>b.addEventListener('click',()=>{
    $$('#sessionSegment button').forEach(x=>x.classList.remove('is-active'));
    b.classList.add('is-active');
    session=b.dataset.session;
  }));

  function currentWork(){ return workBy($('#viewWork').value); }
  function presetPool(){ return (currentWork()?.castPool||[]).filter(c=>(c.actor||'').trim()); }
  function hasActor(name){ const key=actorKey(name); return castEntries.some(c=>actorKey(c.actor)===key); }

  function addActor(name, preferredRole=''){
    const actor=(name||'').trim(); if(!actor || hasActor(actor)) return;
    const role=(preferredRole||rememberedRole($('#viewWork').value,actor)||'').trim();
    castEntries.push({actor,role,autoRole:Boolean(role)});
    renderCastUI();
  }

  function removeActor(name){
    const key=actorKey(name);
    castEntries=castEntries.filter(c=>actorKey(c.actor)!==key);
    renderCastUI();
  }

  function renderCastUI(){
    const pool=presetPool();
    const host=$('#castEntryArea');
    const hint=$('#castModeHint');

    if(pool.length){
      host.innerHTML=`<div class="cast-picker">${pool.map(c=>{
        const selected=hasActor(c.actor);
        return `<button type="button" class="cast-option ${selected?'is-selected':''}" data-cast-pick="${esc(c.actor)}"><span class="cast-option-check">${selected?'✓':'＋'}</span><span><b>${esc(c.actor)}</b><small>${esc(c.role||'배역 미지정')}</small></span></button>`;
      }).join('')}</div>
      <div class="cast-manual-add"><span>목록에 없는 배우</span><div class="badge-input"><input id="actorInput" placeholder="배우 이름 입력 후 Enter"></div></div>`;
      hint.textContent='작품 정보에 등록된 캐스트는 탭해서 선택할 수 있어요. 목록에 없는 배우는 직접 추가할 수 있습니다.';
    }else{
      host.innerHTML=`<div class="badge-input"><input id="actorInput" placeholder="배우 이름 입력 후 Enter"></div>`;
      hint.textContent='이 작품에는 등록된 캐스트가 없어서 직접 입력해요. 한 번 배역까지 저장하면 다음 관극부터 같은 배우의 배역을 자동으로 불러옵니다.';
    }

    $$('[data-cast-pick]',host).forEach(btn=>btn.addEventListener('click',()=>{
      const actor=btn.dataset.castPick;
      if(hasActor(actor)) removeActor(actor);
      else {
        const match=pool.find(c=>actorKey(c.actor)===actorKey(actor));
        addActor(actor,match?.role||'');
      }
    }));

    const actorInput=$('#actorInput');
    if(actorInput) actorInput.addEventListener('keydown',e=>{
      if(e.key==='Enter' && e.target.value.trim()){
        e.preventDefault();
        addActor(e.target.value.trim());
        const next=$('#actorInput'); if(next) next.value='';
      }
    });

    $('#castRoles').innerHTML=castEntries.length
      ? castEntries.map((c,i)=>`<div class="cast-role-line">
          <div class="cast-row">
            <div class="actor-name">${esc(c.actor)}</div>
            <div class="role-input-wrap">
              <input id="role-${i}" value="${esc(c.role||'')}" placeholder="배역 (선택)" data-role-index="${i}">
              ${c.autoRole&&c.role?'<span class="auto-role-badge">자동</span>':''}
            </div>
          </div>
          <button type="button" class="mini-btn cast-remove" data-cast-remove="${i}">삭제</button>
        </div>`).join('')
      : '<div class="cast-empty-note">아직 선택된 배우가 없어요.</div>';

    $$('[data-role-index]').forEach(inp=>inp.addEventListener('input',()=>{
      const i=Number(inp.dataset.roleIndex);
      castEntries[i].role=inp.value;
      castEntries[i].autoRole=false;
      inp.closest('.role-input-wrap')?.querySelector('.auto-role-badge')?.remove();
    }));
    $$('[data-cast-remove]').forEach(btn=>btn.addEventListener('click',()=>{
      castEntries.splice(Number(btn.dataset.castRemove),1);
      renderCastUI();
    }));
  }

  $('#viewWork').addEventListener('change',()=>{
    castEntries=[];
    renderCastUI();
  });

  renderCastUI();

  $('#saveViewing').addEventListener('click',()=>{
    const v={
      id:'v'+Date.now(),
      workId:$('#viewWork').value,
      date:$('#viewDate').value,
      session,
      venue:$('#viewVenue').value.trim(),
      cast:castEntries.map(c=>({actor:c.actor.trim(),role:(c.role||'').trim()})).filter(c=>c.actor)
    };
    state.viewings.unshift(v);
    persist();
    closeModal();
    toast('관극 기록을 저장했어요.');
    routeTo('work',{id:v.workId});
  });
}

function openSettings(){
  const current=document.body.dataset.theme;const def=defaultAccount();
  modalLayer.innerHTML=`<div class="modal settings-modal"><div class="modal-head"><h2>설정</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><section class="settings-section"><h3>테마</h3><p class="page-sub">앱의 분위기를 원하는 대로 바꿔보세요.</p><div class="theme-grid">${['light','lavender','peach','dark'].map(t=>`<button class="theme-option ${current===t?'is-active':''}" data-theme-value="${t}"><div class="theme-swatch"></div><b>${t[0].toUpperCase()+t.slice(1)}</b></button>`).join('')}</div></section><section class="settings-section"><div class="settings-section-head"><div><h3>나의 X 계정</h3><p class="page-sub">링크를 가져올 때 URL에서 계정을 자동 인식하고, 저장된 계정 중 하나로 바꿀 수 있어요.</p></div></div><div class="account-list">${state.accounts.length?state.accounts.map((a,i)=>`<div class="account-row"><label class="account-main"><input type="radio" name="defaultAccount" value="${i}" ${a.isDefault?'checked':''}><span><b>${esc(a.handle)}</b><small>${a.label?esc(a.label):'계정'}${a.isDefault?' · 기본':''}</small></span></label>${state.accounts.length>1?`<button class="mini-btn" data-remove-account="${i}">삭제</button>`:''}</div>`).join(''):'<div class="empty">아직 등록된 X 계정이 없어요.</div>'}</div><div class="account-add"><input id="newAccountHandle" placeholder="@다른계정"><input id="newAccountLabel" placeholder="메모 (선택)"><button class="btn" id="addAccount">＋ 계정 추가</button></div></section></div></div>`;
  bindModalClose();
  $$('[data-theme-value]').forEach(b=>b.addEventListener('click',()=>{document.body.dataset.theme=b.dataset.themeValue;localStorage.setItem('hth-theme',b.dataset.themeValue);$$('[data-theme-value]').forEach(x=>x.classList.toggle('is-active',x===b));}));
  $$('input[name="defaultAccount"]').forEach(r=>r.addEventListener('change',()=>{state.accounts.forEach((a,i)=>a.isDefault=i===Number(r.value));persist();syncProfile();toast(`${defaultAccount().handle}을 기본 계정으로 설정했어요.`);openSettings();}));
  $$('[data-remove-account]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.removeAccount);const wasDefault=state.accounts[i]?.isDefault;state.accounts.splice(i,1);if(wasDefault&&state.accounts[0])state.accounts[0].isDefault=true;persist();syncProfile();openSettings();}));
  $('#addAccount').addEventListener('click',()=>{const handle=cleanHandle($('#newAccountHandle').value);if(!handle){toast('계정 아이디를 입력해 주세요.');return}if(state.accounts.some(a=>a.handle.toLowerCase()===handle.toLowerCase())){toast('이미 등록된 계정이에요.');return}state.accounts.push({handle,label:$('#newAccountLabel').value.trim(),isDefault:false});persist();openSettings();toast(`${handle} 계정을 추가했어요.`);});
}

function openWorkCreator(){
  modalLayer.innerHTML=`<div class="modal"><div class="modal-head"><h2>새 작품 추가</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><div class="form-grid"><div class="field"><label>작품 제목</label><input id="newWorkTitle" placeholder="예: 작품 제목"></div><div class="field"><label>시즌 기간 (선택)</label><div class="date-pair"><input type="date" id="newSeasonStart"><span>—</span><input type="date" id="newSeasonEnd"></div><span class="field-hint">같은 작품의 다음 시즌은 별도 작품 카드로 추가해두면 이전 시즌 기록과 섞이지 않아요.</span></div><div class="field"><label>대표 아이콘</label><input id="newWorkIcon" maxlength="3" value="✦"></div><div class="footer-actions"><button class="btn" data-close>취소</button><button class="btn primary" id="saveNewWork">추가</button></div></div></div></div>`;
  bindModalClose();setTimeout(()=>$('#newWorkTitle')?.focus(),50);
 $('#saveNewWork').addEventListener('click', async () => {
  const title = $('#newWorkTitle').value.trim();

  if (!title) {
    toast('작품 제목을 입력해 주세요.');
    return;
  }

  try {
    const response = await fetch('/api/works', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        season_start: $('#newSeasonStart').value || null,
        season_end: $('#newSeasonEnd').value || null,
        icon: $('#newWorkIcon').value.trim() || '✦'
      })
    });

    const saved = await response.json();

    if (!response.ok) {
      throw new Error(saved.error || '작품 저장에 실패했어요.');
    }

    const tones = ['lavender', 'peach', 'mint', 'blue'];

    const w = {
      id: String(saved.id),
      title: saved.title,
      tone: tones[state.works.length % tones.length],
      icon: saved.icon || '✦',
      seasonStart: saved.season_start || '',
      seasonEnd: saved.season_end || '',
      castPool: []
    };

    const etc = state.works.find(x => x.id === 'etc');

    state.works = state.works.filter(x => x.id !== 'etc');
    state.works.push(w);

    if (etc) state.works.push(etc);

    persist();
    closeModal();
    toast(`${title} 작품을 추가했어요.`);
    routeTo('work', { id: w.id, tab: 'all' });

  } catch (error) {
    console.error(error);
    toast('작품 저장 중 오류가 발생했어요.');
  }
});
}

function openWorkEditor(workId){
  const w=workBy(workId);if(!w)return;let rows=(w.castPool?.length?w.castPool:inferredWorkCast(workId)).map(c=>({...c}));
  modalLayer.innerHTML=`<div class="modal"><div class="modal-head"><h2>작품 정보 수정</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><div class="form-grid"><div class="field"><label>작품 제목</label><input id="editWorkTitle" value="${esc(w.title)}"></div><div class="field"><label>시즌 기간 (선택)</label><div class="date-pair"><input type="date" id="editSeasonStart" value="${esc(w.seasonStart||'')}"><span>—</span><input type="date" id="editSeasonEnd" value="${esc(w.seasonEnd||'')}"></div><span class="field-hint">다음 시즌이 와도 같은 작품명끼리 헷갈리지 않도록 첫공일–막공일을 기록할 수 있어요.</span></div><div class="field"><label>대표 아이콘</label><input id="editWorkIcon" maxlength="3" value="${esc(w.icon||'✦')}" placeholder="✦"><span class="field-hint">이모지나 한두 글자 기호를 사용할 수 있어요.</span></div><div class="field"><label>배우 · 배역</label><div id="workCastRows" class="work-cast-editor"></div><button class="btn" type="button" id="addWorkCast">＋ 배우 추가</button></div><div class="footer-actions"><button class="btn" id="deleteWork">작품 삭제</button><button class="btn" data-close>취소</button><button class="btn primary" id="saveWorkEdit">저장</button></div></div></div></div>`;
  bindModalClose();
  function drawRows(){const host=$('#workCastRows');host.innerHTML=rows.map((c,i)=>`<div class="work-cast-row"><input data-cast-actor="${i}" value="${esc(c.actor||'')}" placeholder="배우 이름"><input data-cast-role="${i}" value="${esc(c.role||'')}" placeholder="배역 (선택)"><button class="mini-btn" data-cast-remove="${i}" type="button">×</button></div>`).join('')||'<div class="field-hint">아직 등록된 배우가 없어요. 필요할 때만 추가해도 됩니다.</div>';$$('[data-cast-actor]',host).forEach(el=>el.addEventListener('input',()=>rows[Number(el.dataset.castActor)].actor=el.value));$$('[data-cast-role]',host).forEach(el=>el.addEventListener('input',()=>rows[Number(el.dataset.castRole)].role=el.value));$$('[data-cast-remove]',host).forEach(el=>el.addEventListener('click',()=>{rows.splice(Number(el.dataset.castRemove),1);drawRows()}));}
  drawRows();$('#addWorkCast').addEventListener('click',()=>{rows.push({actor:'',role:''});drawRows();setTimeout(()=>$$('[data-cast-actor]','#workCastRows').at(-1)?.focus(),0)});
  $('#saveWorkEdit').addEventListener('click',()=>{w.title=$('#editWorkTitle').value.trim()||w.title;w.seasonStart=$('#editSeasonStart').value;w.seasonEnd=$('#editSeasonEnd').value;w.icon=$('#editWorkIcon').value.trim()||'✦';w.castPool=rows.map(c=>({actor:c.actor.trim(),role:c.role.trim()})).filter(c=>c.actor);persist();closeModal();toast('작품 정보를 수정했어요.');if(route==='work')renderWork(w.id);else renderLibrary();});
  
$('#deleteWork').addEventListener('click', async () => {
  const ok = confirm(
    `${w.title} 작품을 삭제할까요?\n연결된 관극과 타래는 미분류로 이동합니다.`
  );

  if (!ok) return;

  try {
    const response = await fetch(`/api/works/${w.id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '작품 삭제에 실패했어요.');
    }

    // 현재 브라우저에 저장된 연결 기록은 보존하고 미분류로 이동
    state.viewings.forEach(v => {
      if (v.workId === w.id) v.workId = 'etc';
    });

    state.threads.forEach(t => {
      if (t.workId === w.id) t.workId = 'etc';
    });

    state.works = state.works.filter(x => x.id !== w.id);

    persist();
    closeModal();
    toast(`${w.title} 작품을 삭제했어요.`);
    routeTo('library');

  } catch (error) {
    console.error(error);
    toast('작품 삭제 중 오류가 발생했어요.');
  }
});
}
function openImageViewer(src,alt='첨부 이미지'){modalLayer.innerHTML=`<div class="image-viewer"><button class="close-btn image-viewer-close" data-close>×</button><img src="${esc(src)}" alt="${esc(alt)}"><div class="image-viewer-caption">${esc(alt)}</div></div>`;bindModalClose();}

function editTitle(id){const t=state.threads.find(x=>x.id===id);modalLayer.innerHTML=`<div class="sheet"><div class="modal-head"><h2>타래 제목 수정</h2><button class="close-btn" data-close>×</button></div><div class="modal-body"><div class="field"><label>제목</label><input id="titleEditInput" value="${esc(t.title)}"><span class="field-hint">제목은 검색 대상이지만 원문은 그대로 유지돼요.</span></div><div class="footer-actions"><button class="btn" data-close>취소</button><button class="btn primary" id="saveTitle">저장</button></div></div></div>`;bindModalClose();setTimeout(()=>$('#titleEditInput').focus(),50);$('#saveTitle').addEventListener('click',()=>{t.title=$('#titleEditInput').value.trim()||t.title;persist();closeModal();renderThread(id);toast('타래 제목을 수정했어요.');});}
function bindModalClose(){$$('[data-close]').forEach(b=>b.addEventListener('click',closeModal));modalLayer.addEventListener('click',e=>{if(e.target===modalLayer)closeModal()},{once:true});}
function closeModal(){modalLayer.innerHTML='';}

// global clicks
$$('[data-route]').forEach(el=>el.addEventListener('click',()=>routeTo(el.dataset.route)));
$$('[data-action="open-add"]').forEach(el=>el.addEventListener('click',openAdd));
$$('[data-action="open-settings"]').forEach(el=>el.addEventListener('click',openSettings));
$('#sideSearchInput').addEventListener('keydown',e=>{if(e.key==='Enter'){searchState.q=e.target.value.trim();routeTo('search')}});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();routeTo('search');setTimeout(()=>$('#searchInput')?.focus(),50)}if(e.key==='Escape')closeModal();});
const theme=localStorage.getItem('hth-theme');if(theme)document.body.dataset.theme=theme;
boot();
