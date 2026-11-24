/* =========================================================
   C:\ARCHIVE — script
   - 바탕화면 아이콘 → 창 열기 (창은 하나씩, 겹쳐 띄우기)
   - 주소 이동: /log/3, /archive/1/2, /pair/1, /pairs/2 …
     (글 번호는 오래된 글부터 1번. 404.html이 GitHub Pages에서 없는 주소를 홈으로 돌려줘요)
   - 모바일(820px 이하): 업로드 창만 보이고, 여는 창은 아래에서 위로 겹쳐 쌓여요
   ========================================================= */

/* ---------------------------------------------------------
   0. 설정 — 여기만 고치면 되는 것들
   --------------------------------------------------------- */

/* 유튜브 재생목록 ID (music.youtube.com / youtube.com 재생목록 주소의 list= 뒤 값) */
const YT_PLAYLIST_ID = 'PL7LA9VHSxZWTgbRT1MFex4Jk09koZ4rQ1';

/* 페어 목록. members의 post는 posts/pair/<post>.html 파일 이름이에요.
   새 페어에 프로필 글을 추가하면 members에 한 줄씩 넣으면 돼요. */
const PAIRS = [
  { no: '01', title: 'CODE × CANDY', members: [
    { post: 'character-1', name: 'CODE',  sub: 'C-Class Guide',    thumb: 'img/pair/character-1.jpg' },
    { post: 'character-2', name: 'CANDY', sub: 'S-Class Vanguard', thumb: 'img/pair/character-2.jpg' }
  ]},
  { no: '02', title: 'NINE × ROMY',    members: [] },
  { no: '03', title: 'DEMON × CHERRY', members: [] }
];

/* 그림 방명록 저장 Worker 주소. workers/guestbook-worker.js 를 Cloudflare에 올린 뒤
   그 주소(예: 'https://code-guestbook.내계정.workers.dev')를 넣어요. 비어 있으면 "아직 연결되지 않았어요"가 떠요. */
const GUESTBOOK_URL = 'https://code-guestbook.jenojeno0423.workers.dev';

/* ---------------------------------------------------------
   1. 픽셀 아이콘 (SVG로 그려요)
   --------------------------------------------------------- */
const PAL = { o:'#2A74B5', d:'#1B4F80', w:'#FFFFFF', a:'#E4F2FC', b:'#A6D2F0', c:'#74B6E6', e:'#4598D6' };
const PAL_LIGHT = { ...PAL, o:'#FFFFFF', d:'#CBE5F7' }; // 제목줄(파란 바탕) 위에 쓰는 흰 테두리 버전
const ICONS = {
  folder: ["................",".ooooo..........",".obbbbo.........",".obbbbbooooooo..",".owwwwwwwwwwwwo.",".ocbbbbbbbbbbbod",".ocbbbbbbbbbbbod",".ocbbbbbbbbbbbod",".occcccccccccccod",".oooooooooooooood","..ddddddddddddddd"],
  doc:    ["...oooooooo.....","...owwwwwwoo....","...owwwwwwoao...","...owbbbbwoooo..","...owwwwwwwwwod.","...owccccccwwod.","...owwwwwwwwwod.","...owccccccwwod.","...owwwwwwwwwod.","...ooooooooooood","....dddddddddddd"],
  chat:   ["................","..oooooooooooo..",".owwwwwwwwwwwwo.",".owwewwewwewwwod",".owwwwwwwwwwwwod",".oaaaaaaaaaaaaod","..ooowoooooooodd","....owod........","....ood........."],
  cd:     [".....oooooo.....","...oowwbbccoo...","..owwwbbbcccco..",".owwbbbaabbccco.",".obbbaowwoabbcod",".obbbaowwoabbcod",".occbbaabbbbbbod","..occcbbbbbbbod.","...ooccbbbbood..",".....oooooodd..."],
  pc:     [".oooooooooooooo.",".owwwwwwwwwwwwod",".owcccccccccbwod",".owcbbbbbbbbbwod",".owcbbbbbbbbbwod",".owwwwwwwwwwwwod",".oooooooooooooood","......oaao..dd..","....oooooooo....","....ooooooooo..."],
  globe:  [".....oooooo.....","...oocbbbbcoo...","..ocbbwwbbbbco..",".obbwwbbbccbbbod",".obbbbbbcccbbbod",".obbbccbbbbbwbod",".ocbcccbbbbwwcod","..ocbccbbbbbcod.","...oocbbbbcood..",".....oooooodd..."],
  paint:  ["..........oo....",".........oddo...","........odwdo...",".......odwdo....","..oooooddddooo..",".owwwoddo.wwwo..",".owcwodo.wwwwod.",".owwwoo.wewwwod.",".owwwwwwwwwwwod.",".owbwwwcwwewwod.",".owwwwwwwwwwwod.",".ooooooooooooood","..ddddddddddddd."],
  heart:  ["..oo..oo..",".owwooewo.",".owwweeeo.",".oweeeeeo.","..oeeeeo..","...oeeo...","....oo...."],
  gear:   ["......oooo......","..oo..owwo..oo..",".owwooowwooowwo.",".owwwwwwwwwwwwo.","..owwbbbbbbwwo..","..owbbooooobbo..","ooowbo....obwooo","owwwbo....obwwwo","owwwbo....obwwwo","ooowbo....obwooo","..owbbooooobbo..","..owwbbbbbbwwo..",".owwwwwwwwwwwwo.",".owwooowwooowwo.","..oo..owwo..oo..","......oooo......"]
};
function px(name, scale, pal){
  const rows = ICONS[name];
  if (!rows) return '';
  const p = pal || PAL;
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  let r = '';
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (p[c]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${p[c]}"/>`; }));
  return `<svg class="pi" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${r}</svg>`;
}
function paintIcons(root){
  (root || document).querySelectorAll('[data-ico]:not(.win):not(.dicon)').forEach(el => {
    const name = el.dataset.ico;
    if (el.classList.contains('dicon-glyph')) el.innerHTML = px(name, 3);
    else if (el.classList.contains('win-ico')) el.innerHTML = px(name, 1.25, PAL_LIGHT);
    else if (el.classList.contains('start-head-ico')) el.innerHTML = px('heart', 2, { ...PAL, o:'#fff', e:'#E4F2FC', w:'#fff' });
    else if (el.closest('.tb-start')) el.innerHTML = px('heart', 2, { ...PAL, o:'#1B4F80' });
    else el.innerHTML = px(name, 1.5);
  });
}
paintIcons();

const BTN_GLYPH = {
  min: '<svg width="9" height="9" aria-hidden="true"><rect x="1" y="6" width="6" height="2" fill="#fff"/></svg>',
  max: '<svg width="9" height="9" aria-hidden="true"><rect x=".5" y=".5" width="8" height="8" fill="none" stroke="#fff"/><rect width="9" height="2" fill="#fff"/></svg>',
  close: '<svg width="9" height="9" aria-hidden="true"><path d="M1 1L8 8M8 1L1 8" stroke="#fff" stroke-width="2"/></svg>'
};

/* ---------------------------------------------------------
   2. 주소 이동
   --------------------------------------------------------- */
const PATH_OF = { pairWin:'pairs', galleryWin:'archive', logWin:'log', chatWin:'record', trackWin:'track', paintWin:'paint', linksWin:'links', adminWin:'admin' };
const WIN_OF = Object.fromEntries(Object.entries(PATH_OF).map(([k, v]) => [v, k]));
WIN_OF.pair = 'pairWin';   // 예전 주소 /pair/1 호환
WIN_OF.menu = 'linksWin';  // 예전 주소 /menu 호환

let routing = false;
function nav(path){
  if (routing || location.pathname === path) return;
  try { history.pushState(null, '', path); } catch (e) {}
}
function numOf(list, id){ const i = list.findIndex(x => x.id === id); return i < 0 ? '' : list.length - i; }
function idOf(list, n){ n = parseInt(n, 10); if (!(n > 0) || n > list.length) return null; return list[list.length - n].id; }

/* ---------------------------------------------------------
   3. 창 관리 (열기 / 닫기 / 최소화 / 최대화 / 끌기 / 작업 표시줄)
   --------------------------------------------------------- */
const mqMobile = window.matchMedia('(max-width:820px)');
const isMobile = () => mqMobile.matches;
const TASKBAR_H = 40;
const wins = [...document.querySelectorAll('.win')];
const winById = id => document.getElementById(id);

let zTop = 10;
let stack = [];      // 화면에 보이는 창들, 마지막이 맨 위
let tasks = [];      // 작업 표시줄에 있는 창들 (열린 순서)

// 창 버튼(최소화·최대화·닫기) 만들기
wins.forEach(win => {
  const box = win.querySelector('.win-btns');
  if (!box) return;
  const only = box.dataset.only;
  const kinds = only ? only.split(',') : ['min', 'max', 'close'];
  const label = { min:'최소화', max:'최대화', close:'닫기' };
  box.innerHTML = kinds.map(k => `<button type="button" class="wb" data-g="${k}" aria-label="${win.dataset.title || ''} ${label[k]}">${BTN_GLYPH[k]}</button>`).join('');
  box.querySelectorAll('.wb').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const k = b.dataset.g;
    if (k === 'close') closeWinAndNav(win.id);
    else if (k === 'min') minimizeWin(win.id);
    else if (k === 'max') win.classList.toggle('is-max');
  }));
});

