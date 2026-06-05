# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

**Tika** — 티켓 기반 칸반 보드 TODO 앱 (MVP, 단일 사용자, 인증 없음).
4개 고정 컬럼(Backlog · TODO · In Progress · Done)에서 티켓을 드래그 앤 드롭으로 관리한다.
Next.js App Router로 프런트엔드·백엔드를 단일 레포에서 관리하며, Vercel + Vercel Postgres에 배포된다.

**MVP 제외 기능**: 사용자 인증, 커스텀 컬럼, 멀티 사용자, 라벨, 코멘트, 파일 업로드, 통계.

---

## 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js App Router | 15.x |
| Language | TypeScript (strict) | 5.x |
| Frontend | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | 6.x |
| ORM | Drizzle ORM | 0.38.x |
| Database | PostgreSQL (로컬: node-postgres, 배포: Vercel Postgres) | 16.x |
| Validation | Zod | 3.x |
| Testing (컴포넌트) | Jest 29 + React Testing Library | 29.x / 14.x |
| Testing (API·서비스) | Vitest | 4.x |
| Deployment | Vercel | — |

---

## 명세 문서 (구현 전 반드시 확인)

모든 기능은 명세 문서를 먼저 읽고 구현한다. 문서 없이 기능을 추가하거나 명세를 임의로 변경하지 않는다.

### 문서 계층

```
PRD.md  (최상위 — 기능 범위·사용자 시나리오)
  └── TRD.md  (기술 구조 — 아키텍처·스택·계층 경계)
        ├── API_SPEC.md       (REST API — 요청/응답·에러코드·Zod 스키마)
        ├── DATA_MODEL.md     (DB 스키마 — 테이블·BR·인덱스·Drizzle 코드)
        ├── COMPONENT_SPEC.md (UI — 컴포넌트 트리·Props·훅 시그니처)
        └── TEST_CASES.md     (테스트 케이스 — TC-API/COMP/INT)
```

### 확인 시점

