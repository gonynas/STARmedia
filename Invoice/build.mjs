// 빌드: 만든 파일을 dist/ 에 모은다. (외부 라이브러리 없이 Node 기본 기능만 씀)
//
//   dist/index.html      ← 실제 프로그램 (program/index.html) · sw.js · manifest.webmanifest (홈 화면 설치)
//   dist/*.mjs           ← 화면 파일 (program/*.mjs)
//   dist/core/*.mjs      ← 계산 · 저장 규칙 (core/*.mjs, 시험 파일 제외)
//   dist/style.css       ← program/css/*.css 를 이름 순서대로 이어 붙인 것
//   dist/assets/         ← 로고 · 아이콘 (program/assets)
//   dist/sian/           ← 디자인 시안 (참고용, sian/)
//   dist/app/index.html  ← 예전 주소(/app/)로 들어오면 첫 화면으로 보내기
//
// 업데이트하면 브라우저가 예전 파일을 쓰지 않도록, 모든 파일 주소 뒤에 이번 빌드 번호(?v=…)를 붙인다.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const v = Date.now().toString(36);
const built = new Date().toISOString();

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'core'), { recursive: true });
mkdirSync(join(out, 'assets'), { recursive: true });

// import './x.mjs' → import './x.mjs?v=빌드번호' (모든 파일이 같은 번호를 써야 한 번만 불러온다)
const stampImports = (text) => text.replace(/(from\s+['"])(\.{1,2}\/[^'"]+\.mjs)(['"])/g, `$1$2?v=${v}$3`)
  .replace(/(import\(\s*['"])(\.{1,2}\/[^'"]+\.mjs)(['"])/g, `$1$2?v=${v}$3`);

// ── 실제 프로그램 ──
const prog = join(root, 'program');
for (const f of readdirSync(prog)) {
  if (f.endsWith('.mjs')) {
    let text = stampImports(readFileSync(join(prog, f), 'utf8'));
    if (f === 'main.mjs') text = text.replace("const APP_BUILD = 'dev';", `const APP_BUILD = '${v}';`).replace("const APP_VERSION = '0.0.0';", `const APP_VERSION = '${pkg.version}';`);
    writeFileSync(join(out, f), text);
  }
}
for (const f of ['index.html', 'sw.js', 'manifest.webmanifest']) writeFileSync(join(out, f), readFileSync(join(prog, f), 'utf8').replaceAll('__V__', v));
for (const f of readdirSync(join(root, 'core'))) {
  if (f.endsWith('.mjs') && !f.startsWith('tests')) writeFileSync(join(out, 'core', f), stampImports(readFileSync(join(root, 'core', f), 'utf8')));
}
const cssFiles = readdirSync(join(prog, 'css')).filter((f) => f.endsWith('.css')).sort();
const css = cssFiles.map((f) => `/* ── ${f} ── */\n` + readFileSync(join(prog, 'css', f), 'utf8')).join('\n');
writeFileSync(join(out, 'style.css'), css);
// assets/ 아래 폴더(assets/sound/sfx · voice — 효과음 v1.10.0)까지 통째로 복사
const copyAssets = (from, to) => { mkdirSync(to, { recursive: true }); for (const f of readdirSync(from, { withFileTypes: true })) { if (f.isDirectory()) copyAssets(join(from, f.name), join(to, f.name)); else copyFileSync(join(from, f.name), join(to, f.name)); } };
copyAssets(join(prog, 'assets'), join(out, 'assets'));
writeFileSync(join(out, 'version.json'), JSON.stringify({ app: pkg.name, version: pkg.version, build: v, built }, null, 2));

// 예전 주소(/app/) → 첫 화면
mkdirSync(join(out, 'app'), { recursive: true });
writeFileSync(join(out, 'app', 'index.html'), '<!doctype html><meta charset="utf-8"><title>이동 중…</title><meta http-equiv="refresh" content="0; url=../"><a href="../">견적서 발행기로 가기</a>');

// ── 디자인 시안 (참고용) ──
const sian = join(root, 'sian');
const so = join(out, 'sian');
mkdirSync(join(so, 'assets'), { recursive: true });
const sCss = ['base', 'app', 'doc', 'hub', 'v2', 'v3', 'v4'].map((n) => `/* ${n}.css */\n` + readFileSync(join(sian, 'css', n + '.css'), 'utf8')).join('\n');
writeFileSync(join(so, 'style.css'), sCss);
const sJs = ['icons', 'data', 'calc', 'docs', 'appui', 'equip', 'event', 'hub', 'main'].map((n) => `/* ${n}.js */\n` + readFileSync(join(sian, 'js', n + '.js'), 'utf8')).join('\n');
writeFileSync(join(so, 'app.js'), '(function () {\n"use strict";\n' + sJs + '\n})();\n');
writeFileSync(join(so, 'index.html'), readFileSync(join(sian, 'index.html'), 'utf8').replace('href="style.css"', `href="style.css?v=${v}"`).replace('src="app.js"', `src="app.js?v=${v}"`));
for (const f of readdirSync(join(sian, 'assets'))) copyFileSync(join(sian, 'assets', f), join(so, 'assets', f));
// 하위 메뉴 디자인 시안 (v1.6 후보, 2026-11-20): sian/ux/ → dist/sian/ux/ (보여 주기용, 프로그램과 따로 논다)
mkdirSync(join(so, 'ux'), { recursive: true });
for (const f of readdirSync(join(sian, 'ux'))) copyFileSync(join(sian, 'ux', f), join(so, 'ux', f));
writeFileSync(join(so, 'ux', 'index.html'), readFileSync(join(sian, 'ux', 'index.html'), 'utf8').replace('href="ux.css"', `href="ux.css?v=${v}"`).replace('src="ux.js"', `src="ux.js?v=${v}"`));
// 메뉴 분류 · 앱 아이콘 시안 (v1.6.2 후보, 2026-11-20): sian/nav/ (+ icons/) → dist/sian/nav/
mkdirSync(join(so, 'nav', 'icons'), { recursive: true });
for (const f of readdirSync(join(sian, 'nav'))) if (f !== 'icons') copyFileSync(join(sian, 'nav', f), join(so, 'nav', f));
for (const f of readdirSync(join(sian, 'nav', 'icons'))) copyFileSync(join(sian, 'nav', 'icons', f), join(so, 'nav', 'icons', f));
writeFileSync(join(so, 'nav', 'index.html'), readFileSync(join(sian, 'nav', 'index.html'), 'utf8').replace('href="nav.css"', `href="nav.css?v=${v}"`).replace('src="nav.js"', `src="nav.js?v=${v}"`));
// 형광펜 표시 고르기 시안 (v1.9 후보, 2026-11-22): sian/mark/ → dist/sian/mark/ (한 파일)
mkdirSync(join(so, 'mark'), { recursive: true });
copyFileSync(join(sian, 'mark', 'index.html'), join(so, 'mark', 'index.html'));
// 효과음 고르기 시안 (v1.10 후보, 2026-11-23): sian/sound/ (+ sfx/ CC0 효과음, voice/v1~v4/ TTS 목소리) → dist/sian/sound/
const copyTree = (from, to) => { mkdirSync(to, { recursive: true }); for (const f of readdirSync(from, { withFileTypes: true })) { if (f.isDirectory()) copyTree(join(from, f.name), join(to, f.name)); else copyFileSync(join(from, f.name), join(to, f.name)); } };
copyTree(join(sian, 'sound'), join(so, 'sound'));

console.log(`built dist/: 프로그램 v${pkg.version} (빌드 ${v}) · style.css ${css.length}자 · 시안은 dist/sian/`);
