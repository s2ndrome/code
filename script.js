/* ---- window manager: bring-to-front / close / reopen / drag ---- */
let zTop = 10;
function bringToFront(el){ zTop += 1; el.style.zIndex = zTop; }

/* keep windows from being resized/dragged under the fixed taskbar */
const TASKBAR_CLEARANCE = 54;
function clampWindow(win){
  if (win.classList.contains('bgm')) return;
  if (getComputedStyle(win).position !== 'absolute') return;
  const limit = window.innerHeight - TASKBAR_CLEARANCE;
  const rect = win.getBoundingClientRect();
  if (rect.bottom <= limit) return;
  const overflow = rect.bottom - limit;
  if (rect.top - overflow >= 0) {
    win.style.top = (parseFloat(win.style.top || rect.top) - overflow) + 'px';
  } else {
    const newHeight = Math.max(150, rect.height - overflow);
    win.style.height = newHeight + 'px';
  }
}
document.querySelectorAll('.win').forEach(win => {
  new ResizeObserver(() => clampWindow(win)).observe(win);
});
window.addEventListener('resize', () => document.querySelectorAll('.win').forEach(clampWindow));

function openWin(id){
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = false;
  bringToFront(el);
  clampWindow(el);
  if (window.matchMedia('(max-width:920px)').matches) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
function closeWin(id){
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}
document.querySelectorAll('.win-close').forEach(btn => {
  const target = btn.dataset.target;
  btn.addEventListener('click', () => closeWin(target));
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeWin(target); } });
});
document.querySelectorAll('[data-open-target]').forEach(el => {
  const target = el.dataset.openTarget;
  el.addEventListener('click', () => openWin(target));
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWin(target); } });
});
document.querySelectorAll('.win').forEach(w => {
  w.addEventListener('mousedown', () => bringToFront(w));
});

function makeDraggable(win){
  const titlebar = win.querySelector('.win-title');
  if (!titlebar) return;
  let dragging = false, offsetX = 0, offsetY = 0, isFixed = false;

  titlebar.addEventListener('pointerdown', e => {
    if (e.target.closest('.win-btns')) return;
    if (!window.matchMedia('(min-width:921px)').matches) return;
    dragging = true;
    isFixed = getComputedStyle(win).position === 'fixed';
    const rect = win.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    win.style.right = 'auto';
    win.style.bottom = 'auto';
    win.style.width = rect.width + 'px';
    win.style.height = rect.height + 'px';
    bringToFront(win);
    titlebar.setPointerCapture(e.pointerId);
  });
  titlebar.addEventListener('pointermove', e => {
    if (!dragging) return;
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
    if (!isFixed) {
      const parentRect = win.offsetParent.getBoundingClientRect();
      newLeft -= parentRect.left;
      newTop -= parentRect.top;
    }
    win.style.left = newLeft + 'px';
    win.style.top = newTop + 'px';
  });
  const endDrag = () => { dragging = false; clampWindow(win); };
  titlebar.addEventListener('pointerup', endDrag);
  titlebar.addEventListener('pointercancel', endDrag);
}
document.querySelectorAll('.win').forEach(makeDraggable);
document.querySelectorAll('.win:not([hidden])').forEach(clampWindow);

/* ---- content data: loaded from data/*.json, posts fetched from posts/<cat>/<id>.html ---- */
let gallery1 = [];
let gallery2 = [];
let logItems = [];
const galPage = { 1: 1, 2: 1 };
let activeCat = 1;

async function fetchJSON(path){
  const res = await fetch(path);
  if (!res.ok) throw new Error(path + ' (' + res.status + ')');
  return res.json();
}

function galleryList(cat){ return cat === 1 ? gallery1 : gallery2; }

/* ---- post (detail) view ---- */
const postMeta = document.getElementById('postMeta');
const postContent = document.getElementById('postContent');

async function openPost(catPath, meta, title){
  postMeta.textContent = meta;
  postContent.innerHTML = '불러오는 중…';
  openWin('postWin');
  try {
    const res = await fetch('posts/' + catPath + '/' + encodeURIComponent(title) + '.html');
    if (!res.ok) throw new Error();
    postContent.innerHTML = await res.text();
  } catch (e) {
    postContent.innerHTML = '<p>본문을 불러오지 못했어요. (서버 없이 파일을 직접 열면 본문을 못 가져와요 — GitHub Pages 등으로 호스팅해서 확인해주세요.)</p>';
  }
}

function openGalleryPost(cat, item){
  openPost('gallery' + cat, 'GALLERY ' + cat, item.id);
}
function openLogPost(item){
  openPost('log', 'LOG · ' + item.date, item.id);
}

document.getElementById('postBack').addEventListener('click', () => closeWin('postWin'));

/* ---- pair ---- */
document.querySelectorAll('.pair-card').forEach(card => {
  const id = card.dataset.pairId;
  const open = () => openPost('pair', 'PAIR', id);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});

/* ---- gallery ---- */
function totalPages(cat){ return Math.max(1, Math.ceil(galleryList(cat).length / 6)); }

