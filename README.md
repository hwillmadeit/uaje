# 우아재 (Next.js + Supabase)

이 프로젝트는 claude.ai 아티팩트에서 만든 우아재 프로토타입을 실제로 배포
가능한 Next.js(App Router) + Supabase 앱으로 옮긴 것입니다. UI/디자인/기능은
프로토타입과 동일하고, 데이터는 module-level mock 객체 대신 실제 Supabase
테이블에서 옵니다.

## 빠르게 실행하기

```bash
npm install
cp .env.local.example .env.local   # 값 채우기 (아래 3번 참고)
```

Supabase 프로젝트에서 SQL Editor를 열고 순서대로 실행:

```
supabase/schema.sql   -- 테이블 + RLS
supabase/storage.sql  -- 책 표지 이미지를 담을 Storage 버킷 (직접 입력 → 표지 자동 인식 기능에 필요)
supabase/seed.sql     -- (선택) 샘플 데이터 10권
```

Supabase 대시보드 → Authentication → Providers → Email에서 "Confirm email"
설정을 확인하세요. 켜져 있으면(기본값) 회원가입 후 메일 인증 링크를 눌러야
로그인할 수 있고, 꺼두면 가입하자마자 바로 로그인됩니다 — 가족 두세 명만
쓰는 개인 앱이라면 꺼두는 것도 괜찮은 선택입니다.

```bash
npm run dev
```

`http://localhost:3000` 접속 → 로그인 화면에서 "계정이 없으신가요? 회원가입"
으로 이메일 + 비밀번호를 등록 → (Confirm email이 켜져 있다면 메일 인증) →
로그인. 브라우저가 비밀번호 저장을 물어보면 저장해두면 다음부터 자동으로
채워집니다.

## 0. 보안 — 이 버전에서 새로 추가된 것

이전 버전은 "인증 없이 anon key만 있으면 전체 데이터를 읽고 쓸 수 있는"
상태였습니다. 이번 업데이트로 네 가지를 닫았습니다.

1. **로그인(Supabase Auth, 이메일 + 비밀번호)** — `middleware.js`가
   로그인하지 않은 방문자를 `/login`으로 돌려보냅니다.
   `app/login/page.jsx`가 로그인/회원가입 폼을 제공하고,
   `supabase.auth.signInWithPassword` / `signUp`을 직접 호출합니다.
   - **비밀번호 저장**은 이 앱이 직접 구현하지 않습니다 — input에
     `autoComplete="current-password"` 등을 정확히 붙여서 브라우저 자체의
     비밀번호 관리자가 저장을 제안하도록 했습니다. 앱 코드로 비밀번호를
     별도 저장하는 건 오히려 위험해서 일부러 하지 않았습니다.
   - **자동 로그인**은 Supabase 세션이 쿠키에 저장되고 만료 전에 자동
     갱신되기 때문에 기본으로 동작합니다 — 로그아웃하기 전까지는 브라우저를
     껐다 켜도 로그인 상태가 유지됩니다.
   - 비밀번호 재설정(예: "비밀번호를 잊으셨나요?") 화면은 아직 없습니다.
     필요하면 `supabase.auth.resetPasswordForEmail()`로 추가하세요
     ("다음 단계" 참고).
2. **RLS를 `auth.role() = 'authenticated'` 기준으로 변경** —
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 브라우저에 노출되는 게 원래 정상이지만,
   이제 그 키만으로는 아무것도 읽을 수 없고 유효한 로그인 세션이 있어야
   읽힙니다. (`supabase/schema.sql` 참고)
3. **쓰기 라우트 5개(`books/add`, `books/identify`, `books/search`,
   `records`, `reading-sessions`) 모두 `getRouteUser()`로 세션을 먼저
   확인** — service role 키가 있어도, 로그인하지 않은 요청은 그 자리에서
   401로 거부됩니다. RLS와 이 체크는 서로 다른 두 겹의 방어선입니다.
4. **레이트 리밋 + 업로드 용량 제한** — `books/identify`(비용이 드는 vision
   호출)는 사용자당 시간당 10회, `books/search`는 분당 60회로 제한했고
   (`lib/rateLimit.js`), 업로드 이미지는 8MB를 넘으면 거부합니다.

`lib/rateLimit.js`는 일부러 아주 단순한 in-memory 구현입니다 — Redis 같은
추가 서비스 없이 바로 쓸 수 있게 하려는 선택이었어요. Vercel처럼 서버리스
인스턴스가 여러 개로 뜨는 환경에서는 인스턴스별로 카운트가 따로 돌기 때문에
실제 한도가 설정값보다 느슨해질 수 있습니다. 가족 단위의 낮은 트래픽에는
문제없지만, 사용자가 늘어나면 `@upstash/ratelimit` 같은 것으로 교체하는 걸
권장합니다 (호출 시그니처는 동일하게 맞춰뒀습니다).

