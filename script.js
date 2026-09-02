/* ---- window manager: bring-to-front / close / reopen / drag ---- */
let zTop = 10;
function bringToFront(el){ zTop += 1; el.style.zIndex = zTop; }
function openWin(id){
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = false;
  bringToFront(el);
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
  const endDrag = () => { dragging = false; };
  titlebar.addEventListener('pointerup', endDrag);
  titlebar.addEventListener('pointercancel', endDrag);
}
document.querySelectorAll('.win').forEach(makeDraggable);

/* ---- content data ---- */
const galleryData = {
  1: {
    total: 14,
    items: [
      { id: 'p1', label: '풍경.jpg', grad: 'linear-gradient(135deg,#DCEFFF,#4FB6EF)', caption: '동네 뒷산에서 찍은 노을 지기 전 풍경. 필터 하나도 안 넣었는데 색이 예쁘게 나왔다.' },
      { id: 'p2', label: '산책길', grad: 'linear-gradient(135deg,#EAF6FE,#63C4EE)', caption: '매일 걷는 산책 코스. 이 다리 지날 때마다 사진 한 장씩 남기는 중.' },
      { id: 'p3', empty: true },
      { id: 'p4', label: '노을', grad: 'linear-gradient(135deg,#CDEEFF,#2E86C1)', caption: '퇴근길에 하늘이 너무 예뻐서 급하게 세워두고 찍음.' },
      { id: 'p5', label: '정원', grad: 'linear-gradient(135deg,#F1FAFF,#9FE3FF)', caption: '베란다에서 키우는 화분들. 올해는 안 죽이는 게 목표.' },
      { id: 'p6', label: '다리', grad: 'linear-gradient(135deg,#BFE7FB,#146485)', caption: '비 온 다음날 물안개 낀 다리. 좋아하는 사진 중 하나.' }
    ]
  },
  2: {
    total: 9,
    items: [
      { id: 'q1', label: '드로잉', grad: 'linear-gradient(135deg,#F1FAFF,#63C4EE)', caption: '심심할 때 끄적인 낙서. 태블릿 산 지 얼마 안 돼서 아직 서툼.' },
      { id: 'q2', label: '메모', grad: 'linear-gradient(135deg,#CDEEFF,#2E86C1)', caption: '다이어리 한 페이지. 글씨 못 써서 부끄럽지만 기록용으로.' },
      { id: 'q3', label: '바다', grad: 'linear-gradient(135deg,#EAF6FE,#146485)', caption: '작년 여름에 다녀온 바다. 다시 가고 싶다.' },
      { id: 'q4', empty: true },
      { id: 'q5', label: '하늘', grad: 'linear-gradient(135deg,#DCEFFF,#9FE3FF)', caption: '구름이 산 모양처럼 생겨서 신기해서 찍음.' },
      { id: 'q6', label: '새벽', grad: 'linear-gradient(135deg,#BFE7FB,#4FB6EF)', caption: '잠 안 와서 나간 새벽 산책. 조용해서 좋았다.' }
    ]
  }
};

const logData = [
  { id: 'l1', date: '2026.09.01', title: '오랜만에 홈피 개편', excerpt: '배경 여백 넓게, 창 틀 다시 다 갈아엎었음. 갤러리 카테고리 두 개로 나눔.', body: '배경 여백 넓게, 창 틀 다시 다 갈아엎었음. 갤러리 카테고리 두 개로 나누고, 창마다 닫고 옮기고 크기 조절도 되게 만들었다. 예전 홈피 느낌 최대한 살리려고 신경 좀 썼음. 다음엔 방명록도 붙여볼까 고민 중.' },
  { id: 'l2', date: '2026.08.24', title: '사진 정리하다가', excerpt: '예전 폴더 뒤지다가 못 올린 것들 갤러리 2에 추가할 예정.', body: '외장하드 정리하다가 2년 전 사진들 발견함. 다 못 올렸던 것들이라 갤러리 2에 천천히 추가할 예정. 화질이 애매한 것들은 그냥 추억으로 남겨두기로.' },
  { id: 'l3', date: '2026.08.10', title: '방문자 카운터 3000 돌파', excerpt: '별거 아닌데 은근 뿌듯함. 계속 기록할 예정.', body: '누적 방문자 3000 넘었다. 별거 아닌 숫자인데 혼자 신남. 방문자 카운터 보는 재미로 홈피 계속 관리하게 되는 듯. 앞으로도 꾸준히 기록할 예정.' },
  { id: 'l4', date: '2026.07.30', title: '링크 정리', excerpt: '죽은 링크 정리하고 메뉴에 검색 추가함.', body: '메뉴에 있던 죽은 링크들 다 정리했다. 검색 기능도 하나 추가함. 다음 업데이트 때는 방명록이랑 다이어리 잠금 기능도 넣어볼 생각.' }
];

