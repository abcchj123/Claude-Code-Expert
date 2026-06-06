/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Column } from './Column';
import type { Ticket } from '@/shared/types';

// ── dnd-kit mocks ────────────────────────────────────────────────────────────
jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: null,
}));

// TicketCard mock — 제목만 렌더링하여 Column 로직에 집중한다
jest.mock('@/client/components/ticket/TicketCard', () => ({
  TicketCard: ({ ticket }: { ticket: { title: string } }) => (
    <div data-testid="ticket-card">{ticket.title}</div>
  ),
}));

// withMeta mock — isOverdue 계산 없이 단순 전달
jest.mock('@/client/utils/ticketMeta', () => ({
  withMeta: (t: Ticket) => ({ ...t, isOverdue: false }),
}));

// ── 공통 픽스처 ──────────────────────────────────────────────────────────────
const makeTicket = (override: Partial<Ticket> = {}): Ticket => ({
  id: 1,
  title: '로그인 구현',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 1,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  ...override,
});

const defaultProps = {
  status: 'TODO' as const,
  tickets: [] as Ticket[],
  onTicketEdit: jest.fn(),
  onTicketDelete: jest.fn(),
  onAddTicket: jest.fn(),
};

// ── 테스트 ───────────────────────────────────────────────────────────────────
describe('Column', () => {
  it('ColumnHeader에 COLUMN_LABELS[status] 텍스트가 표시된다', () => {
    render(<Column {...defaultProps} status="IN_PROGRESS" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('In Progress');
  });

  it('tickets.length만큼 TicketCard가 렌더링된다', () => {
    const tickets = [makeTicket({ id: 1, title: 'A' }), makeTicket({ id: 2, title: 'B' })];
    render(<Column {...defaultProps} tickets={tickets} />);
    expect(screen.getAllByTestId('ticket-card')).toHaveLength(2);
  });

  it('tickets=[] → 빈 상태 메시지가 표시된다', () => {
    render(<Column {...defaultProps} />);
    expect(screen.getByText('이 컬럼에 티켓이 없습니다')).toBeInTheDocument();
  });

  it('AddTicketButton이 렌더링된다', () => {
    render(<Column {...defaultProps} />);
    expect(screen.getByText('추가')).toBeInTheDocument();
  });

  it('AddTicketButton 클릭 → onAddTicket이 호출된다', async () => {
    const user = userEvent.setup();
    const onAddTicket = jest.fn();
    render(<Column {...defaultProps} onAddTicket={onAddTicket} />);
    await user.click(screen.getByText('추가'));
    expect(onAddTicket).toHaveBeenCalledTimes(1);
  });

  it('isOver=true → 컨테이너에 is-over 클래스가 적용된다', () => {
    const { container } = render(<Column {...defaultProps} isOver />);
    expect(container.firstChild).toHaveClass('is-over');
  });

  it('status="TODO" → bg-column-todo 클래스가 적용된다', () => {
    const { container } = render(<Column {...defaultProps} status="TODO" />);
    expect(container.firstChild).toHaveClass('bg-column-todo');
  });

  it('status="IN_PROGRESS" → bg-column-in-progress 클래스가 적용된다', () => {
    const { container } = render(<Column {...defaultProps} status="IN_PROGRESS" />);
    expect(container.firstChild).toHaveClass('bg-column-in-progress');
  });
});
