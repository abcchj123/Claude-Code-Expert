# TEST_CASES — Tika

> **API · 컴포넌트 · 통합 테스트 케이스 정의**
> 버전: v0.1.0 (MVP) · 작성일: 2026-06-05
> 상위 문서: [PRD.md](./PRD.md) · [API_SPEC.md](./API_SPEC.md) · [COMPONENT_SPEC.md](./COMPONENT_SPEC.md)

---

## 요구사항 추적 매트릭스

> TC ID → 관련 요구사항(FR) · 사용자 시나리오(US) · 테스트 대상을 한눈에 확인한다.
> US는 PRD.md §4 사용자 시나리오 기준이다 (US-01 할 일 등록 · US-02 상태 이동 · US-03 수정 · US-04 삭제 · US-05 완료 처리).

| TC ID | 관련 FR | 관련 US | 테스트 대상 |
|-------|---------|---------|------------|
| TC-API-001 | FR-002 | US-01, US-02 | `ticketService.findAll` · `GET /api/tickets` |
| TC-API-002 | FR-001 | US-01 | `ticketService.create` · `POST /api/tickets` |
| TC-API-003 | FR-003 | US-03 | `ticketService.findById` · `GET /api/tickets/:id` |
| TC-API-004 | FR-004, FR-008 | US-03 | `ticketService.update` · `PATCH /api/tickets/:id` |
| TC-API-005 | FR-005 | US-04 | `ticketService.delete` · `DELETE /api/tickets/:id` |
| TC-API-006 | FR-006 | US-02, US-05 | `ticketService.move` · `PATCH /api/tickets/:id/move` (상태 전환·BR-002/003/004) |
| TC-API-007 | FR-007 | US-02 | `ticketService.move` · `PATCH /api/tickets/:id/move` (position 재계산) |
| TC-API-008 | FR-008 | US-01, US-03 | Zod 날짜 검증 · `POST`, `PATCH /api/tickets` |
| TC-COMP-001 | FR-003 | US-01, US-03, US-04 | `TicketCard` 컴포넌트 |
| TC-COMP-002 | FR-001 | US-01 | `TicketForm` 컴포넌트 (생성 폼) |
| TC-COMP-003 | FR-004 | US-03 | `TicketModal` 컴포넌트 (수정 모달) |
| TC-COMP-004 | FR-005 | US-04 | `ConfirmDialog` 컴포넌트 |
| TC-COMP-005 | FR-002 | US-01, US-02 | `Column` 컴포넌트 (보드 컬럼) |
| TC-COMP-006 | FR-008 | US-01, US-03 | `DateRow` 컴포넌트 (기한 초과 표시) |
| TC-INT-001 | FR-001 ~ FR-005 | US-01 ~ US-04 | 티켓 생성·조회·수정·삭제 전체 흐름 |
| TC-INT-002 | FR-006, FR-007 | US-02, US-05 | DnD 상태 전환 + position 재계산 end-to-end |

---

## 목차