/* ---- post (detail) view ---- */
const postMedia = document.getElementById('postMedia');
const postMeta = document.getElementById('postMeta');
const postTitle = document.getElementById('postTitle');
const postBodyText = document.getElementById('postBodyText');

function openGalleryPost(cat, id){
  const item = galleryData[cat].items.find(it => it.id === id);
  if (!item) return;
  postMedia.hidden = false;
  postMeta.textContent = 'GALLERY ' + cat;
  if (item.empty) {
    postMedia.style.background = 'var(--panel-soft)';
    postMedia.textContent = 'NO-IMG';
    postTitle.textContent = '(빈 슬롯)';
    postBodyText.textContent = '아직 사진을 올리지 않은 자리예요.';
  } else {
    postMedia.style.background = item.grad;
    postMedia.textContent = '';
    postTitle.textContent = item.label;
    postBodyText.textContent = item.caption;
  }
  openWin('postWin');
}

function openLogPost(id){
  const item = logData.find(it => it.id === id);
  if (!item) return;
  postMedia.hidden = true;
  postMeta.textContent = 'LOG · ' + item.date;
  postTitle.textContent = item.title;
  postBodyText.textContent = item.body;
  openWin('postWin');
}

document.getElementById('postBack').addEventListener('click', () => closeWin('postWin'));

/* ---- gallery ---- */
const galPage = { 1: 1, 2: 1 };
let activeCat = 1;

function totalPages(cat){ return Math.max(1, Math.ceil(galleryData[cat].total / 6)); }

function renderGallery(cat){
  activeCat = cat;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.cat == cat));
  document.getElementById('galTitle').textContent = 'Gallery ' + cat;
  document.getElementById('galCount').textContent = galleryData[cat].total + ' posts';

  const grid = document.getElementById('galGrid');
  grid.innerHTML = '';
  galleryData[cat].items.forEach(item => {
    const d = document.createElement('div');
    d.setAttribute('role', 'button');
    d.tabIndex = 0;
    if (!item.empty) {
      d.className = 'thumb';
      d.innerHTML = '<div class="thumb-photo" style="background:' + item.grad + '"><span>' + item.label + '</span></div>';
    } else {
      d.className = 'thumb empty';
      d.innerHTML = '<div class="thumb-photo"><span>NO-IMG</span></div>';
    }
    d.addEventListener('click', () => openGalleryPost(cat, item.id));
    d.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGalleryPost(cat, item.id); } });
    grid.appendChild(d);
  });

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
renderGallery(1);

/* ---- log ---- */
function renderLog(){
  const list = document.getElementById('logList');
  list.innerHTML = '';
  logData.forEach(item => {
    const li = document.createElement('li');
    li.className = 'log-item';
    li.setAttribute('role', 'button');
    li.tabIndex = 0;
    li.innerHTML =
      '<span class="log-date">' + item.date + '</span>' +
      '<p class="log-title">' + item.title + '</p>' +
      '<p class="log-excerpt">' + item.excerpt + '</p>' +
      '<a class="log-more">더보기 ›</a>';
    li.addEventListener('click', () => openLogPost(item.id));
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLogPost(item.id); } });
    list.appendChild(li);
  });
}
renderLog();

/* ---- bgm player ---- */
const tracks = ['벚꽃 엔딩 (inst.)', '새벽감성 Lo-fi', '2004 Y2K Mix'];
let trackIndex = 0;
let playing = true;
const bgmEq = document.getElementById('bgmEq');
const bgmTrack = document.getElementById('bgmTrack');
const bgmPlay = document.getElementById('bgmPlay');

function setTrack(i){
  trackIndex = (i + tracks.length) % tracks.length;
  bgmTrack.textContent = tracks[trackIndex];
  bgmTrack.nextElementSibling.textContent = 'track ' + (trackIndex + 1) + ' / ' + tracks.length;
}
function setPlaying(v){
  playing = v;
  bgmEq.classList.toggle('paused', !playing);
  bgmPlay.textContent = playing ? '❚❚' : '▶';
}
document.getElementById('bgmPrev').addEventListener('click', () => setTrack(trackIndex - 1));
document.getElementById('bgmNext').addEventListener('click', () => setTrack(trackIndex + 1));
bgmPlay.addEventListener('click', () => setPlaying(!playing));

/* ---- clock ---- */
function tickClock(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = hh + ':' + mm;
}
tickClock();
setInterval(tickClock, 1000 * 15);
