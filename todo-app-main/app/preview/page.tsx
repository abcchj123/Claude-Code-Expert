'use client';

// ─────────────────────────────────────────────────────────────────────────────
// /preview — 컴포넌트 갤러리
//
// 사용법:
//   npm run dev → http://localhost:3000/preview
//
// 컴포넌트 추가 방법:
//   1. 해당 Phase 섹션의 <PreviewSlot> 안에 컴포넌트를 임포트·렌더링
//   2. status를 'done'으로 변경
//   3. 아래 MOCK 섹션의 mock 데이터 활용
// ─────────────────────────────────────────────────────────────────────────────

// ── Mock 데이터 ──────────────────────────────────────────────────────────────
// Phase별 컴포넌트를 추가할 때 아래 mock 값을 prop으로 사용한다.

const MOCK_TICKET = {
  id: 1,
  title: '로그인 페이지 구현',
  description: '이메일·비밀번호 폼과 유효성 검사를 포함한 로그인 화면을 구현한다.',
  status: 'TODO' as const,
  priority: 'HIGH' as const,
  position: 1,
  plannedStartDate: '2026-06-01',
  dueDate: '2026-06-30',
  startedAt: null,
  completedAt: null,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
  isOverdue: false,
};

const MOCK_TICKET_OVERDUE = {
  ...MOCK_TICKET,
  id: 2,
  title: '기한 초과 티켓 예시',
  description: '기한이 지난 티켓의 시각 상태를 확인한다.',
  dueDate: '2026-05-01',
  isOverdue: true,
};

const MOCK_TICKET_DONE = {
  ...MOCK_TICKET,
  id: 3,
  title: '완료된 티켓 예시',
  status: 'DONE' as const,
  isOverdue: false,
};

const MOCK_TICKETS = [
  MOCK_TICKET,
  { ...MOCK_TICKET, id: 4, title: '회원가입 API 연동', priority: 'MEDIUM' as const, position: 2 },
  { ...MOCK_TICKET, id: 5, title: '대시보드 레이아웃', priority: 'LOW' as const, position: 3 },
];

// ── 헬퍼 컴포넌트 ─────────────────────────────────────────────────────────────

type SlotStatus = 'planned' | 'done';

interface PreviewSlotProps {
  name: string;
  path: string;
  status?: SlotStatus;
  width?: 'sm' | 'md' | 'lg' | 'full';
  children?: React.ReactNode;
}

