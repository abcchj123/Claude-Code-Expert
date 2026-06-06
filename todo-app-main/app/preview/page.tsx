'use client';

import { useState } from 'react';
import { Button } from '@/client/components/ui/Button';
import { ConfirmDialog } from '@/client/components/ui/ConfirmDialog';
import { TicketModal } from '@/client/components/ticket/TicketModal';

// ── Mock 데이터 ───────────────────────────────────────────────────────────────

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
};

const MOCK_TICKETS = [
  MOCK_TICKET,
  { ...MOCK_TICKET, id: 4, title: '회원가입 API 연동', priority: 'MEDIUM' as const, position: 2 },
  { ...MOCK_TICKET, id: 5, title: '대시보드 레이아웃', priority: 'LOW' as const, position: 3 },
];

// ── 인터랙티브 서브 컴포넌트 ──────────────────────────────────────────────────
// 토글 상태(useState)가 필요한 컴포넌트는 여기서 캡슐화한다.

function ConfirmDialogPreview() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        삭제 확인 열기
      </Button>
      {result && (
        <p className="text-xs" style={{ color: result === '확인' ? '#10B981' : '#6B7280' }}>
          → {result} 클릭됨
        </p>
      )}
      {open && (
        <ConfirmDialog
          message="이 티켓을 삭제하시겠습니까?"
          onConfirm={() => { setResult('확인'); setOpen(false); }}
          onCancel={() => { setResult('취소'); setOpen(false); }}
        />
      )}
    </div>
  );
}

function ModalPreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <Button onClick={() => setOpen(true)}>모달 열기</Button>
      <p className="text-center text-xs text-gray-400">
        ESC · 오버레이 클릭으로 닫기
      </p>
      {open && (
        <TicketModal
          mode="create"
          onClose={() => setOpen(false)}
          onSubmit={async () => setOpen(false)}
          isSubmitting={false}
        />
      )}
    </div>
  );
}

// ── 공통 헬퍼 컴포넌트 ───────────────────────────────────────────────────────

type SlotStatus = 'planned' | 'done';

interface PreviewSlotProps {
  name: string;
  path: string;
  status?: SlotStatus;
  width?: 'sm' | 'md' | 'lg' | 'full';
  children?: React.ReactNode;
}