1. [테스트 환경 설정](#1-테스트-환경-설정)
2. [API 테스트 (TC-API)](#2-api-테스트)
3. [컴포넌트 테스트 (TC-COMP)](#3-컴포넌트-테스트)
4. [통합 테스트 (TC-INT)](#4-통합-테스트)

---

## 1. 테스트 환경 설정

### 1-1. 환경 분리 규칙

| 테스트 종류 | Jest 환경 | 파일 위치 | 선언 |
|-------------|-----------|-----------|------|
| API (Route Handler, Service) | `node` | `__tests__/services/`, `__tests__/api/` | 파일 상단 `/** @jest-environment node */` |
| 컴포넌트, 훅 | `jsdom` | `__tests__/components/`, `__tests__/hooks/` | 기본값 (선언 불필요) |
| 통합 테스트 | `node` | `__tests__/integration/` | 파일 상단 `/** @jest-environment node */` |

### 1-2. 공통 픽스처

```typescript
// __tests__/fixtures/ticket.ts
import type { Ticket } from '@/shared/types/ticket';

export const mockTicket: Ticket = {
  id:               1,
  title:            '테스트 티켓',
  description:      '설명입니다',
  status:           'BACKLOG',
  priority:         'MEDIUM',
  position:         1,
  plannedStartDate: null,
  dueDate:          null,
  startedAt:        null,
  completedAt:      null,
  createdAt:        '2026-06-05T09:00:00.000Z',
  updatedAt:        '2026-06-05T09:00:00.000Z',
};

export const mockDoneTicket: Ticket = {
  ...mockTicket,
  id:          2,
  status:      'DONE',
  completedAt: '2026-06-05T15:00:00.000Z',
};

export const mockOverdueTicket: Ticket = {
  ...mockTicket,
  id:      3,
  dueDate: '2020-01-01',   // 과거 날짜
  status:  'TODO',
};
```

### 1-3. 실행 명령

```bash
npm run test                    # 전체 (--runInBand 순차 실행)
npm run test:components         # TC-COMP 전용
npm run test -- TC-API          # TC-API 전용 (파일명 패턴 매칭)
npm run test -- --coverage      # 커버리지 포함
```

---

## 2. API 테스트

> `@jest-environment node` 필수. 실제 테스트 DB(`tika_test`)에 접속한다.
> 각 테스트는 `beforeEach`에서 트랜잭션 시작, `afterEach`에서 롤백한다.

---

### TC-API-001 · GET /api/tickets — 티켓 목록 조회

**연관 FR**: FR-002
**파일**: `__tests__/api/tickets.get.test.ts`

#### 정상 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 1-1 | 전체 목록 조회 | `GET /api/tickets` | `200`, `Ticket[]` 반환, `position ASC` 정렬 |
| 1-2 | 빈 DB 조회 | `GET /api/tickets` (데이터 없음) | `200`, `[]` 반환 |
| 1-3 | status 필터 | `GET /api/tickets?status=TODO` | `200`, `status === 'TODO'`인 티켓만 반환 |

#### 예외 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 1-4 | 잘못된 status 필터 | `GET /api/tickets?status=INVALID` | `400`, `VALIDATION_ERROR` |

```typescript
/** @jest-environment node */
describe('GET /api/tickets', () => {
  it('전체 티켓 목록을 position 오름차순으로 반환해야 한다', async () => {
    // Arrange: DB에 티켓 2개 삽입
    // Act: GET /api/tickets
    // Assert: status 200, 배열, position 순 정렬
  });

  it('티켓이 없으면 빈 배열을 반환해야 한다', async () => {});

  it('status 쿼리로 특정 컬럼 티켓만 필터링해야 한다', async () => {});

  it('유효하지 않은 status 값이면 400을 반환해야 한다', async () => {
    // Assert: { error: { code: 'VALIDATION_ERROR' } }
  });
});
```

---

### TC-API-002 · POST /api/tickets — 티켓 생성

**연관 FR**: FR-001
**파일**: `__tests__/api/tickets.post.test.ts`

#### 정상 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 2-1 | 필수 필드만 | `{ title: "새 티켓" }` | `201`, `status='BACKLOG'`, `position=1`, `priority='MEDIUM'` |
| 2-2 | 모든 선택 필드 포함 | `{ title, description, priority, plannedStartDate, dueDate }` | `201`, 입력값 그대로 반환 |
| 2-3 | 기존 티켓 있을 때 생성 | BACKLOG 티켓 1개 있는 상태에서 POST | `201`, 신규 `position=1`, 기존 티켓 `position=2` |

#### 예외 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 2-4 | title 누락 | `{}` | `400`, `"제목을 입력해주세요"` |
| 2-5 | title 빈 문자열 | `{ title: "" }` | `400`, `"제목을 입력해주세요"` |
| 2-6 | title 201자 | `{ title: "가".repeat(201) }` | `400`, `"제목은 200자 이내로 입력해주세요."` |
| 2-7 | description 1001자 | `{ title: "t", description: "x".repeat(1001) }` | `400`, `VALIDATION_ERROR` |
| 2-8 | 잘못된 priority | `{ title: "t", priority: "URGENT" }` | `400`, `"우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다."` |
| 2-9 | 과거 dueDate | `{ title: "t", dueDate: "2020-01-01" }` | `400`, `"종료예정일은 오늘 이후여야합니다."` |
| 2-10 | 날짜 형식 오류 | `{ title: "t", dueDate: "2026/06/10" }` | `400`, `VALIDATION_ERROR` |

```typescript
/** @jest-environment node */
describe('POST /api/tickets', () => {
  it('title만으로 티켓을 생성하면 status=BACKLOG, position=1로 저장되어야 한다', async () => {
    const res = await POST(new Request('http://localhost/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ title: '새 티켓' }),
      headers: { 'Content-Type': 'application/json' },
    }));
    expect(res.status).toBe(201);
    const ticket = await res.json();
    expect(ticket.status).toBe('BACKLOG');
    expect(ticket.position).toBe(1);
    expect(ticket.priority).toBe('MEDIUM');
  });

  it('title이 없으면 400과 "제목을 입력해주세요" 메시지를 반환해야 한다', async () => {
    // Assert: error.message === '제목을 입력해주세요'
  });

  it('dueDate가 오늘 이전이면 400을 반환해야 한다', async () => {
    // Assert: error.message === '종료예정일은 오늘 이후여야합니다.'
  });
});
```

---

### TC-API-003 · GET /api/tickets/:id — 티켓 단건 조회

**연관 FR**: FR-003
**파일**: `__tests__/api/tickets.getById.test.ts`

#### 정상 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 3-1 | 존재하는 ID 조회 | `GET /api/tickets/1` | `200`, 해당 티켓 전체 필드 반환 |

#### 예외 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 3-2 | 존재하지 않는 ID | `GET /api/tickets/9999` | `404`, `TICKET_NOT_FOUND` |
| 3-3 | 문자열 ID | `GET /api/tickets/abc` | `400`, `VALIDATION_ERROR` |
| 3-4 | 음수 ID | `GET /api/tickets/-1` | `400`, `VALIDATION_ERROR` |

```typescript
/** @jest-environment node */
describe('GET /api/tickets/:id', () => {
  it('존재하는 티켓 ID로 조회하면 티켓 정보를 반환해야 한다', async () => {});

  it('존재하지 않는 ID는 404 TICKET_NOT_FOUND를 반환해야 한다', async () => {
    // Assert: error.code === 'TICKET_NOT_FOUND'
  });

  it('숫자가 아닌 ID는 400 VALIDATION_ERROR를 반환해야 한다', async () => {});
});
```

---

### TC-API-004 · PATCH /api/tickets/:id — 티켓 수정

**연관 FR**: FR-004
**파일**: `__tests__/api/tickets.patch.test.ts`

#### 정상 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 4-1 | title 수정 | `{ title: "수정된 제목" }` | `200`, `title` 변경, `updatedAt` 갱신 |
| 4-2 | description null로 초기화 | `{ description: null }` | `200`, `description === null` |
| 4-3 | dueDate 수정 (오늘 이후) | `{ dueDate: "2099-12-31" }` | `200`, `dueDate` 변경 |
| 4-4 | 여러 필드 동시 수정 | `{ title, priority, dueDate }` | `200`, 전달된 필드 모두 변경 |

#### 예외 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 4-5 | title 빈 문자열 | `{ title: "" }` | `400`, `"제목을 입력해주세요"` |
| 4-6 | 과거 dueDate 수정 | `{ dueDate: "2020-01-01" }` | `400`, `"종료예정일은 오늘 이후여야합니다."` |
| 4-7 | 존재하지 않는 ID | `PATCH /api/tickets/9999` | `404`, `TICKET_NOT_FOUND` |
| 4-8 | 빈 바디 | `{}` | `400`, `VALIDATION_ERROR` (수정 필드 없음) |

```typescript
/** @jest-environment node */
describe('PATCH /api/tickets/:id', () => {
  it('title을 수정하면 변경된 값과 갱신된 updatedAt이 반환되어야 한다', async () => {
    // Assert: ticket.title === '수정된 제목', ticket.updatedAt > 기존값
  });

  it('description에 null을 전달하면 null로 초기화되어야 한다', async () => {});

  it('빈 바디를 전달하면 400을 반환해야 한다', async () => {});
});
```

---

### TC-API-005 · DELETE /api/tickets/:id — 티켓 삭제

**연관 FR**: FR-005
**파일**: `__tests__/api/tickets.delete.test.ts`

#### 정상 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 5-1 | 존재하는 티켓 삭제 | `DELETE /api/tickets/1` | `204`, 응답 본문 없음 |
| 5-2 | 삭제 후 재조회 | 삭제 후 `GET /api/tickets/1` | `404`, `TICKET_NOT_FOUND` |

#### 예외 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 5-3 | 존재하지 않는 ID | `DELETE /api/tickets/9999` | `404`, `TICKET_NOT_FOUND` |
| 5-4 | 문자열 ID | `DELETE /api/tickets/abc` | `400`, `VALIDATION_ERROR` |

```typescript
/** @jest-environment node */
describe('DELETE /api/tickets/:id', () => {
  it('존재하는 티켓을 삭제하면 204를 반환하고 DB에서 제거되어야 한다', async () => {
    // Assert: res.status === 204
    // 재조회 시 404 확인
  });

  it('이미 삭제된 티켓을 다시 삭제하면 404를 반환해야 한다', async () => {});
});
```

---

### TC-API-006 · PATCH /api/tickets/:id/move — DnD 상태 전환

**연관 FR**: FR-006
**파일**: `__tests__/api/tickets.move.test.ts`

#### 정상 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 6-1 | BACKLOG → TODO 이동 | `{ status: "TODO", position: 1 }` | `200`, `startedAt` 자동 설정 (BR-004) |
| 6-2 | TODO → DONE 이동 | `{ status: "DONE", position: 1 }` | `200`, `completedAt = NOW()` (BR-002) |
| 6-3 | DONE → IN_PROGRESS 복귀 | `{ status: "IN_PROGRESS", position: 1 }` | `200`, `completedAt === null` (BR-003) |
| 6-4 | 재이동 시 startedAt 유지 | TODO 이동 후 BACKLOG 복귀 후 다시 TODO | `200`, `startedAt` 최초값 유지 (BR-004 최초 1회) |

#### 예외 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 6-5 | 잘못된 status 값 | `{ status: "INVALID", position: 1 }` | `400`, `VALIDATION_ERROR` |
| 6-6 | position 0 이하 | `{ status: "TODO", position: 0 }` | `400`, `VALIDATION_ERROR` |
| 6-7 | 존재하지 않는 ID | `PATCH /api/tickets/9999/move` | `404`, `TICKET_NOT_FOUND` |

```typescript
/** @jest-environment node */
describe('PATCH /api/tickets/:id/move', () => {
  it('BACKLOG→TODO 최초 이동 시 startedAt이 자동으로 설정되어야 한다', async () => {
    // Arrange: BACKLOG 티켓 생성 (startedAt: null)
    // Act: move to TODO
    // Assert: startedAt !== null
  });

  it('TODO→DONE 이동 시 completedAt이 현재 시간으로 설정되어야 한다', async () => {
    // Assert: completedAt !== null, 오늘 날짜와 일치
  });

  it('DONE→IN_PROGRESS 복귀 시 completedAt이 null로 초기화되어야 한다', async () => {
    // Arrange: DONE 티켓
    // Act: move to IN_PROGRESS
    // Assert: completedAt === null
  });

  it('BACKLOG→TODO 재이동 시 startedAt은 최초값을 유지해야 한다', async () => {
    // Arrange: 이미 startedAt이 설정된 티켓
    // Assert: startedAt 변경 없음
  });
});
```

---

### TC-API-007 · PATCH /api/tickets/:id/move — 컬럼 내 순서 변경

**연관 FR**: FR-007
**파일**: `__tests__/api/tickets.reorder.test.ts`

#### 정상 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 7-1 | 같은 컬럼 내 순서 변경 | 3번 티켓을 position 1로 이동 | `200`, 컬럼 내 전체 position 1,2,3 재계산 |
| 7-2 | 다른 컬럼으로 이동 시 양쪽 재계산 | TODO 티켓을 IN_PROGRESS로 이동 | `200`, 출발/도착 컬럼 모두 position 재계산 |

#### 예외 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 7-3 | position이 소수 | `{ status: "TODO", position: 1.5 }` | `400`, `VALIDATION_ERROR` |

```typescript
/** @jest-environment node */
describe('position 재계산', () => {
  it('같은 컬럼에서 이동 후 position이 1부터 순서대로 재부여되어야 한다', async () => {
    // Arrange: TODO 컬럼에 티켓 3개 (position 1,2,3)
    // Act: 3번 티켓을 position 1로 이동
    // Assert: 재조회 시 position이 1,2,3으로 연속됨
  });
});
```

---

### TC-API-008 · 날짜 필드 관리

**연관 FR**: FR-008
**파일**: `__tests__/api/tickets.dates.test.ts`

#### 정상 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 8-1 | plannedStartDate 설정 | `POST { title: "t", plannedStartDate: "2026-06-10" }` | `201`, `plannedStartDate === "2026-06-10"` |
| 8-2 | dueDate null로 초기화 | `PATCH { dueDate: null }` | `200`, `dueDate === null` |
| 8-3 | completedAt 수동 수정 | `PATCH { completedAt: "2026-06-10T12:00:00.000Z" }` | `200`, `completedAt` 변경됨 |

#### 예외 케이스

| # | 시나리오 | 입력 | 기대 결과 |
|---|----------|------|-----------|
| 8-4 | dueDate 잘못된 형식 | `{ dueDate: "06-10-2026" }` | `400`, `VALIDATION_ERROR` |
| 8-5 | dueDate 오늘 날짜 (경계값) | `{ dueDate: TODAY }` | `200` (오늘 포함은 허용) |

```typescript
/** @jest-environment node */
describe('날짜 필드', () => {
  it('dueDate를 null로 전달하면 날짜가 초기화되어야 한다', async () => {});

  it('dueDate에 오늘 날짜를 입력하면 허용되어야 한다', async () => {
    const today = new Date().toISOString().slice(0, 10);
    // Assert: status 200 또는 201
  });

  it('YYYY-MM-DD 형식이 아닌 날짜는 400을 반환해야 한다', async () => {});
});
```

---

## 3. 컴포넌트 테스트

> RTL(React Testing Library) + `@testing-library/user-event` 사용.
> **사용자가 보는 것**과 **사용자가 하는 행동**에만 초점을 맞춘다.
> `data-testid`는 최소화하고 `getByRole`, `getByText`, `getByLabelText`를 우선한다.

---

### TC-COMP-001 · TicketCard — 티켓 카드 표시

**연관 FR**: FR-003
**파일**: `__tests__/components/TicketCard.test.tsx`

#### 정상 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C1-1 | 기본 티켓 렌더링 | 카드 렌더링 | 제목, 설명, 우선순위 뱃지가 화면에 표시된다 |
| C1-2 | description 없는 티켓 | `description: null` 카드 렌더링 | 제목만 표시, 설명 영역 없음 |
| C1-3 | 완료 티켓 | `status: 'DONE'` 카드 렌더링 | 제목에 취소선이 적용된다 |
| C1-4 | 수정 버튼 클릭 | 카드에 호버 후 수정 버튼 클릭 | `onEdit`이 해당 티켓 ID로 호출된다 |
| C1-5 | 삭제 버튼 클릭 | 카드에 호버 후 삭제 버튼 클릭 | 삭제 확인 다이얼로그가 나타난다 |

#### 예외 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C1-6 | 확인 다이얼로그 취소 | 삭제 버튼 → "취소" 클릭 | 다이얼로그가 닫히고 `onDelete`는 호출되지 않는다 |
| C1-7 | 확인 다이얼로그 확인 | 삭제 버튼 → "삭제" 클릭 | `onDelete`가 해당 티켓 ID로 호출된다 |

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCard } from '@/client/components/ticket/TicketCard';
import { mockTicket, mockDoneTicket } from '../fixtures/ticket';

describe('TicketCard', () => {
  it('티켓 제목과 설명이 화면에 표시되어야 한다', () => {
    render(<TicketCard ticket={{ ...mockTicket, isOverdue: false }} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('테스트 티켓')).toBeInTheDocument();
    expect(screen.getByText('설명입니다')).toBeInTheDocument();
  });

  it('완료된 티켓의 제목에는 취소선이 표시되어야 한다', () => {
    render(<TicketCard ticket={{ ...mockDoneTicket, isOverdue: false }} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('테스트 티켓')).toHaveStyle('text-decoration: line-through');
  });

  it('삭제 버튼 클릭 시 확인 다이얼로그가 나타나야 한다', async () => {
    const user = userEvent.setup();
    render(<TicketCard ticket={{ ...mockTicket, isOverdue: false }} onEdit={jest.fn()} onDelete={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: /삭제/ }));
    expect(screen.getByText('티켓을 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('삭제 다이얼로그에서 취소하면 onDelete가 호출되지 않아야 한다', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(<TicketCard ticket={{ ...mockTicket, isOverdue: false }} onEdit={jest.fn()} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: /삭제/ }));
    await user.click(screen.getByRole('button', { name: /취소/ }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
```

---

### TC-COMP-002 · TicketForm — 티켓 생성 폼

**연관 FR**: FR-001
**파일**: `__tests__/components/TicketForm.test.tsx`

#### 정상 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C2-1 | 필수 필드 입력 후 저장 | 제목 입력 → "저장" 클릭 | `onSubmit`이 `{ title }` 데이터로 호출된다 |
| C2-2 | 전체 필드 입력 후 저장 | 모든 필드 입력 → "저장" 클릭 | `onSubmit`이 전체 데이터로 호출된다 |
| C2-3 | 저장 중 버튼 비활성화 | `isSubmitting=true`로 렌더링 | "저장" 버튼이 비활성화되고 "저장 중..." 텍스트가 표시된다 |
| C2-4 | 취소 버튼 | "취소" 클릭 | `onCancel`이 호출된다 |

#### 예외 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C2-5 | 빈 제목으로 제출 | 제목 비우고 "저장" 클릭 | `"제목을 입력해주세요"` 에러 메시지가 표시되고 `onSubmit`은 호출되지 않는다 |
| C2-6 | 201자 제목 입력 | 201자 제목 입력 후 "저장" 클릭 | `"제목은 200자 이내로 입력해주세요."` 에러 메시지가 표시된다 |
| C2-7 | 과거 종료예정일 | 과거 날짜 입력 후 "저장" 클릭 | `"종료예정일은 오늘 이후여야합니다."` 에러 메시지가 표시된다 |
| C2-8 | 에러 후 올바른 값 입력 | 에러 발생 후 올바른 값 재입력 | 에러 메시지가 사라진다 |

```typescript
describe('TicketForm', () => {
  it('제목을 입력하고 저장하면 onSubmit이 해당 데이터로 호출되어야 한다', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<TicketForm onSubmit={onSubmit} onCancel={jest.fn()} isSubmitting={false} />);

    await user.type(screen.getByLabelText(/제목/), '새로운 티켓');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: '새로운 티켓' }));
  });

  it('제목 없이 저장하면 에러 메시지가 표시되고 onSubmit은 호출되지 않아야 한다', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<TicketForm onSubmit={onSubmit} onCancel={jest.fn()} isSubmitting={false} />);

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(screen.getByRole('alert')).toHaveTextContent('제목을 입력해주세요');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('isSubmitting이 true면 저장 버튼이 비활성화되어야 한다', () => {
    render(<TicketForm onSubmit={jest.fn()} onCancel={jest.fn()} isSubmitting={true} />);
    expect(screen.getByRole('button', { name: /저장 중/ })).toBeDisabled();
  });
});
```

---

### TC-COMP-003 · TicketModal — 티켓 수정 모달

**연관 FR**: FR-004
**파일**: `__tests__/components/TicketModal.test.tsx`

#### 정상 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C3-1 | edit 모드로 모달 열기 | `mode='edit', ticket=mockTicket` | 기존 제목, 설명이 입력 필드에 채워져 있다 |
| C3-2 | create 모드로 모달 열기 | `mode='create'` | 모든 필드가 비어있다 |
| C3-3 | X 버튼으로 닫기 | X 버튼 클릭 | `onClose`가 호출된다 |
| C3-4 | ESC 키로 닫기 | ESC 키 누름 | `onClose`가 호출된다 |
| C3-5 | 오버레이 클릭으로 닫기 | 모달 외부 클릭 | `onClose`가 호출된다 |

#### 예외 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C3-6 | 저장 중 닫기 시도 | `isSubmitting=true` 상태에서 ESC | `onClose`가 호출되지 않는다 (저장 중 닫기 방지) |

```typescript
describe('TicketModal', () => {
  it('edit 모드에서는 기존 티켓 정보가 폼에 채워져 있어야 한다', () => {
    render(
      <TicketModal mode="edit" ticket={mockTicket} onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />
    );
    expect(screen.getByLabelText(/제목/)).toHaveValue('테스트 티켓');
  });

  it('ESC 키를 누르면 모달이 닫혀야 한다', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<TicketModal mode="create" onClose={onClose} onSubmit={jest.fn()} isSubmitting={false} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
```

---

### TC-COMP-004 · ConfirmDialog — 삭제 확인

**연관 FR**: FR-005
**파일**: `__tests__/components/ConfirmDialog.test.tsx`

#### 정상 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C4-1 | 다이얼로그 표시 | `open=true` | 전달된 메시지가 화면에 표시된다 |
| C4-2 | 삭제 확인 | "삭제" 버튼 클릭 | `onConfirm`이 호출된다 |
| C4-3 | 취소 | "취소" 버튼 클릭 | `onCancel`이 호출되고 `onConfirm`은 호출되지 않는다 |

#### 예외 케이스

없음 — 단순 확인 다이얼로그.

```typescript
describe('ConfirmDialog', () => {
  it('전달된 메시지가 화면에 표시되어야 한다', () => {
    render(<ConfirmDialog message="정말 삭제할까요?" onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByText('정말 삭제할까요?')).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 onConfirm은 호출되지 않아야 한다', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(<ConfirmDialog message="삭제?" onConfirm={onConfirm} onCancel={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: /취소/ }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
```

---

### TC-COMP-005 · Column — 보드 컬럼

**연관 FR**: FR-002
**파일**: `__tests__/components/Column.test.tsx`

#### 정상 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C5-1 | 컬럼 제목 표시 | TODO 컬럼 렌더링 | "TODO" 텍스트가 표시된다 |
| C5-2 | 티켓 수 배지 | 티켓 3개 있는 컬럼 렌더링 | 컬럼 헤더에 "3"이 표시된다 |
| C5-3 | 티켓 목록 표시 | 티켓 2개 전달 | 두 티켓의 제목이 모두 화면에 표시된다 |
| C5-4 | 빈 컬럼 | 티켓 없음 | 컬럼 헤더와 "+ 추가" 버튼은 표시되고 티켓 카드는 없다 |
| C5-5 | "+ 추가" 버튼 | "+ 추가" 클릭 | `onAddTicket`이 호출된다 |

#### 예외 케이스

없음 — 컬럼은 전달된 데이터를 표시하는 순수 렌더링 컴포넌트.

```typescript
describe('Column', () => {
  const tickets = [
    { ...mockTicket, id: 1, title: '티켓 1', status: 'TODO' as const },
    { ...mockTicket, id: 2, title: '티켓 2', status: 'TODO' as const },
  ];

  it('컬럼 제목이 표시되어야 한다', () => {
    render(<Column status="TODO" tickets={[]} onTicketEdit={jest.fn()} onTicketDelete={jest.fn()} onAddTicket={jest.fn()} />);
    expect(screen.getByText('TODO')).toBeInTheDocument();
  });

  it('전달된 티켓 수가 헤더 배지에 표시되어야 한다', () => {
    render(<Column status="TODO" tickets={tickets} onTicketEdit={jest.fn()} onTicketDelete={jest.fn()} onAddTicket={jest.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('전달된 모든 티켓 제목이 표시되어야 한다', () => {
    render(<Column status="TODO" tickets={tickets} onTicketEdit={jest.fn()} onTicketDelete={jest.fn()} onAddTicket={jest.fn()} />);
    expect(screen.getByText('티켓 1')).toBeInTheDocument();
    expect(screen.getByText('티켓 2')).toBeInTheDocument();
  });
});
```

---

### TC-COMP-006 · DateRow / TicketCard — 기한 초과 표시

**연관 FR**: FR-008
**파일**: `__tests__/components/DateRow.test.tsx`

#### 정상 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C6-1 | 날짜 없는 티켓 | `plannedStartDate: null, dueDate: null` | 날짜 영역이 렌더링되지 않는다 |
| C6-2 | 정상 날짜 표시 | 미래 dueDate | 날짜가 표시되고 기한초과 표시 없음 |
| C6-3 | 기한 초과 표시 | `isOverdue: true` | "기한초과" 텍스트 또는 뱃지가 표시된다 |
| C6-4 | 기한 초과 시 색상 | `isOverdue: true` | 날짜 텍스트가 빨간색으로 표시된다 |

#### 예외 케이스

| # | 시나리오 | 행동 | 기대 결과 |
|---|----------|------|-----------|
| C6-5 | DONE 상태 + 과거 dueDate | `status='DONE', dueDate='2020-01-01'` | "기한초과" 표시가 없다 (완료된 티켓은 초과 아님) |

```typescript
describe('DateRow', () => {
  it('날짜가 없으면 날짜 영역이 렌더링되지 않아야 한다', () => {
    const { container } = render(
      <DateRow plannedStartDate={null} dueDate={null} isOverdue={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('isOverdue가 true이면 "기한초과" 텍스트가 표시되어야 한다', () => {
    render(<DateRow plannedStartDate={null} dueDate="2020-01-01" isOverdue={true} />);
    expect(screen.getByText(/기한초과/)).toBeInTheDocument();
  });

  it('isOverdue가 false이면 "기한초과" 텍스트가 표시되지 않아야 한다', () => {
    render(<DateRow plannedStartDate={null} dueDate="2099-12-31" isOverdue={false} />);
    expect(screen.queryByText(/기한초과/)).not.toBeInTheDocument();
  });
});
```

---

## 4. 통합 테스트

> API 레이어와 서비스 레이어를 함께 호출해 실제 DB에서 end-to-end 흐름을 검증한다.
> `@jest-environment node` 필수.

---

### TC-INT-001 · 티켓 전체 생명 주기

**연관 FR**: FR-001, FR-002, FR-004, FR-005
**파일**: `__tests__/integration/ticketLifecycle.test.ts`
**시나리오**: 티켓 생성 → 목록 확인 → 수정 → 삭제 → 최종 확인

#### 정상 케이스

| # | 단계 | 동작 | 검증 |
|---|------|------|------|
| I1-1 | 생성 | `POST /api/tickets` `{ title: "통합 테스트 티켓" }` | `201`, `status='BACKLOG'`, `id` 반환 |
| I1-2 | 목록 확인 | `GET /api/tickets` | 방금 생성한 티켓이 목록에 포함된다 |
| I1-3 | 수정 | `PATCH /api/tickets/:id` `{ title: "수정된 제목" }` | `200`, `title` 변경, `updatedAt` 갱신 |
| I1-4 | 삭제 | `DELETE /api/tickets/:id` | `204` |
| I1-5 | 삭제 후 목록 확인 | `GET /api/tickets` | 삭제된 티켓이 목록에 없다 |

```typescript
/** @jest-environment node */
describe('TC-INT-001: 티켓 전체 생명 주기', () => {
  it('생성 → 조회 → 수정 → 삭제 흐름이 정상 동작해야 한다', async () => {
    // 1. 생성
    const createRes = await POST(makeRequest({ title: '통합 테스트 티켓' }));
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.status).toBe('BACKLOG');

    // 2. 목록에서 확인
    const listRes = await GET(new Request('http://localhost/api/tickets'));
    const tickets = await listRes.json();
    expect(tickets.some((t: Ticket) => t.id === created.id)).toBe(true);

    // 3. 수정
    const updateRes = await PATCH(makeRequest({ title: '수정된 제목' }), { params: { id: String(created.id) } });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.title).toBe('수정된 제목');

    // 4. 삭제
    const deleteRes = await DELETE(new Request(`http://localhost/api/tickets/${created.id}`), { params: { id: String(created.id) } });
    expect(deleteRes.status).toBe(204);

    // 5. 삭제 후 목록에서 사라짐 확인
    const finalListRes = await GET(new Request('http://localhost/api/tickets'));
    const finalTickets = await finalListRes.json();
    expect(finalTickets.some((t: Ticket) => t.id === created.id)).toBe(false);
  });
});
```

---

### TC-INT-002 · DnD 상태 전환 및 position 동기화

**연관 FR**: FR-006, FR-007
**파일**: `__tests__/integration/ticketMove.test.ts`
**시나리오**: 티켓 3개 생성 → BACKLOG→TODO 이동 → TODO 내 순서 변경 → DONE 이동 → 완료 상태 확인

#### 정상 케이스

| # | 단계 | 동작 | 검증 |
|---|------|------|------|
| I2-1 | 초기 셋업 | BACKLOG 티켓 3개 생성 | position 1, 2, 3으로 순서 지정됨 |
| I2-2 | 컬럼 간 이동 | 티켓 A를 TODO로 이동 | `status='TODO'`, `startedAt` 자동 설정, BACKLOG position 재계산 |
| I2-3 | TODO 내 순서 변경 | 티켓 B도 TODO 이동 후 순서 변경 | TODO 컬럼 내 position 1, 2로 재계산 |
| I2-4 | Done으로 이동 | 티켓 A를 DONE으로 이동 | `completedAt` 자동 설정 |
| I2-5 | Done에서 복귀 | 티켓 A를 IN_PROGRESS로 복귀 | `completedAt === null` |

```typescript
/** @jest-environment node */
describe('TC-INT-002: DnD 상태 전환 및 position 동기화', () => {
  it('BACKLOG→TODO 이동 시 startedAt이 설정되고 position이 재계산되어야 한다', async () => {
    // 1. 티켓 2개 생성
    const ticketA = await createTicket('티켓 A');
    const ticketB = await createTicket('티켓 B');

    // 2. 티켓 A를 TODO로 이동
    const moveRes = await moveTicket(ticketA.id, { status: 'TODO', position: 1 });
    expect(moveRes.startedAt).not.toBeNull();

    // 3. BACKLOG의 티켓 B는 position 1로 재계산
    const backlogTickets = await getTicketsByStatus('BACKLOG');
    expect(backlogTickets[0].id).toBe(ticketB.id);
    expect(backlogTickets[0].position).toBe(1);
  });

  it('DONE 이동 시 completedAt이 설정되고 복귀 시 초기화되어야 한다', async () => {
    const ticket = await createTicket('완료 테스트');

    // DONE 이동
    const doneTicket = await moveTicket(ticket.id, { status: 'DONE', position: 1 });
    expect(doneTicket.completedAt).not.toBeNull();

    // IN_PROGRESS로 복귀
    const restoredTicket = await moveTicket(ticket.id, { status: 'IN_PROGRESS', position: 1 });
    expect(restoredTicket.completedAt).toBeNull();
  });
});
```

---

*이 문서는 `__tests__/` 하위 구현의 기준이다. 신규 기능 추가 시 이 문서에 테스트 케이스를 먼저 정의한 후 구현한다.*
*테스트 실행 시 `--runInBand` 필수 (서비스 테스트의 공유 DB race condition 방지 — CLAUDE.md 참조).*
