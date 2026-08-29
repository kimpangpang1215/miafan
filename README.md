# 어떤 책을 추천할래? — 알라딘 OpenAPI 버전

첫 화면에는 특정 책을 보여주지 않습니다.
이용자가 책 제목/저자를 검색하면 알라딘 OpenAPI에서 책 정보를 불러옵니다.

표시 정보:
- 표지
- 제목
- 저자
- 출판사
- 출판년
- ISBN
- 책 소개
- 알라딘 상품 링크

책 선택 후:
- 추천 / 비추천
- 이유 작성
- 작성한 의견을 말풍선으로 확인

## 알라딘 TTB Key 설정

알라딘 OpenAPI를 사용하려면 TTB Key가 필요합니다.

Vercel:
Settings → Environment Variables

Name:
ALADIN_TTB_KEY

Value:
본인의 알라딘 TTB Key

저장 후 Redeploy 하세요.

키를 브라우저 script.js 안에 직접 넣지 마세요.
이 버전은 `/api/search.js`에서만 키를 사용합니다.

## 영구저장 기능

현재 의견은 브라우저 화면에만 존재해서 새로고침하면 사라집니다.

다음 단계에서 Supabase를 연결하면:
- books 테이블: ISBN/표지/저자/출판사 등
- opinions 테이블: 추천/비추천, 이유, 작성시간
- comments 테이블: 의견별 댓글

처럼 저장할 수 있습니다.

Supabase 연결 후에는 다른 이용자가 접속해도 기존 의견을 볼 수 있고,
새로고침하거나 며칠 뒤 다시 접속해도 글이 남습니다.


## Supabase 의견 저장
Vercel Environment Variables:
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY

Supabase `opinions` table:
- id int8 primary key
- created_at timestamptz default now()
- isbn13 text
- book_title text
- vote text
- reason text

RLS:
- public SELECT using true
- public INSERT with check true

`api/opinions.js`가 저장/조회 요청을 처리합니다.
