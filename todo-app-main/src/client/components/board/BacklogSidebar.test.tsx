/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BacklogSidebar } from './BacklogSidebar';
import type { Ticket } from '@/shared/types';

// ── dnd-kit mocks ────────────────────────────────────────────────────────────
jest.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }),
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: null,
}));

// TicketCard mock
jest.mock('@/client/components/ticket/TicketCard', () => ({
  TicketCard: ({ ticket }: { ticket: { title: string } }) => (
    <div data-testid="ticket-card">{ticket.title}</div>
  ),
}));

// withMeta mock
jest.mock('@/client/utils/ticketMeta', () => ({
  withMeta: (t: Ticket) => ({ ...t, isOverdue: false }),
}));

// ── 공통 픽스처 ──────────────────────────────────────────────────────────────
const makeTicket = (override: Partial<Ticket> = {}): Ticket => ({
  id: 1,
  title: '백로그 티켓',
  description: null,
  status: 'BACKLOG',
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
  tickets: [] as Ticket[],
  onTicketEdit:   jest.fn(),
  onTicketDelete: jest.fn(),
  onAddTicket:    jest.fn(),
};

// ── 테스트 ───────────────────────────────────────────────────────────────────
describe('BacklogSidebar', () => {
  it('ColumnHeader가 "Backlog" 텍스트로 렌더링된다', () => {
    render(<BacklogSidebar {...defaultProps} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Backlog' })).toBeInTheDocument();
  });

  it('tickets.length만큼 TicketCard가 렌더링된다', () => {
    const tickets = [makeTicket({ id: 1, title: 'A' }), makeTicket({ id: 2, title: 'B' })];
    render(<BacklogSidebar {...defaultProps} tickets={tickets} />);
    expect(screen.getAllByTestId('ticket-card')).toHaveLength(2);
  });

  it('tickets=[] → 빈 상태 메시지가 표시된다', () => {
    render(<BacklogSidebar {...defaultProps} />);
    expect(screen.getByText('백로그에 티켓이 없습니다')).toBeInTheDocument();
  });

  it('AddTicketButton이 렌더링된다', () => {
    render(<BacklogSidebar {...defaultProps} />);
    expect(screen.getByText('추가')).toBeInTheDocument();
  });

  it('AddTicketButton 클릭 → onAddTicket이 호출된다', async () => {
    const user = userEvent.setup();
    const onAddTicket = jest.fn();
    render(<BacklogSidebar {...defaultProps} onAddTicket={onAddTicket} />);
    await user.click(screen.getByText('추가'));
    expect(onAddTicket).toHaveBeenCalledTimes(1);
  });

  it('aside 엘리먼트로 렌더링된다', () => {
    const { container } = render(<BacklogSidebar {...defaultProps} />);
    expect(container.querySelector('aside')).toBeInTheDocument();
  });
});
