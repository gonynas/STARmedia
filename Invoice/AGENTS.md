# AGENTS.md — 스타미디어 견적서 발행기 (AI 작업 안내서)

이 파일은 **이 프로그램을 고치거나 업데이트하는 AI(Claude Code · OpenAI Codex/GPT 등)가 가장 먼저 읽는 안내서**입니다.
`CLAUDE.md`도 이 파일을 가리킵니다. 사용자는 코드를 직접 고치지 않습니다. 사용자가 보내는 **문제 보고 글**(설정 · 백업 → 문제 기록 → 「AI에게 보낼 내용 복사」)과 요청을 보고 고칩니다.

## 0. 코드가 있는 곳
- **깃허브**: https://github.com/gonynas/STARmedia 저장소의 `Invoice/` 폴더 (공개 저장소). 이 폴더 = 사용자 PC의 `app/` 폴더.
- **실행 주소(GitHub Pages)**: https://gonynas.github.io/STARmedia/Invoice/dist/ — `main` 브랜치 루트에서 자동 배포(저장소 루트에 `.nojekyll`). `Invoice/dist/`를 새로 빌드해 올리면 1~2분 뒤 반영된다.
- `docs/`(설계서 · 질문지 답변)는 사업 문서라 **깃허브에 올리지 않고** 사용자 PC의 `app/docs/`에만 있다(`.gitignore`). 요구사항이 필요하면 사용자에게 그 파일을 달라고 한다.
- 고친 뒤 올릴 때도 `.backup/` · `docs/`는 올리지 않는다. `dist/`는 함께 올린다(빌드된 프로그램).