function bringToFront(el){
  zTop += 1;
  el.style.zIndex = zTop;
  stack = stack.filter(id => id !== el.id);
  stack.push(el.id);
  wins.forEach(w => w.classList.toggle('is-top', w === el));
  layout();
  renderTasks();
}

function openWin(id){
  const el = winById(id);
  if (!el) return;
  const wasHidden = el.hidden;
  el.hidden = false;
  delete el.dataset.min;
  if (!el.dataset.notask && !tasks.includes(id)) tasks.push(id);
  bringToFront(el);
  clampWindow(el);
  if (wasHidden) onWinShown(id);
}
function closeWin(id){
  const el = winById(id);
  if (!el) return;
  el.hidden = true;
  el.classList.remove('is-max');
  delete el.dataset.min;
  stack = stack.filter(x => x !== id);
  tasks = tasks.filter(x => x !== id);
  onWinHidden(id);
  refocusTop();
}
function minimizeWin(id){
  const el = winById(id);
  if (!el) return;
  el.hidden = true;
  el.dataset.min = '1';
  stack = stack.filter(x => x !== id);
  refocusTop();
}
function refocusTop(){
  const top = stack[stack.length - 1];
  wins.forEach(w => w.classList.toggle('is-top', w.id === top));
  layout();
  renderTasks();
}
function closeWinAndNav(target){
  closeWin(target);
  if (target === 'postWin') { nav(postParentPath); return; }
  const seg = location.pathname.split('/').filter(Boolean);
  if (WIN_OF[seg[0]] === target) nav('/');
}

// 바탕화면 아이콘 · 시작 메뉴 · [data-open-target]
function openAndNav(target){
  openWin(target);
  if (target === 'pairWin') { renderPairs(null); }
  nav('/' + (PATH_OF[target] || ''));
}
document.querySelectorAll('[data-open-target]').forEach(el => {
  el.addEventListener('click', () => openAndNav(el.dataset.openTarget));
});
document.querySelectorAll('[data-close]').forEach(el => {
  el.addEventListener('click', () => closeWin(el.dataset.close));
});
wins.forEach(w => w.addEventListener('pointerdown', () => { if (!w.classList.contains('is-top')) bringToFront(w); }));

