// 프로그램 설정값 (비밀 아님 — 공개돼도 되는 값만)
//
// GOOGLE_CLIENT_ID: 구글 드라이브 연결에 쓰는 「OAuth 클라이언트 ID」(…apps.googleusercontent.com).
//   사용자 구글 클라우드 프로젝트에서 만든다 → 방법은 app/GOOGLE_SETUP.md.
//   비어 있으면 구글 드라이브 칸에 「설정 전」이라고 나오고 연결 단추가 숨는다.
//   이 값은 비밀번호가 아니다(브라우저 프로그램은 원래 공개). 「승인된 자바스크립트 원본」에 적은 주소에서만 로그인이 된다.
export const GOOGLE_CLIENT_ID = '497702309285-3vr6cb0r1m68rdooe1j819de78mspph2.apps.googleusercontent.com';
export const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/drive.file';   // 이 프로그램이 만든 파일만 보고 고친다
