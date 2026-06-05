# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**Tika** — 티켓 기반 칸반 보드 TODO 앱 (MVP, 단일 사용자).
Next.js App Router로 프런트엔드·백엔드를 단일 레포에서 관리한다. Vercel + Vercel Postgres에 배포된다.

## 개발 명령어

```bash
# 개발
npm run dev          # 개발 서버 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint

# 테스트
npm run test              # 전체 (--runInBand 순차 실행 필수)
npm run test:components   # 컴포넌트만 (jsdom)
npm run test:watch        # watch 모드
npm run test -- path/to/test.test.ts          # 단일 파일
npm run test -- --testNamePattern "제목 입력"  # 특정 테스트명
npx tsc --noEmit          # 타입 체크

# DB
npm run db:generate  # Drizzle 마이그레이션 생성 (스키마 변경 후 항상 실행)
npm run db:migrate   # 마이그레이션 적용
npm run db:studio    # Drizzle Studio GUI
npm run db:seed      # 시드 데이터 삽입
```

## 아키텍처

### 계층 구조

```
Browser (React 19 + @dnd-kit)
    ↓
app/api/tickets/          ← Route Handler: 요청 파싱 → Zod 검증 → 서비스 호출 → 응답만
    ↓
src/server/services/      ← 비즈니스 로직 전담 (position 계산, 날짜 자동화)
    ↓
src/server/db/            ← Drizzle ORM (schema.ts 기준, $inferSelect 타입 활용)
    ↓
Vercel Postgres (PostgreSQL 16)
```

### 레이어 간 Import 경계 (엄격히 준수)

```
src/client/  →  src/shared/  ✅
src/server/  →  src/shared/  ✅
src/client/  →  src/server/  ❌  (빌드 에러 또는 런타임 에러)
src/server/  →  src/client/  ❌
app/page.tsx →  src/server/  ✅  (RSC에서만 직접 서비스 호출 허용)
```

`src/shared/`에만 타입·Zod 스키마·상수를 두고 양쪽에서 재사용한다.

### 디렉토리 구조

```
app/
├── api/tickets/
│   ├── route.ts              # GET(목록) · POST(생성)
│   ├── [id]/
│   │   ├── route.ts          # GET · PATCH · DELETE
│   │   └── complete/route.ts # PATCH /complete — Done 이동 전용
│   └── reorder/route.ts      # PATCH /reorder — 상태 변경·순서 변경 (DnD)
└── page.tsx                  # RSC: initialTickets fetch → BoardContainer 전달

src/
├── server/
│   ├── services/ticketService.ts  # 비즈니스 로직 (CRUD + move + complete + reorder)
│   └── db/
│       ├── index.ts               # Drizzle 인스턴스 (싱글턴)
│       ├── schema.ts              # tickets 테이블 (DATA_MODEL.md 기준)
│       └── seed.ts
├── client/
│   ├── components/
│   │   ├── board/     # BoardContainer · BoardHeader · FilterBar · Board · Column · ColumnHeader
│   │   ├── ticket/    # TicketCard · TicketModal · TicketForm · TicketDetailView
│   │   └── ui/        # Button · Modal · Badge · ConfirmDialog
│   ├── hooks/useTickets.ts    # 전체 보드 상태 + CRUD + DnD 낙관적 업데이트
│   └── api/ticketApi.ts       # fetch 래퍼 (7개 엔드포인트 대응)
└── shared/
    ├── types/index.ts          # Ticket · BoardData · API 타입
    ├── validations/ticket.ts   # Zod 스키마 (프런트/백 공유)
    └── errors/index.ts         # TicketNotFoundError 등
```

### API 엔드포인트 (7개)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/tickets` | 전체 보드 조회 (status + position 정렬) |
| `POST` | `/api/tickets` | 티켓 생성 (status=BACKLOG, position=1 고정) |
| `GET` | `/api/tickets/:id` | 티켓 상세 조회 |
| `PATCH` | `/api/tickets/:id` | 내용 수정 (title·description·priority·날짜) |
| `PATCH` | `/api/tickets/:id/complete` | Done 이동 전용 — `completedAt=NOW()` 자동 설정 |
| `DELETE` | `/api/tickets/:id` | 영구 삭제 (soft delete 없음) |
| `PATCH` | `/api/tickets/reorder` | DnD 이동 — status·position 재계산, BR-002/003/004 처리 |

> `/complete`와 `/reorder`는 별개 엔드포인트다. Done으로의 이동은 `/complete`만 사용한다.

### 핵심 비즈니스 규칙 (DATA_MODEL.md §4)

| 규칙 | 동작 |
|------|------|
| BR-001 | 신규 티켓은 항상 `status=BACKLOG`, `position=1` (기존 BACKLOG position +1 재계산) |
| BR-002 | `→ DONE` 이동 시 `completedAt = NOW()` |
| BR-003 | `DONE →` 복귀 시 `completedAt = NULL` |
| BR-004 | `BACKLOG → TODO` 최초 이동 시 `startedAt = NOW()` (이후 유지) |
| BR-005 | 기한 초과: `dueDate < TODAY AND status ≠ DONE` |

