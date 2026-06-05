# COMPONENT_SPEC — Tika

> **컴포넌트 계층 · Props · 이벤트 · 훅 명세**
> 버전: v0.1.0 (MVP) · 작성일: 2026-06-05
> 상위 문서: [PRD.md](./PRD.md) · [TRD.md](./TRD.md) · [DATA_MODEL.md](./DATA_MODEL.md) · [API_SPEC.md](./API_SPEC.md)

---

## 목차

1. [컴포넌트 트리](#1-컴포넌트-트리)
2. [렌더링 전략 (RSC vs Client)](#2-렌더링-전략)
3. [Page 레벨](#3-page-레벨)
4. [Layout 컴포넌트](#4-layout-컴포넌트)
5. [Board 컴포넌트](#5-board-컴포넌트)
6. [Ticket 컴포넌트](#6-ticket-컴포넌트)
7. [공통 UI 컴포넌트](#7-공통-ui-컴포넌트)
8. [커스텀 훅](#8-커스텀-훅)
9. [데이터 흐름 요약](#9-데이터-흐름-요약)
10. [파일 구조](#10-파일-구조)

---

## 1. 컴포넌트 트리

```
app/page.tsx                         (RSC — 초기 데이터 fetch)
└── BoardPage                        (Client — 전체 보드 상태 관리)
    ├── Header
    │   └── NewTicketButton
    ├── BacklogSidebar               (DnD: Droppable)
    │   ├── ColumnHeader
    │   └── SortableContext
    │       └── TicketCard[]         (DnD: Draggable + Sortable)
    ├── KanbanBoard                  (DnD: DndContext)
    │   └── Column × 3              (DnD: Droppable + SortableContext)
    │       ├── ColumnHeader
    │       ├── TicketCard[]         (DnD: Draggable + Sortable)
    │       └── AddTicketButton
    └── TicketModal                  (조건부 렌더링 — create / edit)
        └── TicketForm
            └── ConfirmDialog        (삭제 확인 전용)
```

---

## 2. 렌더링 전략

| 컴포넌트 | 타입 | 이유 |
|----------|------|------|
| `app/page.tsx` | **RSC** | DB에서 초기 티켓 목록을 서버에서 fetch — TTI 최소화 |
| `BoardPage` | **Client** | `useTickets`, `useDragDrop` 훅 사용, 인터랙션 전담 |
| `Header` | **Client** | 모달 열기 버튼 핸들러 필요 |
| `BacklogSidebar` | **Client** | DnD Droppable, 상태 연동 |
| `KanbanBoard` | **Client** | `DndContext` — `'use client'` 필수 |
| `Column` | **Client** | DnD `useDroppable` + `SortableContext` |
| `TicketCard` | **Client** | DnD `useSortable`, 인라인 편집 버튼 |
| `TicketModal` | **Client** | 폼 상태, `isSubmitting` 관리 |
| `TicketForm` | **Client** | 제어 컴포넌트, Zod 클라이언트 검증 |
| 공통 UI 컴포넌트 | **Client** | 이벤트 핸들러 사용 |

> **규칙**: `'use client'` 는 최대한 리프 컴포넌트에 가깝게 선언한다. `BoardPage`가 Client이므로 하위 컴포넌트는 자동으로 Client 컨텍스트를 가진다.

---

## 3. Page 레벨

### `app/page.tsx` (RSC)

초기 티켓 목록을 서버에서 fetch해 `BoardPage`에 넘긴다. 인터랙션은 `BoardPage`가 전담한다.

```typescript
// app/page.tsx
import { ticketService } from '@/server/services/ticketService';
import { BoardPage } from '@/client/components/board/BoardPage';

export default async function Page() {
  const initialTickets = await ticketService.findAll();
  return <BoardPage initialTickets={initialTickets} />;
}
```

---

### `BoardPage`

**파일**: `src/client/components/board/BoardPage.tsx`

전체 보드의 최상위 Client 컴포넌트. 티켓 상태와 모달 가시성을 소유한다.

**Props**

```typescript
interface BoardPageProps {
  initialTickets: Ticket[];
}
```

**내부 상태**

| 상태 | 타입 | 설명 |
|------|------|------|
| `modalMode` | `'create' \| 'edit' \| null` | 모달 표시 여부 및 모드 |
| `editingTicket` | `Ticket \| null` | 수정 대상 티켓 (`edit` 모드 시) |

**의존 훅**: `useTickets(initialTickets)`, `useDragDrop({ onMove })`

**렌더링**

```
<DndContext ...useDragDrop>
  <Header onNewTicket={() => setModalMode('create')} />
  <main>
    <BacklogSidebar tickets={backlogTickets} ... />
    <KanbanBoard tickets={boardTickets} ... />
  </main>
  {modalMode && (
    <TicketModal mode={modalMode} ticket={editingTicket} ... />
  )}
</DndContext>
```

---

## 4. Layout 컴포넌트

### `Header`

**파일**: `src/client/components/layout/Header.tsx`

앱 로고와 전역 새 티켓 버튼을 포함한다. 고정(sticky) 헤더.

**Props**

```typescript
interface HeaderProps {
  onNewTicket: () => void;
}
```

**렌더 구조**

```
<header sticky>
  <h1>TIKA</h1>
  <NewTicketButton onClick={onNewTicket} />
</header>
```

---

### `NewTicketButton`

**파일**: `src/client/components/layout/NewTicketButton.tsx`

**Props**

```typescript
interface NewTicketButtonProps {
  onClick: () => void;
}
```

---

### `BacklogSidebar`

**파일**: `src/client/components/board/BacklogSidebar.tsx`

Backlog 전용 사이드바. 고정 너비(280px), 독립 스크롤.
DnD에서 드롭 가능한 영역(`useDroppable`)이다.

**Props**

```typescript
interface BacklogSidebarProps {
  tickets: Ticket[];
  onTicketEdit:   (id: number) => void;
  onTicketDelete: (id: number) => void;
  onAddTicket:    () => void;
}
```

**렌더 구조**

```
<aside droppable id="BACKLOG">
  <ColumnHeader title="Backlog" count={tickets.length} />
  <SortableContext items={ticketIds}>
    {tickets.map(t => <TicketCard key={t.id} ticket={t} ... />)}
  </SortableContext>
  <AddTicketButton onClick={onAddTicket} />
</aside>
```

---

## 5. Board 컴포넌트

### `KanbanBoard`

**파일**: `src/client/components/board/KanbanBoard.tsx`

우측 3컬럼 보드 영역. `DndContext`는 `BoardPage`에서 제공받는다.

**Props**

```typescript
interface KanbanBoardProps {
  tickets:        Ticket[];
  onTicketEdit:   (id: number) => void;
  onTicketDelete: (id: number) => void;
  onAddTicket:    (status: TicketStatus) => void;
}
```

**렌더 구조**

```
<div grid-cols-3>
  {[TODO, IN_PROGRESS, DONE].map(status => (
    <Column
      key={status}
      status={status}
      tickets={ticketsByStatus[status]}
      ...
    />
  ))}
</div>
```

---

### `Column`

**파일**: `src/client/components/board/Column.tsx`

단일 컬럼. `useDroppable`로 드롭 영역을 등록하고, `SortableContext`로 내부 정렬을 제공한다.

**Props**

```typescript
interface ColumnProps {
  status:         TicketStatus;            // 'TODO' | 'IN_PROGRESS' | 'DONE'
  tickets:        Ticket[];
  onTicketEdit:   (id: number) => void;
  onTicketDelete: (id: number) => void;
  onAddTicket:    () => void;
  isOver?:        boolean;                 // DnD 드래그 오버 시 강조용
}
```

**컬럼 표시 이름 매핑**

```typescript
const COLUMN_LABELS: Record<TicketStatus, string> = {
  BACKLOG:     'Backlog',
  TODO:        'TODO',
  IN_PROGRESS: 'In Progress',
  DONE:        'Done',
};
```

**렌더 구조**

```
<div droppable id={status} isOver={isOver}>
  <ColumnHeader title={COLUMN_LABELS[status]} count={tickets.length} />
  <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
    {tickets.map(t => <TicketCard key={t.id} ticket={withMeta(t)} ... />)}
  </SortableContext>
  <AddTicketButton onClick={onAddTicket} />
</div>
```

---

### `ColumnHeader`

**파일**: `src/client/components/board/ColumnHeader.tsx`

컬럼 제목과 티켓 수 배지를 표시한다.

**Props**

```typescript
interface ColumnHeaderProps {
  title: string;
  count: number;
}
```

---

### `AddTicketButton`

**파일**: `src/client/components/board/AddTicketButton.tsx`

각 컬럼 하단의 "+ 추가" 버튼.

**Props**

```typescript
interface AddTicketButtonProps {
  onClick: () => void;
}
```

---

## 6. Ticket 컴포넌트

### `TicketCard`

**파일**: `src/client/components/ticket/TicketCard.tsx`

드래그 가능한 티켓 카드. `useSortable`로 DnD를 등록한다.

**Props**

```typescript
interface TicketCardProps {
  ticket:   TicketWithMeta;        // isOverdue 파생 필드 포함
  onEdit:   (id: number) => void;
  onDelete: (id: number) => void;
}
```

**`TicketWithMeta` 생성**

```typescript
// src/client/utils/ticketMeta.ts
export function withMeta(ticket: Ticket): TicketWithMeta {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...ticket,
    isOverdue:
      ticket.dueDate !== null &&
      ticket.dueDate < today &&
      ticket.status !== 'DONE',
  };
}
```

**내부 상태**

| 상태 | 타입 | 설명 |
|------|------|------|
| `showActions` | `boolean` | 호버 시 수정/삭제 버튼 표시 |
| `deleteConfirm` | `boolean` | 삭제 확인 다이얼로그 표시 |

**DnD 연동**

```typescript
const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
  useSortable({ id: ticket.id });
```

**렌더 구조**

```
<div ref={setNodeRef} draggable style={transform} isDragging={isDragging}>
  <span {...listeners}>≡</span>          {/* 드래그 핸들 */}
  <div>
    <h3 line-clamp-2>{ticket.title}</h3>
    {ticket.description && <p line-clamp-1>{ticket.description}</p>}
    <DateRow ticket={ticket} />           {/* 날짜 + 기한초과 배지 */}
    <PriorityBadge priority={ticket.priority} />
  </div>
  {showActions && (
    <>
      <button onClick={() => onEdit(ticket.id)}>수정</button>
      <button onClick={() => setDeleteConfirm(true)}>삭제</button>
    </>
  )}
  {deleteConfirm && (
    <ConfirmDialog
      message="티켓을 삭제하시겠습니까?"
      onConfirm={() => onDelete(ticket.id)}
      onCancel={() => setDeleteConfirm(false)}
    />
  )}
</div>
```

**시각 규칙**

| 조건 | 처리 |
|------|------|
| `isDragging` | 카드 반투명 처리 (opacity 0.4) |
| `isOverdue` | 제목에 빨간색 테두리, 기한초과 배지 노출 |
| `status === 'DONE'` | 제목 취소선 (`line-through`) |

---

### `TicketModal`

**파일**: `src/client/components/ticket/TicketModal.tsx`

티켓 생성 / 수정 모달. Portal(`createPortal`)로 `body`에 렌더링한다.

**Props**

```typescript
interface TicketModalProps {
  mode:         'create' | 'edit';
  ticket?:      Ticket;              // edit 모드 시 필수
  onClose:      () => void;
  onSubmit:     (data: CreateTicketInput | UpdateTicketInput) => Promise<void>;
  isSubmitting: boolean;
}
```

**동작 규칙**

| 상황 | 동작 |
|------|------|
| ESC 키 입력 | `onClose()` 호출 |
| 모달 바깥 클릭 | `onClose()` 호출 |
| `isSubmitting === true` | 저장 버튼 비활성화, 로딩 스피너 표시 |

**렌더 구조**

```
<Portal>
  <Overlay onClick={onClose} />
  <dialog>
    <header>
      <h2>{mode === 'create' ? '새 티켓' : '티켓 수정'}</h2>
      <button onClick={onClose}>×</button>
    </header>
    <TicketForm
      defaultValues={mode === 'edit' ? ticket : undefined}
      onSubmit={onSubmit}
      onCancel={onClose}
      isSubmitting={isSubmitting}
    />
  </dialog>
</Portal>
```

---

### `TicketForm`

**파일**: `src/client/components/ticket/TicketForm.tsx`

제어 컴포넌트 기반 폼. `createTicketSchema` / `updateTicketSchema`(§9 API_SPEC)로 클라이언트 검증을 수행한다.

**Props**

```typescript
interface TicketFormProps {
  defaultValues?: Partial<CreateTicketInput>;
  onSubmit:       (data: CreateTicketInput) => void;
  onCancel:       () => void;
  isSubmitting:   boolean;
}
```

**폼 필드**

| 필드 | 컴포넌트 | 검증 |
|------|----------|------|
| `title` | `<input type="text">` | 필수, 1–200자 |
| `description` | `<textarea>` | 선택, 최대 1000자 |
| `priority` | `<select>` | LOW / MEDIUM / HIGH |
| `plannedStartDate` | `<input type="date">` | YYYY-MM-DD, 선택 |
| `dueDate` | `<input type="date">` | YYYY-MM-DD, 오늘 이후, 선택 |

**내부 상태**

| 상태 | 타입 | 설명 |
|------|------|------|
| `errors` | `Record<string, string>` | 필드별 에러 메시지 |
| `values` | `CreateTicketInput` | 폼 입력값 |

**제출 흐름**

```
1. onSubmit 핸들러 진입
2. createTicketSchema.safeParse(values)
   실패 → errors 상태 업데이트 → 인라인 에러 표시, 중단
   성공 → props.onSubmit(result.data) 호출
```

**렌더 구조**

```
<form onSubmit={handleSubmit}>
  <Field label="제목 *" error={errors.title}>
    <input name="title" value={values.title} onChange={...} />
  </Field>
  <Field label="설명" error={errors.description}>
    <textarea name="description" ... />
  </Field>
  <Field label="우선순위">
    <select name="priority" ...>
      <option value="LOW">Low</option>
      <option value="MEDIUM">Medium</option>
      <option value="HIGH">High</option>
    </select>
  </Field>
  <div grid-cols-2>
    <Field label="계획 시작일">
      <input type="date" name="plannedStartDate" ... />
    </Field>
    <Field label="계획 종료일">
      <input type="date" name="dueDate" ... />
    </Field>
  </div>
  <footer>
    <button type="button" onClick={onCancel}>취소</button>
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? '저장 중...' : '저장'}
    </button>
  </footer>
</form>
```

---

## 7. 공통 UI 컴포넌트

### `PriorityBadge`

**파일**: `src/client/components/ui/PriorityBadge.tsx`

**Props**

```typescript
interface PriorityBadgeProps {
  priority: TicketPriority;
}
```

**색상 규칙**

| 값 | 배경색 (디자인 토큰) |
|----|----------------------|
| `LOW` | `colors.priority.low` (회색) |
| `MEDIUM` | `colors.priority.medium` (파랑) |
| `HIGH` | `colors.priority.high` (빨강) |

---

### `DateRow`

**파일**: `src/client/components/ui/DateRow.tsx`

티켓 카드에서 날짜(계획 시작일 → 계획 종료일)를 표시하고, 기한 초과 시 시각적 경고를 제공한다.

**Props**

```typescript
interface DateRowProps {
  plannedStartDate: string | null;
  dueDate:          string | null;
  isOverdue:        boolean;
}
```

**렌더 규칙**

| 조건 | 표시 |
|------|------|
| 날짜 없음 | 렌더링 생략 |
| `isOverdue === true` | 날짜 텍스트 빨간색 + "기한초과" 뱃지 |
| 정상 | 회색 텍스트 `📅 시작일 → 종료일` |

---

### `ConfirmDialog`

**파일**: `src/client/components/ui/ConfirmDialog.tsx`

삭제 확인용 다이얼로그. `TicketCard` 내부에서 사용한다.

**Props**

```typescript
interface ConfirmDialogProps {
  message:   string;
  onConfirm: () => void;
  onCancel:  () => void;
}
```

---

### `Field`

**파일**: `src/client/components/ui/Field.tsx`

폼 필드 래퍼. 레이블, 입력, 에러 메시지를 일관된 구조로 조합한다.

**Props**

```typescript
interface FieldProps {
  label:     string;
  error?:    string;
  children:  React.ReactNode;
}
```

**렌더 구조**

```
<div>
  <label>{label}</label>
  {children}
  {error && <span role="alert" color="red">{error}</span>}
</div>
```

---

## 8. 커스텀 훅

### `useTickets`

**파일**: `src/client/hooks/useTickets.ts`

전체 티켓 상태를 관리하는 주 훅. CRUD·이동 API 호출과 낙관적 업데이트를 모두 처리한다.

**시그니처**

```typescript
function useTickets(initialTickets: Ticket[]): {
  tickets:      Ticket[];
  boardColumns: Record<TicketStatus, Ticket[]>;  // status 기준 분류
  isLoading:    boolean;
  error:        string | null;

  createTicket: (input: CreateTicketInput) => Promise<void>;
  updateTicket: (id: number, input: UpdateTicketInput) => Promise<void>;
  deleteTicket: (id: number) => Promise<void>;
  moveTicket:   (id: number, input: MoveTicketInput) => Promise<void>;
}
```

**내부 동작**

| 액션 | 낙관적 업데이트 | 롤백 조건 |
|------|-----------------|-----------|
| `createTicket` | 없음 (201 응답 후 상태 반영) | API 에러 시 에러 토스트 |
| `updateTicket` | 없음 (200 응답 후 상태 반영) | API 에러 시 에러 토스트 |
| `deleteTicket` | 즉시 목록에서 제거 | API 에러 시 상태 복구 |
| `moveTicket` | 즉시 컬럼·순서 변경 | API 에러 시 상태 복구 |

**`boardColumns` 계산**

```typescript
const boardColumns = useMemo(() =>
  COLUMN_ORDER.reduce((acc, status) => {
    acc[status] = tickets
      .filter(t => t.status === status)
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {} as Record<TicketStatus, Ticket[]>),
  [tickets]
);
```

---

### `useDragDrop`

**파일**: `src/client/hooks/useDragDrop.ts`

@dnd-kit DnD 이벤트 핸들러를 캡슐화한다. `BoardPage`에서 사용하고, 결과를 `DndContext`에 전달한다.

**시그니처**

```typescript
function useDragDrop(options: {
  tickets:    Ticket[];
  onMove:     (id: number, input: MoveTicketInput) => Promise<void>;
}): {
  sensors:         SensorDescriptor<any>[];
  activeTicket:    Ticket | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver:  (event: DragOverEvent) => void;
  handleDragEnd:   (event: DragEndEvent) => void;
}
```

**이벤트별 처리**

| 이벤트 | 처리 내용 |
|--------|-----------|
| `onDragStart` | `activeTicket` 설정 (DragOverlay용) |
| `onDragOver` | 컬럼 간 이동 시 소스 컬럼 업데이트 (시각적 피드백) |
| `onDragEnd` | `moveTicket(id, { status, position })` 호출, `activeTicket` 초기화 |

**센서 설정**

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },  // 8px 이상 드래그 시 활성화 (클릭 오발화 방지)
  })
);
```

**DragOverlay 사용**

드래그 중 원본 카드는 반투명으로 유지하고, `DragOverlay`로 이동 중인 카드를 별도 레이어에 렌더링한다.

```typescript
// BoardPage 렌더링
<DndContext sensors={sensors} onDragStart={...} onDragOver={...} onDragEnd={...}>
  {/* 보드 */}
  <DragOverlay>
    {activeTicket && <TicketCard ticket={withMeta(activeTicket)} onEdit={noop} onDelete={noop} />}
  </DragOverlay>
</DndContext>
```

---

## 9. 데이터 흐름 요약

### 읽기 (초기 로드)

```
app/page.tsx (RSC)
  └─ ticketService.findAll()
       └─ DB → Ticket[]
            └─ BoardPage(initialTickets)
                 └─ useTickets(initialTickets) → boardColumns
                      └─ 각 Column → TicketCard 렌더링
```

### 쓰기 (티켓 생성)

```
Header "새 티켓" 클릭
  └─ BoardPage: setModalMode('create')
       └─ TicketModal (create)
            └─ TicketForm
                 └─ Zod 클라이언트 검증
                      └─ useTickets.createTicket(input)
                           └─ ticketApi.create(input) → POST /api/tickets
                                └─ 201 Created → tickets 상태 업데이트
                                     └─ TicketModal 닫기
```

### DnD (상태/순서 변경)

```
TicketCard 드래그 종료 (onDragEnd)
  └─ useDragDrop.handleDragEnd
       ├─ 낙관적: boardColumns 즉시 업데이트
       └─ useTickets.moveTicket(id, { status, position })
            └─ ticketApi.move(id, input) → PATCH /api/tickets/:id/move
                 ├─ 성공: 서버 position으로 상태 교체 (BR-002/003/004 자동 적용)
                 └─ 실패: 상태 롤백 + 에러 토스트
```

### 삭제

```
TicketCard 삭제 버튼 클릭
  └─ ConfirmDialog 표시
       └─ 확인 클릭
            └─ useTickets.deleteTicket(id)
                 ├─ 낙관적: tickets에서 즉시 제거
                 └─ ticketApi.delete(id) → DELETE /api/tickets/:id
                      ├─ 성공 (204): 완료
                      └─ 실패: 상태 복구 + 에러 토스트
```

---

## 10. 파일 구조

```
src/client/
├── api/
│   └── ticketApi.ts              # fetch wrapper (CREATE / READ / UPDATE / DELETE / MOVE)
│
├── components/
│   ├── board/
│   │   ├── BoardPage.tsx         # 최상위 Client 컴포넌트
│   │   ├── BacklogSidebar.tsx    # 좌측 Backlog 사이드바
│   │   ├── KanbanBoard.tsx       # 우측 3컬럼 보드
│   │   ├── Column.tsx            # 단일 컬럼 (Droppable + SortableContext)
│   │   ├── ColumnHeader.tsx      # 컬럼 제목 + 카운트
│   │   └── AddTicketButton.tsx   # "+ 추가" 버튼
│   │
│   ├── ticket/
│   │   ├── TicketCard.tsx        # 드래그 가능한 티켓 카드
│   │   ├── TicketModal.tsx       # 생성/수정 모달 (Portal)
│   │   └── TicketForm.tsx        # 폼 (제어 컴포넌트 + Zod 검증)
│   │
│   ├── layout/
│   │   ├── Header.tsx            # 앱 헤더 (sticky)
│   │   └── NewTicketButton.tsx   # 전역 새 티켓 버튼
│   │
│   └── ui/
│       ├── PriorityBadge.tsx     # 우선순위 뱃지
│       ├── DateRow.tsx           # 날짜 + 기한초과 표시
│       ├── ConfirmDialog.tsx     # 삭제 확인 다이얼로그
│       └── Field.tsx             # 폼 필드 래퍼 (레이블 + 에러)
│
├── hooks/
│   ├── useTickets.ts             # 티켓 CRUD 상태 관리
│   └── useDragDrop.ts            # @dnd-kit 이벤트 핸들러
│
└── utils/
    └── ticketMeta.ts             # withMeta() — TicketWithMeta 파생
```

---

*이 문서는 `src/client/` 하위 구현의 기준이다. 컴포넌트 추가·변경 시 이 문서를 먼저 수정한다.*
*스타일링은 `docs/DESIGN_SYSTEM.md`와 `src/shared/design/colors.json`을 참조한다.*
