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
  const wasHidden = el.hidden;
  el.hidden = false;
  bringToFront(el);
  clampWindow(el);
  if (id === 'chatWin' && wasHidden && typeof playChatThread === 'function') playChatThread();
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
function galleryEmoji(cat){ return cat === 1 ? '💻' : '🛸'; }

/* ---- post (detail) view ---- */
const postMeta = document.getElementById('postMeta');
const postContent = document.getElementById('postContent');

/* locked posts: posts/<cat>/<id>.html can contain
   <div class="locked-post" data-salt="…" data-iv="…" data-cipher="…"></div>
   instead of real HTML. Content is AES-256-GCM encrypted with a
   PBKDF2(password, salt, 100000, SHA-256) key, decrypted client-side —
   the plaintext never appears anywhere in the repo. */
function parseLockedPost(html){
  const match = html.match(/<div class="locked-post" data-salt="([^"]+)" data-iv="([^"]+)" data-cipher="([^"]+)">/);
  if (!match) return null;
  return { salt: match[1], iv: match[2], cipher: match[3] };
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
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(locked.iv) },
    key,
    base64ToBytes(locked.cipher)
  );
  return new TextDecoder().decode(plainBuf);
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
    } catch (e) {
      error.hidden = false;
      input.value = '';
      input.focus();
      submit.disabled = false;
    }
  };

  submit.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
  input.focus();
}

async function openPost(catPath, meta, title){
  postMeta.textContent = meta;
  postContent.innerHTML = '불러오는 중…';
  openWin('postWin');
  try {
    const res = await fetch('posts/' + catPath + '/' + encodeURIComponent(title) + '.html');
    if (!res.ok) throw new Error();
    const html = await res.text();
    const locked = parseLockedPost(html);
    if (locked) {
      postContent.innerHTML = renderLockGate();
      wireLockGate(locked);
    } else {
      postContent.innerHTML = html;
    }
  } catch (e) {
    postContent.innerHTML = '<p>본문을 불러오지 못했어요. (서버 없이 파일을 직접 열면 본문을 못 가져와요 — GitHub Pages 등으로 호스팅해서 확인해주세요.)</p>';
  }
}

function openGalleryPost(cat, item){
  openPost('gallery' + cat, galleryEmoji(cat), item.id);
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
  document.getElementById('galTitle').textContent = galleryEmoji(cat);
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
    const lockIcon = item.locked ? '<iconify-icon class="log-lock" icon="solar:lock-keyhole-minimalistic-bold-duotone"></iconify-icon>' : '';
    li.innerHTML =
      '<span class="log-date">' + item.date + '</span>' +
      '<p class="log-title">' + lockIcon + item.title + '</p>' +
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

/* ---- chat thread: reveal messages one by one ---- */
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
playChatThread();
