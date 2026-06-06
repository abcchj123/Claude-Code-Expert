# FRONTEND_TASKS.md — Tika 프런트엔드 구현 계획

> 기준 문서: `docs/COMPONENT_SPEC.md` · 작성일: 2026-06-06
> 구현 원칙: **Bottom-up** (leaf → container), **TDD** (테스트 먼저 작성 → 구현 → 통과)

---

## 의존성 그래프

```
 ┌─ Phase 0 ──────────────────────────────────────────────────────────────────────┐
 │  ticketMeta.ts          ticketApi.ts                                           │
 └──────┬──────────────────────┬─────────────────────────────────────────────────┘
        │                      │
 ┌─ Phase 1 ────────┐          │   ┌─ Phase 4 ──────────────────────────────────┐
 │  PriorityBadge   │          └──►│  useTickets                                │
 │  DateRow         │              │  useDragDrop                               │
 │  ConfirmDialog   │              └──────────────────────────┬─────────────────┘
 │  Field           │                                         │
 └──┬───────────────┘                                         │
    │                                                         │
 ┌─ Phase 2 ────────────────────────┐                         │
 │  TicketCard (PriorityBadge,      │                         │
 │             DateRow,             │                         │
 │             ConfirmDialog)       │                         │
 │  TicketForm (Field)              │                         │
 │  TicketModal (TicketForm)        │                         │
 └──┬───────────────────────────────┘                         │
    │                                                         │
 ┌─ Phase 3 ────────────────────────────────────────────────┐ │
 │  NewTicketButton → Header                                │ │
 │  ColumnHeader                                            │ │
 │  AddTicketButton                                         │ │
 │  Column     (ColumnHeader, TicketCard, AddTicketButton)  │ │
 │  KanbanBoard (Column × 3)                                │ │
 │  BacklogSidebar (ColumnHeader, TicketCard, AddTicket)    │ │
 └──┬───────────────────────────────────────────────────────┘ │
    │                                                          │
 ┌─ Phase 5 ────────────────────────────────────────────────┴─┘
 │  BoardPage (Header + BacklogSidebar + KanbanBoard         │
 │             + TicketModal + useTickets + useDragDrop)     │
 │  app/page.tsx (RSC → BoardPage)                           │
 └───────────────────────────────────────────────────────────┘
```

---

## Phase 0 — 기반 유틸리티

> React 없음. 단위 테스트(jest)만 작성.

---

### `ticketMeta.ts`

**파일**: `src/client/utils/ticketMeta.ts`
**의존성**: `Ticket` 타입, `TicketWithMeta` 타입

```
TDD 체크리스트
  [ ] dueDate가 null이면 isOverdue = false
  [ ] dueDate가 오늘 이후면 isOverdue = false
  [ ] dueDate가 오늘 이전이고 status !== DONE이면 isOverdue = true
  [ ] status === DONE이면 dueDate 지나도 isOverdue = false
  [ ] 원본 ticket 필드를 그대로 전달(spread)한다
```

---

### `ticketApi.ts`

**파일**: `src/client/api/ticketApi.ts`
**의존성**: `fetch`, 공유 타입

```
TDD 체크리스트 (fetch mock 사용)
  [ ] create(input) → POST /api/tickets, 반환값 Ticket
  [ ] findAll(status?) → GET /api/tickets?status=..., 반환값 Ticket[]
  [ ] findById(id) → GET /api/tickets/:id, 반환값 Ticket | null
  [ ] update(id, input) → PATCH /api/tickets/:id, 반환값 Ticket
  [ ] remove(id) → DELETE /api/tickets/:id, 반환값 void
  [ ] move(id, input) → PATCH /api/tickets/:id/move, 반환값 Ticket
  [ ] 서버 4xx/5xx 응답 시 Error를 throw한다
```

---

## Phase 1 — 공통 UI 컴포넌트

