# DATA_MODEL — Tika

> **데이터베이스 스키마 · ERD · 비즈니스 규칙**
> 버전: v0.1.0 (MVP) · 작성일: 2026-06-05
> 상위 문서: [PRD.md](./PRD.md) · [TRD.md](./TRD.md)

---

## 목차

1. [ERD](#1-erd)
2. [tickets 테이블 정의](#2-tickets-테이블-정의)
3. [상태 머신 (Status State Machine)](#3-상태-머신)
4. [비즈니스 규칙](#4-비즈니스-규칙)
5. [Position 관리](#5-position-관리)
6. [인덱스](#6-인덱스)
7. [Drizzle 스키마 코드](#7-drizzle-스키마-코드)
8. [TypeScript 타입 정의](#8-typescript-타입-정의)
9. [PRD · TRD 일치 확인](#9-prd--trd-일치-확인)

---

## 1. ERD

MVP는 단일 `tickets` 테이블로 구성된다. 멀티 사용자·컬럼 엔티티는 2차 스펙이므로 포함하지 않는다.

```
┌──────────────────────────────────────────────┐
│                   tickets                    │
├──────────────────┬───────────────────────────┤
│ id               │ SERIAL         PK         │
│ title            │ VARCHAR(200)   NOT NULL   │
│ description      │ TEXT           NULLABLE   │
│ status           │ VARCHAR(20)    NOT NULL   │
│ priority         │ VARCHAR(10)    NOT NULL   │
│ position         │ INTEGER        NOT NULL   │
│ planned_start_date│ DATE          NULLABLE   │
│ due_date         │ DATE           NULLABLE   │
│ started_at       │ TIMESTAMP      NULLABLE   │
│ completed_at     │ TIMESTAMP      NULLABLE   │
│ created_at       │ TIMESTAMP      NOT NULL   │
│ updated_at       │ TIMESTAMP      NOT NULL   │
└──────────────────┴───────────────────────────┘

※ MVP 범위: 단일 테이블, 인증/사용자 테이블 없음
```

---

## 2. tickets 테이블 정의

### 2-1. 컬럼 명세

| 컬럼 | 타입 | 제약 조건 | 기본값 | 설명 |
|------|------|-----------|--------|------|
| `id` | `SERIAL` | PK, AUTO INCREMENT | — | 티켓 고유 식별자 |
| `title` | `VARCHAR(200)` | NOT NULL | — | 티켓 제목 |
| `description` | `TEXT` | NULLABLE | `NULL` | 티켓 상세 설명 |
| `status` | `VARCHAR(20)` | NOT NULL | `'BACKLOG'` | 현재 상태(컬럼) |
| `priority` | `VARCHAR(10)` | NOT NULL | `'MEDIUM'` | 우선순위 |
| `position` | `INTEGER` | NOT NULL | `1` | 컬럼 내 표시 순서 |
| `planned_start_date` | `DATE` | NULLABLE | `NULL` | 시작 예정일 (사용자 입력) |
| `due_date` | `DATE` | NULLABLE | `NULL` | 종료 예정일 (사용자 입력) |
| `started_at` | `TIMESTAMP` | NULLABLE | `NULL` | 실제 시작일 (TODO 이동 시 자동 설정) |
| `completed_at` | `TIMESTAMP` | NULLABLE | `NULL` | 실제 완료일 (Done 이동 시 자동 설정) |
| `created_at` | `TIMESTAMP` | NOT NULL | `NOW()` | 생성 시간 |
| `updated_at` | `TIMESTAMP` | NOT NULL | `NOW()` | 최종 수정 시간 |

> **참고** — `created_at` / `updated_at`의 기본값은 `NOW()`다. `NOT NULL` + `NULL` 기본값은 모순이므로 `NOW()`로 적용한다.

### 2-2. ENUM 값 정의

#### status (VARCHAR(20))

| 값 | 화면 표시 | 설명 |
|----|-----------|------|
| `'BACKLOG'` | Backlog | 기본 상태. 미착수 백로그 티켓 |
| `'TODO'` | TODO | 이번 스프린트에서 처리할 티켓 |
| `'IN_PROGRESS'` | In Progress | 현재 진행 중인 티켓 |
| `'DONE'` | Done | 완료된 티켓 |

#### priority (VARCHAR(10))

| 값 | 화면 표시 | 설명 |
|----|-----------|------|
| `'LOW'` | Low | 낮은 우선순위 |
| `'MEDIUM'` | Medium | 기본 우선순위 |
| `'HIGH'` | High | 높은 우선순위 |

### 2-3. DDL

```sql
CREATE TABLE tickets (
  id                  SERIAL        PRIMARY KEY,
  title               VARCHAR(200)  NOT NULL,
  description         TEXT,
  status              VARCHAR(20)   NOT NULL  DEFAULT 'BACKLOG',
  priority            VARCHAR(10)   NOT NULL  DEFAULT 'MEDIUM',
  position            INTEGER       NOT NULL  DEFAULT 1,
  planned_start_date  DATE,
  due_date            DATE,
  started_at          TIMESTAMP,
  completed_at        TIMESTAMP,
  created_at          TIMESTAMP     NOT NULL  DEFAULT NOW(),
  updated_at          TIMESTAMP     NOT NULL  DEFAULT NOW()
);
```

---

## 3. 상태 머신

티켓의 `status`는 아래 전이 규칙을 따른다. 모든 방향 이동이 허용되며(자유 전이), 특정 전이에 자동 처리 부수 효과가 붙는다.

```
                ┌─────────────────────────────────────────┐
                │              자유 전이 (양방향)          │
                │                                         │
  [신규 생성]   │                                         │
       │        │                                         │
       ▼        ▼                                         │
   ┌────────┐  ──→  ┌───────┐  ──→  ┌─────────────┐  ──→  ┌──────┐
   │BACKLOG │       │ TODO  │       │ IN_PROGRESS │       │ DONE │
   └────────┘  ←──  └───────┘  ←──  └─────────────┘  ←──  └──────┘
                │                                         │
                │  started_at = NOW()                     │  completed_at = NOW()
                │  (BACKLOG→TODO 최초 전이 시)            │  (→DONE 전이 시)
                │                                         │
                │                         completed_at = NULL
                │                         (DONE→다른 컬럼 복귀 시)
                │
                └─────────────────────────────────────────┘
```

### 전이별 자동 처리 규칙

| 전이 방향 | 자동 처리 | 조건 |
|-----------|-----------|------|
| 임의 → `DONE` | `completed_at = NOW()` | 항상 |
| `DONE` → 임의 (복귀) | `completed_at = NULL` | 항상 |
| `BACKLOG` → `TODO` | `started_at = NOW()` | `started_at IS NULL`인 경우만 (최초 1회) |
| 임의 → 임의 (DONE 제외) | `completed_at` 변경 없음 | — |

---

## 4. 비즈니스 규칙

### BR-001: 신규 티켓 생성

```
status   = 'BACKLOG'  -- 기본 상태
position = 1          -- 정렬 첫 번째 (해당 컬럼 최상단)
priority = 'MEDIUM'   -- 기본 우선순위
```

새 티켓은 항상 Backlog 컬럼에 생성되며, `position = 1`로 해당 컬럼의 최상단에 배치된다. 기존 BACKLOG 티켓들의 position은 +1씩 재계산된다.

### BR-002: Done 이동 시 완료 시간 자동 설정

```sql
-- status가 'DONE'으로 변경될 때
UPDATE tickets
SET status       = 'DONE',
    completed_at = NOW(),
    updated_at   = NOW()
WHERE id = :id;
```

### BR-003: Done에서 다른 컬럼 복귀 시 완료 시간 초기화

```sql
-- 'DONE'에서 다른 status로 변경될 때
UPDATE tickets
SET status       = :newStatus,
    completed_at = NULL,
    updated_at   = NOW()
WHERE id = :id AND status = 'DONE';
```

### BR-004: TODO 최초 이동 시 시작 시간 자동 설정

```sql
-- 'BACKLOG'에서 'TODO'로 최초 전이 시 (started_at이 NULL인 경우만)
UPDATE tickets
SET status     = 'TODO',
    started_at = CASE WHEN started_at IS NULL THEN NOW() ELSE started_at END,
    updated_at = NOW()
WHERE id = :id;
```

### BR-005: 일정 초과 판정

```sql
-- 일정 초과 티켓 조회
SELECT *
FROM tickets
WHERE due_date < CURRENT_DATE
  AND status <> 'DONE';
```

- `due_date < 오늘` AND `status ≠ DONE`인 티켓은 **기한 초과(overdue)** 상태다.
- 이 판정은 DB 컬럼이 아닌 **쿼리 시점 계산**으로 처리한다 (별도 컬럼 없음).
- 클라이언트에서도 `isOverdue(ticket)` 유틸 함수로 동일 로직을 적용한다.

### BR-006: 제목 필수 / 길이 제한

```
title: NOT NULL, 최소 1자, 최대 200자 (VARCHAR(200))
description: NULLABLE, 최대 제한 없음 (TEXT)
```

---

## 5. Position 관리

### 5-1. 기본 원칙

`position`은 동일 `status` 컬럼 내 티켓의 표시 순서를 결정하는 정수 값이다. **낮을수록 위**에 표시된다.

```sql
-- 특정 컬럼의 티켓 목록 정렬
SELECT * FROM tickets
WHERE status = 'TODO'
ORDER BY position ASC;
```

### 5-2. 신규 티켓 position 계산

신규 티켓은 `position = 1`로 삽입한 뒤 해당 컬럼의 기존 티켓 position을 일괄 +1 재계산한다.

```sql
-- 1단계: 기존 티켓 position +1 (공간 확보)
UPDATE tickets
SET position   = position + 1,
    updated_at = NOW()
WHERE status = 'BACKLOG'
  AND id <> :newId;

-- 2단계: 신규 티켓 삽입
INSERT INTO tickets (title, description, status, position, ...)
VALUES (:title, :description, 'BACKLOG', 1, ...);
```

### 5-3. 드래그 앤 드롭 후 position 재계산

DnD 이벤트(`onDragEnd`) 완료 후 **드롭 대상 컬럼 전체 티켓의 position을 1부터 순서대로 재계산**한다.

```
DnD 이벤트 발생
    │
    ├─ 클라이언트: 낙관적 업데이트 (즉각 반영)
    │   └─ 배열에서 티켓 순서 재배열
    │
    └─ PATCH /api/tickets/:id/move
        body: { status, position }
            │
            ▼
        ticketService.move()
            │
            ├─ 1. 해당 컬럼의 모든 티켓 조회 (position ASC)
            ├─ 2. 이동한 티켓을 목표 인덱스에 삽입
            └─ 3. 전체 position 1, 2, 3... 재부여 (트랜잭션)
```

**트랜잭션 처리 예시**

```sql
BEGIN;

-- 이동 대상 컬럼의 티켓을 새 순서로 position 재부여
UPDATE tickets SET position = 1, updated_at = NOW() WHERE id = :id_a;
UPDATE tickets SET position = 2, updated_at = NOW() WHERE id = :id_b;
UPDATE tickets SET position = 3, updated_at = NOW() WHERE id = :id_c;
-- (컬럼 내 티켓 수만큼 반복)

COMMIT;
```

> **컬럼 간 이동 시**: 기존 컬럼과 대상 컬럼 양쪽 모두 position을 재계산한다. 단일 트랜잭션으로 처리해 정합성을 보장한다.

### 5-4. position 값 예시

```
BACKLOG 컬럼
  position 1 │ 티켓 A
  position 2 │ 티켓 B
  position 3 │ 티켓 C

→ 티켓 C를 position 1로 이동 (DnD)

재계산 후:
  position 1 │ 티켓 C  ← 이동됨
  position 2 │ 티켓 A
  position 3 │ 티켓 B
```

---

## 6. 인덱스

| 인덱스 이름 | 대상 컬럼 | 타입 | 목적 |
|-------------|-----------|------|------|
| `tickets_pkey` | `id` | PRIMARY KEY | 기본 식별자 조회 |
| `idx_tickets_status_position` | `(status, position)` | COMPOSITE | 컬럼별 티켓 목록 정렬 조회 (FR-002 핵심 쿼리) |
| `idx_tickets_due_date` | `due_date` | BTREE | 일정 초과 판정 쿼리 (BR-005) |
| `idx_tickets_created_at` | `created_at` | BTREE | 생성 순 정렬 지원 |

```sql
CREATE INDEX idx_tickets_status_position ON tickets (status, position ASC);
CREATE INDEX idx_tickets_due_date        ON tickets (due_date)
    WHERE due_date IS NOT NULL;
CREATE INDEX idx_tickets_created_at      ON tickets (created_at DESC);
```

---

## 7. Drizzle 스키마 코드

`src/server/db/schema.ts`에 작성한다.

```typescript
import { pgTable, serial, varchar, text, integer, date, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { TICKET_STATUS, TICKET_PRIORITY } from '@/shared/constants/columns';

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),

  title:       varchar('title', { length: 200 }).notNull(),
  description: text('description'),

  status:   varchar('status',   { length: 20  }).notNull().default(TICKET_STATUS.BACKLOG),
  priority: varchar('priority', { length: 10  }).notNull().default(TICKET_PRIORITY.MEDIUM),
  position: integer('position').notNull().default(1),

  plannedStartDate: date('planned_start_date'),
  dueDate:          date('due_date'),

  startedAt:   timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  createdAt: timestamp('created_at').notNull().default(sql`NOW()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`NOW()`),
});

export type TicketSelect = typeof tickets.$inferSelect;
export type TicketInsert = typeof tickets.$inferInsert;
```

---

## 8. TypeScript 타입 정의

`src/shared/types/ticket.ts`에 작성한다.

```typescript
import { TICKET_STATUS, TICKET_PRIORITY } from '@/shared/constants/columns';

// 상수 타입 (enum 대신 const 객체 사용 — CLAUDE.md 컨벤션)
export type TicketStatus   = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];
export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY];

// DB 레코드와 1:1 대응
export interface Ticket {
  id:               number;
  title:            string;
  description:      string | null;
  status:           TicketStatus;
  priority:         TicketPriority;
  position:         number;
  plannedStartDate: string | null;   // DATE → 'YYYY-MM-DD'
  dueDate:          string | null;   // DATE → 'YYYY-MM-DD'
  startedAt:        string | null;   // TIMESTAMP → ISO 8601
  completedAt:      string | null;   // TIMESTAMP → ISO 8601
  createdAt:        string;
  updatedAt:        string;
}

// POST /api/tickets 요청 바디
export interface CreateTicketInput {
  title:            string;
  description?:     string;
  priority?:        TicketPriority;
  plannedStartDate?: string;
  dueDate?:         string;
}

// PATCH /api/tickets/:id 요청 바디
export interface UpdateTicketInput {
  title?:            string;
  description?:      string;
  priority?:         TicketPriority;
  plannedStartDate?: string | null;
  dueDate?:          string | null;
  startedAt?:        string | null;
  completedAt?:      string | null;
}

// PATCH /api/tickets/:id/move 요청 바디 (DnD 전용)
export interface MoveTicketInput {
  status:   TicketStatus;
  position: number;
}

// 클라이언트 파생 속성 포함 (UI 전용)
export interface TicketWithMeta extends Ticket {
  isOverdue: boolean;  // due_date < today AND status !== 'DONE'
}
```

`src/shared/constants/columns.ts`에 작성한다.

```typescript
export const TICKET_STATUS = {
  BACKLOG:     'BACKLOG',
  TODO:        'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE:        'DONE',
} as const;

export const TICKET_PRIORITY = {
  LOW:    'LOW',
  MEDIUM: 'MEDIUM',
  HIGH:   'HIGH',
} as const;

// 보드 컬럼 순서 (고정 — MVP)
export const COLUMN_ORDER = [
  TICKET_STATUS.BACKLOG,
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.DONE,
] as const;
```

---

## 9. PRD · TRD 일치 확인

### 9-1. PRD 기능 목록 대응

| PRD FR | 기능 | DATA_MODEL 대응 |
|--------|------|-----------------|
| FR-001 | 티켓 생성 | `INSERT`, `status='BACKLOG'`, `position=1` (BR-001) |
| FR-002 | 티켓 목록 조회 | `SELECT … ORDER BY status, position` + `idx_tickets_status_position` |
| FR-003 | 티켓 상세 조회 | `SELECT … WHERE id = :id` |
| FR-004 | 티켓 수정 | `UPDATE tickets SET … updated_at=NOW()` |
| FR-005 | 티켓 삭제 | `DELETE FROM tickets WHERE id = :id` (영구 삭제, soft delete 없음) |
| FR-006 | DnD 상태 전환 | `MoveTicketInput`, BR-002/003/004, position 재계산 (§5-3) |
| FR-007 | 컬럼 내 순서 변경 | 동일 컬럼 DnD → position 재계산 (§5-3) |
| FR-008 | 날짜 관리 | `planned_start_date`, `due_date`, `completed_at` 독립 수정 |

### 9-2. PRD 필드명 매핑

PRD는 사용자 친화적 명칭을 사용했다. DB 컬럼명과의 매핑은 다음과 같다.

| PRD 명칭 | DB 컬럼 | TypeScript 필드 | 비고 |
|----------|---------|-----------------|------|
| 계획 시작일 | `planned_start_date` | `plannedStartDate` | DATE |
| 계획 종료일 | `due_date` | `dueDate` | DATE, PRD에서 plannedEndDate로 표현 |
| 실제 종료일 | `completed_at` | `completedAt` | TIMESTAMP (PRD에서 actualEndDate로 표현) |
| (신규) 실제 시작일 | `started_at` | `startedAt` | TIMESTAMP, TODO 이동 시 자동 설정 |
| (신규) 우선순위 | `priority` | `priority` | MVP 스펙 추가 |

### 9-3. TRD 기술 스택 일치

| TRD 항목 | DATA_MODEL 반영 |
|----------|-----------------|
| Drizzle ORM 0.38.x | §7 Drizzle 스키마 코드 (`pgTable`, `$inferSelect`) |
| PostgreSQL 16 | §2-3 DDL, §6 인덱스 (PostgreSQL 문법) |
| Zod 3.x | Zod 스키마는 `src/shared/validations/ticket.ts`에 별도 작성 (API_SPEC 참조) |
| TypeScript strict | `enum` 금지, `const 객체 + 타입 추론` 패턴 (§8) |

---

*이 문서는 `src/server/db/schema.ts`, `src/shared/types/ticket.ts`, `src/shared/constants/columns.ts`의 구현 기준이다. 스키마 변경 시 반드시 이 문서를 먼저 수정한 후 Drizzle 마이그레이션을 생성한다.*