function PreviewSlot({
  name,
  path,
  status = 'planned',
  width = 'md',
  children,
}: PreviewSlotProps) {
  const widthClass = {
    sm:   'col-span-1',
    md:   'col-span-1',
    lg:   'col-span-2',
    full: 'col-span-full',
  }[width];

  return (
    <div
      className={`${widthClass} rounded-xl border bg-white p-4 shadow-sm`}
      style={{ borderColor: status === 'done' ? '#10B981' : '#E5E7EB' }}
    >
      {/* 카드 헤더 */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <p className="mt-0.5 font-mono text-xs text-gray-400">{path}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          style={
            status === 'done'
              ? { background: '#D1FAE5', color: '#065F46' }
              : { background: '#F3F4F6', color: '#6B7280' }
          }
        >
          {status === 'done' ? '완료' : '예정'}
        </span>
      </div>

      {/* 컴포넌트 렌더링 영역 */}
      <div className="min-h-16 rounded-lg" style={{ background: '#F9FAFB' }}>
        {children ?? (
          <div className="flex h-16 items-center justify-center">
            <span className="text-xs text-gray-400">컴포넌트 미구현</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface PreviewSectionProps {
  phase: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function PreviewSection({ phase, title, description, children }: PreviewSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
          {phase}
        </span>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">{children}</div>
    </section>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-10">

      {/* 헤더 */}
      <div className="mb-10 border-b pb-6" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tika — Component Preview</h1>
            <p className="mt-1 text-sm text-gray-500">
              프런트엔드 컴포넌트 갤러리 · 목 데이터 기반 · DB 연결 불필요
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#3B82F6' }}
          >
            앱으로 이동 →
          </a>
        </div>

        {/* 범례 */}
        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />
            예정
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            완료
          </span>
        </div>
      </div>

      {/* ── Phase 1: 공통 UI ────────────────────────────────────────────────── */}
      <PreviewSection
        phase="Phase 1"
        title="공통 UI 컴포넌트"
        description="의존성 없는 순수 표시 컴포넌트"
      >
        <PreviewSlot
          name="PriorityBadge"
          path="src/client/components/ui/PriorityBadge.tsx"
        >
          {/* 구현 후 아래 주석을 풀고 실제 컴포넌트로 교체
          <div className="flex flex-col gap-2 p-3">
            <PriorityBadge priority="LOW" />
            <PriorityBadge priority="MEDIUM" />
            <PriorityBadge priority="HIGH" />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="DateRow"
          path="src/client/components/ui/DateRow.tsx"
        >
          {/* 구현 후 교체
          <div className="flex flex-col gap-3 p-3">
            <DateRow plannedStartDate="2026-06-01" dueDate="2026-06-30" isOverdue={false} />
            <DateRow plannedStartDate="2026-05-01" dueDate="2026-05-15" isOverdue={true} />
            <DateRow plannedStartDate={null} dueDate={null} isOverdue={false} />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="Field"
          path="src/client/components/ui/Field.tsx"
        >
          {/* 구현 후 교체
          <div className="flex flex-col gap-3 p-3">
            <Field label="제목">
              <input type="text" placeholder="입력..." className="w-full rounded border p-1 text-sm" />
            </Field>
            <Field label="에러 있는 필드" error="필수 항목입니다.">
              <input type="text" className="w-full rounded border border-red-400 p-1 text-sm" />
            </Field>
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="ConfirmDialog"
          path="src/client/components/ui/ConfirmDialog.tsx"
          width="sm"
        >
          {/* 구현 후 교체
          <div className="relative h-36">
            <ConfirmDialog
              message="이 티켓을 삭제하시겠습니까?"
              onConfirm={() => alert('삭제')}
              onCancel={() => {}}
            />
          </div>
          */}
        </PreviewSlot>
      </PreviewSection>

      {/* ── Phase 2: 티켓 컴포넌트 ─────────────────────────────────────────── */}
      <PreviewSection
        phase="Phase 2"
        title="티켓 컴포넌트"
        description="TicketCard · TicketForm · TicketModal"
      >
        <PreviewSlot
          name="TicketCard — 기본"
          path="src/client/components/ticket/TicketCard.tsx"
        >
          {/* 구현 후 교체
          <div className="p-3">
            <TicketCard
              ticket={MOCK_TICKET}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="TicketCard — 기한 초과"
          path="src/client/components/ticket/TicketCard.tsx"
        >
          {/* 구현 후 교체
          <div className="p-3">
            <TicketCard
              ticket={MOCK_TICKET_OVERDUE}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="TicketCard — 완료"
          path="src/client/components/ticket/TicketCard.tsx"
        >
          {/* 구현 후 교체
          <div className="p-3">
            <TicketCard
              ticket={MOCK_TICKET_DONE}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="TicketForm"
          path="src/client/components/ticket/TicketForm.tsx"
          width="lg"
        >
          {/* 구현 후 교체
          <div className="p-3">
            <TicketForm
              onSubmit={(data) => console.log(data)}
              onCancel={() => {}}
              isSubmitting={false}
            />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="TicketModal — create"
          path="src/client/components/ticket/TicketModal.tsx"
          width="sm"
        >
          {/* 구현 후 교체 (모달은 버튼으로 토글)
          <ModalToggle label="모달 열기">
            <TicketModal
              mode="create"
              onClose={() => {}}
              onSubmit={async () => {}}
              isSubmitting={false}
            />
          </ModalToggle>
          */}
        </PreviewSlot>
      </PreviewSection>

      {/* ── Phase 3: 레이아웃 · 보드 ────────────────────────────────────────── */}
      <PreviewSection
        phase="Phase 3"
        title="레이아웃 · 보드 컴포넌트"
        description="Header · Column · KanbanBoard · BacklogSidebar"
      >
        <PreviewSlot
          name="NewTicketButton"
          path="src/client/components/layout/NewTicketButton.tsx"
          width="sm"
        >
          {/* 구현 후 교체
          <div className="flex items-center justify-center p-4">
            <NewTicketButton onClick={() => {}} />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="AddTicketButton"
          path="src/client/components/board/AddTicketButton.tsx"
          width="sm"
        >
          {/* 구현 후 교체
          <div className="flex items-center justify-center p-4">
            <AddTicketButton onClick={() => {}} />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="ColumnHeader"
          path="src/client/components/board/ColumnHeader.tsx"
          width="sm"
        >
          {/* 구현 후 교체
          <div className="flex flex-col gap-2 p-3">
            <ColumnHeader title="Backlog" count={5} />
            <ColumnHeader title="TODO" count={3} />
            <ColumnHeader title="In Progress" count={1} />
            <ColumnHeader title="Done" count={0} />
          </div>
          */}
        </PreviewSlot>

        <PreviewSlot
          name="Header"
          path="src/client/components/layout/Header.tsx"
          width="full"
        >
          {/* 구현 후 교체
          <Header onNewTicket={() => {}} />
          */}
        </PreviewSlot>

        <PreviewSlot
          name="Column — TODO"
          path="src/client/components/board/Column.tsx"
          width="lg"
        >
          {/* 구현 후 교체
          <Column
            status="TODO"
            tickets={MOCK_TICKETS}
            onTicketEdit={() => {}}
            onTicketDelete={() => {}}
            onAddTicket={() => {}}
          />
          */}
        </PreviewSlot>

        <PreviewSlot
          name="Column — 빈 컬럼"
          path="src/client/components/board/Column.tsx"
          width="sm"
        >
          {/* 구현 후 교체
          <Column
            status="DONE"
            tickets={[]}
            onTicketEdit={() => {}}
            onTicketDelete={() => {}}
            onAddTicket={() => {}}
          />
          */}
        </PreviewSlot>

        <PreviewSlot
          name="BacklogSidebar"
          path="src/client/components/board/BacklogSidebar.tsx"
          width="lg"
        >
          {/* 구현 후 교체
          <BacklogSidebar
            tickets={MOCK_TICKETS}
            onTicketEdit={() => {}}
            onTicketDelete={() => {}}
            onAddTicket={() => {}}
          />
          */}
        </PreviewSlot>

        <PreviewSlot
          name="KanbanBoard"
          path="src/client/components/board/KanbanBoard.tsx"
          width="full"
        >
          {/* 구현 후 교체 (DndContext 필요)
          <DndContext>
            <KanbanBoard
              tickets={MOCK_TICKETS}
              onTicketEdit={() => {}}
              onTicketDelete={() => {}}
              onAddTicket={() => {}}
            />
          </DndContext>
          */}
        </PreviewSlot>
      </PreviewSection>

      {/* ── Phase 4: 훅 (시각적 미리보기 없음) ────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
            Phase 4
          </span>
          <h2 className="text-lg font-bold text-gray-900">커스텀 훅</h2>
          <p className="text-sm text-gray-500">시각적 미리보기 없음 — 단위 테스트로 검증</p>
        </div>
        <div className="rounded-xl border border-dashed p-4" style={{ borderColor: '#D1D5DB' }}>
          <ul className="space-y-1 text-sm text-gray-500">
            <li>
              <code className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">useTickets</code>
              src/client/hooks/useTickets.ts
            </li>
            <li>
              <code className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">useDragDrop</code>
              src/client/hooks/useDragDrop.ts
            </li>
          </ul>
        </div>
      </section>

      {/* ── Phase 5: 페이지 통합 ────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
            Phase 5
          </span>
          <h2 className="text-lg font-bold text-gray-900">페이지 통합</h2>
          <p className="text-sm text-gray-500">BoardPage · app/page.tsx (RSC)</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
          <p className="mb-3 text-sm text-gray-600">
            BoardPage는 전체 화면을 차지하므로 별도 페이지에서 확인합니다.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: '#3B82F6' }}
          >
            / 메인 페이지로 이동 →
          </a>
        </div>
      </section>

      {/* 푸터 */}
      <div className="border-t pt-6 text-center text-xs text-gray-400" style={{ borderColor: '#E5E7EB' }}>
        Tika Preview Page · DB 연결 없이 동작 · localhost:3000/preview
      </div>
    </div>
  );
}