// 작업 표시줄
const tbTasks = document.getElementById('tbTasks');
function renderTasks(){
  const top = stack[stack.length - 1];
  tbTasks.innerHTML = '';
  tasks.forEach(id => {
    const w = winById(id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tb-task' + (id === top ? ' is-active' : '') + (w.dataset.min ? ' is-min' : '');
    b.innerHTML = px(w.dataset.ico || 'doc', 1.1, PAL_LIGHT) + '<span></span>';
    b.querySelector('span').textContent = w.dataset.title || id;
    b.addEventListener('click', () => {
      if (w.hidden) openWin(id);
      else if (id === stack[stack.length - 1]) minimizeWin(id);
      else bringToFront(w);
    });
    tbTasks.appendChild(b);
  });
  document.querySelectorAll('.dicon').forEach(d => d.classList.toggle('is-open', tasks.includes(d.dataset.openTarget)));
}

// 데스크톱: 작업 표시줄 아래로 창이 내려가지 않게
function clampWindow(win){
  if (isMobile() || win.hidden || win.classList.contains('is-max')) return;
  const limit = window.innerHeight - TASKBAR_H;
  const rect = win.getBoundingClientRect();
  if (rect.bottom <= limit + 1) return;
  const overflow = rect.bottom - limit;
  if (rect.top - overflow >= 0) {
    win.style.top = (win.offsetTop - overflow) + 'px';
    win.style.bottom = 'auto';
  } else {
    win.style.height = Math.max(150, rect.height - overflow) + 'px';
  }
}
wins.forEach(win => new ResizeObserver(() => clampWindow(win)).observe(win));

// 데스크톱: 제목줄 끌어서 옮기기, 더블클릭으로 최대화
wins.forEach(win => {
  const bar = win.querySelector('.win-title');
  if (!bar) return;
  let dragging = false, ox = 0, oy = 0;
  bar.addEventListener('pointerdown', e => {
    if (isMobile() || e.target.closest('.win-btns') || win.classList.contains('is-max')) return;
    dragging = true;
    const r = win.getBoundingClientRect();
    ox = e.clientX - r.left; oy = e.clientY - r.top;
    win.style.width = r.width + 'px';
    win.style.height = r.height + 'px';
    win.style.right = 'auto'; win.style.bottom = 'auto';
    win.style.left = r.left + 'px'; win.style.top = r.top + 'px';
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener('pointermove', e => {
    if (!dragging) return;
    const maxX = window.innerWidth - 60, maxY = window.innerHeight - TASKBAR_H - 28;
    win.style.left = Math.min(maxX, Math.max(-win.offsetWidth + 80, e.clientX - ox)) + 'px';
    win.style.top = Math.min(maxY, Math.max(0, e.clientY - oy)) + 'px';
  });
  const end = () => { if (dragging) { dragging = false; clampWindow(win); } };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  bar.addEventListener('dblclick', e => { if (!isMobile() && !e.target.closest('.win-btns') && win.dataset.win !== 'uploadWin') win.classList.toggle('is-max'); });
});

// 모바일: 열린 순서대로 아래에서 위로 겹쳐 쌓기
const STACK_STEP = 44;
function layout(){
  if (!isMobile()) {
    wins.forEach(w => { if (w.dataset.mstack) { w.style.bottom = ''; w.style.maxHeight = ''; delete w.dataset.mstack; } });
    return;
  }
  stack.forEach((id, i) => {
    const w = winById(id);
    const bottom = TASKBAR_H + 8 + i * STACK_STEP;
    w.dataset.mstack = '1';
    w.style.bottom = bottom + 'px';
    w.style.maxHeight = Math.max(200, window.innerHeight - bottom - 10) + 'px';
  });
}
mqMobile.addEventListener('change', () => { layout(); wins.forEach(clampWindow); });
window.addEventListener('resize', () => { layout(); wins.forEach(clampWindow); });

/* ---------------------------------------------------------
   4. 시작 메뉴 · 시계
   --------------------------------------------------------- */
const startBtn = document.getElementById('tbStart');
const startMenu = document.getElementById('startMenu');
const startList = document.getElementById('startList');
const startItems = {}; // 창 id → 시작 메뉴 줄 (관리 메뉴를 숨겼다 보였다 하려고)
document.querySelectorAll('.dicon').forEach(d => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = px(d.querySelector('.dicon-glyph').dataset.ico, 1.5) + d.querySelector('.dicon-label').textContent;
  b.addEventListener('click', () => { toggleStart(false); openAndNav(d.dataset.openTarget); });
  li.appendChild(b);
  li.hidden = d.hidden;
  startItems[d.dataset.openTarget] = li;
  startList.appendChild(li);
});
function toggleStart(v){
  const open = v === undefined ? startMenu.hidden : v;
  startMenu.hidden = !open;
  startBtn.setAttribute('aria-expanded', String(open));
}
startBtn.addEventListener('click', e => { e.stopPropagation(); toggleStart(); });
document.addEventListener('click', e => { if (!startMenu.hidden && !startMenu.contains(e.target)) toggleStart(false); });

function tickClock(){
  const now = new Date();
  document.getElementById('clock').textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}
tickClock();
setInterval(tickClock, 15000);

/* ---------------------------------------------------------
   5. 바탕화면 코드 (PAIRS 목록으로 만들어요)
   --------------------------------------------------------- */
(function renderBgCode(){
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const w = Math.max(...PAIRS.map(p => p.title.length)) + 2;
  const rows = PAIRS.map(p => {
    const t = ('"' + p.title + '",').padEnd(w + 1, ' ');
    return `  { id: <span class="s">${p.no}</span>, title: <span class="s">${esc(t)}</span> status: <span class="k">ONLINE</span> },`;
  });
  document.getElementById('bgCode').innerHTML =
    '<span class="c">// C:\\ARCHIVE\\pairs.js</span>\n' +
    '<span class="k">const</span> PAIRS = [\n' + rows.join('\n') + '\n];\n' +
    `archive.mount(PAIRS);  <span class="c">// ${PAIRS.length} pairs found</span>`;
})();

/* ---------------------------------------------------------
   6. 글 · 아카이브 · 로그 (data/*.json, posts/<cat>/<id>.html)
   --------------------------------------------------------- */
/* ARCHIVE · LOG 는 페어별로 섹션(탭) 3개예요. 탭 이름은 아래 SECTION_NAMES (PAIRS 순서와 같아요).
   ARCHIVE n번 = data/gallery<n>.json, LOG는 data/log.json 한 파일에 글마다 "pair": "1"~"3"
   이름을 바꾸면 tools/upload.html, tools/edit.html의 선택칸 이름도 같이 바꿔주세요. */
const SECTION_NAMES = ['CXC', '9.44', 'D-cherry'];
const SECTION_COUNT = SECTION_NAMES.length;
function sectionName(n){ return SECTION_NAMES[n - 1] || 'SECTION ' + n; }
const galleries = { 1: [], 2: [], 3: [] };
let logItems = [];
const galPage = { 1: 1, 2: 1, 3: 1 };
let activeCat = 1;
let activeLogPair = 1;
function logList(p){ return logItems.filter(x => String(x.pair || 1) === String(p)); }
function buildTabs(boxId, onPick){
  const box = document.getElementById(boxId);
  for (let n = 1; n <= SECTION_COUNT; n++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab';
    b.dataset.n = n;
    b.textContent = sectionName(n);
    b.addEventListener('click', () => onPick(n));
    box.appendChild(b);
  }
}
function markTabs(boxId, n){ document.querySelectorAll('#' + boxId + ' .tab').forEach(t => t.classList.toggle('active', Number(t.dataset.n) === n)); }

async function fetchJSON(path){
  const res = await fetch(path);
  if (!res.ok) throw new Error(path + ' (' + res.status + ')');
  return res.json();
}
function galleryList(cat){ return galleries[cat] || []; }

const postWin = document.getElementById('postWin');
const postMeta = document.getElementById('postMeta');
const postContent = document.getElementById('postContent');
const postTitle = document.getElementById('postTitle');

/* 잠금 글: posts/<cat>/<id>.html 안에
   <div class="locked-post" data-salt="…" data-iv="…" data-cipher="…"></div>
   가 있으면 비밀번호로 풀어서 보여줘요 (AES-256-GCM, PBKDF2 100000회). */
function parseLockedPost(html){
  const m = html.match(/<div class="locked-post" data-salt="([^"]+)" data-iv="([^"]+)" data-cipher="([^"]+)">/);
  return m ? { salt: m[1], iv: m[2], cipher: m[3] } : null;
}
function base64ToBytes(b64){
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function decryptLockedPost(locked, password){
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: base64ToBytes(locked.salt), iterations: 100000, hash: 'SHA-256' },
    baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  );
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(locked.iv) }, key, base64ToBytes(locked.cipher));
  return new TextDecoder().decode(plain);
}
function renderLockGate(){
  return '<div class="lock-gate">' +
    '<iconify-icon class="lock-gate-icon" icon="solar:lock-keyhole-minimalistic-bold-duotone"></iconify-icon>' +
    '<p class="lock-gate-hint">비밀번호가 필요한 글이에요</p>' +
    '<div class="lock-gate-row">' +
      '<input type="password" class="lock-gate-input" placeholder="비밀번호" autocomplete="off">' +
      '<button type="button" class="lock-gate-submit">확인</button>' +
    '</div>' +
    '<p class="lock-gate-error" hidden>비밀번호가 틀렸어요</p>' +
  '</div>';
}
function wireLockGate(locked){
  const input = postContent.querySelector('.lock-gate-input');
  const submit = postContent.querySelector('.lock-gate-submit');
  const error = postContent.querySelector('.lock-gate-error');
  const tryUnlock = async () => {
    const password = input.value;
    if (!password || submit.disabled) return;
    submit.disabled = true;
    error.hidden = true;
    try {
      postContent.innerHTML = await decryptLockedPost(locked, password);
      runScripts(postContent);
    } catch (e) {
      error.hidden = false;
      input.value = '';
      input.focus();
      submit.disabled = false;
    }
  };
  submit.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
  if (!isMobile()) input.focus();
}
// 스포일러: 흐린 글을 누르면(키보드는 Enter) 보여요
postContent.addEventListener('click', e => {
  const sp = e.target.closest && e.target.closest('.spoiler:not(.show)');
  if (sp) { e.preventDefault(); e.stopPropagation(); sp.classList.add('show'); }
}, true);
postContent.addEventListener('keydown', e => {
  const sp = e.target.closest && e.target.closest('.spoiler:not(.show)');
  if (sp && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sp.classList.add('show'); }
});
function runScripts(container){
  container.querySelectorAll('.spoiler').forEach(sp => { sp.tabIndex = 0; sp.setAttribute('aria-label', '가려진 글 · 눌러서 보기'); });
  // innerHTML로 넣은 <script>는 실행되지 않아서 새 script로 바꿔 실행시켜요.
  container.querySelectorAll('script').forEach(old => {
    const s = document.createElement('script');
    for (const attr of old.attributes) s.setAttribute(attr.name, attr.value);
    s.textContent = old.textContent;
    old.replaceWith(s);
  });
}

