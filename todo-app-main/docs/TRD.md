# TRD — Tika

> **Technical Requirements Document**
> 버전: v0.1.0 (MVP) · 작성일: 2026-06-05
> 상위 문서: [PRD.md](./PRD.md)

---

## 목차

1. [시스템 아키텍처](#1-시스템-아키텍처)
2. [기술 스택 상세](#2-기술-스택-상세)
3. [데이터 흐름](#3-데이터-흐름)
4. [계층 간 경계 규칙](#4-계층-간-경계-규칙)
5. [개발 환경 설정](#5-개발-환경-설정)
6. [배포 전략](#6-배포-전략)
7. [비기능 요구사항](#7-비기능-요구사항)

---

## 1. 시스템 아키텍처

### 1-1. 전체 구조

Tika는 **Vercel 단일 배포** 구조다. Next.js App Router가 프런트엔드 렌더링과 백엔드 API를 모두 담당하며, 데이터 저장소로 Vercel Postgres를 사용한다.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Platform                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Next.js 15 App Router                  │   │
│  │                                                         │   │
│  │  ┌───────────────────┐   ┌───────────────────────────┐ │   │
│  │  │  Page Components  │   │     API Route Handlers    │ │   │
│  │  │  (RSC + Client)   │   │     app/api/**            │ │   │
│  │  └────────┬──────────┘   └───────────┬───────────────┘ │   │
│  │           │                          │                  │   │
│  │  ┌────────▼──────────────────────────▼───────────────┐ │   │
│  │  │              src/client/  ←  src/shared/           │ │   │
│  │  │              src/server/  ←  src/shared/           │ │   │
│  │  └───────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────┬───────────────────────────┘   │
│                                │                                │
│  ┌─────────────────────────────▼───────────────────────────┐   │
│  │              Vercel Postgres (Neon 기반)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1-2. 요청 처리 흐름 (아키텍처 다이어그램)

```
Browser (React)
    │
    │  HTTP Request
    ▼
app/api/tickets/route.ts          ← Route Handler (진입점)
    │  요청 파싱 + Zod 검증
    │
    ▼
src/server/services/ticketService  ← Service Layer (비즈니스 로직)
    │  position 계산, 날짜 자동 설정
    │
    ▼
src/server/db/index.ts             ← Drizzle ORM
    │  타입 안전 쿼리 생성
    │
    ▼
Vercel Postgres (PostgreSQL 16)    ← Database
```

### 1-3. 디렉토리 구조

```
tika/
├── app/
│   ├── page.tsx                   # 보드 메인 페이지 (RSC)
│   ├── layout.tsx                 # 루트 레이아웃
│   ├── globals.css                # CSS 변수 (디자인 토큰)
│   └── api/
│       └── tickets/
│           ├── route.ts           # GET /api/tickets, POST /api/tickets
│           └── [id]/
│               └── route.ts      # GET/PATCH/DELETE /api/tickets/:id
│
├── src/
│   ├── server/                    # 백엔드 로직 (client에서 import 금지)
│   │   ├── db/
│   │   │   ├── index.ts           # Drizzle 인스턴스 (db 싱글턴)
│   │   │   └── schema.ts          # tickets 테이블 스키마
│   │   └── services/
│   │       └── ticketService.ts   # 티켓 비즈니스 로직
│   │
│   ├── client/                    # 프런트엔드 로직 (server에서 import 금지)
│   │   ├── api/
│   │   │   └── ticketApi.ts       # fetch wrapper (브라우저 → API)
│   │   ├── components/
│   │   │   ├── board/             # KanbanBoard, Column, DropZone
│   │   │   └── ticket/            # TicketCard, TicketModal, TicketForm
│   │   └── hooks/
│   │       └── useTickets.ts      # 보드 상태 관리 훅
│   │
│   └── shared/                    # 양쪽에서 참조 가능
│       ├── types/
│       │   └── ticket.ts          # Ticket, TicketStatus, CreateTicketInput 등
│       ├── validations/
│       │   └── ticket.ts          # Zod 스키마 (createTicketSchema 등)
│       ├── constants/
│       │   └── columns.ts         # TICKET_STATUS, COLUMN_ORDER 상수
│       └── design/
│           └── colors.json        # 디자인 토큰 (컬러 팔레트)
│
├── docs/                          # 명세 문서
├── drizzle/                       # 마이그레이션 파일
└── __tests__/                     # 테스트 파일
    ├── services/                  # @jest-environment node
    ├── components/                # jsdom (기본)
    ├── hooks/                     # jsdom (기본)
    └── api/                       # ticketApi: jsdom, tickets route: node
```

---

## 2. 기술 스택 상세

### 2-1. 선정 스택 및 대안 비교

> PRD §6 기술 스택 요약표의 확장 버전이다. 버전과 선정 근거를 상세화한다.

#### Framework: Next.js 15 (App Router)

| 항목 | 내용 |
|------|------|
| 버전 | 15.x (App Router 전용) |
| 런타임 | Node.js — Vercel Serverless Functions |
| 선정 이유 | 프런트+백엔드 단일 레포, RSC로 초기 로드 최적화, Vercel 공식 지원 |

**대안 비교**

| 대안 | 탈락 이유 |
|------|-----------|
| Next.js Pages Router | App Router 대비 Server Components 미지원, 캐싱 제어 불편 |
| Vite + Express | 프런트/백엔드 별도 배포 필요, 설정 비용 증가 |
| Remix | 커뮤니티·생태계가 Next.js 대비 작음, Vercel 통합 최적화 부족 |

---

#### Language: TypeScript 5.x (strict mode)

| 항목 | 내용 |
|------|------|
| 버전 | 5.x (`strict: true`) |
| 선정 이유 | 컴파일 타임 오류 검출, `src/shared/types`로 프런트·백엔드 타입 계약 보장 |
| 주요 설정 | `strict`, `noUncheckedIndexedAccess`, path alias (`@/` → `src/`) |

---

#### Frontend: React 19

| 항목 | 내용 |
|------|------|
| 버전 | 19.x |
| 선정 이유 | Server Components(RSC) + Client Components 혼용으로 TTI 최소화 |
| 렌더링 전략 | 보드 페이지: RSC (초기 데이터 fetch) + Client Components (DnD 인터랙션) |

---

#### Styling: Tailwind CSS 4

| 항목 | 내용 |
|------|------|
| 버전 | 4.x |
| 선정 이유 | 유틸리티 클래스로 빠른 UI 구성, CSS 번들 최소화 (사용한 클래스만 포함) |
| 디자인 토큰 | `src/shared/design/colors.json` + `app/globals.css` CSS 변수 연동 |

**대안 비교**

| 대안 | 탈락 이유 |
|------|-----------|
| CSS Modules | 컴포넌트별 파일 분리 필요, 토큰 관리 복잡 |
| styled-components | SSR 설정 복잡, React 19 호환성 이슈 가능 |

---

#### Drag & Drop: @dnd-kit/core + @dnd-kit/sortable

| 항목 | 내용 |
|------|------|
| 버전 | latest (6.x 계열) |
| 선정 이유 | ARIA 접근성 내장, SSR 친화적(window 참조 없음), React 19 공식 지원 |

**대안 비교**

| 대안 | 탈락 이유 |
|------|-----------|
| react-beautiful-dnd | React 18+ 미지원(Deprecated), 유지보수 중단 |
| react-dnd | 설정 복잡도 높음, HTML5 백엔드 터치 미지원 |

---

#### ORM: Drizzle ORM 0.38.x

| 항목 | 내용 |
|------|------|
| 버전 | 0.38.x |
| 선정 이유 | 코드 생성 불필요, Vercel Postgres 공식 지원, SQL-like 쿼리로 가독성 우수 |
| 연결 방식 | `@vercel/postgres` 어댑터 사용 (서버리스 커넥션 풀 자동 관리) |

**대안 비교**

| 대안 | 탈락 이유 |
|------|-----------|
| Prisma | Vercel Edge 환경에서 엔진 바이너리 크기 이슈, 콜드 스타트 지연 |
| Kysely | 타입 정의 직접 작성 필요, 스키마 마이그레이션 도구 별도 |
| TypeORM | 데코레이터 기반으로 strict TypeScript와 궁합 약함 |

---

#### Database: PostgreSQL 16 / Vercel Postgres

| 항목 | 내용 |
|------|------|
| 버전 | PostgreSQL 16 |
| 호스팅 | Vercel Postgres (Neon 기반, 서버리스 커넥션 풀 자동 관리) |
| 로컬 | node-postgres(`pg`) + 로컬 PostgreSQL 인스턴스 |
| 선정 이유 | ACID 트랜잭션으로 position 정합성 보장, Vercel 대시보드 통합 관리 |

**대안 비교**

| 대안 | 탈락 이유 |
|------|-----------|
| PlanetScale(MySQL) | Drizzle과 통합은 가능하나 PostgreSQL 생태계 이점 포기 |
| SQLite(Turso) | 서버리스 환경에서 write 동시성 제한 |
| Supabase | 자체 인증/스토리지 기능이 MVP에 불필요한 의존성 추가 |

---

#### Validation: Zod 3.x

| 항목 | 내용 |
|------|------|
| 버전 | 3.x |
| 선정 이유 | Runtime 검증 + TypeScript 타입 추론 동시 처리, `src/shared/validations`로 프런트·백엔드 스키마 공유 |
| 적용 위치 | Route Handler 입력 검증 + 클라이언트 폼 검증 (동일 스키마 재사용) |

---

#### Testing: Jest + React Testing Library

| 항목 | 내용 |
|------|------|
| 버전 | Jest 29.x, RTL 14.x |
| 선정 이유 | 서비스 단위 테스트(Jest) + 컴포넌트 통합 테스트(RTL)를 단일 러너로 실행 |
| 환경 분리 | 컴포넌트: `jsdom` / 서비스·API: `@jest-environment node` (파일 상단 주석 필수) |
| 실행 방식 | `--runInBand` 필수 (공유 DB `tika_test` race condition 방지) |

---

## 3. 데이터 흐름

### 3-1. 읽기 흐름 (GET)

```
[KanbanBoard 컴포넌트]
    │  마운트 시 useTickets() 훅 호출
    ▼
[src/client/api/ticketApi.ts]
    │  GET /api/tickets
    ▼
[app/api/tickets/route.ts]          (Route Handler)
    │  요청 파싱 (query params)
    ▼
[src/server/services/ticketService.findAll()]
    │  SELECT * FROM tickets ORDER BY status, position
    ▼
[Vercel Postgres]
    │  결과 반환
    ▼
[Ticket[]] → 컬럼별 그룹화 → 보드 렌더링
```

### 3-2. 쓰기 흐름 (POST / PATCH)

```
[TicketForm 컴포넌트]
    │  사용자 입력
    ▼
[Zod 클라이언트 검증]              (createTicketSchema.safeParse)
    │  검증 실패 → 인라인 에러 표시
    │  검증 성공 ↓
    ▼
[src/client/api/ticketApi.ts]
    │  POST /api/tickets  (JSON body)
    ▼
[app/api/tickets/route.ts]          (Route Handler)
    │  1. body 파싱
    │  2. Zod 서버 검증 (createTicketSchema.safeParse)
    │     실패 → 400 VALIDATION_ERROR
    ▼
[src/server/services/ticketService.create()]
    │  position 계산 (해당 컬럼 최하단)
    │  INSERT INTO tickets ... RETURNING *
    ▼
[Vercel Postgres]
    │  201 Created + Ticket 반환
    ▼
[클라이언트 상태 업데이트 → 보드 리렌더링]
```

### 3-3. 드래그 앤 드롭 흐름 (낙관적 업데이트)

```
[사용자 드래그 종료 (onDragEnd)]
    │
    ├─ 1. 낙관적 업데이트: 클라이언트 상태 즉시 변경
    │      → 보드가 반응 즉시 반영 (지연 없음)
    │
    ├─ 2. PATCH /api/tickets/:id
    │      body: { status, position }
    │      (Done 컬럼으로 이동 시 actualEndDate: today 포함)
    │
    ├─ 3. ticketService.updateStatus()
    │      position 재계산: (이전 티켓 position + 다음 티켓 position) / 2
    │      → fractional indexing 방식
    │
    └─ 4. 서버 응답
           성공 → 낙관적 상태 확정 (서버 position 값으로 교체)
           실패 → 낙관적 상태 롤백 + 에러 토스트 표시
```

**position 재계산 규칙**

| 상황 | 계산 방법 |
|------|-----------|
| 컬럼의 첫 번째 티켓 | `기존 첫 번째 position - 1024` |
| 컬럼의 마지막 티켓 | `기존 마지막 position + 1024` |
| 두 티켓 사이 삽입 | `(위 티켓 position + 아래 티켓 position) / 2` |
| position 간격 < 1 | DB 전체 position 재정렬 트리거 |

---

## 4. 계층 간 경계 규칙

### 4-1. Import 규칙

```
┌─────────────────────────────────────────────┐
│                                             │
│   src/client/  ──import──▶  src/shared/     │
│                                             │
│   src/server/  ──import──▶  src/shared/     │
│                                             │
│   src/client/  ✗ NEVER ✗  src/server/      │
│   src/server/  ✗ NEVER ✗  src/client/      │
│                                             │
│   app/api/     ──import──▶  src/server/     │
│   app/api/     ──import──▶  src/shared/     │
│   app/(pages)  ──import──▶  src/client/     │
│   app/(pages)  ──import──▶  src/shared/     │
│                                             │
└─────────────────────────────────────────────┘
```

위반 시 빌드 에러 또는 런타임 에러 발생 가능. ESLint import 규칙으로 CI에서 강제한다.

### 4-2. Route Handler 책임 범위

Route Handler는 **얇게(thin)** 유지한다. 비즈니스 로직은 Service Layer에만 존재한다.

```typescript
// ✅ 올바른 Route Handler
export async function POST(request: Request) {
  const body = await request.json();                          // 1. 요청 파싱

  const result = createTicketSchema.safeParse(body);          // 2. Zod 검증
  if (!result.success) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: result.error.message } },
      { status: 400 }
    );
  }

  const ticket = await ticketService.create(result.data);     // 3. 서비스 호출

  return Response.json(ticket, { status: 201 });              // 4. 응답 반환
}

// ❌ 금지: Route Handler에 비즈니스 로직 작성
export async function POST(request: Request) {
  const body = await request.json();
  const position = await db.select()...  // ← 직접 DB 접근 금지
  const ticket = await db.insert()...    // ← 비즈니스 로직 금지
}
```

### 4-3. 에러 응답 형식

모든 API 에러는 아래 형식을 준수한다.

```typescript
// 표준 에러 응답
{
  "error": {
    "code": "TICKET_NOT_FOUND",     // 머신 리더블 코드 (대문자_스네이크)
    "message": "티켓을 찾을 수 없습니다"  // 사람이 읽을 수 있는 메시지
  }
}
```

| HTTP 상태 | 에러 코드 | 발생 상황 |
|-----------|-----------|-----------|
| 400 | `VALIDATION_ERROR` | Zod 검증 실패 |
| 404 | `TICKET_NOT_FOUND` | 존재하지 않는 티켓 ID |
| 500 | `INTERNAL_ERROR` | 예상치 못한 서버 오류 |

---

## 5. 개발 환경 설정

### 5-1. 사전 요구사항

| 도구 | 버전 | 용도 |
|------|------|------|
| Node.js | 20.x LTS | 런타임 |
| PostgreSQL | 16.x | 로컬 DB |
| Vercel CLI | latest | 환경 변수 동기화 |

### 5-2. 초기 설정

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (Vercel 프로젝트 연결 후)
vercel env pull .env.local
# 또는 로컬 PostgreSQL 사용 시 직접 작성
echo "DATABASE_URL=postgresql://user:password@localhost:5432/tika" > .env.local

# 3. DB 마이그레이션
npm run db:migrate

# 4. 시드 데이터 (선택)
npm run db:seed

# 5. 개발 서버 실행
npm run dev
```

### 5-3. 환경 변수

| 변수명 | 예시 | 필수 여부 |
|--------|------|-----------|
| `DATABASE_URL` | `postgresql://user:pw@host:5432/tika` | 필수 |
| `POSTGRES_URL` | Vercel Postgres 자동 생성 | 배포 환경 |

### 5-4. 테스트 환경

```bash
npm run test              # 전체 테스트 (--runInBand 순차 실행)
npm run test:components   # 컴포넌트 테스트만 (jsdom)
npm run test:watch        # watch 모드
npx tsc --noEmit          # 타입 체크
```

**테스트 DB 설정**

- 서비스 테스트는 공유 DB `tika_test`를 사용한다.
- 각 테스트 파일은 `beforeEach`에서 트랜잭션을 시작하고 `afterEach`에서 롤백한다.
- `--runInBand` 없이 병렬 실행 시 race condition 발생 — `package.json`에 고정 설정.

```typescript
// 서비스 테스트 파일 필수 주석
/** @jest-environment node */
```

### 5-5. Lint / Format

```bash
npm run lint              # ESLint 실행
npm run lint:fix          # ESLint 자동 수정
```

| 도구 | 설정 파일 | 역할 |
|------|-----------|------|
| ESLint | `eslint.config.mjs` | 코드 품질 (import 순서, any 금지 등) |
| Prettier | `.prettierrc` | 코드 포맷 (자동 정렬) |
| TypeScript | `tsconfig.json` | 타입 체크 (strict mode) |

### 5-6. Git Hooks

```bash
bash .specify/scripts/bash/install-hooks.sh  # hook 설치
```

| Hook | 실행 시점 | 동작 |
|------|-----------|------|
| `pre-commit` | 커밋 직전 | CHANGELOG.md 자동 업데이트 |

---

## 6. 배포 전략

### 6-1. 배포 파이프라인

```
로컬 개발
    │
    │  git push origin feature/*
    ▼
GitHub PR 생성
    │
    ├─ Vercel Preview 배포 (자동)
    │   URL: https://tika-git-feature-xxx.vercel.app
    │   용도: PR 리뷰, QA 확인
    │
    │  PR Merge → main 브랜치
    ▼
Vercel Production 배포 (자동)
    URL: https://tika.vercel.app
```

### 6-2. 환경 구분

| 환경 | 트리거 | DB | 용도 |
|------|--------|-----|------|
| **Local** | `npm run dev` | 로컬 PostgreSQL | 개발 |
| **Preview** | PR 생성 | Vercel Postgres (Preview) | QA·리뷰 |
| **Production** | main 브랜치 push | Vercel Postgres (Production) | 서비스 |

### 6-3. 환경 변수 관리

- 모든 환경 변수는 **Vercel Dashboard**에서 관리한다.
- `.env.local`은 Git에 커밋하지 않는다 (`.gitignore` 포함).
- `vercel env pull .env.local`로 로컬에 최신 값을 동기화한다.

### 6-4. DB 마이그레이션 전략

```bash
# 스키마 변경 시
npm run db:generate   # Drizzle이 마이그레이션 SQL 생성
npm run db:migrate    # 마이그레이션 실행 (배포 전 수동 실행)
```

- **배포 시**: 마이그레이션은 자동 실행되지 않는다. 스키마 변경 PR에는 마이그레이션 실행이 수동 절차로 포함된다.
- **롤백**: Drizzle 마이그레이션은 자동 롤백 미지원 — 스키마 변경은 하위 호환성을 유지하며 단계적으로 적용한다.

### 6-5. 빌드 체크리스트 (배포 전 필수)

```bash
npx tsc --noEmit   # 타입 에러 없음
npm run test       # 전체 테스트 통과
npm run build      # 프로덕션 빌드 성공
npm run lint       # Lint 경고 없음
```

---

## 7. 비기능 요구사항

PRD FR-001~008 구현을 지원하는 기술적 품질 기준이다.

| 항목 | 목표 | 측정 방법 |
|------|------|-----------|
| **응답 시간** | API 응답 < 300ms (p95) | Vercel Analytics |
| **초기 로드** | LCP < 2.5s | Lighthouse |
| **드래그 반응** | 낙관적 업데이트로 즉각 반응 (< 16ms) | 체감 테스트 |
| **타입 안전성** | `tsc --noEmit` 에러 0 | CI 자동화 |
| **테스트 커버리지** | 서비스 레이어 80% 이상 | Jest coverage |
| **번들 크기** | 초기 JS < 200KB (gzip) | `next build` 출력 |

---

*이 문서는 PRD.md를 기술 관점에서 구체화한 것이다. 구현 전 API_SPEC.md, DATA_MODEL.md와 함께 확인한다.*