| 문서 | 경로 | 확인 시점 |
|------|------|-----------|
| **CONSTITUTION** | [docs/CONSTITUTION.md](docs/CONSTITUTION.md) | **상시** — 모든 구현의 절대 원칙 (C-001~005) |
| PRD | [docs/PRD.md](docs/PRD.md) | 기능 범위 확인 — FR-001~008, 2차 제외 목록 |
| TRD | [docs/TRD.md](docs/TRD.md) | 아키텍처·스택·계층 경계 확인 |
| API_SPEC | [docs/API_SPEC.md](docs/API_SPEC.md) | API 구현 전 — 에러 코드·응답 형식·Zod 스키마 |
| DATA_MODEL | [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | DB 작업 전 — 스키마·BR·position 계산 |
| COMPONENT_SPEC | [docs/COMPONENT_SPEC.md](docs/COMPONENT_SPEC.md) | 컴포넌트 작성 전 — Props·훅 시그니처 |
| TEST_CASES | [docs/TEST_CASES.md](docs/TEST_CASES.md) | 테스트 작성 전 — TC-API/COMP/INT 케이스 |

---

## 개발 명령어

```bash
# 개발
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint

# 테스트 (Jest — 컴포넌트·훅·API 통합)
npm run test              # 전체 (--runInBand 순차 실행 필수)
npm run test:components   # 컴포넌트만 (jsdom)
npm run test:watch        # watch 모드
npm run test -- __tests__/api/tickets.post.test.ts  # 단일 파일
npm run test -- --testNamePattern "제목 입력"        # 특정 테스트명

# 테스트 (Vitest — 서비스·API Route 단위, 실제 DB 연결)
npm run test:vitest       # Vitest 전체 실행

# 타입 검사
npx tsc --noEmit

# DB
npm run db:generate  # Drizzle 마이그레이션 생성 (스키마 변경 후 항상 실행)
npm run db:migrate   # 마이그레이션 적용
npm run db:studio    # Drizzle Studio GUI
npm run db:seed      # 시드 데이터 삽입
```

---

## 아키텍처

### 디렉토리 구조

```
app/
├── page.tsx                   # RSC — 초기 티켓 fetch → BoardPage 전달
├── layout.tsx                 # 루트 레이아웃
├── globals.css                # CSS 변수 (디자인 토큰)
└── api/tickets/
    ├── route.ts               # GET /api/tickets · POST /api/tickets
    └── [id]/
        ├── route.ts           # GET · PATCH · DELETE /api/tickets/:id
        └── move/route.ts      # PATCH /api/tickets/:id/move (DnD 이동)

src/
├── server/                    # 백엔드 전용 (client에서 import 금지)
│   ├── db/
│   │   ├── index.ts           # Drizzle 인스턴스 (싱글턴)
│   │   ├── schema.ts          # tickets 테이블 (DATA_MODEL.md 기준)
│   │   └── seed.ts
│   └── services/
│       └── ticketService.ts   # 비즈니스 로직 전담
├── client/                    # 프런트엔드 전용 (server에서 import 금지)
│   ├── api/ticketApi.ts       # fetch 래퍼 (브라우저 → API)
│   ├── components/
│   │   ├── board/             # BoardPage · Column · ColumnHeader
│   │   ├── ticket/            # TicketCard · TicketModal · TicketForm
│   │   └── ui/                # Button · Modal · Badge · ConfirmDialog
│   └── hooks/useTickets.ts    # 보드 상태 + CRUD + DnD 낙관적 업데이트
└── shared/                    # 양쪽에서 참조 가능
    ├── types/index.ts          # TicketSelect · BoardData · API 타입 (re-export)
    ├── validations/ticket.ts   # Zod 스키마 (프런트/백 공유)
    ├── constants/columns.ts    # TICKET_STATUS · TICKET_PRIORITY · COLUMN_ORDER
    └── design/colors.json      # 디자인 토큰 (컬러 팔레트)

__tests__/
├── api/        # @jest-environment node (실제 DB)
├── services/   # @jest-environment node (실제 DB)
├── components/ # jsdom (기본)
└── hooks/      # jsdom (기본)

drizzle/        # Drizzle 마이그레이션 파일 (자동 생성, 커밋 필수)
docs/           # 명세 문서
```

### 계층 간 Import 경계

```
src/client/  →  src/shared/  ✅
src/server/  →  src/shared/  ✅
src/client/  →  src/server/  ❌  빌드/런타임 에러
src/server/  →  src/client/  ❌  빌드/런타임 에러
app/api/     →  src/server/  ✅
app/(page)   →  src/server/  ✅  RSC에서만 직접 서비스 호출 허용
```

`src/shared/`에만 타입·Zod 스키마·상수를 두고 client/server 양쪽에서 재사용한다.

### API 엔드포인트 (6개)

| 메서드 | 경로 | 설명 | FR |
|--------|------|------|----|
| `GET` | `/api/tickets` | 전체 목록 (status + position 오름차순) | FR-002 |
| `POST` | `/api/tickets` | 티켓 생성 (status=BACKLOG, position=1) | FR-001 |
| `GET` | `/api/tickets/:id` | 티켓 상세 조회 | FR-003 |
| `PATCH` | `/api/tickets/:id` | 내용 수정 (title·description·priority·날짜) | FR-004 |
| `DELETE` | `/api/tickets/:id` | 영구 삭제 (204 No Content) | FR-005 |
| `PATCH` | `/api/tickets/:id/move` | DnD 이동 — status·position 재계산 | FR-006·007 |

### 핵심 비즈니스 규칙 (DATA_MODEL.md §4)

| 규칙 | 동작 |
|------|------|
| BR-001 | 신규 티켓: `status=BACKLOG`, `position=1` (기존 BACKLOG position +1 재계산) |
| BR-002 | `→ DONE` 이동 시 `completedAt = NOW()` |
| BR-003 | `DONE →` 복귀 시 `completedAt = NULL` |
| BR-004 | `BACKLOG → TODO` 최초 이동 시 `startedAt = NOW()` (이후 유지) |
| BR-005 | 기한 초과 판정: `dueDate < TODAY AND status ≠ DONE` |

---

## SDD 워크플로

**구현 순서 규칙**: 명세 문서 확인 → 타입/스키마 → 테스트(Red) → 구현(Green) → UI

```
0. 명세 문서 확인
   ├── PRD.md    — 기능 요구사항 (FR-XXX) 확인
   ├── API_SPEC  — 엔드포인트·에러코드·응답 형식 확인
   ├── DATA_MODEL — DB 스키마·비즈니스 규칙 확인
   └── COMPONENT_SPEC — 컴포넌트 Props·훅 시그니처 확인

1. src/shared/types/         — 타입 정의
2. src/shared/validations/   — Zod 스키마 (에러 메시지 포함, API_SPEC §1-6 기준)
3. __tests__/                — Red 테스트 먼저 작성 (TEST_CASES.md TC-ID 기준)
4. src/server/services/      — 비즈니스 로직 (Green)
5. app/api/                  — Route Handler (thin — 파싱·검증·서비스 호출·응답만)
6. src/client/api/           — fetch 래퍼
7. src/client/components/    — UI (COMPONENT_SPEC.md 기준)
```

---

## 코딩 컨벤션

### TypeScript

```typescript
// ✅ const 객체 + 타입 추론
export const TICKET_STATUS = {
  BACKLOG: 'BACKLOG', TODO: 'TODO', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE',
} as const;
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

// ❌ 금지
enum Status { ... }        // enum 사용 금지
interface ITicket { ... }  // I 접두사 금지
let data: any;             // any 금지
```

### Route Handler — 얇게(thin) 유지

```typescript
export async function POST(request: Request) {
  const body = await request.json();                        // 1. 파싱
  const result = createTicketSchema.safeParse(body);        // 2. Zod 검증
  if (!result.success) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message } },
      { status: 400 }
    );
  }
  const ticket = await ticketService.create(result.data);   // 3. 서비스 호출
  return Response.json(ticket, { status: 201 });            // 4. 응답
}
// Route Handler에 비즈니스 로직 작성 금지. DB 직접 접근 금지.
```

### 에러 응답 형식 (전 엔드포인트 통일)

```typescript
// ✅
{ error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } }

// ❌
{ message: 'Not found' }
{ error: 'Not found' }
```

| HTTP 상태 | `error.code` | 발생 상황 |
|-----------|--------------|-----------|
| 400 | `VALIDATION_ERROR` | Zod 검증 실패 |
| 404 | `TICKET_NOT_FOUND` | 존재하지 않는 티켓 ID |
| 500 | `INTERNAL_ERROR` | 예상치 못한 서버 오류 |

### 검증 에러 메시지 (한국어 고정, API_SPEC.md §1-6 기준)

| 조건 | `error.message` |
|------|-----------------|
| title 누락·빈 문자열 | `"제목을 입력해주세요"` |
| title 200자 초과 | `"제목은 200자 이내로 입력해주세요."` |
| dueDate 오늘 이전 | `"종료예정일은 오늘 이후여야합니다."` |
| priority 잘못된 값 | `"우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다."` |

---

## 테스트 환경

### Jest vs Vitest 분리

| 러너 | 대상 | 파일 확장자 | 환경 |
|------|------|-------------|------|
| Jest | 컴포넌트·훅·ticketApi fetch 래퍼 | `*.test.ts(x)` | `jsdom` (기본) |
| Vitest | 서비스·API Route (실제 DB 접속) | `*.vtest.ts` | `node` |

### Jest 환경 선언

서비스·API Route 테스트는 파일 상단에 선언 필수:

```typescript
/** @jest-environment node */
```

### 병렬 실행 제한

`--runInBand` 없이 병렬 실행 시 공유 DB `tika_test` race condition 발생 → `package.json`에 고정.
Vitest는 `vitest.config.ts`에서 `fileParallelism: false` 설정.

---

## 변경 시 주의

| 변경 대상 | 필수 후속 작업 |
|-----------|----------------|
| `src/server/db/schema.ts` | `npm run db:generate` → 마이그레이션 파일 커밋 |
| `src/shared/types` | 프런트·백엔드 양쪽 영향 범위 확인 |
| `src/shared/constants/columns.ts` | TICKET_STATUS·PRIORITY·COLUMN_ORDER — schema.ts 기본값과 동기화 |
| API 응답 형식 | `docs/API_SPEC.md` 먼저 수정 |
| 디자인 토큰 | `src/shared/design/colors.json` + `app/globals.css` 동시 수정 |

---

## 환경 변수

| 변수 | 용도 | 환경 |
|------|------|------|
| `DATABASE_URL` | `postgresql://user:pw@host:5432/tika` | 로컬 필수 |
| `POSTGRES_URL` | Vercel Postgres 자동 생성 | 배포 환경 |

```bash
vercel env pull .env.local   # Vercel에서 최신 값 동기화
```

`.env.local`은 `.gitignore`에 포함 — 커밋 금지.

---

## Git

```bash
# 커밋 메시지 prefix
feat:     # 신규 기능
fix:      # 버그 수정
refactor: # 리팩토링
test:     # 테스트 추가·수정
docs:     # 명세 문서 수정

# 브랜치
main        # 프로덕션
feature/*   # 기능 개발
fix/*       # 버그 수정
```

`pre-commit` hook이 CHANGELOG.md를 자동 업데이트한다.
`/changelog` 수동 실행 시 중복 방지를 위해 hook이 스킵된다.

---

## 금지 사항

- `src/client/`에서 DB 직접 접근
- Route Handler에 비즈니스 로직 작성
- `enum` 사용 (const 객체 + 타입 추론으로 대체)
- `any` 타입
- `console.log` 커밋
- 명세 문서 없이 기능 추가·변경