let postParentPath = '/';
let currentPost = null; // { catPath, id } — 관리자 "수정" 버튼용
async function openPost(catPath, meta, id, path, title){
  if (path) { postParentPath = path.replace(/\/[^/]+$/, '') || '/'; nav(path); }
  currentPost = { catPath, id };
  syncPostEdit();
  postMeta.textContent = meta;
  postTitle.textContent = title || id;
  postWin.dataset.title = title || id;
  postContent.innerHTML = '불러오는 중…';
  openWin('postWin');
  postWin.querySelector('.win-body').scrollTop = 0;
  try {
    const res = await fetch('posts/' + catPath + '/' + encodeURIComponent(id) + '.html');
    if (!res.ok) throw new Error();
    const html = await res.text();
    const locked = parseLockedPost(html);
    if (locked) {
      postContent.innerHTML = renderLockGate();
      wireLockGate(locked);
    } else {
      postContent.innerHTML = html;
      runScripts(postContent);
    }
  } catch (e) {
    postContent.innerHTML = '<p>본문을 불러오지 못했어요. (파일을 직접 열면 본문을 못 가져와요 — GitHub Pages 등으로 열어서 확인해주세요.)</p>';
  }
}
function openGalleryPost(cat, item){
  openPost('gallery' + cat, 'ARCHIVE · ' + sectionName(cat), item.id, '/archive/' + cat + '/' + numOf(galleryList(cat), item.id), item.label || item.id);
}
function openLogPost(item){
  const p = Number(item.pair) || 1;
  openPost('log', 'LOG · ' + sectionName(p) + ' · ' + item.date, item.id, '/log/' + p + '/' + numOf(logList(p), item.id), item.title || item.id);
}
document.getElementById('postBack').addEventListener('click', () => {
  closeWin('postWin');
  nav(postParentPath);
  const parent = WIN_OF[postParentPath.split('/').filter(Boolean)[0]];
  if (parent) openWin(parent);
});

/* ---- ADMIN: 글쓰기 · 글 수정 도구를 창 안에서 ----
   이 저장소에 쓸 수 있는 토큰이 있는 브라우저에서만 ADMIN 아이콘·시작 메뉴·"수정" 버튼·/admin 주소가 열려요.
   다른 기기에서 처음 쓸 때는 이동하.닷컴/tools/upload.html 에서 토큰을 한 번 넣으면 그 뒤로 보여요. */
const TOKEN_KEY = 'code_gh_token';
const adminFrame = document.getElementById('adminFrame');
const adminOut = document.getElementById('adminOut');
const postEdit = document.getElementById('postEdit');
let isAdmin = false;
function readToken(){ try { return (localStorage.getItem(TOKEN_KEY) || '').trim(); } catch (e) { return ''; } }
function setAdmin(v){
  isAdmin = v;
  document.getElementById('adminIcon').hidden = !v;
  if (startItems.adminWin) startItems.adminWin.hidden = !v;
  adminOut.hidden = !v;
  if (!v && !winById('adminWin').hidden) { closeWinAndNav('adminWin'); adminFrame.removeAttribute('src'); }
  syncPostEdit();
  if (gbEntries) renderGuestbook(); // 방명록 삭제 버튼 보이기/숨기기
}
async function checkAdmin(){
  const t = readToken();
  if (!t) return setAdmin(false);
  let ok = '';
  try { ok = sessionStorage.getItem('code_adm_ok') || ''; } catch (e) {}
  if (ok === t.slice(-8)) return setAdmin(true);
  try {
    const r = await fetch('https://api.github.com/repos/s2ndrome/code', { headers: { Authorization: 'Bearer ' + t, Accept: 'application/vnd.github+json' } });
    const d = r.ok ? await r.json() : null;
    const can = !!(d && d.permissions && d.permissions.push);
    if (can) try { sessionStorage.setItem('code_adm_ok', t.slice(-8)); } catch (e) {}
    setAdmin(can);
  } catch (e) { setAdmin(false); }
}
function syncPostEdit(){
  postEdit.hidden = !(isAdmin && currentPost && /^(gallery[123]|log)$/.test(currentPost.catPath));
}
function setAdminTool(tool, query){
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.toggle('is-on', b.dataset.tool === tool));
  adminFrame.src = 'tools/' + tool + '.html?embed=1&v=' + Date.now() + (query || ''); // v=: 예전 도구 페이지가 캐시돼서 뜨지 않게
}
document.querySelectorAll('.admin-tab').forEach(b => b.addEventListener('click', () => setAdminTool(b.dataset.tool)));
postEdit.addEventListener('click', () => {
  if (!currentPost) return;
  setAdminTool('edit', '&cat=' + encodeURIComponent(currentPost.catPath) + '&id=' + encodeURIComponent(currentPost.id));
  openAndNav('adminWin');
});
adminOut.addEventListener('click', () => {
  if (!confirm('이 브라우저에서 관리 메뉴를 끌까요? (저장된 토큰이 지워져요)')) return;
  try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem('code_adm_ok'); } catch (e) {}
  closeWinAndNav('adminWin');
  adminFrame.removeAttribute('src');
  checkAdmin();
});
// 창 안의 도구에서 토큰을 저장하면 바로 관리 메뉴가 켜져요
addEventListener('storage', e => { if (e.key === TOKEN_KEY) checkAdmin(); });
const adminChecked = checkAdmin(); // /admin 주소는 이 확인이 끝난 뒤, 관리자일 때만 열어요

/* ---- PAIRS (폴더) ---- */
const ALL_MEMBERS = PAIRS.flatMap(p => p.members.map(m => ({ ...m, pair: p })));
const pairGrid = document.getElementById('pairGrid');
const pairAddr = document.getElementById('pairAddr');
const pairUp = document.getElementById('pairUp');
const pairCount = document.getElementById('pairCount');
const FOLDER_TINTS = [
  { b:'#A6D2F0', c:'#74B6E6' },
  { b:'#8FCDF2', c:'#4598D6' },
  { b:'#CBE5F7', c:'#A6D2F0' }
];
let pairOpenIdx = null;

