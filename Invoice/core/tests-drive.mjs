// v1.2.0 시험: 구글 드라이브 맞추기 — 가짜 드라이브(메모리)로 PC · 휴대폰 두 기기를 흉내 낸다
import { createDrive, syncOnce, peekRemote, FOLDER_NAME, FILE_NAME, BACKUP_KEEP, OLD_FOLDER_NAMES } from './drive.mjs';
import { emptyData } from './datafile.mjs';

let pass = 0, fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log((ok ? '  통과 ' : '  실패 ') + name + (ok ? '' : `  → 결과 ${JSON.stringify(got)} / 기대 ${JSON.stringify(want)}`));
}

/* ── 가짜 드라이브 ── */
function fakeDrive() {
  const files = new Map(); let n = 0, calls = 0;
  const meta = (f) => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime, version: String(f.version) });
  const res = (status, body) => ({ status, ok: status < 300, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
  function match(f, cond) {
    let m;
    if (cond === 'trashed=false') return !f.trashed;
    if ((m = /^name='(.*)'$/.exec(cond))) return f.name === m[1];
    if ((m = /^mimeType='(.*)'$/.exec(cond))) return f.mimeType === m[1];
    if ((m = /^mimeType!='(.*)'$/.exec(cond))) return f.mimeType !== m[1];
    if ((m = /^'(.*)' in parents$/.exec(cond))) return (f.parents || []).includes(m[1]);
    throw new Error('모르는 조건 ' + cond);
  }
  async function fetch(url, opts = {}) {
    calls++;
    if (!/Bearer ok/.test((opts.headers || {}).Authorization || '')) return res(401, {});
    const u = new URL(url), method = opts.method || 'GET', id = decodeURIComponent((u.pathname.match(/files\/([^/]+)$/) || [])[1] || '');
    const now = new Date(Date.UTC(2026, 10, 16, 0, 0, n)).toISOString();
    if (method === 'GET' && !id) { const conds = u.searchParams.get('q').split(' and '); return res(200, { files: [...files.values()].filter((f) => conds.every((c) => match(f, c))).map(meta) }); }
    if (method === 'GET' && u.searchParams.get('alt') === 'media') return res(200, files.get(id).content);
    if (method === 'GET') return files.has(id) ? res(200, meta(files.get(id))) : res(404, {});
    if (method === 'POST' && u.pathname.includes('/upload/')) {
      const parts = opts.body.split(/\r\n--smq[a-z0-9]+(?:--)?/).map((p) => p.split('\r\n\r\n').slice(1).join('\r\n\r\n'));
      const md = JSON.parse(opts.body.split('\r\n\r\n')[1].split('\r\n--')[0]);
      const content = opts.body.split('\r\n\r\n')[2].replace(/\r\n--smq[a-z0-9]+--$/, '');
      const f = { id: 'f' + (++n), ...md, content, version: 1, modifiedTime: now }; files.set(f.id, f); void parts; return res(200, meta(f));
    }
    if (method === 'POST') { const md = JSON.parse(opts.body); const f = { id: 'f' + (++n), ...md, version: 1, modifiedTime: now }; files.set(f.id, f); return res(200, meta(f)); }
    if (method === 'PATCH' && !u.pathname.includes('/upload/')) { const f = files.get(id); Object.assign(f, JSON.parse(opts.body)); f.version++; return res(200, meta(f)); }
    if (method === 'PATCH') { const f = files.get(id); f.content = opts.body; f.version++; f.modifiedTime = now; n++; return res(200, meta(f)); }
    if (method === 'DELETE') { files.delete(id); return res(204, {}); }
    return res(400, {});
  }
  return { fetch, files, calls: () => calls };
}

const cloud = fakeDrive();
const drive = createDrive({ fetch: cloud.fetch, getToken: () => 'ok' });
const dayOf = (i) => '2026-11-' + String(16 + i).padStart(2, '0');

console.log('PC 처음 연결');
const pc = emptyData(); pc.me.name = '스타미디어'; pc.me.bizNo = '120-81-47521';
pc.clients.push({ id: 'c1', name: '○○군청', updatedAt: '2026-11-16T01' }); pc.docs.push({ id: 'q1', type: 'quote', device: 'pc', updatedAt: '2026-11-16T01' });
let r1 = await syncOnce(drive, {}, pc, { day: dayOf(0) });
const folder = [...cloud.files.values()].find((f) => f.name === FOLDER_NAME), main = [...cloud.files.values()].find((f) => f.name === FILE_NAME);
eq('「01_스타미디어 견적서」 폴더를 저절로 만듦', !!folder, true);
eq('자료 파일을 그 폴더에 올림', main && main.parents[0] === folder.id, true);
eq('올렸다고 알려 줌 · 이 기기 자료는 그대로', [r1.uploaded, r1.localChanged], [true, false]);
eq('백업 폴더에 오늘 백업', [...cloud.files.values()].some((f) => f.name === '견적서발행기_2026-11-16.json'), true);
let pcState = r1.state;
const r1b = await syncOnce(drive, pcState, pc, { day: dayOf(0) });
eq('바뀐 게 없으면 다시 올리지 않음', r1b.uploaded, false);

console.log('휴대폰 처음 (사업자 정보 다시 안 넣기)');
const peek = await peekRemote(drive);
eq('드라이브에서 자료를 찾음', [peek.found, peek.data.me.name, peek.data.docs.length], [true, '스타미디어', 1]);
let r2 = await syncOnce(drive, {}, emptyData(), { day: dayOf(0) });
eq('휴대폰이 PC 자료를 그대로 받음', [r2.data.me.bizNo, r2.data.clients[0].name, r2.localChanged], ['120-81-47521', '○○군청', true]);
let phone = r2.data, phoneState = r2.state;

console.log('양쪽에서 쓰기');
phone = JSON.parse(JSON.stringify(phone)); phone.docs.push({ id: 'm1', type: 'quote', device: 'phone', updatedAt: '2026-11-16T05' });
const r3 = await syncOnce(drive, phoneState, phone, { day: dayOf(0) }); phoneState = r3.state;
eq('휴대폰 새 문서를 올림', r3.uploaded, true);
const pc2 = JSON.parse(JSON.stringify(pc)); pc2.clients[0] = { id: 'c1', name: '○○군청 축제추진위', updatedAt: '2026-11-16T06' };
const r4 = await syncOnce(drive, pcState, pc2, { day: dayOf(1) }); pcState = r4.state;
eq('PC: 휴대폰 문서가 들어오고 PC 수정도 남음', [r4.data.docs.map((d) => d.id + '@' + d.device), r4.data.clients[0].name, r4.localChanged, r4.uploaded], [['q1@pc', 'm1@phone'], '○○군청 축제추진위', true, true]);
const r5 = await syncOnce(drive, phoneState, r3.data, { day: dayOf(1) });
eq('휴대폰: PC 거래처 수정이 들어옴', [r5.data.clients[0].name, r5.uploaded], ['○○군청 축제추진위', false]);

console.log('지우기');
const pc3 = JSON.parse(JSON.stringify(r4.data)); pc3.docs = pc3.docs.filter((d) => d.id !== 'q1'); pc3.trash.push({ kind: 'doc', item: { id: 'q1' }, deletedAt: '2026-11-16T07' });
const r6 = await syncOnce(drive, pcState, pc3, { day: dayOf(1) }); pcState = r6.state;
const r7 = await syncOnce(drive, r5.state, r5.data, { day: dayOf(1) });
eq('PC에서 지운 문서는 휴대폰에서도 휴지통으로', [r7.data.docs.map((d) => d.id), r7.data.trash.length], [['m1'], 1]);

console.log('백업 · 권한');
let st = pcState, d = r6.data;
for (let i = 2; i < 15; i++) { d = JSON.parse(JSON.stringify(d)); d.items.push({ id: 'i' + i, updatedAt: 'x' + i }); st = (await syncOnce(drive, st, d, { day: dayOf(i) })).state; }
const bks = [...cloud.files.values()].filter((f) => /^견적서발행기_\d{4}-\d{2}-\d{2}\.json$/.test(f.name));
eq('백업은 하루 한 개, 최근 ' + BACKUP_KEEP + '개만', bks.length, BACKUP_KEEP);
const noAuth = createDrive({ fetch: cloud.fetch, getToken: () => 'expired' });
let code = ''; try { await syncOnce(noAuth, st, d); } catch (e) { code = e.code; }
eq('토큰이 끝나면 「다시 연결」 필요(auth)', code, 'auth');
const newer = fakeDrive(); const dn = createDrive({ fetch: newer.fetch, getToken: () => 'ok' });
await syncOnce(dn, {}, pc);
const mf = [...newer.files.values()].find((f) => f.name === FILE_NAME); mf.content = mf.content.replace(/"schema":\d+/, '"schema":99'); mf.version++;
let code2 = ''; try { await syncOnce(dn, {}, pc); } catch (e) { code2 = e.code; }
eq('더 새 버전 프로그램이 올린 자료는 덮어쓰지 않음', code2, 'newer');

console.log('예전 폴더 이름');
const oldc = fakeDrive(); const od = createDrive({ fetch: oldc.fetch, getToken: () => 'ok' });
oldc.files.set('o1', { id: 'o1', name: OLD_FOLDER_NAMES[0], mimeType: 'application/vnd.google-apps.folder', version: 1, modifiedTime: 'x' });
const fo = await od.ensureFolder();
eq('예전 이름 폴더(01_스타미디어 견적서)는 새 이름으로 바꿔 그대로 씀', [fo.id, oldc.files.get('o1').name, FOLDER_NAME], ['o1', '01_견적서 발행기', '01_견적서 발행기']);

console.log(`\n구글 드라이브 맞추기 시험: ${pass}개 통과, ${fail}개 실패`);
if (fail) process.exit(1);