> 의존성 없는 순수 표시 컴포넌트. `@jest-environment jsdom` + RTL.
> 테스트 파일 위치: 컴포넌트와 동일 디렉토리 `.test.tsx`

---

### `PriorityBadge`

**파일**: `src/client/components/ui/PriorityBadge.tsx`
**의존성**: 없음

구현 요점
- LOW / MEDIUM / HIGH 각각 `--color-priority-*` 색상 적용
- 텍스트: 낮음 / 보통 / 높음

```
TDD 체크리스트
  [ ] priority="LOW"    → "낮음" 텍스트 렌더링
  [ ] priority="MEDIUM" → "보통" 텍스트 렌더링
  [ ] priority="HIGH"   → "높음" 텍스트 렌더링
  [ ] LOW    → CSS 변수 --color-priority-low 색상 클래스 적용
  [ ] MEDIUM → CSS 변수 --color-priority-medium 색상 클래스 적용
  [ ] HIGH   → CSS 변수 --color-priority-high 색상 클래스 적용
```

---

### `DateRow`

**파일**: `src/client/components/ui/DateRow.tsx`
**의존성**: 없음

구현 요점
- plannedStartDate, dueDate 모두 null → 렌더링 생략(null 반환)
- isOverdue → 빨간 텍스트 + "기한초과" 뱃지

```
TDD 체크리스트
  [ ] 두 날짜 모두 null → 아무것도 렌더링하지 않는다
  [ ] plannedStartDate만 있으면 시작일만 표시한다
  [ ] dueDate만 있으면 종료일만 표시한다
  [ ] 두 날짜 모두 있으면 "시작일 → 종료일" 형식으로 표시한다
  [ ] isOverdue=true → 날짜 텍스트에 빨간색 클래스 적용
  [ ] isOverdue=true → "기한초과" 뱃지가 렌더링된다
  [ ] isOverdue=false → "기한초과" 뱃지가 없다
```

---

### `Field`

**파일**: `src/client/components/ui/Field.tsx`
**의존성**: 없음

구현 요점
- label, children, error? 조합
- error 존재 시 `role="alert"` span 렌더링

```
TDD 체크리스트
  [ ] label prop 텍스트가 렌더링된다
  [ ] children(input 등)이 렌더링된다
  [ ] error prop 없으면 에러 메시지 엘리먼트가 없다
  [ ] error prop 있으면 role="alert" span에 에러 메시지가 표시된다
  [ ] 에러 없을 때 alert 역할 엘리먼트가 존재하지 않는다
```

---

### `ConfirmDialog`

**파일**: `src/client/components/ui/ConfirmDialog.tsx`
**의존성**: 없음

구현 요점
- role="dialog" aria-modal="true"
- 오버레이 클릭 → onCancel, 내부 클릭 전파 차단

```
TDD 체크리스트
  [ ] role="dialog" 엘리먼트가 렌더링된다
  [ ] message prop 텍스트가 표시된다
  [ ] "삭제" 버튼 클릭 → onConfirm 호출
  [ ] "취소" 버튼 클릭 → onCancel 호출
  [ ] 오버레이(배경) 클릭 → onCancel 호출
  [ ] 다이얼로그 내부 클릭은 onCancel을 호출하지 않는다
```

---

## Phase 2 — 티켓 컴포넌트

---

### `TicketCard`

**파일**: `src/client/components/ticket/TicketCard.tsx`
**의존성**: `PriorityBadge`, `DateRow`, `ConfirmDialog`, `useSortable`(@dnd-kit)

구현 요점
- `useSortable({ id: ticket.id })` — setNodeRef, transform, isDragging
- hover 시 showActions 토글 (onMouseEnter/Leave)
- isDragging → `is-dragging` 클래스 (opacity 0.4)

