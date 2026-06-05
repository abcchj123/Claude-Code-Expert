# CONSTITUTION — Tika

> **개발 원칙 헌법 (Constitution)**
> 버전: v0.1.0 · 작성일: 2026-06-06
> 상위 문서: [PRD.md](./PRD.md) · [TRD.md](./TRD.md) · [API_SPEC.md](./API_SPEC.md)

이 문서는 Tika 코드베이스의 **절대 원칙**이다.
모든 구현·리뷰·리팩토링은 아래 원칙을 기준으로 판단한다.
원칙과 충돌하는 코드는 병합하지 않는다.

---

## 원칙 목록

| ID | 원칙 | 위반 시 결과 |
|----|------|-------------|
| C-001 | TypeScript strict 모드 필수 | 빌드 거부 |
| C-002 | API 응답은 API_SPEC.md 형식 정확히 준수 | 테스트 실패 |
| C-003 | 에러 응답은 `{ error: { code, message } }` 형식 통일 | 테스트 실패 |
| C-004 | 모든 요청은 Zod로 검증 | 코드 리뷰 거부 |
| C-005 | 비즈니스 로직은 `src/server/services/`에만 작성 | 코드 리뷰 거부 |

---

## C-001 · TypeScript strict 모드 필수

### 규칙

`tsconfig.json`의 `"strict": true`를 항상 유지한다.
`any` 타입, 타입 단언(`as any`, `as unknown`), `@ts-ignore`는 원칙적으로 금지한다.

### 세부 설정 (tsconfig.json 기준)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 허용 패턴

```typescript
// ✅ const 객체 + keyof 타입 추론
export const TICKET_STATUS = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;
export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

// ✅ Drizzle $inferSelect — 스키마 변경 시 타입 자동 동기화
export type TicketSelect = typeof tickets.$inferSelect;
export type TicketInsert = typeof tickets.$inferInsert;

// ✅ Zod infer — 스키마와 타입을 한 곳에서 관리
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
```

### 금지 패턴

```typescript
// ❌
let data: any;
const result = value as any;
// @ts-ignore
const ticket = obj as Ticket;
enum Status { BACKLOG, TODO }    // enum 금지 → const 객체 사용
interface ITicket { ... }        // I 접두사 금지
```

### 검증 명령어

```bash
npx tsc --noEmit   # 에러 0개 유지
```

---

## C-002 · API 응답은 API_SPEC.md 형식 정확히 준수

### 규칙

모든 API 엔드포인트의 응답 구조·필드명·타입·HTTP 상태코드는
[docs/API_SPEC.md](./API_SPEC.md)를 단일 소스로 삼는다.
명세와 다른 응답을 반환하면 안 된다.

### HTTP 상태코드 규칙

| 상황 | 상태코드 |
|------|---------|
| GET · PATCH 성공 | `200` |
| POST 성공 (생성) | `201` |
| DELETE 성공 | `204` (본문 없음) |
| 검증 실패 | `400` |
| 리소스 없음 | `404` |
| 서버 오류 | `500` |

### 응답 형식

```typescript
// ✅ 단건 반환 (data 래퍼 없음)
return Response.json(ticket, { status: 200 });

// ✅ 목록 반환 (배열 직접 반환)
return Response.json(tickets, { status: 200 });

// ✅ 삭제 성공 (본문 없음)
return new Response(null, { status: 204 });

// ❌ data 래퍼 사용 금지
return Response.json({ data: ticket }, { status: 200 });

// ❌ 상태코드 누락
return Response.json(ticket);
```

### Ticket 공통 응답 필드

API_SPEC.md §1-8의 `TicketResponse` 인터페이스를 따른다.
필드 추가·제거·이름 변경은 API_SPEC.md를 먼저 수정하고 구현한다.

---

## C-003 · 에러 응답은 `{ error: { code, message } }` 형식 통일

### 규칙

모든 에러 응답은 단일 형식을 사용한다. 예외 없음.

### 표준 에러 형식

```typescript
interface ErrorResponse {
  error: {
    code: string;    // 대문자_스네이크_케이스 (머신 리더블)
    message: string; // 한국어 (사람 리더블)
  };
}
```

### 에러 코드 목록

| HTTP | `error.code` | 발생 상황 |
|------|--------------|-----------|
| 400 | `VALIDATION_ERROR` | Zod 검증 실패 |
| 404 | `TICKET_NOT_FOUND` | 존재하지 않는 티켓 ID |
| 500 | `INTERNAL_ERROR` | 예상치 못한 서버 오류 |

### 검증 에러 메시지 (API_SPEC.md §1-6 기준, 한국어 고정)

| 조건 | `error.message` |
|------|-----------------|
| `title` 누락·빈 문자열 | `"제목을 입력해주세요"` |
| `title` 200자 초과 | `"제목은 200자 이내로 입력해주세요."` |
| `dueDate` 오늘 이전 | `"종료예정일은 오늘 이후여야합니다."` |
| `priority` 잘못된 값 | `"우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다."` |

### 허용 패턴

```typescript
// ✅
return Response.json(
  { error: { code: 'VALIDATION_ERROR', message: '제목을 입력해주세요' } },
  { status: 400 }
);

return Response.json(
  { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
  { status: 404 }
);
```

### 금지 패턴

```typescript
// ❌ 형식 불일치
return Response.json({ message: 'Not found' }, { status: 404 });
return Response.json({ error: 'Not found' }, { status: 404 });
return Response.json('error', { status: 400 });
```