이 앱은 "한 가족이 공유하는 서재" 하나를 전제로 합니다 — 로그인한 사람은
전부 같은 데이터를 봅니다. 여러 가족이 한 배포본을 나눠 쓰려면
`household_id` 컬럼 + `auth.uid()` 기반 소유권 체크로 확장하세요
(`supabase/schema.sql`에 주석으로 안내해뒀습니다).

## 무엇이 "진짜"이고 무엇이 설정이 필요한지

| 기능 | 상태 |
|---|---|
| 이번 주 책 / 책꽂이 / 책 상세 / 기록 / 아카이브 | ✅ 실제 Supabase 데이터로 동작 |
| "제목으로 찾기" (책 검색) | ✅ 실제 동작 — 우리 서재(Supabase) 우선 검색 + 알라딘(국내 출판사/브랜드 도서에 강함, `ALADIN_TTB_KEY` 설정 시) + Google Books API(키 없이도 동작, 국제 도서 위주) |
| "직접 입력" | ✅ 실제 Supabase insert. 표지 사진을 찍으면 제목/저자를 vision으로 자동 채우고, 표지의 네 꼭짓점을 원근 보정해서 반듯하게 잘라 Supabase Storage에 업로드합니다. 자동으로 읽은 제목이 그림체 폰트 때문에 틀렸을 수 있어 "검색해서 확인하기"로 실제 도서 DB와 대조할 수 있습니다 (`ANTHROPIC_API_KEY` 설정 + `supabase/storage.sql` 실행 필요, 둘 다 없어도 텍스트만으로 등록 가능) |
| 책 등록 → 이번 주 책 / 책꽂이 반영 | ✅ 실제 동작, 다시 촬영한 책은 새 책을 만들지 않고 기존 책에 읽기 세션만 추가 |
| 책 수정 / 삭제 (책 상세 화면) | ✅ 실제 Supabase update/delete. 삭제하면 그 책의 기록·읽기 세션도 함께 삭제됩니다 (DB의 ON DELETE CASCADE) |
| 기록 작성 ("기록 저장하기") | ✅ 실제 Supabase insert (텍스트만 — 사진 업로드는 아래 참고) |
| "읽은 날 추가" / "다시 읽었어요" | ✅ 실제 reading_sessions insert |
| "이미지로 저장" (선생님 공유 카드) | ✅ 실제 PNG 생성 (`html-to-image`) 후 다운로드 |
| "여러 권 촬영하기" 책 인식 (vision) | ⚙️ `ANTHROPIC_API_KEY` + `ANTHROPIC_VISION_MODEL` 설정 시 실제 Claude vision 호출. 설정 안 하면 가짜 인식 결과를 보여주는 대신 "책 인식 기능이 아직 연결되지 않았어요" 안내와 함께 제목 검색/직접 입력으로 자연스럽게 넘어갑니다. |
| 기록(그림/사진)의 실제 이미지 업로드 | 🚧 TODO — 아래 "다음 단계" 참고 (책 표지 업로드와는 별개입니다) |

### "직접 입력"은 여러 권을 한 번에 등록할 수 있어요

책 한 권을 입력한 뒤 "+ 목록에 추가하고 다음 책 입력하기"를 누르면 그
책은 목록에 쌓이고 폼이 비워져서 바로 다음 책을 입력할 수 있습니다.
마지막 책은 목록에 굳이 추가하지 않고 폼에 남겨둔 채로 "N권 추가하기"를
눌러도 함께 등록됩니다. 표지 사진도 책마다 각각 찍을 수 있어요.

### 자동으로 읽은 제목이 틀렸을 수 있어요 — "검색해서 확인하기"

vision이 표지에서 제목을 읽어도, 손글씨체·캘리그래피 같은 그림체 폰트는
잘못 읽을 수 있습니다. 자동으로 채워진 제목을 무조건 믿지 말고, 제목
입력칸 아래의 "검색해서 확인하기"를 눌러 실제 도서 DB(우리 서재 +
알라딘 + Google Books)와 대조해서 정확한 항목을 고를 수 있습니다.
이미 서재에 있는 책을 고르면 새 책을 또 만들지 않고 자동으로 "다시
읽기"로 처리됩니다 — "여러 권 촬영하기"의 "수정" 기능과 같은 원리입니다.

### "직접 입력" 표지 자동 인식 + 원근 보정 크롭은 어떻게 동작하나

1. `POST /api/books/cover` — 사진 한 장을 vision에 보내서 제목/저자와,
   표지의 네 꼭짓점 좌표(왼쪽위·오른쪽위·오른쪽아래·왼쪽아래, 0~1 비율)를
   받습니다. 사각형 하나가 아니라 네 점을 따로 받는 이유는 책이 비스듬히
   찍혔을 때도 실제 표지 모서리를 정확히 짚기 위해서입니다.