```
TDD 체크리스트
  [ ] ticket.title이 렌더링된다
  [ ] ticket.description이 있으면 렌더링된다
  [ ] ticket.description이 null이면 렌더링하지 않는다
  [ ] PriorityBadge가 렌더링된다
  [ ] DateRow가 렌더링된다
  [ ] 기본 상태에서 수정/삭제 버튼이 보이지 않는다
  [ ] onMouseEnter → 수정/삭제 버튼 노출
  [ ] 수정 버튼 클릭 → onEdit(ticket.id) 호출
  [ ] 삭제 버튼 클릭 → ConfirmDialog 표시
  [ ] ConfirmDialog에서 확인 → onDelete(ticket.id) 호출
  [ ] ConfirmDialog에서 취소 → 다이얼로그 닫힘, onDelete 미호출
  [ ] isDragging=true → is-dragging 클래스 적용
  [ ] isOverdue=true → 카드에 빨간 테두리 스타일 적용
  [ ] status="DONE" → 제목에 line-through 스타일 적용
```

---

### `TicketForm`

**파일**: `src/client/components/ticket/TicketForm.tsx`
**의존성**: `Field`, `createTicketSchema`(Zod)

구현 요점
- 제어 컴포넌트(values 상태) + 필드별 errors 상태
- 제출 시 `createTicketSchema.safeParse` → 실패 시 errors 업데이트, 중단
- 필드 변경 시 해당 필드 에러 초기화

```
TDD 체크리스트
  [ ] 모든 폼 필드(title, description, priority, plannedStartDate, dueDate)가 렌더링된다
  [ ] defaultValues prop이 초기값으로 채워진다
  [ ] title 빈 채로 제출 → "제목을 입력해주세요" 에러 메시지 표시
  [ ] title 빈 채로 제출 → onSubmit이 호출되지 않는다
  [ ] 유효한 데이터로 제출 → onSubmit(data) 호출
  [ ] 유효한 데이터로 제출 → onSubmit에 전달된 data가 Zod 스키마를 통과한다
  [ ] title 입력 후 에러가 사라진다(에러 초기화)
  [ ] isSubmitting=true → 저장 버튼 disabled
  [ ] isSubmitting=true → "저장 중..." 텍스트 표시
  [ ] 취소 버튼 클릭 → onCancel 호출
  [ ] priority select가 LOW / MEDIUM / HIGH 옵션을 가진다
```

---

### `TicketModal`

**파일**: `src/client/components/ticket/TicketModal.tsx`
**의존성**: `TicketForm`, `createPortal`(react-dom)

구현 요점
- `createPortal(modal, document.body)` — body에 마운트
- useEffect로 ESC 키 핸들러 등록/해제
- 오버레이 클릭 → onClose, 모달 내부 클릭 전파 차단

```
TDD 체크리스트
  [ ] mode="create" → 헤더에 "새 티켓" 텍스트 표시
  [ ] mode="edit"   → 헤더에 "티켓 수정" 텍스트 표시
  [ ] mode="edit" + ticket prop → TicketForm에 defaultValues 전달
  [ ] ESC 키 입력 → onClose 호출
  [ ] 오버레이(backdrop) 클릭 → onClose 호출
  [ ] 모달 내부 클릭 → onClose 호출하지 않는다
  [ ] × 닫기 버튼 클릭 → onClose 호출
  [ ] isSubmitting=true → TicketForm에 isSubmitting 전달
  [ ] document.body에 마운트된다(Portal 검증)
  [ ] 언마운트 시 ESC 핸들러가 제거된다
```

---

## Phase 3 — 레이아웃 · 보드 컴포넌트

---

### `NewTicketButton`

**파일**: `src/client/components/layout/NewTicketButton.tsx`
**의존성**: 없음

```
TDD 체크리스트
  [ ] "새 업무" 텍스트가 렌더링된다
  [ ] 클릭 → onClick 호출
```

---

### `Header`

**파일**: `src/client/components/layout/Header.tsx`
**의존성**: `NewTicketButton`