### 테스트 환경 분리

| 위치 | 환경 | 이유 |
|------|------|------|
| `__tests__/services/`, `__tests__/api/tickets*.test.ts` | `node` | 실제 DB(`tika_test`) 접속 |
| `__tests__/components/`, `__tests__/hooks/`, `__tests__/api/ticketApi.test.ts` | `jsdom` | DOM API 필요 |

서비스 테스트 파일 상단에 반드시 `/** @jest-environment node */` 선언.
`--runInBand` 없이 병렬 실행 시 공유 DB race condition 발생 — `package.json`에 고정 설정됨.

### DnD 낙관적 업데이트 흐름

`onDragEnd` → 클라이언트 상태 즉시 반영 → `PATCH /api/tickets/reorder` 호출 → 성공 시 서버 position으로 교체, 실패 시 롤백 + 에러 토스트.

## 명세 문서 (구현 전 반드시 확인)

| 문서 | 확인 시점 |
|------|-----------|
| [docs/API_SPEC.md](docs/API_SPEC.md) | API 구현 전 — 에러 코드·응답 형식·Zod 스키마 |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | DB 작업 전 — 스키마·비즈니스 규칙·position 계산 |
| [docs/COMPONENT_SPEC.md](docs/COMPONENT_SPEC.md) | 컴포넌트 작성 전 — Props·이벤트·훅 시그니처 |
| [docs/TEST_CASES.md](docs/TEST_CASES.md) | 테스트 작성 전 — TC-API/COMP/INT 케이스 |
| [docs/PRD.md](docs/PRD.md) | 기능 범위 확인 — FR-001~008, 2차 제외 목록 |

## 코딩 컨벤션

### TypeScript

```typescript
// ✅
export const TICKET_STATUS = { BACKLOG: 'BACKLOG', TODO: 'TODO' } as const;
type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

// ❌ enum 사용 금지 / I 접두사 금지 / any 금지
enum Status { ... }
interface ITicket { ... }
let data: any;
```

### Route Handler — 얇게 유지

```typescript
export async function POST(request: Request) {
  const body = await request.json();                       // 1. 파싱
  const result = createTicketSchema.safeParse(body);       // 2. Zod 검증
  if (!result.success) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: result.error.message } },
      { status: 400 }
    );
  }
  const ticket = await ticketService.create(result.data);  // 3. 서비스 호출
  return Response.json(ticket, { status: 201 });           // 4. 응답
}
```

Route Handler에 비즈니스 로직 작성 금지. DB 직접 접근 금지.

### 에러 응답 형식 (전 엔드포인트 통일)

```typescript
// ✅
{ error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } }

// ❌
{ message: 'Not found' }
{ error: 'Not found' }
```

| 상태 | code |
|------|------|
| 400 | `VALIDATION_ERROR` |
| 404 | `TICKET_NOT_FOUND` |
| 500 | `INTERNAL_ERROR` |

### 검증 에러 메시지 (한국어 고정)

| 조건 | 메시지 |
|------|--------|
| title 누락·빈 문자열 | `"제목을 입력해주세요"` |
| title 200자 초과 | `"제목은 200자 이내로 입력해주세요."` |
| dueDate 오늘 이전 | `"종료예정일은 오늘 이후여야합니다."` |
| priority 잘못된 값 | `"우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다."` |

## SDD + TDD 구현 순서

새 기능 구현 시 아래 순서를 지킨다.

```
1. src/shared/types/         — 타입 정의
2. src/shared/validations/   — Zod 스키마 (에러 메시지 포함)
3. __tests__/                — Red 테스트 먼저 작성 (TEST_CASES.md 기준)
4. src/server/services/      — 비즈니스 로직 (Green)
5. app/api/                  — Route Handler (thin)
6. src/client/api/           — fetch 래퍼
7. src/client/components/    — UI (COMPONENT_SPEC.md 기준)
```

## 금지 사항

- `src/client/`에서 DB 직접 접근
- Route Handler에 비즈니스 로직 작성
- `enum` 사용 (const 객체 + 타입 추론으로 대체)
- `any` 타입
- `console.log` 커밋
- 명세 문서 없이 기능 추가

## 변경 시 주의

| 변경 대상 | 필수 후속 작업 |
|-----------|---------------|
| DB 스키마 | `npm run db:generate` → 마이그레이션 파일 커밋 |
| `src/shared/types` | 프런트·백엔드 양쪽 영향 범위 확인 |
| API 응답 형식 | `docs/API_SPEC.md` 먼저 수정 |
| 디자인 토큰 | `src/shared/design/colors.json` + `app/globals.css` 동시 수정 |

## 환경 변수

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/tika   # 로컬
# Vercel Postgres 사용 시: vercel env pull .env.local
```

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

pre-commit hook이 CHANGELOG.md를 자동 업데이트한다. `/changelog` 수동 실행 시 중복 방지를 위해 hook이 스킵된다.