function openMember(m){
  const n = ALL_MEMBERS.findIndex(x => x.post === m.post) + 1;
  openPost('pair', 'PAIR ' + m.pair.no + ' · ' + m.pair.title, m.post, '/pair/' + n, m.name);
}
function renderPairs(idx){
  pairOpenIdx = idx;
  pairGrid.innerHTML = '';
  if (idx === null) {
    pairAddr.textContent = 'C:\\ARCHIVE\\PAIRS';
    pairUp.disabled = true;
    pairCount.textContent = PAIRS.length + ' pairs';
    PAIRS.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fitem';
      b.innerHTML = px('folder', 3, { ...PAL, ...FOLDER_TINTS[i % FOLDER_TINTS.length] }) +
        '<span class="fitem-name">PAIR ' + p.no + '</span><span class="fitem-sub"></span>';
      b.querySelector('.fitem-sub').textContent = p.title;
      b.addEventListener('click', () => { renderPairs(i); nav('/pairs/' + (i + 1)); });
      pairGrid.appendChild(b);
    });
  } else {
    const p = PAIRS[idx];
    pairAddr.textContent = 'C:\\ARCHIVE\\PAIRS\\PAIR_' + p.no;
    pairUp.disabled = false;
    pairCount.textContent = p.members.length + ' file(s) · ' + p.title;
    if (!p.members.length) {
      pairGrid.innerHTML = '<div class="folder-empty">아직 파일이 없어요.</div>';
    }
    p.members.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fitem';
      b.innerHTML = '<img class="fitem-thumb" alt="" loading="lazy"><span class="fitem-name"></span><span class="fitem-sub"></span>';
      b.querySelector('img').src = m.thumb;
      b.querySelector('.fitem-name').textContent = m.name;
      b.querySelector('.fitem-sub').textContent = m.sub || '';
      b.addEventListener('click', () => openMember(ALL_MEMBERS.find(x => x.post === m.post)));
      pairGrid.appendChild(b);
    });
  }
}
pairUp.addEventListener('click', () => { renderPairs(null); nav('/pairs'); });
renderPairs(null);

/* ---- ARCHIVE ---- */
function totalPages(cat){ return Math.max(1, Math.ceil(galleryList(cat).length / 6)); }
function renderGallery(cat){
  activeCat = cat;
  markTabs('galTabs', cat);
  document.getElementById('galTitle').textContent = sectionName(cat);
  const list = galleryList(cat);
  document.getElementById('galCount').textContent = list.length + ' posts';
  const grid = document.getElementById('galGrid');
  grid.innerHTML = '';
  if (list.length === 0) {
    grid.innerHTML = '<div class="gallery-empty">아직 업로드한 사진이 없어요.</div>';
  } else {
    const start = (galPage[cat] - 1) * 6;
    list.slice(start, start + 6).forEach(item => {
      const d = document.createElement('div');
      d.className = 'thumb';
      d.setAttribute('role', 'button');
      d.tabIndex = 0;
      d.innerHTML = '<div class="thumb-photo"><img src="' + item.thumb + '" alt="' + item.label + '" loading="lazy"><span>' + item.label + '</span></div>';
      d.addEventListener('click', () => openGalleryPost(cat, item));
      d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGalleryPost(cat, item); } });
      grid.appendChild(d);
    });
  }
  const tp = totalPages(cat);
  document.getElementById('galPage').textContent = galPage[cat] + ' / ' + tp;
  document.getElementById('galPrev').disabled = galPage[cat] <= 1;
  document.getElementById('galNext').disabled = galPage[cat] >= tp;
}
buildTabs('galTabs', n => { renderGallery(n); nav('/archive/' + n); });
document.getElementById('galPrev').addEventListener('click', () => { if (galPage[activeCat] > 1) { galPage[activeCat]--; renderGallery(activeCat); } });
document.getElementById('galNext').addEventListener('click', () => { if (galPage[activeCat] < totalPages(activeCat)) { galPage[activeCat]++; renderGallery(activeCat); } });

/* ---- LOG ---- */
function renderLog(p){
  activeLogPair = p;
  markTabs('logTabs', p);
  const items = logList(p);
  const list = document.getElementById('logList');
  list.innerHTML = '';
  document.getElementById('logCount').textContent = items.length + ' log(s)';
  document.getElementById('logPairName').textContent = sectionName(p);
  if (items.length === 0) {
    list.innerHTML = '<li class="gallery-empty">아직 쓴 글이 없어요.</li>';
    return;
  }
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'log-item';
    li.setAttribute('role', 'button');
    li.tabIndex = 0;
    const lockIcon = item.locked ? '<iconify-icon class="log-lock" icon="solar:lock-keyhole-minimalistic-bold-duotone"></iconify-icon>' : '';
    li.innerHTML =
      '<span class="log-date">' + item.date + '</span>' +
      '<p class="log-title">' + lockIcon + item.title + '</p>' +
      '<p class="log-excerpt">' + (item.excerpt || '') + '</p>';
    li.addEventListener('click', () => openLogPost(item));
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLogPost(item); } });
    list.appendChild(li);
  });
}
buildTabs('logTabs', n => { renderLog(n); nav('/log/' + n); });

/* ---- 주소로 바로 들어왔을 때 ---- */
function route(){
  const seg = location.pathname.split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch (e) { return s; } });
  const winId = WIN_OF[seg[0]];
  if (!winId) return;
  if (winId === 'adminWin') {
    adminChecked.then(() => { if (isAdmin) { routing = true; openWin('adminWin'); routing = false; } else if (location.pathname.startsWith('/admin')) history.replaceState(null, '', '/'); });
    return;
  }
  routing = true;
  try {
    openWin(winId);
    if (winId === 'galleryWin') {
      const cat = /^[1-3]$/.test(seg[1]) ? Number(seg[1]) : 1;
      renderGallery(cat);
      if (seg[2]) {
        const id = idOf(galleryList(cat), seg[2]);
        const item = id && galleryList(cat).find(x => x.id === id);
        if (item) openGalleryPost(cat, item);
      }
    } else if (winId === 'logWin') { // /log/<페어 1~3>/<그 페어 안 글 번호>
      const p = /^[1-3]$/.test(seg[1]) ? Number(seg[1]) : 1;
      renderLog(p);
      if (seg[2]) {
        const id = idOf(logList(p), seg[2]);
        const item = id && logItems.find(x => x.id === id);
        if (item) openLogPost(item);
      }
    } else if (winId === 'pairWin') {
      if (seg[0] === 'pair' && seg[1]) {
        const m = ALL_MEMBERS[parseInt(seg[1], 10) - 1];
        if (m) { renderPairs(PAIRS.indexOf(m.pair)); openMember(m); }
      } else {
        const k = parseInt(seg[1], 10) - 1;
        renderPairs(PAIRS[k] ? k : null);
      }
    }
  } finally { routing = false; }
}
addEventListener('popstate', route);

/* ---------------------------------------------------------
   7. 창이 열리고 닫힐 때
   --------------------------------------------------------- */
function onWinShown(id){
  if (id === 'chatWin') playChatThread();
  if (id === 'trackWin') loadYouTube();
  if (id === 'uploadWin') startUpload();
  if (id === 'adminWin' && !adminFrame.getAttribute('src')) setAdminTool('upload');
  if (id === 'paintWin' && gbEntries == null) loadGuestbook();
}
function onWinHidden(id){
  if (id === 'uploadWin') stopUpload();
  if (id === 'chatWin') chatPlayToken++;
}