구현 요점
- sticky 헤더, `--header-height: 56px`
- 좌측: "TIKA" 로고, 우측: 검색창 + NewTicketButton

```
TDD 체크리스트
  [ ] "TIKA" 로고 텍스트가 렌더링된다
  [ ] NewTicketButton이 렌더링된다
  [ ] NewTicketButton 클릭 → onNewTicket 호출
  [ ] header 엘리먼트(또는 role="banner")로 렌더링된다
```

---

### `ColumnHeader`

**파일**: `src/client/components/board/ColumnHeader.tsx`
**의존성**: 없음

```
TDD 체크리스트
  [ ] title prop 텍스트가 렌더링된다
  [ ] count prop 숫자가 뱃지로 렌더링된다
  [ ] count=0 → "0"이 표시된다
```

---

### `AddTicketButton`

**파일**: `src/client/components/board/AddTicketButton.tsx`
**의존성**: 없음

```
TDD 체크리스트
  [ ] "+ 추가" 또는 유사 텍스트가 렌더링된다
  [ ] 클릭 → onClick 호출
```

---

### `Column`

**파일**: `src/client/components/board/Column.tsx`
**의존성**: `ColumnHeader`, `TicketCard`, `AddTicketButton`, `useDroppable`(@dnd-kit)

구현 요점
- `useDroppable({ id: status })` — setNodeRef, isOver
- `SortableContext` + `verticalListSortingStrategy`
- isOver → `is-over` 클래스 적용
- 컬럼 배경: `bg-column-todo` / `bg-column-in-progress` / `bg-column-done`

```
TDD 체크리스트
  [ ] ColumnHeader가 COLUMN_LABELS[status] 텍스트와 함께 렌더링된다
  [ ] tickets.length만큼 TicketCard가 렌더링된다
  [ ] tickets=[] → 빈 상태 메시지("이 컬럼에 티켓이 없습니다") 표시
  [ ] AddTicketButton이 렌더링된다
  [ ] AddTicketButton 클릭 → onAddTicket 호출
  [ ] onTicketEdit, onTicketDelete가 각 TicketCard에 전달된다
  [ ] isOver=true → is-over 클래스가 컨테이너에 적용된다
  [ ] status="TODO"        → bg-column-todo 클래스 적용
  [ ] status="IN_PROGRESS" → bg-column-in-progress 클래스 적용
  [ ] status="DONE"        → bg-column-done 클래스 적용
```

---

### `KanbanBoard`

**파일**: `src/client/components/board/KanbanBoard.tsx`
**의존성**: `Column`

구현 요점
- [TODO, IN_PROGRESS, DONE] 3개 컬럼 렌더링
- tickets를 status로 필터링해 각 Column에 전달

```
TDD 체크리스트
  [ ] TODO, IN_PROGRESS, DONE 3개 컬럼이 렌더링된다
  [ ] 각 컬럼에 해당 status 티켓만 전달된다
  [ ] 다른 status 티켓이 섞이지 않는다
  [ ] onTicketEdit, onTicketDelete, onAddTicket이 각 컬럼에 전달된다
```

---

### `BacklogSidebar`

**파일**: `src/client/components/board/BacklogSidebar.tsx`
**의존성**: `ColumnHeader`, `TicketCard`, `AddTicketButton`, `useDroppable`(@dnd-kit)

구현 요점
- `useDroppable({ id: 'BACKLOG' })`
- 고정 너비 `var(--sidebar-width)` = 280px, 독립 스크롤
- ColumnHeader title="Backlog"

```
TDD 체크리스트
  [ ] ColumnHeader가 "Backlog" 텍스트로 렌더링된다
  [ ] tickets.length만큼 TicketCard가 렌더링된다
  [ ] tickets=[] → 빈 상태 메시지 표시
  [ ] AddTicketButton이 렌더링된다
  [ ] AddTicketButton 클릭 → onAddTicket 호출
  [ ] onTicketEdit, onTicketDelete가 각 TicketCard에 전달된다
  [ ] aside 또는 역할이 있는 엘리먼트로 렌더링된다
```

