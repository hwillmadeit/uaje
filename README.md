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
supabase/seed.sql     -- (선택) 샘플 데이터 10권
```

Supabase 대시보드 → Authentication → URL Configuration에서 Redirect URLs에
`http://localhost:3000/auth/callback` (배포 시에는 실제 도메인으로)을 추가하세요.
매직 링크 로그인이 여기 등록된 URL로만 돌아옵니다.

```bash
npm run dev
```

`http://localhost:3000` 접속 → 로그인 화면으로 이동 → 이메일 입력 →
받은 메일의 링크를 누르면 로그인됩니다.

## 0. 보안 — 이 버전에서 새로 추가된 것

이전 버전은 "인증 없이 anon key만 있으면 전체 데이터를 읽고 쓸 수 있는"
상태였습니다. 이번 업데이트로 네 가지를 닫았습니다.

1. **로그인(Supabase Auth, 매직 링크)** — `middleware.js`가 로그인하지 않은
   방문자를 `/login`으로 돌려보냅니다. `app/login/page.jsx`에서 이메일을
   입력하면 링크가 오고, `app/auth/callback/route.js`가 그 링크를 실제
   세션으로 교환합니다.
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
| "제목으로 찾기" (책 검색) | ✅ 실제 동작 — 우리 서재(Supabase) 우선 검색 + Google Books API(키 없이도 동작, 낮은 트래픽 기준) |
| "직접 입력" | ✅ 실제 Supabase insert |
| 책 등록 → 이번 주 책 / 책꽂이 반영 | ✅ 실제 동작, 다시 촬영한 책은 새 책을 만들지 않고 기존 책에 읽기 세션만 추가 |
| 기록 작성 ("기록 저장하기") | ✅ 실제 Supabase insert (텍스트만 — 사진 업로드는 아래 참고) |
| "읽은 날 추가" / "다시 읽었어요" | ✅ 실제 reading_sessions insert |
| "이미지로 저장" (선생님 공유 카드) | ✅ 실제 PNG 생성 (`html-to-image`) 후 다운로드 |
| "여러 권 촬영하기" 책 인식 (vision) | ⚙️ `ANTHROPIC_API_KEY` + `ANTHROPIC_VISION_MODEL` 설정 시 실제 Claude vision 호출. 설정 안 하면 가짜 인식 결과를 보여주는 대신 "책 인식 기능이 아직 연결되지 않았어요" 안내와 함께 제목 검색/직접 입력으로 자연스럽게 넘어갑니다. |
| 그림/사진 기록의 실제 이미지 업로드 | 🚧 TODO — 아래 "다음 단계" 참고 |

## 1. 폴더 구조

```
middleware.js               로그인 세션 체크 + 갱신 (모든 페이지, /api 제외)

app/
  layout.jsx            루트 레이아웃, 폰트/전역 스타일
  page.jsx               LibraryProvider로 감싼 엔트리
  globals.css             디자인 토큰(CSS 변수) + 애니메이션 keyframes
  login/page.jsx           매직 링크 로그인 화면
  auth/callback/route.js   매직 링크 → 세션 교환
  api/
    books/identify/        POST — vision 기반 다중 책 인식 (로그인 필요 + 시간당 10회 제한)
    books/search/           GET  — 서재 검색 + Google Books 검색 (로그인 필요 + 분당 60회 제한)
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
  bookAdapters.js             identifyBooksFromImage / searchBook / saveBooks / addRecord / addReadingSession
                               — 전부 fetch()로 /api/* 라우트를 호출, 401을 받으면 /login으로 이동
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

## 5. 확인한 것

`npm install` && `npm run build` 로 전체 프로젝트가 오류 없이 빌드되는 것을
확인했습니다(플레이스홀더 환경변수 사용). 실제 Supabase 프로젝트와 연결한
상태에서의 런타임 동작(`npm run dev`)은 이 환경에서 외부 네트워크가 제한되어
직접 실행해보지 못했으니, 로컬에서 `.env.local`을 채운 뒤 한 번 확인해주세요.