- **사용자에게 주는 안내서 · 질문과 답 · 버전 백업은 사용자 폴더에 쓴다**: `D:\02_VS code\06_스타미디어 프로젝트\02_견적서 프로그램 개발\` (사용자 요청 2026-11-16). 코드는 지금처럼 이 `app/` 에서 고친다. 폴더 안내: 그 폴더의 `00_폴더 안내 (어디에 무엇이 있나).md`.
- 구글 클라이언트 ID 는 `program/config.mjs` 에 들어 있다(2026-11-16, localhost:8080 에서 구글 로그인 창이 오류 없이 뜨는 것 확인).

## 1. 한 줄 요약
행사 대행업체(스타미디어)의 견적서 · 거래명세서 · 납품ㆍ청구서 · 영수증 발행 + 행사 · 입금 · 장비 · 매출 관리.
**서버 없는 정적 웹앱**(HTML + 순수 JavaScript 모듈 + CSS). 외부 라이브러리 · 프레임워크 · npm 의존성 **없음**. 자료는 사용자 기기에만 저장.

## 2. 꼭 지킬 것
1. **자료를 잃지 않는다.** 자료 형식을 바꾸면 `core/datafile.mjs`의 `CURRENT_SCHEMA`를 1 올리고 `migrations[이전번호]` 변환 함수를 추가한다(옛 자료 → 새 자료). 변환 전 백업은 저장 장치가 자동으로 만든다. 필드 이름을 함부로 바꾸거나 지우지 않는다.
2. **계산 규칙은 `core/`에만** 두고 node 시험을 함께 고친다. 화면 파일(`program/`)은 계산하지 않고 `core/` 함수를 부른다.
3. **외부 라이브러리를 들이지 않는다.** (엑셀 · PDF · ZIP도 직접 만든다: `core/xlsx.mjs`, `core/pdf.mjs`)
4. 고친 뒤에는 `npm run build` (시험 전부 + 빌드)가 통과해야 한다. 통과 못 하면 완료라고 하지 않는다.
5. 개인 자료(거래처 · 금액 · 사업자번호)를 외부로 보내는 코드를 넣지 않는다. 문제 기록에도 넣지 않는다.
6. 화면 글은 쉬운 한국어 존댓말(「~해요」). 디자인은 **시안 A 블루 모던**(`program/css/01-base.css`의 `[data-theme="a"]` 변수) 그대로.
7. `app/` 밖의 파일, `.backup/` 폴더는 건드리지 않는다.

## 3. 폴더 지도
```
app/
├─ AGENTS.md · CLAUDE.md · README.md · CHANGELOG.md
├─ package.json        버전(version)과 명령: npm test · npm run build
├─ build.mjs           program/ + core/ → dist/ (정적 파일). 파일 주소에 ?v=빌드번호를 붙여 업데이트가 바로 보이게 함
├─ program/            화면 (브라우저에서 돌아감)
│  ├─ index.html       첫 페이지. 맨 위 <script>가 오류를 잡아 기록(문제 기록기)
│  ├─ main.mjs         ★ 중심: 자료 불러오기 · 자동 저장 · 메뉴 · 주소(#home 등)별 화면 · 누르기/입력 나눠 주기
│  │                   직접 그리는 화면: 처음 실행 · 홈 · 내 정보 · 거래처
│  ├─ editor.mjs       문서 작성(#doc/ID) · 발행 목록(#list). 품목 줄 = 품목 · 규격 / 일수 · 수량 · 단가 · 비고, 품목 칸 실시간 찾기(showAc · pickAc, 규칙 core/catalog.mjs searchItems)
│  ├─ docview.mjs      A4 문서 그리기(미리보기 = 인쇄 = PDF 같은 그림)
│  ├─ export.mjs       파일로 저장(PDF · 이미지 · 엑셀) · 보내기(카톡 · 메일)
│  ├─ events.mjs       행사 · 입금(#event, #event/ID)
│  ├─ items.mjs        품목 · 세트(#items)
│  ├─ equip.mjs        장비 관리(#equip) + 행사 화면의 장비 카드
│  ├─ money.mjs        매출 · 미수금(#money) + 홈의 오늘 챙길 일 · 돈 흐름 카드
│  ├─ calendar.mjs     행사 달력(#cal)
│  ├─ trash.mjs        휴지통(#trash)
│  ├─ settings.mjs     설정 · 백업(#set): 기본값 · 글자 크게 · 잠금 · 저장 위치 · 백업 · 문제 기록 · 업데이트 확인
│  ├─ lockscreen.mjs   화면 잠금(숫자 4~10자리, 동그라미 = 자릿수, 자동 잠금, 초기화 코드로 「초기화 → 재설정」). 브라우저 · 앱을 닫았다 열면 잠금(sessionStorage + closedAt 15초, v1.7.0)
│  ├─ setup.mjs        처음 설정 단계(needsSetup: drive → folder(PC만, 나중 가능) → me → pin) — 자료를 보고 단계를 정해서 드라이브에 설정이 있으면 건너뜀
│  ├─ gdrive.mjs       구글 드라이브 연결 · 휴대폰 「드라이브에서 불러오기」 · 저절로 맞추기 · 상태 알약 (규칙은 core/drive.mjs · core/sync.mjs)
│  ├─ config.mjs       GOOGLE_CLIENT_ID (비어 있으면 드라이브 칸이 「설정 전」) — 만드는 법 GOOGLE_SETUP.md
│  ├─ install.mjs      휴대폰 · 태블릿 첫 화면 「바탕화면 아이콘 만들기」, 카카오톡 등 앱 안 브라우저 → Safari · 기본 브라우저
│  ├─ inputs.mjs       사업자등록번호 자동 형식(123-45-67890) · 번호 확인
│  ├─ releases.mjs     릴리즈 노트(설정 → 프로그램 정보) — 새 버전마다 맨 위에 추가
│  ├─ errors.mjs       문제 기록(localStorage 'starmedia-quote:problems', 최근 50개) · AI에게 보낼 글
│  ├─ stamp.mjs        도장 사진 흰 배경 지우기
│  ├─ icons.mjs        아이콘 ic('이름')
│  ├─ ux.mjs           하위 메뉴 디자인(v1.6.0): 설정 · 백업 → 화면 → 「화면 디자인 (UI · UX)」 기본 · A · B (이 기기 localStorage), uxMode() · 탭 · 하위 메뉴 · ⋯ 메뉴 · 휴대폰 자세히 창. 품목 · 발행 목록 · 설정 화면이 uxMode() 로 모양을 고름 (CSS: css/09-ux-ab.css)
│  ├─ sortable.mjs     끌어서 순서 바꾸기 부품(bindSortable · sortedIds) — 거래처 순서(v1.6.1)
│  ├─ sw.js · manifest.webmanifest   홈 화면 설치(인터넷 먼저, 끊기면 저장본)
│  ├─ assets/          로고 · 아이콘
│  └─ css/             01 → 08 순서로 이어 붙여 style.css 가 됨 (08-v1-screens.css = 1.0에서 더한 화면)
├─ core/               계산 · 저장 규칙 (화면 없음, node 로 시험)
│  ├─ money.mjs        줄 금액 · 부가세(별도/포함/없음) · 끝자리 정리 · 입금 장부 · 한글 금액
│  ├─ docs.mjs         문서 종류 · 번호 · 합계 · 쪽 나누기 · 붙여넣기
│  ├─ catalog.mjs      품목 · 세트
│  ├─ events.mjs       행사 묶음 · 계약 기준 문서 · 입금 · 바꿔 만들기 · 영수증
│  ├─ reports.mjs      매출 · 미수금 · 장비 사용/부족 · 달력 · 오늘 챙길 일 · 휴지통 30일
│  ├─ lock.mjs         비밀번호 · 초기화 코드(소금 + SHA-256) · 사업자번호 형식/검증 · 자동 잠금 시간
│  ├─ sync.mjs         PC ↔ 휴대폰 세 갈래 합치기(base · 이 기기 · 드라이브), 목록은 id 별 · 내 정보/설정은 칸 별, 기기 설정(lock 등)은 안 맞춤
│  ├─ drive.mjs        드라이브 REST(폴더 · 파일 · 하루 백업 10개) + syncOnce · peekRemote (fetch · 토큰을 받아서 → node 가짜 드라이브로 시험)
│  ├─ storage.mjs      저장 장치(이 기기 IndexedDB + PC 폴더), 백업 10개 · 하루 전 사본 · 되살리기
│  ├─ datafile.mjs     ★ 자료 파일 형식 · 형식 번호(schema) · 업데이트 변환
│  ├─ xlsx.mjs · sheets.mjs · pdf.mjs   엑셀 · PDF 파일 만들기
│  └─ tests*.mjs       node 시험 (npm test)
├─ sian/               디자인 시안(참고용, dist/sian/ 으로 빌드). 프로그램과 따로 논다. sian/ux/ = 하위 메뉴 시안 A · B (v1.6 후보, 예시 자료만)
├─ docs/               설계서 · 요구사항 · 질문지 답변 (요구사항이 헷갈리면 여기 먼저)
└─ dist/               빌드 결과(직접 고치지 않음). 이 폴더를 그대로 웹에 올리면 됨
```

## 4. 작동 방식
- **그리기**: 화면은 문자열 HTML을 만들어 `#root`에 통째로 넣는다(`render()`). 각 화면 파일은 `xxxPage()`가 HTML을 돌려주고, `xxxClick(act, a)` · `xxxInput(t)` · `xxxChange(t)`가 처리했으면 `true`를 돌려준다.
- **누르기**: 버튼에 `data-act="이름"`을 달면 `main.mjs`가 화면 파일들에 차례로 넘긴다. 새 기능은 새 `data-act` 이름(파일별 접두어: `eq-`, `gear-`, `set-`, `trash-`, `cal-`, `money-` …)으로.
- **공용 도구(ctx)**: `init(ctx)`로 받는다 — `S`(상태, `S.data`가 자료), `esc`, `ic`, `uid`, `toast`, `openModal`, `changed()`(바꿨으면 꼭 부름 → 0.7초 뒤 자동 저장), `render()`, `saveNow()`.
- **새 문서**: `createDoc()`은 `pending: true` 로 만든다. 무언가 넣으면(`touch`) · 「저장」 · 상태 바꾸기 때 pending 을 지워 목록에 들어간다. pending 문서는 저장 · 드라이브에 올리지 않고(`savable`), 다른 화면으로 가면 지운다(`dropPendingDocs`).
- **저장**: `changed()` → 이 기기(IndexedDB `starmedia-quote`) + 연결했으면 PC 폴더(`견적서발행기.json`, `견적서발행기_하루전.json`, `백업/`). 저장 위치마다 성공/실패를 따로 보여 준다.
- **오류**: 화면 그리기 실패는 `render()`가 잡아 안내 화면 + 문제 기록. 저장 실패 · 파일 만들기 실패도 `logProblem()`으로 기록.

## 4-1. 메뉴 분류 규칙 (v1.6.2, 사용자와 정함 — 새 하위 메뉴도 이대로)
- **대분류** = 상자 하나(`uxGroup(아이콘, 제목, 안)`): 연한 파란 네모 선 아이콘 + 굵은 제목. 성격이 다른 묶음은 다른 상자.
- **중분류** = `uxMid(키, 이름, 개수, 고름, 강제펼침)`: 꺾쇠 › / ⌄ + 굵게 + 개수 둥근 칸. 누르면 펼침/접힘 + 그 묶음 전체 보기(`ux-fold`).
- **소분류** = `uxLeaf(속성, 고름, 이름, 오른쪽)`: 한 글자(24px) 들여쓰기 + 옅은 └ + 보통 굵기. 휴대폰 시안 B 는 맨 앞에 「전체 보기」.
- **처음 펼침**: 사용자가 늘리는 목록(분류 · 세트 · 거래처)은 접힘, 정해진 짧은 목록(문서 종류 · 상태 · 설정)은 펼침, 고른 항목이 든 묶음은 늘 펼침(`FOLD_DEF` in ux.mjs).
- 알록달록한 이모지 금지. 세 단계까지만. 도구(순서 바꾸기 등)는 상자 맨 아래 점선 다음 파란 글자 줄(`.uxtoolrow`). 규칙 문서 · 시안: `sian/nav/`, D:\…\v1.6.2_메뉴 분류 · 앱 아이콘 시안\.

## 5. 자료 형식 (schema 2, `S.data`) — 1 → 2 변환은 core/datafile.mjs MIGRATIONS[1]
```
me        { name(2줄까지), ceo, bizNo, addr, bizType, bizItem, tel, fax, bankName, bankNo, holder, stamp(dataURL), stampSize }
clients   [{ id, name, person, tel, email, bizNo, addr, memo, createdAt, updatedAt }]
items     [{ id, cat, name, spec, price, days, memo, taxFree, ... }]
sets      [{ id, name, lines:[{ itemId, qty, days, 사본… }] }]
equipment [{ id, cat, name, spec, total, price, memo, createdAt, updatedAt }]
events    [{ id, name, clientId, client{name,person,tel}, start, end, place, dateText, baseDocId, status('active'|'cancel'), contract(계약 확정), contractAt,
             gear:[{equipId, qty}], out(반출일), back(반납일), gearNote, memo, createdAt, updatedAt }]
docs      [{ id, type('quote'|'stmt'|'inv'|'rcpt'), serial, version, showNo, date, validDays, status('draft' 작성 중|'done' 작성 완료|'sent' 발송 완료), editedAfter, doneAt, sentAt,
             clientId, client{...사본}, event{name,date,place}, lines[{name,spec,days,qty,price,note,...}], vat('excl'|'incl'|'none'),
             agreed, deposit{on,amount}, notes{...}, fillRows, eventId, tradeDate, copies, dueDate, paidDate, payMethod, device, createdAt, updatedAt }]
payments  [{ id, eventId, date, amount(환불은 음수), method, memo, cancelled, createdAt }]
trash     [{ kind('doc'|'client'|'item'|'set'|'equip'), item, deletedAt, gearOf? }]   30일 뒤 자동으로 비움
settings  { vat, validDays, dueDays, autoLockMin, bigText, fillRows, phrases[], catOrder[](분류 순서, 없으면 가나다순), clientOrder[](거래처 id 순서), lock?{salt,hash,len,rsalt,rhash,setAt} }   (lock 은 PC · 휴대폰이 같이 씀, bigText · autoLockMin 은 기기마다)
```
날짜는 모두 `YYYY-MM-DD` 글자, 시각은 ISO 문자열. 금액은 원 단위 정수.

## 6. 고치는 순서 (권장)
1. 사용자의 문제 보고 글에서 **버전 · 화면 주소 · 오류 위치(파일:줄)** 를 본다. 위치의 `?v=…`는 빌드 번호라 무시하고 `program/파일.mjs` 또는 `core/파일.mjs`를 연다.
2. 계산이 틀렸으면 `core/`를 고치고 `core/tests-*.mjs`에 그 경우를 시험으로 추가한다.
3. `npm run build` → 통과 확인. 가능하면 크롬에서 직접 눌러 본다(가로 넘침 · 콘솔 오류 없는지, 폭 390 · 768 · 1440).
4. `package.json`의 `version`을 올리고(고침 1.0.1, 기능 추가 1.1.0) `CHANGELOG.md`에 쉬운 말로 적는다.
5. `dist/`를 배포하면 사용자는 설정 → 「업데이트 확인」 또는 새로 고침으로 받는다. 자료는 그대로 남는다.

## 6-1. 버전 번호 · 릴리즈 노트 · 올리기 규칙 (사용자와 정한 것)
- **버전 번호는 AI가 정한다** (v주.부.수). 고침만 → 수(1.1.0 → 1.1.1). 새 기능 · 화면 추가 → 부(1.1.x → 1.2.0). 자료 형식(schema)을 바꾸거나 쓰는 법이 크게 달라짐 → 주(1.x → 2.0.0).
- 새 버전마다 세 곳을 같이 고친다: `package.json` version, `program/releases.mjs` 맨 위(설정 → 릴리즈 노트 창), `CHANGELOG.md`. 날짜는 깃허브에 올리는 날.
- 사용자가 「깃허브에 올려줘 / 푸시해줘」라고 하면:
  1. `npm run build` 통과 확인 → `gonynas/STARmedia` 의 `Invoice/` 에 `app/` 내용(`.backup/` · `docs/` · `.impeccable/` 빼고)을 넣어 커밋 · 푸시.
  2. **같이 백업**: `D:\02_VS code\06_스타미디어 프로젝트\02_견적서 프로그램 개발\00_[STARmedia]견적서 프로그램 릴리즈노트\v버전번호\` 폴더(예: `v1.1.0`)를 만들고 그 버전 원본 전체(`app/` 전부, `docs/` 포함 · `.backup/` 제외)를 복사한다. 이미 있으면 덮어쓰지 말고 사용자에게 묻는다.
  3. 1~2분 뒤 실행 주소가 새 버전(`version.json`)으로 바뀌었는지 확인한다.

## 7. 아직 안 된 것 (다음 단계 후보)
- 구글 드라이브: 코드는 v1.2.0 에 있음. **사용자가 GOOGLE_SETUP.md 대로 만든 클라이언트 ID 를 program/config.mjs 의 GOOGLE_CLIENT_ID 에 넣고 빌드 · 배포**해야 켜진다. 진짜 구글로는 아직 시험 못 함(가짜 드라이브 · 가짜 로그인으로만 시험).
- 구글 토큰은 1시간쯤 — 끝나면 「구글 · 다시 연결」 단추(백엔드 없이 새로 고침 토큰을 못 씀). 아이폰 홈 화면 앱에서 구글 로그인 창 동작은 실기기 확인 필요.
- 구글 계정으로 비밀번호 재설정(지금은 사업자등록번호 + 초기화 코드)
- NAS Cloud Sync 안내, 발행 PDF 보관함
- 실제 아이폰 공유 창 · PC 카톡 붙여넣기 · 종이 인쇄는 실기기 확인 필요