---

## Phase 4 — 커스텀 훅

> `@jest-environment node` 또는 jsdom + fetch mock.

---

### `useTickets`

**파일**: `src/client/hooks/useTickets.ts`
**의존성**: `ticketApi`, `useState`, `useMemo`

구현 요점
- `boardColumns`: `useMemo`로 status별 분류 + position 정렬
- `deleteTicket`: 낙관적 제거 → 실패 시 복구
- `moveTicket`: 낙관적 이동 → 실패 시 복구

```
TDD 체크리스트
  [ ] 초기 tickets 상태가 initialTickets로 설정된다
  [ ] boardColumns가 status별로 올바르게 분류된다
  [ ] boardColumns 내 티켓이 position 오름차순으로 정렬된다
  [ ] createTicket 호출 → ticketApi.create 호출 → tickets에 추가된다
  [ ] createTicket API 실패 → error 상태가 설정된다
  [ ] updateTicket 호출 → ticketApi.update 호출 → tickets 해당 항목 교체
  [ ] updateTicket API 실패 → error 상태가 설정된다
  [ ] deleteTicket 호출 → 낙관적으로 즉시 목록에서 제거된다
  [ ] deleteTicket API 실패 → 상태가 원래대로 복구된다
  [ ] moveTicket 호출 → 낙관적으로 status/position 즉시 변경된다
  [ ] moveTicket API 실패 → 상태가 원래대로 복구된다
  [ ] moveTicket API 성공 → 서버 응답값으로 해당 티켓을 교체한다
```

---

### `useDragDrop`

**파일**: `src/client/hooks/useDragDrop.ts`
**의존성**: `@dnd-kit/core`, `@dnd-kit/sortable`

구현 요점
- `PointerSensor` + `activationConstraint: { distance: 8 }`
- `handleDragEnd`: over가 컬럼 id → 해당 컬럼 맨 끝 position 계산
- `handleDragEnd`: over가 카드 id → 해당 카드 position 채택

```
TDD 체크리스트
  [ ] sensors, activeTicket, 3개 핸들러를 반환한다
  [ ] handleDragStart → activeTicket이 드래그 시작한 티켓으로 설정된다
  [ ] handleDragEnd → activeTicket이 null로 초기화된다
  [ ] handleDragEnd, over=null → onMove가 호출되지 않는다
  [ ] handleDragEnd, 같은 위치 → onMove가 호출되지 않는다
  [ ] handleDragEnd, 다른 컬럼 → onMove(id, { status: 대상컬럼, position })이 호출된다
  [ ] handleDragEnd, 카드 위 → onMove(id, { status: 대상카드.status, position: 대상카드.position })이 호출된다
```

---

## Phase 5 — 페이지 통합

---

### `BoardPage`

**파일**: `src/client/components/board/BoardPage.tsx`
**의존성**: 모든 Phase 1–4 컴포넌트 + 훅

구현 요점
- `useTickets(initialTickets)` + `useDragDrop({ tickets, onMove: moveTicket })`
- 모달 상태: `modalMode: 'create' | 'edit' | null`, `editingTicket: Ticket | null`
- `DndContext` → `DragOverlay` (activeTicket 기반)

```
TDD 체크리스트
  [ ] Header, BacklogSidebar, KanbanBoard가 렌더링된다
  [ ] initialTickets가 BacklogSidebar/KanbanBoard에 분배된다
  [ ] Header의 "새 업무" 클릭 → TicketModal(mode="create")이 열린다
  [ ] TicketCard 수정 클릭 → TicketModal(mode="edit")이 해당 티켓으로 열린다
  [ ] TicketModal에서 폼 제출 → createTicket/updateTicket이 호출된다
  [ ] TicketModal 제출 성공 → 모달이 닫힌다
  [ ] TicketModal onClose → 모달이 닫힌다
  [ ] error 상태 존재 → 에러 배너가 표시된다
```

