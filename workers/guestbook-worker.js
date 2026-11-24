/* =========================================================
   그림 방명록 저장 Worker (Cloudflare Workers)
   - 홈페이지 PAINT 창에서 "방명록에 남기기"를 누르면 여기로 그림이 와요.
   - 그림은 img/guestbook/<id>.png, 목록은 data/guestbook.json 에 저장돼요 (s2ndrome/code 저장소).
   - 1~2분 뒤 GitHub Pages가 다시 만들어지면 모두에게 보여요.

   설정 (Cloudflare 대시보드):
   1. Workers & Pages → Create → Worker → 이름 정하고 Deploy → Edit code 에 이 파일 내용 전체를 붙여넣고 Deploy
   2. Settings → Variables and Secrets → Add → Type: Secret, Name: GITHUB_TOKEN,
      Value: s2ndrome/code 에 Contents Read and write 권한만 준 fine-grained 토큰 → Deploy
   3. 그 Worker 주소(https://<이름>.<계정>.workers.dev)를 script.js 맨 위 GUESTBOOK_URL 에 넣어요
   ========================================================= */

const OWNER = 's2ndrome';
const REPO = 'code';
const BRANCH = 'main';
// 이 주소에서 온 요청만 받아요 (이동하.닷컴 = xn--2q1bu58a38j.xn--mk1bu44c)
const ALLOWED_ORIGINS = [
  'https://xn--2q1bu58a38j.xn--mk1bu44c',
  'https://www.xn--2q1bu58a38j.xn--mk1bu44c',
  'https://s2ndrome.github.io'
];
const MAX_IMAGE_BYTES = 700 * 1024;   // 그림 한 장 최대 용량
const COOLDOWN_MS = 30 * 1000;        // 같은 사람(IP)은 30초에 한 번만
const recent = new Map();             // IP → 마지막으로 남긴 시각 (Worker가 살아 있는 동안만 기억해요)

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const okOrigin = ALLOWED_ORIGINS.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Vary': 'Origin'
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'content-type': 'application/json; charset=utf-8' } });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'POST로만 남길 수 있어요' }, 405);
    if (!okOrigin) return json({ error: '이 사이트에서만 남길 수 있어요' }, 403);
    if (!env.GITHUB_TOKEN) return json({ error: '방명록 저장소 설정이 아직 안 끝났어요 (GITHUB_TOKEN)' }, 500);

    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    if (now - (recent.get(ip) || 0) < COOLDOWN_MS) return json({ error: '조금 있다가 다시 남겨주세요' }, 429);

    let body;
    try { body = await req.json(); } catch (e) { return json({ error: '잘못된 요청이에요' }, 400); }
    if (body.website) return json({ ok: true }); // 사람 눈엔 안 보이는 칸이 채워져 있으면 스팸봇이라 조용히 무시해요

    const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
    const name = clean(body.name, 20) || '익명';
    const message = clean(body.message, 80);
    const m = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(body.image || '');
    if (!m) return json({ error: '그림이 없어요' }, 400);
    const b64 = m[1];
    if (b64.length * 3 / 4 > MAX_IMAGE_BYTES) return json({ error: '그림 용량이 너무 커요' }, 413);
    if (!atob(b64.slice(0, 12)).startsWith('\x89PNG')) return json({ error: 'PNG 그림이 아니에요' }, 400);

    recent.set(ip, now);
    if (recent.size > 5000) recent.clear();

    const stamp = new Date(now).toISOString();
    const id = stamp.replace(/[-:T]/g, '').slice(0, 14) + '-' + crypto.randomUUID().slice(0, 6);
    const imgPath = `img/guestbook/${id}.png`;
    const gh = (path, init = {}) => fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'code-guestbook-worker',
        'content-type': 'application/json'
      }
    });

    const put = await gh(imgPath, { method: 'PUT', body: JSON.stringify({ message: `Guestbook drawing ${id}`, content: b64, branch: BRANCH }) });
    if (!put.ok) return json({ error: `그림 저장에 실패했어요 (${put.status})` }, 502);

    const entry = { id, name, message, image: imgPath, createdAt: stamp };
    // 목록은 읽은 직후 고쳐서 저장하고, 그 사이 다른 사람이 남겨서 거절되면 다시 읽어서 해요
    for (let attempt = 0; attempt < 4; attempt++) {
      const got = await gh(`data/guestbook.json?ref=${BRANCH}`);
      let list = [], sha;
      if (got.ok) {
        const f = await got.json();
        sha = f.sha;
        try { list = JSON.parse(fromBase64Utf8(f.content)); } catch (e) { list = []; }
      } else if (got.status !== 404) {
        return json({ error: `방명록 목록을 못 불러왔어요 (${got.status})` }, 502);
      }
      list.unshift(entry);
      const saved = await gh('data/guestbook.json', {
        method: 'PUT',
        body: JSON.stringify({ message: `Guestbook entry ${id}`, content: toBase64Utf8(JSON.stringify(list, null, 2) + '\n'), branch: BRANCH, ...(sha ? { sha } : {}) })
      });
      if (saved.ok) return json({ ok: true, entry });
      if (saved.status !== 409 && saved.status !== 422) return json({ error: `방명록 목록 저장에 실패했어요 (${saved.status})` }, 502);
    }
    return json({ error: '다른 사람이 동시에 남기는 중이에요. 다시 해주세요' }, 409);
  }
};

function toBase64Utf8(s) {
  let bin = '';
  for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin);
}
function fromBase64Utf8(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}