/* ---------------------------------------------------------
   8. TRACK — 유튜브 재생목록 플레이어
   --------------------------------------------------------- */
const mp = {
  player: null, ready: false, loading: false, wantPlay: false,
  ids: [], titles: {}, timer: null,
  shuffle: false, cur: -1, bag: [], hist: [], goingBack: false
};
// 버튼 기호는 글자 대신 SVG로 그려요 (글자는 폰트마다 크기·위치가 달라서 원 중앙에 안 맞아요)
const MP_ICON = {
  play:  '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 1.5v9l7-4.5z" fill="currentColor"/></svg>',
  pause: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5h2.6v9H2.5zM6.9 1.5h2.6v9H6.9z" fill="currentColor"/></svg>'
};
const mpEl = {
  idle: document.getElementById('mpIdle'),
  list: document.getElementById('mpTracks'),
  count: document.getElementById('mpCount'),
  play: document.getElementById('mpPlay'),
  seek: document.getElementById('mpSeek'),
  fill: document.getElementById('mpSeekFill'),
  knob: document.getElementById('mpSeekKnob'),
  time: document.getElementById('mpTime'),
  state: document.getElementById('mpState'),
  now: document.getElementById('mpNow'),
  tbNow: document.getElementById('tbNow')
};
document.getElementById('mpOpenYt').href = 'https://music.youtube.com/playlist?list=' + YT_PLAYLIST_ID;

