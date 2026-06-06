/**
 * TC-COMP-006: TicketModal
 * Modal + TicketDetailView + TicketForm + ConfirmDialog 조합
 * 삭제: 삭제 버튼 → ConfirmDialog → 확인 2단계 흐름
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketModal } from './TicketModal';
import type { Ticket } from '@/shared/types';

// ── createPortal → 인라인 렌더링 ────────────────────────────────────────────
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

// ── 자식 컴포넌트 mocks ────────────────────────────────────────────────────
jest.mock('./TicketForm', () => ({
  TicketForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="ticket-form">
      <button onClick={onCancel}>취소</button>
    </div>
  ),
}));

jest.mock('./TicketDetailView', () => ({
  TicketDetailView: () => <div data-testid="ticket-detail-view" />,
}));

jest.mock('@/client/components/ui/ConfirmDialog', () => ({
  ConfirmDialog: ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <div data-testid="confirm-dialog">
      <button onClick={onConfirm}>확인</button>
      <button onClick={onCancel}>취소</button>
    </div>
  ),
}));

// ── 공통 픽스처 ──────────────────────────────────────────────────────────────
const MOCK_TICKET: Ticket = {
  id: 1,
  title: '테스트 티켓',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 1,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
};

const defaultProps = {
  onClose:      jest.fn(),
  onSubmit:     jest.fn(),
  isSubmitting: false,
};

// ── 테스트 ───────────────────────────────────────────────────────────────────
describe('TicketModal', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── TM-1 ──────────────────────────────────────────────────────────────────
  it('TM-1: mode="create" → 헤더에 "새 티켓" 텍스트가 표시된다', () => {
    render(<TicketModal {...defaultProps} mode="create" />);
    expect(screen.getByText('새 티켓')).toBeInTheDocument();
  });

  // ── TM-2 ──────────────────────────────────────────────────────────────────
  it('TM-2: mode="edit" → 헤더에 "티켓 수정" 텍스트가 표시된다', () => {
    render(<TicketModal {...defaultProps} mode="edit" ticket={MOCK_TICKET} />);
    expect(screen.getByText('티켓 수정')).toBeInTheDocument();
  });

  // ── TM-3 ──────────────────────────────────────────────────────────────────
  it('TM-3: mode="edit" + ticket → TicketDetailView가 렌더링된다', () => {
    render(<TicketModal {...defaultProps} mode="edit" ticket={MOCK_TICKET} />);
    expect(screen.getByTestId('ticket-detail-view')).toBeInTheDocument();
  });

  // ── TM-4 ──────────────────────────────────────────────────────────────────
  it('TM-4: 닫기(×) 버튼 클릭 → onClose가 호출된다', async () => {
    const user = userEvent.setup();
    render(<TicketModal {...defaultProps} mode="create" />);
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // ── TM-5 ──────────────────────────────────────────────────────────────────
  // fireEvent.click: 이벤트를 role="dialog" 요소에 직접 디스패치
  // (userEvent.click은 내부 콘텐츠 중앙에 이벤트를 발생시켜 stopPropagation에 막힘)
  it('TM-5: 오버레이(backdrop) 클릭 → onClose가 호출된다', () => {
    render(<TicketModal {...defaultProps} mode="create" />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // ── TM-6 ──────────────────────────────────────────────────────────────────
  // 모달 내부 클릭 → 내부 div의 stopPropagation이 role="dialog"까지 전파를 차단
  it('TM-6: 모달 내부 클릭 → onClose가 호출되지 않는다', async () => {
    const user = userEvent.setup();
    render(<TicketModal {...defaultProps} mode="create" />);
    await user.click(screen.getByTestId('ticket-form'));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  // ── TM-7 ──────────────────────────────────────────────────────────────────
  it('TM-7: mode="edit" 삭제 버튼 → ConfirmDialog 표시 → 확인 → onDelete 호출', async () => {
    const onDelete = jest.fn();
    const user     = userEvent.setup();
    render(<TicketModal {...defaultProps} mode="edit" ticket={MOCK_TICKET} onDelete={onDelete} />);

    // 초기엔 ConfirmDialog 없음
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();

    // 삭제 버튼 클릭
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();

    // 확인 클릭 → onDelete 호출
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