2. `lib/perspectiveCrop.js` — 브라우저 canvas에서 그 네 점을 반듯한
   사각형으로 펴서(원근 보정) 잘라냅니다. 진짜 배경 제거(투명 배경 누끼)는
   아니지만, 네 꼭짓점이 표지의 실제 모서리이기 때문에 배경 여백이 남지
   않고, 삐뚤게 찍은 사진도 자동으로 수평·수직이 맞게 펴집니다. (canvas에
   원근 변환이 없어서 사각형을 삼각형 두 개로 나눠 각각 어파인 변환하는
   방식으로 근사합니다 — 완벽한 원근 변환은 아니지만 책 표지처럼 평평한
   물체에는 충분히 정확합니다.)
3. `POST /api/books/cover-upload` — 잘라낸 이미지를 Supabase Storage
   `book-covers` 버킷에 올리고 공개 URL을 돌려줍니다 (`supabase/storage.sql`
   로 버킷을 먼저 만들어야 합니다).
4. 그 URL이 `books.cover_image_url`로 저장되어, 이후 책꽂이/상세/공유
   카드 등 모든 화면에서 placeholder 대신 실제 표지 이미지로 보입니다.

`ANTHROPIC_API_KEY`가 없으면 이 단계 전체를 건너뛰고 "표지 자동 인식
기능이 아직 연결되지 않았어요" 안내만 뜨며, 제목/저자를 직접 타이핑해서
그대로 등록할 수 있습니다 (표지 없이 placeholder로 등록).

## 1. 폴더 구조

```
middleware.js               로그인 세션 체크 + 갱신 (모든 페이지, /api 제외)

app/
  layout.jsx            루트 레이아웃, 폰트/전역 스타일
  page.jsx               LibraryProvider로 감싼 엔트리
  globals.css             디자인 토큰(CSS 변수) + 애니메이션 keyframes
  login/page.jsx           이메일+비밀번호 로그인/회원가입 화면
  auth/callback/route.js   이메일 인증 링크 → 세션 교환 (회원가입 확인 메일용, 현재 미사용 경로 포함)
  api/
    books/identify/        POST — vision 기반 다중 책 인식 (로그인 필요 + 시간당 10회 제한)
    books/cover/             POST — 표지 한 장 인식: 제목/저자 + 크롭 좌표 (로그인 필요 + 시간당 20회 제한)
    books/cover-upload/      POST — 잘라낸 표지 이미지를 Supabase Storage에 업로드 (로그인 필요 + 시간당 30회 제한)
    books/[id]/               PATCH/DELETE — 책 정보 수정 / 삭제 (로그인 필요, 삭제 시 기록·세션도 함께 삭제)
    books/search/           GET  — 서재 검색 + 알라딘 + Google Books 검색 (로그인 필요 + 분당 60회 제한)
    books/add/               POST — 신규 책 등록 / 중복 책은 세션만 추가 / 이번 주 큐레이션 연결 (로그인 필요)
    records/                  POST — 기록 추가 (로그인 필요)
    reading-sessions/         POST — 읽은 날 추가 (로그인 필요)

components/
  brand/SplashScreen.jsx     오프닝 화면 (로고 타이포그래피 + 낙서 심볼)
  layout/                     BottomNav, 공통 프리미티브(BookCover, 헤더 등)
  books/                      BookShelf(실제 DOM 책장) + AddBookFlow(촬영→인식→등록 전체 flow)
  records/                    RecordCard, RecordComposer(기록 작성), RecordTimeline(기록 탭)
  sharing/ShareCard.jsx       선생님 공유 카드 + PNG 내보내기
  archive/Archive.jsx         나의 아카이브
  screens/                    Home/Shelf/Detail/Settings 화면 (Settings에 로그아웃 포함)
  UajeApp.jsx                 화면 전환 + 스플래시 타이밍을 담당하는 루트 셸

lib/
  supabaseClient.js           브라우저용 쿠키 기반 클라이언트 (@supabase/ssr) — 로그인 세션을 자동으로 실어 보냄
  supabaseServer.js           supabaseServer(): service role 클라이언트(쓰기용, 관리자 권한)
                               getRouteUser(): 요청 쿠키에서 현재 로그인 사용자를 읽음 — 모든 쓰기 라우트가 제일 먼저 호출
  rateLimit.js                간단한 in-memory 레이트 리밋 (아래 0번 참고)
  LibraryContext.jsx          Supabase에서 불러온 데이터를 React state로 들고 있는 Context.
                               books / sessionsOf(id) / recordsOf(id) / weeklyBookIds 등을 제공.
  bookAdapters.js             identifyBooksFromImage / searchBook / saveBooks / addRecord / addReadingSession /
                               identifyCover / uploadCover — 전부 fetch()로 /api/* 라우트를 호출, 401을 받으면 /login으로 이동
  visionClient.js              /api/books/identify 와 /api/books/cover가 함께 쓰는 Anthropic 호출 헬퍼
  perspectiveCrop.js            표지 네 꼭짓점을 반듯한 사각형으로 펴서 잘라내는 원근 보정 크롭 (canvas 삼각형 어파인 변환)
  resizeImage.js                 vision에 보내기 전 사진을 적당한 크기로 줄이는 헬퍼 (용량 초과 400 에러 방지 + 비용 절감)
  resolveDetections.js        vision이 준 제목 후보를 searchBook으로 재검증하는 파이프라인
  constants.js                RECORD_TYPES, 상태 라벨 등 순수 상수/헬퍼

supabase/
  schema.sql                  테이블 + RLS 정책 (auth.role() = 'authenticated' 기준)
  seed.sql                    샘플 데이터(선택)
```