function loadYouTube(){
  if (mp.loading) return;
  mp.loading = true;
  window.onYouTubeIframeAPIReady = () => {
    mp.player = new YT.Player('ytPlayer', {
      width: '100%', height: '100%',
      playerVars: { listType: 'playlist', list: YT_PLAYLIST_ID, playsinline: 1, rel: 0, modestbranding: 1 },
      events: { onReady: mpReady, onStateChange: mpStateChange, onError: mpError }
    });
  };
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.onerror = () => { mpEl.state.textContent = '유튜브를 불러오지 못했어요'; mpEl.list.innerHTML = '<li class="mp-empty">유튜브에 연결할 수 없어요</li>'; };
  document.head.appendChild(s);
}
function mpReady(){
  mp.ready = true;
  mpEl.state.textContent = 'Ready';
  let tries = 0;
  const t = setInterval(() => { if (mpRefreshList() || ++tries > 20) clearInterval(t); }, 500);
  if (mp.wantPlay) mp.player.playVideo();
}
/* ---- 셔플: 한 바퀴 다 돌 때까지 같은 곡이 다시 안 나오게 섞어서 뽑아요 ---- */
function mpPickRandom(){
  const n = mp.ids.length;
  if (n < 2) return 0;
  mp.bag = mp.bag.filter(i => i < n && i !== mp.cur);
  if (!mp.bag.length) mp.bag = [...Array(n).keys()].filter(i => i !== mp.cur);
  return mp.bag.splice(Math.floor(Math.random() * mp.bag.length), 1)[0];
}
function mpNextTrack(){
  if (!mp.ready) return;
  mpHideIdle();
  if (mp.shuffle && mp.ids.length > 1) mp.player.playVideoAt(mpPickRandom());
  else mp.player.nextVideo();
}
function mpPrevTrack(){
  if (!mp.ready) return;
  mpHideIdle();
  if (mp.shuffle && mp.hist.length) { mp.goingBack = true; mp.player.playVideoAt(mp.hist.pop()); }
  else mp.player.previousVideo();
}
function mpSetShuffle(on){
  mp.shuffle = on;
  mp.bag = [];
  const b = document.getElementById('mpShuffle');
  b.classList.toggle('is-on', on);
  b.setAttribute('aria-pressed', String(on));
  try { localStorage.setItem('code_mp_shuffle', on ? '1' : ''); } catch (e) {}
}
function mpRefreshList(){
  const ids = mp.player && mp.player.getPlaylist && mp.player.getPlaylist();
  if (!ids || !ids.length) return false;
  if (ids.join() !== mp.ids.join()) {
    mp.ids = ids;
    mpEl.count.textContent = ids.length;
    mpRenderList();
    mpFetchTitles();
  }
  return true;
}
function mpRenderList(){
  const cur = mp.player && mp.player.getPlaylistIndex ? mp.player.getPlaylistIndex() : -1;
  mpEl.list.innerHTML = '';
  mp.ids.forEach((id, i) => {
    const li = document.createElement('li');
    li.className = i === cur ? 'active' : '';
    li.innerHTML = '<span></span>';
    li.querySelector('span').textContent = mp.titles[id] || 'Track ' + (i + 1);
    li.addEventListener('click', () => { mpHideIdle(); mp.player.playVideoAt(i); });
    mpEl.list.appendChild(li);
  });
}
async function mpTitleOf(id){
  const url = encodeURIComponent('https://www.youtube.com/watch?v=' + id);
  for (const api of ['https://www.youtube.com/oembed?format=json&url=', 'https://noembed.com/embed?url=']) {
    try {
      const r = await fetch(api + url);
      if (!r.ok) continue;
      const j = await r.json();
      if (j && j.title) return j.title;
    } catch (e) {}
  }
  return null;
}
async function mpFetchTitles(){
  const queue = mp.ids.filter(id => !mp.titles[id]);
  const worker = async () => {
    while (queue.length) {
      const id = queue.shift();
      const t = await mpTitleOf(id);
      if (t) { mp.titles[id] = t; mpRenderList(); }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}
function mpHideIdle(){ mpEl.idle.hidden = true; }
function mpCurrentTitle(){
  const d = mp.player && mp.player.getVideoData ? mp.player.getVideoData() : null;
  if (d && d.video_id && d.title) mp.titles[d.video_id] = d.title;
  return (d && d.title) || '';
}
function fmt(sec){ sec = Math.max(0, Math.floor(sec || 0)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); }
function mpTick(){
  if (!mp.ready) return;
  const cur = mp.player.getCurrentTime() || 0, dur = mp.player.getDuration() || 0;
  const pct = dur ? (cur / dur) * 100 : 0;
  mpEl.fill.style.width = pct + '%';
  mpEl.knob.style.left = pct + '%';
  mpEl.time.textContent = fmt(cur) + ' / ' + fmt(dur);
}
function mpStateChange(e){
  const S = YT.PlayerState;
  mpRefreshList();
  const title = mpCurrentTitle();
  if (e.data === S.PLAYING) {
    mpHideIdle();
    mpEl.play.innerHTML = MP_ICON.pause;
    mpEl.state.textContent = 'Playing · youtube.com' + (mp.shuffle ? ' · 셔플' : '');
    if (!mp.timer) mp.timer = setInterval(mpTick, 500);
    const i = mp.player.getPlaylistIndex();
    if (i !== mp.cur) { // 이전 곡 기록 (셔플일 때 ◀◀로 돌아가려고)
      if (mp.cur >= 0 && !mp.goingBack) mp.hist.push(mp.cur);
      if (mp.hist.length > 100) mp.hist.shift();
      mp.goingBack = false;
      mp.cur = i;
      mp.bag = mp.bag.filter(x => x !== i);
    }
  } else {
    mpEl.play.innerHTML = MP_ICON.play;
    if (mp.timer && e.data !== S.BUFFERING) { clearInterval(mp.timer); mp.timer = null; }
    mpEl.state.textContent = e.data === S.PAUSED ? 'Paused' : e.data === S.BUFFERING ? 'Buffering…' : e.data === S.ENDED ? 'Ended' : 'Ready';
    // 셔플이면 곡이 끝났을 때 유튜브가 순서대로 넘기기 전에 아무 곡이나 골라 틀어요
    if (e.data === S.ENDED && mp.shuffle) mpNextTrack();
  }
  if (title) {
    mpEl.now.textContent = title;
    mpEl.tbNow.textContent = '♪ ' + title;
  }
  mpRenderList();
  mpTick();
}
function mpError(){
  mpEl.state.textContent = '재생할 수 없는 곡이라 다음 곡으로 넘어가요';
  setTimeout(mpNextTrack, 1500);
}
function mpPlayPause(){
  mpHideIdle();
  if (!mp.ready) { mp.wantPlay = true; loadYouTube(); return; }
  const st = mp.player.getPlayerState();
  if (st === YT.PlayerState.PLAYING) mp.player.pauseVideo(); else mp.player.playVideo();
}
mpEl.idle.addEventListener('click', mpPlayPause);
mpEl.play.addEventListener('click', mpPlayPause);
document.getElementById('mpPrev').addEventListener('click', mpPrevTrack);
document.getElementById('mpNext').addEventListener('click', mpNextTrack);
document.getElementById('mpShuffle').addEventListener('click', () => mpSetShuffle(!mp.shuffle));
try { if (localStorage.getItem('code_mp_shuffle')) mpSetShuffle(true); } catch (e) {}
mpEl.seek.addEventListener('click', e => {
  if (!mp.ready) return;
  const r = mpEl.seek.getBoundingClientRect();
  const dur = mp.player.getDuration() || 0;
  mp.player.seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur, true);
  mpTick();
});

/* ---------------------------------------------------------
   9. PAINT — 그림 방명록
   --------------------------------------------------------- */
(function paint(){
  const canvas = document.getElementById('paintCanvas');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#000000','#3A3F47','#7A8591','#FFFFFF','#0F2F4F','#1B4F80','#2A74B5','#3A8FD2','#4598D6','#5AAEE6','#74B6E6','#8FCDF2','#A6D2F0','#CBE5F7','#E4F2FC','#F4FAFF'];
  const TOOL_NAME = { pencil:'연필', brush:'붓', eraser:'지우개' };
  const SIZE = { pencil:3, brush:10, eraser:22 };
  const palette = document.getElementById('paintPalette');
  const current = document.querySelector('#paintCurrent i');
  const state = document.getElementById('paintState');
  const note = document.getElementById('paintNote');
  let color = '#2A74B5', tool = 'pencil', drawing = false, last = null;
  const undo = [];

  function blank(){ ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  blank();
  function setColor(c){
    color = c;
    current.style.background = c;
    palette.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c === c));
  }
  COLORS.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.c = c;
    b.style.background = c;
    b.setAttribute('aria-label', '색 ' + c);
    b.addEventListener('click', () => { setColor(c); if (tool === 'eraser') setTool('pencil'); });
    palette.appendChild(b);
  });
  setColor(color);

  function setTool(t){
    tool = t;
    document.querySelectorAll('#paintTools .pt').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
    state.textContent = TOOL_NAME[t];
  }
  document.querySelectorAll('#paintTools .pt').forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.tool;
    if (t === 'undo') { if (undo.length) ctx.putImageData(undo.pop(), 0, 0); return; }
    if (t === 'clear') { pushUndo(); blank(); return; }
    setTool(t);
  }));
  function pushUndo(){ undo.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); if (undo.length > 20) undo.shift(); }
  function pos(e){
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
  }
  function line(a, b){
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    ctx.lineWidth = SIZE[tool];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    pushUndo();
    drawing = true;
    last = pos(e);
    line(last, { x: last.x + .01, y: last.y + .01 });
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); line(last, p); last = p; });
  const end = () => { drawing = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  const BLANK = canvas.toDataURL('image/png');
  const form = document.getElementById('paintForm');
  const submitBtn = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    const data = {
      name: document.getElementById('gbName').value.trim() || '익명',
      message: document.getElementById('gbMsg').value.trim(),
      image: canvas.toDataURL('image/png'),
      website: document.getElementById('gbWebsite').value,
      createdAt: new Date().toISOString()
    };
    if (data.image === BLANK) { note.textContent = '그림을 먼저 그려주세요'; return; }
    if (typeof window.submitGuestbook !== 'function') {
      note.textContent = '방명록 저장소가 아직 연결되지 않았어요';
      return;
    }
    note.textContent = '남기는 중…';
    submitBtn.disabled = true;
    try {
      const entry = await window.submitGuestbook(data);
      note.textContent = '방명록에 남겼어요! (1~2분 뒤 모두에게 보여요)';
      if (entry) addGuestbookEntry({ ...entry, localImage: data.image });
      document.getElementById('gbMsg').value = '';
      pushUndo(); blank();
    } catch (err) {
      note.textContent = err && err.message ? err.message : '남기지 못했어요. 잠시 후 다시 해주세요';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();

// Worker로 보내요 (workers/guestbook-worker.js)
if (GUESTBOOK_URL) window.submitGuestbook = async data => {
  const r = await fetch(GUESTBOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(j.error || '남기지 못했어요 (' + r.status + ')');
  return j.entry;
};

/* ---- GUESTBOOK: 남긴 그림 목록 (data/guestbook.json). 관리자 브라우저에선 그림마다 삭제 버튼이 떠요 ---- */
var gbEntries = null; // null = 아직 안 불러옴 (var: 관리자 확인이 이보다 먼저 돌아서)
async function loadGuestbook(){
  try { gbEntries = await fetchJSON('data/guestbook.json?t=' + Date.now()); } catch (e) { gbEntries = []; }
  if (!Array.isArray(gbEntries)) gbEntries = [];
  renderGuestbook();
}
function addGuestbookEntry(entry){
  if (!gbEntries) gbEntries = [];
  if (!gbEntries.some(x => x.id === entry.id)) gbEntries.unshift(entry);
  renderGuestbook();
}
function renderGuestbook(){
  const list = document.getElementById('gbList');
  if (!list || !gbEntries) return;
  document.getElementById('gbCount').textContent = gbEntries.length + ' drawing(s)';
  list.innerHTML = '';
  if (!gbEntries.length) { list.innerHTML = '<div class="gb-empty">아직 남긴 그림이 없어요. 첫 그림을 남겨주세요!</div>'; return; }
  gbEntries.forEach(en => {
    const card = document.createElement('figure');
    card.className = 'gb-card';
    card.innerHTML = '<img alt="" loading="lazy"><figcaption><b></b><span class="gb-msg"></span><time></time></figcaption>';
    card.querySelector('img').src = en.localImage || en.image;
    card.querySelector('img').alt = (en.name || '익명') + '님의 그림';
    card.querySelector('b').textContent = en.name || '익명';
    card.querySelector('.gb-msg').textContent = en.message || '';
    card.querySelector('time').textContent = (en.createdAt || '').slice(0, 10).replace(/-/g, '.');
    if (isAdmin) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'gb-del';
      del.textContent = '삭제';
      del.addEventListener('click', () => deleteGuestbookEntry(en, del));
      card.appendChild(del);
    }
    list.appendChild(card);
  });
}
async function deleteGuestbookEntry(en, btn){
  if (!confirm('"' + (en.name || '익명') + '"님의 그림을 지울까요? 되돌릴 수 없어요.')) return;
  const note = document.getElementById('paintNote');
  const api = p => 'https://api.github.com/repos/s2ndrome/code/contents/' + p;
  const H = { Authorization: 'Bearer ' + readToken(), Accept: 'application/vnd.github+json' };
  const toB64 = s => { let b = ''; new TextEncoder().encode(s).forEach(x => b += String.fromCharCode(x)); return btoa(b); };
  btn.disabled = true;
  note.textContent = '지우는 중…';
  try {
    for (let attempt = 0; ; attempt++) { // 목록에서 빼기 (그 사이 누가 남겨서 거절되면 다시 읽어서)
      const g = await fetch(api('data/guestbook.json') + '?ref=main', { headers: H, cache: 'no-store' });
      if (!g.ok) throw new Error('목록을 못 불러왔어요 (' + g.status + ')');
      const f = await g.json();
      const list = JSON.parse(new TextDecoder().decode(base64ToBytes(f.content.replace(/\n/g, '')))).filter(x => x.id !== en.id);
      const p = await fetch(api('data/guestbook.json'), { method: 'PUT', headers: H, body: JSON.stringify({ message: 'Remove guestbook entry ' + en.id, content: toB64(JSON.stringify(list, null, 2) + '\n'), sha: f.sha, branch: 'main' }) });
      if (p.ok) break;
      if (p.status !== 409 || attempt >= 2) throw new Error('목록 저장에 실패했어요 (' + p.status + ')');
    }
    const img = await fetch(api(en.image) + '?ref=main', { headers: H, cache: 'no-store' });
    if (img.ok) {
      const f = await img.json();
      await fetch(api(en.image), { method: 'DELETE', headers: H, body: JSON.stringify({ message: 'Remove guestbook drawing ' + en.id, sha: f.sha, branch: 'main' }) });
    }
    gbEntries = gbEntries.filter(x => x.id !== en.id);
    renderGuestbook();
    note.textContent = '지웠어요 (1~2분 뒤 사이트에서도 사라져요)';
  } catch (err) {
    note.textContent = err.message;
    btn.disabled = false;
  }
}

/* ---------------------------------------------------------
   10. 업로드 진행창 (장식) — 가장 최근 로그 이름으로 돌아가요
   --------------------------------------------------------- */
const up = { bar: document.getElementById('upBar'), file: document.getElementById('upFile'), left: document.getElementById('upLeft'), timer: null, k: 0 };
function upSetName(){
  const latest = logItems[0];
  up.file.textContent = (latest ? latest.title.replace(/\s+/g, '_').toLowerCase() : 'archive') + '.log 업로드 중';
}
function startUpload(){
  stopUpload();
  upSetName();
  const total = Math.max(10, Math.floor((up.bar.clientWidth - 4) / 11));
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  up.k = reduce ? Math.round(total * .6) : 0;
  const draw = () => {
    up.bar.innerHTML = '<i></i>'.repeat(Math.min(up.k, total));
    up.left.textContent = up.k >= total ? '완료!' : '남은 시간: ' + Math.max(1, Math.ceil((total - up.k) * .25)) + '초';
  };
  draw();
  if (reduce) return;
  up.timer = setInterval(() => {
    up.k = up.k >= total + 6 ? 0 : up.k + 1;
    draw();
  }, 250);
}
function stopUpload(){ if (up.timer) { clearInterval(up.timer); up.timer = null; } }

/* ---------------------------------------------------------
   11. RECORD — 메시지가 하나씩 떠요
   --------------------------------------------------------- */
const chatMessages = [
  { who: 'them', text: '아' },
  { who: 'them', text: '갑자기 생각났는데' },
  { who: 'them', text: '너 그거 기억남?' },
  { who: 'them', text: '우리 처음 만났을 때' },
  { who: 'me', text: '망고마켓?' },
  { who: 'them', text: 'ㅇㅇ' },
  { who: 'them', text: '그때 너 ㅈㄴ 웃겼는데' },
  { who: 'me', text: '내가 뭐가 웃겨' },
  { who: 'me', text: '니가 더 웃겼거든?' },
  { who: 'me', text: '돈 없다고 징징대고' },
  { who: 'them', text: '아니 그건 팩트고' },
  { who: 'them', text: '진짜 돈 없었음' },
  { who: 'them', text: '월급 전이라' },
  { who: 'them', text: '근데 너 그때 나 이상한 사람인 줄 알았지' },
  { who: 'me', text: '솔직히 좀' },
  { who: 'me', text: '의심했음' },
  { who: 'them', text: 'ㅋ 그때 게이밍 의자 판 돈으로 뭐 했냐' },
  { who: 'me', text: '기억 안 남' },
  { who: 'me', text: '뭐 맛있는 거 사 먹었겠지' },
  { who: 'them', text: '에휴' },
  { who: 'them', text: '그 의자 지금도 잘 쓰고 있다' },
  { who: 'them', text: '우리 집 보물 1호임' },
  { who: 'them', text: '너는 보물 0호고' },
  { who: 'me', text: '…' },
  { who: 'me', text: '갑자기 그런 말을' },
  { who: 'them', text: '왜' },
  { who: 'them', text: '부끄러워?' },
  { who: 'me', text: '아니거든' },
  { who: 'them', text: '부끄러울 땐 말이 없어지는 편' },
  { who: 'them', text: '메모' },
  { who: 'me', text: 'ㅈㄹ' }
];
let chatPlayToken = 0;
function playChatThread(){
  const thread = document.getElementById('chatThread');
  const body = document.querySelector('#chatWin .win-body');
  const myToken = ++chatPlayToken;
  thread.innerHTML = '';
  let delay = 0;
  chatMessages.forEach(msg => {
    delay += 350 + Math.min(msg.text.length * 25, 500);
    setTimeout(() => {
      if (myToken !== chatPlayToken) return;
      const div = document.createElement('div');
      div.className = 'chat-bubble ' + msg.who + ' chat-pop';
      div.textContent = msg.text;
      thread.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }, delay);
  });
}

/* ---------------------------------------------------------
   12. 처음 화면
   --------------------------------------------------------- */
(async function init(){
  // 처음엔 업로드 창만, 데스크톱이면 미디어 플레이어도 같이 열어둬요
  stack = ['uploadWin'];
  winById('uploadWin').style.zIndex = ++zTop;
  if (!isMobile() && !/^\/[^/]/.test(location.pathname)) openWin('trackWin');
  refocusTop();

  const none = () => [];
  [galleries[1], galleries[2], galleries[3], logItems] = await Promise.all([
    fetchJSON('data/gallery1.json').catch(none),
    fetchJSON('data/gallery2.json').catch(none),
    fetchJSON('data/gallery3.json').catch(none),
    fetchJSON('data/log.json').catch(none)
  ]);
  renderGallery(1);
  renderLog(1);
  startUpload();
  route(); // 주소로 바로 들어온 경우 그 창·글 열기
})();