---

### `app/page.tsx` (RSC)

**파일**: `app/page.tsx`
**의존성**: `ticketService.findAll()`, `BoardPage`

구현 요점
- `ticketService.findAll()` → Drizzle `Date` 객체를 ISO 문자열로 직렬화
- `BoardPage`에 `Ticket[]` 타입으로 전달

```
TDD 체크리스트 (E2E 또는 서버 통합 테스트)
  [ ] ticketService.findAll()을 호출한다
  [ ] Drizzle Date 객체를 toISOString()으로 변환하여 전달한다
  [ ] BoardPage를 렌더링한다
```

---

## 구현 순서 체크리스트

```
Phase 0 — 기반 유틸리티
  [ ] src/client/utils/ticketMeta.ts
  [ ] src/client/api/ticketApi.ts

Phase 1 — 공통 UI (의존성 없음, 병렬 구현 가능)
  [ ] src/client/components/ui/PriorityBadge.tsx
  [ ] src/client/components/ui/DateRow.tsx
  [ ] src/client/components/ui/Field.tsx
  [ ] src/client/components/ui/ConfirmDialog.tsx

Phase 2 — 티켓 컴포넌트
  [ ] src/client/components/ticket/TicketCard.tsx  ← Phase 1 완료 후
  [ ] src/client/components/ticket/TicketForm.tsx  ← Phase 1 완료 후
  [ ] src/client/components/ticket/TicketModal.tsx ← TicketForm 완료 후

Phase 3 — 레이아웃 · 보드
  [ ] src/client/components/layout/NewTicketButton.tsx  ← 병렬 가능
  [ ] src/client/components/layout/Header.tsx           ← NewTicketButton 후
  [ ] src/client/components/board/ColumnHeader.tsx      ← 병렬 가능
  [ ] src/client/components/board/AddTicketButton.tsx   ← 병렬 가능
  [ ] src/client/components/board/Column.tsx            ← ColumnHeader, TicketCard, AddTicket 후
  [ ] src/client/components/board/KanbanBoard.tsx       ← Column 후
  [ ] src/client/components/board/BacklogSidebar.tsx    ← ColumnHeader, TicketCard, AddTicket 후

Phase 4 — 커스텀 훅 (Phase 0 완료 후, Phase 3과 병렬 가능)
  [ ] src/client/hooks/useTickets.ts
  [ ] src/client/hooks/useDragDrop.ts

Phase 5 — 페이지 통합
  [ ] src/client/components/board/BoardPage.tsx  ← 모든 Phase 완료 후
  [ ] app/page.tsx                               ← BoardPage 완료 후
```

---

## 테스트 파일 위치 규칙

| 테스트 대상 | 테스트 파일 위치 | Jest 환경 |
|-------------|-----------------|-----------|
| `ticketMeta.ts` | `src/client/utils/ticketMeta.test.ts` | node |
| `ticketApi.ts` | `src/client/api/ticketApi.test.ts` | node |
| UI 컴포넌트 | 컴포넌트와 동일 디렉토리 `.test.tsx` | jsdom |
| `useTickets.ts` | `src/client/hooks/useTickets.test.ts` | jsdom |
| `useDragDrop.ts` | `src/client/hooks/useDragDrop.test.ts` | jsdom |
| `BoardPage.tsx` | `src/client/components/board/BoardPage.test.tsx` | jsdom |

```bash
# 컴포넌트 테스트만 실행
npm run test:components

# 전체 테스트
npm run test
```

---

*이 문서는 구현 진행에 따라 각 항목을 `[x]`로 체크하며 업데이트한다.*
*컴포넌트 추가/변경 시 `docs/COMPONENT_SPEC.md`를 먼저 수정한다.*