## 2. 아티팩트 프로토타입과의 가장 중요한 차이

프로토타입은 `SESSIONS`/`RECORDS`라는 모듈 전역 객체를 직접 mutate하는
방식이었습니다. 브라우저 탭 하나짜리 데모에서는 괜찮지만, 실제 여러 사용자가
쓰는 서버 렌더링 앱에서는 전역 mutable 상태가 위험합니다(요청 간에 데이터가
섞일 수 있음). 그래서 이 프로젝트에서는 그 부분을 `LibraryContext`로
바꿨습니다 — 데이터는 Supabase에서 오고, 화면들은 `useLibrary()` 훅으로
`sessionsOf(id)` / `recordsOf(id)`를 그대로 호출할 수 있어서(형태는 동일),
컴포넌트 코드 자체는 프로토타입과 거의 같습니다.

## 3. 환경 변수

`.env.local.example` 참고. Supabase 값은 프로젝트 Settings → API에서 확인.
`SUPABASE_SERVICE_ROLE_KEY`는 서버(=API 라우트)에서만 쓰이고 브라우저에
노출되지 않습니다 — `lib/supabaseServer.js`가 아닌 다른 곳에서는 절대
import하지 마세요.

`ANTHROPIC_VISION_MODEL`은 일부러 비워뒀습니다. 현재 사용 가능한 vision
지원 모델 id는 https://docs.claude.com 에서 확인한 뒤 채워주세요 — 코드에
특정 모델명을 하드코딩하지 않은 이유는, 모델 id는 시점에 따라 바뀌므로
최신 값을 여기서 추측해서 넣는 것보다 실제 문서를 확인하시는 게 안전하기
때문입니다.

## 4. 다음 단계 (TODO로 남겨둔 것)

- **그림/사진 실제 업로드**: 지금은 `RecordComposer`의 파일 input이 로컬
  선택만 하고 실제로 어디에 올리지는 않습니다. Supabase Storage 버킷을
  하나 만들고(`book-records` 등), 업로드 후 받은 public URL을
  `records.image_url`에 저장하도록 `RecordComposer.jsx`의 해당 `<input>`
  핸들러와 `/api/records`를 확장하면 됩니다.
- **인증/가구 단위 분리**: 지금 스키마는 가구(가정) 구분이 없는 단일
  라이브러리 구조입니다. 여러 가정이 함께 쓰려면 `households` 테이블 +
  `auth.uid()` 기반 RLS로 확장하세요.
- **외부 표지 이미지 재호스팅**: `/api/books/search`가 반환하는
  Google Books 썸네일 URL을 그대로 저장하고 있습니다. 이용약관을 확인한
  뒤, 필요하면 Supabase Storage로 다운로드/재업로드하는 단계를
  `/api/books/add`에 추가하세요.
- **비밀번호 재설정 화면**: `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`
  로 재설정 메일을 보내고, `/auth/callback`에서 받은 세션으로 새 비밀번호를
  입력하는 화면을 하나 추가하면 됩니다. 지금은 비밀번호를 잊으면 Supabase
  대시보드에서 수동으로 사용자 비밀번호를 재설정해줘야 합니다.

## 5. 확인한 것

`npm install` && `npm run build` 로 전체 프로젝트가 오류 없이 빌드되는 것을
확인했습니다(플레이스홀더 환경변수 사용). 실제 Supabase 프로젝트와 연결한
상태에서의 런타임 동작(`npm run dev`)은 이 환경에서 외부 네트워크가 제한되어
직접 실행해보지 못했으니, 로컬에서 `.env.local`을 채운 뒤 한 번 확인해주세요.