---

## C-004 · 모든 요청은 Zod로 검증

### 규칙

Route Handler가 외부로부터 받는 모든 입력(body, query params, path params)은
Zod 스키마로 검증한 후 사용한다.
검증 없이 `request.json()` 결과를 직접 사용하면 안 된다.

### 스키마 위치

```
src/shared/validations/ticket.ts   # 모든 티켓 관련 Zod 스키마
```

프런트엔드 폼 검증과 백엔드 Route Handler 검증이 동일한 스키마를 재사용한다.

### 허용 패턴

```typescript
// ✅ safeParse로 검증 후 사용
export async function POST(request: Request) {
  const body = await request.json();
  const result = createTicketSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message } },
      { status: 400 }
    );
  }
  // result.data는 타입 안전 — 이후 로직에서 안심하고 사용
  const ticket = await ticketService.create(result.data);
  return Response.json(ticket, { status: 201 });
}

// ✅ query params 검증
const result = getTicketsSchema.safeParse({ status: searchParams.get('status') });
```

### 금지 패턴

```typescript
// ❌ 검증 없이 직접 사용
const body = await request.json();
const ticket = await ticketService.create(body);  // body 타입 unknown

// ❌ parse() 사용 (예외 던짐 — 표준 에러 형식 깨짐)
const data = createTicketSchema.parse(body);

// ❌ 타입 단언으로 검증 우회
const data = body as CreateTicketInput;
```

### Zod 스키마 컨벤션

```typescript
// ✅ errorMap으로 한국어 메시지 고정
export const createTicketSchema = z.object({
  title: z
    .string({ required_error: '제목을 입력해주세요' })
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요.'),
  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH'], {
      errorMap: () => ({ message: '우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다.' }),
    })
    .optional(),
});

// ✅ infer로 타입 자동 생성
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
```

---

## C-005 · 비즈니스 로직은 `src/server/services/`에만 작성

### 규칙

비즈니스 로직(position 계산, 날짜 자동 설정, 상태 전환 규칙, 트랜잭션)은
`src/server/services/ticketService.ts`에만 작성한다.
Route Handler, 컴포넌트, 훅에 비즈니스 로직을 작성하면 안 된다.

### 계층별 책임

| 계층 | 책임 | 금지 |
|------|------|------|
| Route Handler (`app/api/`) | 요청 파싱, Zod 검증, 서비스 호출, 응답 반환 | DB 직접 접근, 비즈니스 로직 |
| Service (`src/server/services/`) | 비즈니스 로직, 트랜잭션, position 계산 | HTTP 응답 생성, `Response` 객체 |
| DB (`src/server/db/`) | Drizzle 인스턴스, 스키마 정의 | 비즈니스 로직 |
| Client (`src/client/`) | UI 렌더링, 사용자 인터랙션 | `src/server/` 직접 import |

### 허용 패턴

```typescript
// ✅ ticketService — 비즈니스 로직 전담
export const ticketService = {
  async create(input: CreateTicketInput): Promise<TicketSelect> {
    return db.transaction(async (tx) => {
      // BR-001: 기존 BACKLOG position + 1 재계산
      await tx
        .update(tickets)
        .set({ position: sql`${tickets.position} + 1` })
        .where(eq(tickets.status, TICKET_STATUS.BACKLOG));

      const [ticket] = await tx
        .insert(tickets)
        .values({ ...input, status: TICKET_STATUS.BACKLOG, position: 1 })
        .returning();
      return ticket!;
    });
  },
};

// ✅ Route Handler — 얇게(thin)
export async function POST(request: Request) {
  const body = await request.json();
  const result = createTicketSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message } },
      { status: 400 }
    );
  }
  const ticket = await ticketService.create(result.data);  // 서비스에 위임
  return Response.json(ticket, { status: 201 });
}
```

### 금지 패턴

```typescript
// ❌ Route Handler에 비즈니스 로직
export async function POST(request: Request) {
  const body = await request.json();
  // position 계산 — Route Handler에 있으면 안 됨
  const count = await db.select({ count: sql`COUNT(*)` }).from(tickets);
  const position = Number(count[0]?.count ?? 0) + 1;
  const ticket = await db.insert(tickets).values({ ...body, position }).returning();
  return Response.json(ticket[0], { status: 201 });
}

// ❌ 클라이언트에서 서버 모듈 import
import { ticketService } from '@/server/services/ticketService';  // Client Component에서 금지
import { db } from '@/server/db';                                 // Client Component에서 금지
```

---

## 원칙 준수 체크리스트

구현 완료 후 아래를 확인한다.

```bash
# C-001: TypeScript strict
npx tsc --noEmit

# C-002 ~ C-005: 테스트
npm run test           # Jest 전체
npm run test:vitest    # Vitest 전체

# 빌드 성공 확인
npm run build
```

| 체크 | 항목 |
|------|------|
| ☐ | `tsc --noEmit` 에러 0개 |
| ☐ | 전체 테스트 통과 |
| ☐ | `any` 타입 없음 |
| ☐ | 에러 응답이 `{ error: { code, message } }` 형식 |
| ☐ | Route Handler에서 `safeParse` 사용 확인 |
| ☐ | 비즈니스 로직이 `src/server/services/`에만 존재 |
| ☐ | API 응답 구조가 API_SPEC.md와 일치 |