function PreviewSlot({ name, path, status = 'planned', width = 'md', children }: PreviewSlotProps) {
  const widthClass = { sm: 'col-span-1', md: 'col-span-1', lg: 'col-span-2', full: 'col-span-full' }[width];
  return (
    <div
      className={`${widthClass} rounded-xl border bg-white p-4 shadow-sm`}
      style={{ borderColor: status === 'done' ? '#10B981' : '#E5E7EB' }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">{name}</p>
          <p className="mt-0.5 font-mono text-xs text-gray-400">{path}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          style={status === 'done'
            ? { background: '#D1FAE5', color: '#065F46' }
            : { background: '#F3F4F6', color: '#6B7280' }}
        >
          {status === 'done' ? '완료' : '예정'}
        </span>
      </div>
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
  phaseColor?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function PreviewSection({ phase, phaseColor = 'bg-blue-100 text-blue-700', title, description, children }: PreviewSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline gap-3">
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${phaseColor}`}>{phase}</span>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">{children}</div>
    </section>
  );
}

// ── 페이지 ───────────────────────────────────────────────────────────────────

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
          <a href="/" className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: '#3B82F6' }}>
            앱으로 이동 →
          </a>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />예정
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />완료
          </span>
        </div>
      </div>

      {/* ── Button ───────────────────────────────────────────────────────────── */}
      <PreviewSection
        phase="UI"
        phaseColor="bg-indigo-100 text-indigo-700"
        title="Button"
        description="variant · size · isLoading"
      >
        {/* Variant */}
        <PreviewSlot
          name="Variants"
          path="src/client/components/ui/Button.tsx"
          status="done"
          width="full"
        >
          <div className="flex flex-wrap items-center gap-3 p-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </PreviewSlot>

        {/* Size */}
        <PreviewSlot
          name="Sizes"
          path="src/client/components/ui/Button.tsx"
          status="done"
          width="lg"
        >
          <div className="flex items-center gap-3 p-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </PreviewSlot>

        {/* isLoading */}
        <PreviewSlot
          name="isLoading"
          path="src/client/components/ui/Button.tsx"
          status="done"
          width="sm"
        >
          <div className="flex flex-col gap-2 p-4">
            <Button isLoading>저장</Button>
            <Button variant="secondary" isLoading>처리</Button>
          </div>
        </PreviewSlot>
      </PreviewSection>

      {/* ── Phase 1: 공통 UI ─────────────────────────────────────────────────── */}
      <PreviewSection
        phase="Phase 1"
        title="공통 UI 컴포넌트"
        description="PriorityBadge · DateRow · Field · ConfirmDialog"
      >
        <PreviewSlot name="PriorityBadge" path="src/client/components/ui/PriorityBadge.tsx" />
        <PreviewSlot name="DateRow"       path="src/client/components/ui/DateRow.tsx" />
        <PreviewSlot name="Field"         path="src/client/components/ui/Field.tsx" />

        {/* ConfirmDialog — 버튼으로 열기 */}
        <PreviewSlot
          name="ConfirmDialog"
          path="src/client/components/ui/ConfirmDialog.tsx"
          status="done"
          width="sm"
        >
          <ConfirmDialogPreview />
        </PreviewSlot>
      </PreviewSection>

      {/* ── Phase 2: 티켓 컴포넌트 ───────────────────────────────────────────── */}
      <PreviewSection
        phase="Phase 2"
        title="티켓 컴포넌트"
        description="TicketCard · TicketForm · TicketModal"
      >
        <PreviewSlot name="TicketCard — 기본"    path="src/client/components/ticket/TicketCard.tsx" />
        <PreviewSlot name="TicketCard — 기한초과" path="src/client/components/ticket/TicketCard.tsx" />
        <PreviewSlot name="TicketCard — 완료"    path="src/client/components/ticket/TicketCard.tsx" />
        <PreviewSlot name="TicketForm" path="src/client/components/ticket/TicketForm.tsx" width="lg" />

        {/* TicketModal — 버튼으로 열기/닫기 */}
        <PreviewSlot
          name="TicketModal — create"
          path="src/client/components/ticket/TicketModal.tsx"
          status="done"
          width="sm"
        >
          <ModalPreview />
        </PreviewSlot>
      </PreviewSection>

      {/* ── Phase 3: 레이아웃 · 보드 ─────────────────────────────────────────── */}
      <PreviewSection
        phase="Phase 3"
        title="레이아웃 · 보드 컴포넌트"
        description="Header · Column · KanbanBoard · BacklogSidebar"
      >
        <PreviewSlot name="NewTicketButton"  path="src/client/components/layout/NewTicketButton.tsx" width="sm" />
        <PreviewSlot name="AddTicketButton"  path="src/client/components/board/AddTicketButton.tsx"  width="sm" />
        <PreviewSlot name="ColumnHeader"     path="src/client/components/board/ColumnHeader.tsx"     width="sm" />
        <PreviewSlot name="Header"           path="src/client/components/layout/Header.tsx"          width="full" />
        <PreviewSlot name="Column — TODO"    path="src/client/components/board/Column.tsx"           width="lg" />
        <PreviewSlot name="Column — 빈 컬럼" path="src/client/components/board/Column.tsx"           width="sm" />
        <PreviewSlot name="BacklogSidebar"   path="src/client/components/board/BacklogSidebar.tsx"   width="lg" />
        <PreviewSlot name="KanbanBoard"      path="src/client/components/board/KanbanBoard.tsx"      width="full" />
      </PreviewSection>

      {/* ── Phase 4: 훅 ──────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">Phase 4</span>
          <h2 className="text-lg font-bold text-gray-900">커스텀 훅</h2>
          <p className="text-sm text-gray-500">시각적 미리보기 없음 — 단위 테스트로 검증</p>
        </div>
        <div className="rounded-xl border border-dashed p-4" style={{ borderColor: '#D1D5DB' }}>
          <ul className="space-y-1 text-sm text-gray-500">
            <li><code className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">useTickets</code>src/client/hooks/useTickets.ts</li>
            <li><code className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs">useDragDrop</code>src/client/hooks/useDragDrop.ts</li>
          </ul>
        </div>
      </section>

      {/* ── Phase 5: 페이지 통합 ─────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">Phase 5</span>
          <h2 className="text-lg font-bold text-gray-900">페이지 통합</h2>
          <p className="text-sm text-gray-500">BoardPage · app/page.tsx (RSC)</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
          <p className="mb-3 text-sm text-gray-600">BoardPage는 전체 화면을 차지하므로 별도 페이지에서 확인합니다.</p>
          <a href="/" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: '#3B82F6' }}>
            / 메인 페이지로 이동 →
          </a>
        </div>
      </section>

      <div className="border-t pt-6 text-center text-xs text-gray-400" style={{ borderColor: '#E5E7EB' }}>
        Tika Preview Page · DB 연결 없이 동작 · localhost:3000/preview
      </div>
    </div>
  );
}
