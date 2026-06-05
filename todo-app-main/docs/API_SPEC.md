# API_SPEC — Tika

> **REST API 엔드포인트 명세**
> 버전: v0.1.0 (MVP) · 작성일: 2026-06-05
> 상위 문서: [PRD.md](./PRD.md) · [TRD.md](./TRD.md) · [DATA_MODEL.md](./DATA_MODEL.md)

---

## 목차

1. [공통 규칙](#1-공통-규칙)
2. [엔드포인트 목록](#2-엔드포인트-목록)
3. [GET /api/tickets](#3-get-apitickets)
4. [POST /api/tickets](#4-post-apitickets)
5. [GET /api/tickets/:id](#5-get-apiticketsid)
6. [PATCH /api/tickets/:id](#6-patch-apiticketsid)
7. [DELETE /api/tickets/:id](#7-delete-apiticketsid)
8. [PATCH /api/tickets/:id/move](#8-patch-apiticketsidmove)
9. [Zod 검증 스키마](#9-zod-검증-스키마)
10. [FR 대응표](#10-fr-대응표)

---

## 1. 공통 규칙

### 1-1. Base URL

```
로컬:      http://localhost:3000/api
프로덕션:  https://tika.vercel.app/api
```

### 1-2. 요청 헤더

| 헤더 | 값 | 필수 여부 |
|------|----|-----------|
| `Content-Type` | `application/json` | POST / PATCH 요청 시 필수 |

인증 헤더 없음 — MVP는 단일 사용자, 인증 미적용.

### 1-3. 응답 형식

**성공 응답** — 데이터를 직접 반환한다 (`data` 래퍼 없음).

```json
// 단건 조회 / 생성 / 수정
{ "id": 1, "title": "...", ... }

// 목록 조회
[{ "id": 1, ... }, { "id": 2, ... }]

// 삭제 (본문 없음)
HTTP 204 No Content
```

**에러 응답** — 모든 에러는 아래 형식을 준수한다.

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "티켓을 찾을 수 없습니다"
  }
}
```

### 1-4. HTTP 상태 코드 규칙

| 상태 코드 | 의미 | 사용 시점 |
|-----------|------|-----------|
| `200` | OK | 조회(GET) / 수정(PATCH) 성공 |
| `201` | Created | 생성(POST) 성공 |
| `204` | No Content | 삭제(DELETE) 성공 — 응답 본문 없음 |
| `400` | Bad Request | 검증 실패 (필드 누락·형식 오류·값 범위 초과 등) |
| `404` | Not Found | 리소스(티켓) 없음 |
| `500` | Internal Server Error | 서버·DB 오류 |

### 1-5. 공통 에러 코드

| HTTP 상태 | `error.code` | 발생 상황 |
|-----------|--------------|-----------|
| `400` | `VALIDATION_ERROR` | Zod 검증 실패 (필수 필드 누락, 타입 불일치, 길이 초과 등) |
| `404` | `TICKET_NOT_FOUND` | 존재하지 않는 티켓 ID |
| `500` | `INTERNAL_ERROR` | 예상치 못한 서버 오류 |

### 1-6. 검증 에러 메시지 정의

400 응답 시 `error.message`에 사용하는 한국어 메시지를 아래와 같이 고정한다. Zod 스키마(§9)와 동일한 메시지를 사용한다.

| 조건 | `error.message` |
|------|-----------------|
| `title` 누락 (빈 문자열·필드 없음) | `"제목을 입력해주세요"` |
| `title` 200자 초과 | `"제목은 200자 이내로 입력해주세요."` |
| `dueDate`가 오늘 이전 날짜 | `"종료예정일은 오늘 이후여야합니다."` |
| `priority`가 유효하지 않은 값 | `"우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다."` |

> **참고** — 에러 응답 구조는 항상 동일하다.
> ```json
> {
>   "error": {
>     "code": "VALIDATION_ERROR",
>     "message": "제목을 입력해주세요"
>   }
> }
> ```

### 1-7. 날짜 형식

| 타입 | 형식 | 예시 |
|------|------|------|
| `DATE` (planned_start_date, due_date) | `YYYY-MM-DD` | `"2026-06-15"` |
| `TIMESTAMP` (started_at, completed_at, created_at, updated_at) | ISO 8601 UTC | `"2026-06-05T09:00:00.000Z"` |

### 1-8. Ticket 공통 응답 스키마

모든 엔드포인트에서 티켓 1건을 반환할 때 아래 구조를 사용한다.

```typescript
interface TicketResponse {
  id:               number;           // SERIAL PK
  title:            string;           // 1–200자
  description:      string | null;
  status:           'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority:         'LOW' | 'MEDIUM' | 'HIGH';
  position:         number;
  plannedStartDate: string | null;    // 'YYYY-MM-DD'
  dueDate:          string | null;    // 'YYYY-MM-DD'
  startedAt:        string | null;    // ISO 8601
  completedAt:      string | null;    // ISO 8601
  createdAt:        string;           // ISO 8601
  updatedAt:        string;           // ISO 8601
}
```

---

## 2. 엔드포인트 목록

| # | Method | URL | 기능 | FR |
|---|--------|-----|------|----|
| 1 | `GET` | `/api/tickets` | 전체 티켓 목록 조회 | FR-002 |
| 2 | `POST` | `/api/tickets` | 티켓 생성 | FR-001 |
| 3 | `GET` | `/api/tickets/:id` | 티켓 단건 조회 | FR-003 |
| 4 | `PATCH` | `/api/tickets/:id` | 티켓 수정 (내용·날짜) | FR-004 |
| 5 | `DELETE` | `/api/tickets/:id` | 티켓 영구 삭제 | FR-005 |
| 6 | `PATCH` | `/api/tickets/:id/move` | 상태/순서 변경 (DnD) | FR-006, FR-007 |

---

## 3. GET /api/tickets

전체 티켓 목록을 조회한다. 결과는 `status` 기준 고정 순서(BACKLOG→TODO→IN_PROGRESS→DONE), 동일 status 내에서는 `position ASC`으로 정렬된다.

### 요청

```
GET /api/tickets
```

**쿼리 파라미터 (선택)**

| 파라미터 | 타입 | 설명 | 예시 |
|----------|------|------|------|
| `status` | `string` | 특정 컬럼의 티켓만 필터링 | `?status=TODO` |

### 응답

**200 OK**

```json
[
  {
    "id": 3,
    "title": "API 설계 완료",
    "description": "REST API 엔드포인트 정의",
    "status": "TODO",
    "priority": "HIGH",
    "position": 1,
    "plannedStartDate": "2026-06-05",
    "dueDate": "2026-06-10",
    "startedAt": null,
    "completedAt": null,
    "createdAt": "2026-06-05T09:00:00.000Z",
    "updatedAt": "2026-06-05T09:00:00.000Z"
  },
  {
    "id": 1,
    "title": "백로그 티켓",
    "description": null,
    "status": "BACKLOG",
    "priority": "MEDIUM",
    "position": 1,
    "plannedStartDate": null,
    "dueDate": null,
    "startedAt": null,
    "completedAt": null,
    "createdAt": "2026-06-04T08:00:00.000Z",
    "updatedAt": "2026-06-04T08:00:00.000Z"
  }
]
```

**빈 목록**

```json
[]
```

**에러 응답**

| 상태 | code | 발생 조건 |
|------|------|-----------|
| `400` | `VALIDATION_ERROR` | `status` 파라미터가 유효하지 않은 값일 때 |
| `500` | `INTERNAL_ERROR` | DB 연결 실패 등 |

---

## 4. POST /api/tickets

새 티켓을 생성한다.

- `status`는 항상 `'BACKLOG'`로 고정된다 (클라이언트에서 지정 불가).
- `position`은 BACKLOG 컬럼 최상단(`1`)으로 삽입되며, 기존 BACKLOG 티켓들의 position은 자동으로 +1 재계산된다. (DATA_MODEL BR-001)

### 요청

```
POST /api/tickets
Content-Type: application/json
```

**요청 바디**

| 필드 | 타입 | 필수 | 제약 | 기본값 |
|------|------|------|------|--------|
| `title` | `string` | 필수 | 1–200자 | — |
| `description` | `string` | 선택 | 최대 1000자 | `null` |
| `priority` | `'LOW' \| 'MEDIUM' \| 'HIGH'` | 선택 | LOW / MEDIUM / HIGH | `'MEDIUM'` |
| `plannedStartDate` | `string` | 선택 | `'YYYY-MM-DD'` | `null` |
| `dueDate` | `string` | 선택 | `'YYYY-MM-DD'` | `null` |

```json
{
  "title": "API 설계 완료",
  "description": "REST API 엔드포인트 정의 및 문서화",
  "priority": "HIGH",
  "plannedStartDate": "2026-06-05",
  "dueDate": "2026-06-10"
}
```

### 응답

**201 Created**

```json
{
  "id": 7,
  "title": "API 설계 완료",
  "description": "REST API 엔드포인트 정의 및 문서화",
  "status": "BACKLOG",
  "priority": "HIGH",
  "position": 1,
  "plannedStartDate": "2026-06-05",
  "dueDate": "2026-06-10",
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2026-06-05T10:30:00.000Z",
  "updatedAt": "2026-06-05T10:30:00.000Z"
}
```

**에러 응답**

| 상태 | code | 발생 조건 |
|------|------|-----------|
| `400` | `VALIDATION_ERROR` | `title` 누락, 200자 초과, `priority` 유효하지 않은 값, 날짜 형식 오류 |
| `500` | `INTERNAL_ERROR` | DB 오류 |

**검증 에러 예시**

```json
// title 누락: POST body: {}
HTTP 400
{
  "error": { "code": "VALIDATION_ERROR", "message": "제목을 입력해주세요" }
}

// title 200자 초과: POST body: { "title": "가".repeat(201) }
HTTP 400
{
  "error": { "code": "VALIDATION_ERROR", "message": "제목은 200자 이내로 입력해주세요." }
}

// 과거 종료예정일: POST body: { "title": "테스트", "dueDate": "2020-01-01" }
HTTP 400
{
  "error": { "code": "VALIDATION_ERROR", "message": "종료예정일은 오늘 이후여야합니다." }
}

// 잘못된 priority: POST body: { "title": "테스트", "priority": "URGENT" }
HTTP 400
{
  "error": { "code": "VALIDATION_ERROR", "message": "우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다." }
}
```

---

## 5. GET /api/tickets/:id

특정 티켓 1건의 상세 정보를 조회한다.

### 요청

```
GET /api/tickets/:id
```

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | `number` | 티켓 ID (양의 정수) |

### 응답

**200 OK**

```json
{
  "id": 7,
  "title": "API 설계 완료",
  "description": "REST API 엔드포인트 정의 및 문서화",
  "status": "TODO",
  "priority": "HIGH",
  "position": 2,
  "plannedStartDate": "2026-06-05",
  "dueDate": "2026-06-10",
  "startedAt": "2026-06-05T10:35:00.000Z",
  "completedAt": null,
  "createdAt": "2026-06-05T10:30:00.000Z",
  "updatedAt": "2026-06-05T10:35:00.000Z"
}
```

**에러 응답**

| 상태 | code | 발생 조건 |
|------|------|-----------|
| `400` | `VALIDATION_ERROR` | `:id`가 정수가 아닌 경우 |
| `404` | `TICKET_NOT_FOUND` | 해당 ID의 티켓이 존재하지 않는 경우 |
| `500` | `INTERNAL_ERROR` | DB 오류 |

---

## 6. PATCH /api/tickets/:id

티켓의 **내용(제목·설명·우선순위·날짜)**을 수정한다.

- 상태(`status`) 변경은 이 엔드포인트에서 처리하지 않는다 → [`PATCH /api/tickets/:id/move`](#8-patch-apiticketsidmove) 사용.
- 전달된 필드만 업데이트하며, 누락된 필드는 기존 값을 유지한다 (Partial update).
- `updated_at`은 항상 `NOW()`로 갱신된다.

### 요청

```
PATCH /api/tickets/:id
Content-Type: application/json
```

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | `number` | 티켓 ID (양의 정수) |

**요청 바디 (모든 필드 선택)**

| 필드 | 타입 | 제약 |
|------|------|------|
| `title` | `string` | 1–200자 |
| `description` | `string \| null` | 제한 없음, `null`로 전달 시 초기화 |
| `priority` | `'LOW' \| 'MEDIUM' \| 'HIGH'` | — |
| `plannedStartDate` | `string \| null` | `'YYYY-MM-DD'`, `null`로 전달 시 초기화 |
| `dueDate` | `string \| null` | `'YYYY-MM-DD'`, `null`로 전달 시 초기화 |
| `startedAt` | `string \| null` | ISO 8601, 수동 수정 허용 |
| `completedAt` | `string \| null` | ISO 8601, 수동 수정 허용 |

```json
{
  "title": "API 설계 완료 (수정)",
  "dueDate": "2026-06-12",
  "priority": "MEDIUM"
}
```

### 응답

**200 OK** — 수정된 티켓 전체 반환

```json
{
  "id": 7,
  "title": "API 설계 완료 (수정)",
  "description": "REST API 엔드포인트 정의 및 문서화",
  "status": "TODO",
  "priority": "MEDIUM",
  "position": 2,
  "plannedStartDate": "2026-06-05",
  "dueDate": "2026-06-12",
  "startedAt": "2026-06-05T10:35:00.000Z",
  "completedAt": null,
  "createdAt": "2026-06-05T10:30:00.000Z",
  "updatedAt": "2026-06-05T11:00:00.000Z"
}
```

**에러 응답**

| 상태 | code | 발생 조건 |
|------|------|-----------|
| `400` | `VALIDATION_ERROR` | `title` 빈 문자열·200자 초과, 날짜 형식 오류, 유효하지 않은 필드 값 |
| `404` | `TICKET_NOT_FOUND` | 해당 ID의 티켓이 존재하지 않는 경우 |
| `500` | `INTERNAL_ERROR` | DB 오류 |

---

## 7. DELETE /api/tickets/:id

티켓을 **영구 삭제**한다. Soft delete 없이 즉시 DB에서 제거된다. (DATA_MODEL §4 FR-005)

### 요청

```
DELETE /api/tickets/:id
```

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | `number` | 티켓 ID (양의 정수) |

### 응답

**204 No Content** — 응답 본문 없음

**에러 응답**

| 상태 | code | 발생 조건 |
|------|------|-----------|
| `400` | `VALIDATION_ERROR` | `:id`가 정수가 아닌 경우 |
| `404` | `TICKET_NOT_FOUND` | 해당 ID의 티켓이 존재하지 않는 경우 |
| `500` | `INTERNAL_ERROR` | DB 오류 |

---

## 8. PATCH /api/tickets/:id/move

드래그 앤 드롭으로 티켓의 **상태(컬럼)와 순서(position)를 변경**한다. 이 엔드포인트는 아래 비즈니스 규칙을 자동으로 처리한다:

| 전이 | 자동 처리 | 규칙 |
|------|-----------|------|
| 임의 → `DONE` | `completedAt = NOW()` | BR-002 |
| `DONE` → 임의 | `completedAt = null` | BR-003 |
| `BACKLOG` → `TODO` (최초) | `startedAt = NOW()` | BR-004 |
| 모든 이동 | 이동 대상 컬럼 전체 position 재계산 | DATA_MODEL §5-3 |

### 요청

```
PATCH /api/tickets/:id/move
Content-Type: application/json
```

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | `number` | 이동할 티켓 ID (양의 정수) |

**요청 바디**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `status` | `'BACKLOG' \| 'TODO' \| 'IN_PROGRESS' \| 'DONE'` | 필수 | 이동할 컬럼 |
| `position` | `number` | 필수 | 이동 후 목표 순서 (1-based, 양의 정수) |

```json
{
  "status": "IN_PROGRESS",
  "position": 1
}
```

### 응답

**200 OK** — 이동 후 최신 상태의 티켓 반환

```json
{
  "id": 7,
  "title": "API 설계 완료 (수정)",
  "description": "REST API 엔드포인트 정의 및 문서화",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "position": 1,
  "plannedStartDate": "2026-06-05",
  "dueDate": "2026-06-12",
  "startedAt": "2026-06-05T10:35:00.000Z",
  "completedAt": null,
  "createdAt": "2026-06-05T10:30:00.000Z",
  "updatedAt": "2026-06-05T12:00:00.000Z"
}
```

**Done 이동 시 응답 예시**

```json
{
  "id": 7,
  "status": "DONE",
  "position": 1,
  "completedAt": "2026-06-05T14:00:00.000Z",
  "updatedAt": "2026-06-05T14:00:00.000Z"
}
```

**에러 응답**

| 상태 | code | 발생 조건 |
|------|------|-----------|
| `400` | `VALIDATION_ERROR` | `status`가 유효하지 않은 값, `position`이 정수가 아니거나 1 미만 |
| `404` | `TICKET_NOT_FOUND` | 해당 ID의 티켓이 존재하지 않는 경우 |
| `500` | `INTERNAL_ERROR` | position 재계산 트랜잭션 실패 등 |

### 낙관적 업데이트 처리 흐름

```
클라이언트 onDragEnd 발생
    │
    ├─ 1. 클라이언트 상태 즉시 업데이트 (낙관적)
    │      → 보드 UI 즉각 반영
    │
    └─ 2. PATCH /api/tickets/:id/move 호출
           ├─ 성공: 서버 응답값으로 클라이언트 상태 교체 (position 확정)
           └─ 실패: 클라이언트 상태 롤백 + 에러 토스트 표시
```

---

## 9. Zod 검증 스키마

`src/shared/validations/ticket.ts`에 작성한다. 프런트엔드와 백엔드가 동일 스키마를 공유한다.

```typescript
import { z } from 'zod';
import { TICKET_STATUS, TICKET_PRIORITY } from '@/shared/constants/columns';

// 날짜 문자열 검증 (YYYY-MM-DD 형식만 허용)
const dateStringBase = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '날짜 형식은 YYYY-MM-DD이어야 합니다' });

// 오늘 이후 날짜 검증 (dueDate 전용)
const futureDateString = dateStringBase
  .refine(
    (val) => val === null || val === undefined || new Date(val) >= new Date(new Date().toISOString().slice(0, 10)),
    { message: '종료예정일은 오늘 이후여야합니다.' }
  )
  .nullable()
  .optional();

const dateString = dateStringBase.nullable().optional();

// priority enum — 잘못된 값은 고정 메시지 반환
const priorityEnum = z
  .enum([TICKET_PRIORITY.LOW, TICKET_PRIORITY.MEDIUM, TICKET_PRIORITY.HIGH], {
    errorMap: () => ({ message: '우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다.' }),
  })
  .optional();

// POST /api/tickets
export const createTicketSchema = z.object({
  title: z
    .string({ required_error: '제목을 입력해주세요' })
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요.'),
  description:      z.string().max(1000, '설명은 1000자 이내로 입력해주세요.').optional(),
  priority:         priorityEnum,
  plannedStartDate: dateString,
  dueDate:          futureDateString,
});

// PATCH /api/tickets/:id
export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요.')
    .optional(),
  description:      z.string().max(1000, '설명은 1000자 이내로 입력해주세요.').nullable().optional(),
  priority:         priorityEnum,
  plannedStartDate: dateString,
  dueDate:          futureDateString,
  startedAt:        z.string().datetime().nullable().optional(),
  completedAt:      z.string().datetime().nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: '수정할 필드를 최소 1개 이상 전달해야 합니다' }
);

// PATCH /api/tickets/:id/move
export const moveTicketSchema = z.object({
  status: z.enum(
    [TICKET_STATUS.BACKLOG, TICKET_STATUS.TODO, TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.DONE],
    { errorMap: () => ({ message: '유효하지 않은 상태값입니다.' }) }
  ),
  position: z
    .number({ required_error: 'position은 필수입니다' })
    .int('position은 정수여야 합니다')
    .min(1, 'position은 1 이상이어야 합니다'),
});

// 경로 파라미터 :id
export const ticketIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// 쿼리 파라미터 (GET /api/tickets)
export const ticketListQuerySchema = z.object({
  status: z
    .enum(
      [TICKET_STATUS.BACKLOG, TICKET_STATUS.TODO, TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.DONE],
      { errorMap: () => ({ message: '유효하지 않은 상태값입니다.' }) }
    )
    .optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type MoveTicketInput   = z.infer<typeof moveTicketSchema>;
```

---

## 10. FR 대응표

| FR | 기능 | 엔드포인트 | HTTP 메서드 |
|----|------|------------|-------------|
| FR-001 | 티켓 생성 | `/api/tickets` | `POST` |
| FR-002 | 티켓 목록 조회 | `/api/tickets` | `GET` |
| FR-003 | 티켓 상세 조회 | `/api/tickets/:id` | `GET` |
| FR-004 | 티켓 수정 | `/api/tickets/:id` | `PATCH` |
| FR-005 | 티켓 삭제 | `/api/tickets/:id` | `DELETE` |
| FR-006 | DnD 상태 전환 | `/api/tickets/:id/move` | `PATCH` |
| FR-007 | 컬럼 내 순서 변경 | `/api/tickets/:id/move` | `PATCH` |
| FR-008 | 날짜 관리 | `/api/tickets/:id` | `PATCH` |

> FR-006과 FR-007은 동일 엔드포인트(`/move`)에서 처리된다. `status`가 변경되면 컬럼 간 이동(FR-006), 동일하면 순서 변경(FR-007)이다.

---

*이 문서는 `app/api/tickets/route.ts`, `app/api/tickets/[id]/route.ts`, `app/api/tickets/[id]/move/route.ts`의 구현 기준이다.*
*검증 스키마(§9)는 `src/shared/validations/ticket.ts`에 구현하고, Route Handler와 클라이언트 폼에서 동일하게 재사용한다.*