function renderGallery(cat){
  activeCat = cat;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.cat == cat));
  document.getElementById('galTitle').textContent = 'Gallery ' + cat;
  const list = galleryList(cat);
  document.getElementById('galCount').textContent = list.length + ' posts';

  const grid = document.getElementById('galGrid');
  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = '<div class="gallery-empty">아직 업로드한 사진이 없어요. tools/upload.html로 첫 사진을 올려보세요.</div>';
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

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => renderGallery(Number(btn.dataset.cat)));
});
document.getElementById('galPrev').addEventListener('click', () => {
  if (galPage[activeCat] > 1) { galPage[activeCat]--; renderGallery(activeCat); }
});
document.getElementById('galNext').addEventListener('click', () => {
  if (galPage[activeCat] < totalPages(activeCat)) { galPage[activeCat]++; renderGallery(activeCat); }
});

/* ---- log ---- */
function renderLog(){
  const list = document.getElementById('logList');
  list.innerHTML = '';
  if (logItems.length === 0) {
    list.innerHTML = '<li class="gallery-empty">아직 쓴 글이 없어요.</li>';
    return;
  }
  logItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'log-item';
    li.setAttribute('role', 'button');
    li.tabIndex = 0;
    li.innerHTML =
      '<span class="log-date">' + item.date + '</span>' +
      '<p class="log-title">' + item.title + '</p>' +
      '<p class="log-excerpt">' + item.excerpt + '</p>' +
      '<a class="log-more">더보기 ›</a>';
    li.addEventListener('click', () => openLogPost(item));
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLogPost(item); } });
    list.appendChild(li);
  });
}

/* ---- initial load ---- */
(async function loadContent(){
  try {
    [gallery1, gallery2, logItems] = await Promise.all([
      fetchJSON('data/gallery1.json'),
      fetchJSON('data/gallery2.json'),
      fetchJSON('data/log.json')
    ]);
  } catch (e) {
    document.getElementById('galGrid').innerHTML = '<div class="gallery-empty">데이터를 불러오지 못했어요. 서버(GitHub Pages 등)로 열어주세요.</div>';
  }
  renderGallery(1);
  renderLog();
})();

/* ---- bgm player ---- */
const tracks = [
  { title: 'Midnight Roller Coaster', file: '미드나잇롤러코스터.mp3' },
  { title: 'Bug Report', file: '버그리포트.mp3' },
  { title: '궤도이탈', file: '궤도이탈.mp3' },
  { title: 'Cold Candy Melt', file: '콜드캔디멜트.mp3' },
  { title: 'Unholy Alliance', file: '언홀리얼라이언스.mp3' }
];
let trackIndex = 0;
let playing = false;
const bgmAudio = document.getElementById('bgmAudio');
const bgmEq = document.getElementById('bgmEq');
const bgmTrack = document.getElementById('bgmTrack');
const bgmSub = document.getElementById('bgmSub');
const bgmPlay = document.getElementById('bgmPlay');
const bgmPlaylist = document.getElementById('bgmPlaylist');

function renderPlaylist(){
  bgmPlaylist.innerHTML = '';
  tracks.forEach((t, i) => {
    const li = document.createElement('li');
    li.textContent = t.title;
    li.className = i === trackIndex ? 'active' : '';
    li.addEventListener('click', () => { setTrack(i); playBgm(); });
    bgmPlaylist.appendChild(li);
  });
}

function setTrack(i){
  trackIndex = (i + tracks.length) % tracks.length;
  bgmTrack.textContent = tracks[trackIndex].title;
  bgmSub.textContent = 'track ' + (trackIndex + 1) + ' / ' + tracks.length;
  bgmAudio.src = 'bgm/' + encodeURIComponent(tracks[trackIndex].file);
  renderPlaylist();
}

function setPlayingUI(v){
  playing = v;
  bgmEq.classList.toggle('paused', !playing);
  bgmPlay.textContent = playing ? '❚❚' : '▶';
}
function playBgm(){
  bgmAudio.play().then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));
}
function pauseBgm(){
  bgmAudio.pause();
  setPlayingUI(false);
}

document.getElementById('bgmPrev').addEventListener('click', () => { setTrack(trackIndex - 1); if (playing) playBgm(); });
document.getElementById('bgmNext').addEventListener('click', () => { setTrack(trackIndex + 1); if (playing) playBgm(); });
bgmPlay.addEventListener('click', () => { if (playing) pauseBgm(); else playBgm(); });
bgmAudio.addEventListener('ended', () => { setTrack(trackIndex + 1); playBgm(); });
document.getElementById('bgmListToggle').addEventListener('click', () => { bgmPlaylist.hidden = !bgmPlaylist.hidden; });

setTrack(0);

/* ---- clock ---- */
function tickClock(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = hh + ':' + mm;
}
tickClock();
setInterval(tickClock, 1000 * 15);

/* ---- mobile: start with only Menu + BGM visible ---- */
if (window.matchMedia('(max-width:920px)').matches) {
  ['profileWin', 'galleryWin', 'chatWin'].forEach(closeWin);
}
