/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCard } from '@/client/components/ticket/TicketCard';
import type { TicketWithMeta } from '@/shared/types';

// ── dnd-kit mock ─────────────────────────────────────────────────────────────
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

// ── 공통 픽스처 ──────────────────────────────────────────────────────────────
const baseTicket: TicketWithMeta = {
  id: 1,
  title: '로그인 페이지 구현',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 1,
  plannedStartDate: '2026-06-01',
  dueDate: '2026-06-30',
  startedAt: null,
  completedAt: null,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
  isOverdue: false,
};

// ── 테스트 ───────────────────────────────────────────────────────────────────
describe('TicketCard', () => {
  // C001-1: 기본 렌더링 ────────────────────────────────────────────────────
  it('C001-1: 제목, 우선순위 뱃지, 종료예정일이 렌더링된다', () => {
    render(<TicketCard ticket={baseTicket} onEdit={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByText('로그인 페이지 구현')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText(/2026-06-30/)).toBeInTheDocument();
  });

  // C001-2: 오버듀 표시 ────────────────────────────────────────────────────
  // Red: 현재 구현은 CSS border 클래스로만 처리하며 data-overdue 속성이 없다
  it('C001-2: isOverdue=true → 카드 루트에 data-overdue="true" 속성이 있다', () => {
    const ticket = { ...baseTicket, isOverdue: true };
    const { container } = render(
      <TicketCard ticket={ticket} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveAttribute('data-overdue', 'true');
  });

  // C001-3: 완료 상태 ──────────────────────────────────────────────────────
  // Red: 현재 구현은 h3에 line-through 클래스를 적용하지만 카드에 ticket-card-done 클래스는 없다
  it('C001-3: status=DONE → 카드 루트에 ticket-card-done 클래스가 있다', () => {
    const ticket = { ...baseTicket, status: 'DONE' as const };
    const { container } = render(
      <TicketCard ticket={ticket} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('ticket-card-done');
  });

  // C001-4: dueDate=null ───────────────────────────────────────────────────
  it('C001-4: dueDate=null → 날짜 영역이 렌더링되지 않는다', () => {
    const ticket = { ...baseTicket, plannedStartDate: null, dueDate: null };
    render(<TicketCard ticket={ticket} onEdit={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.queryByText(/📅/)).not.toBeInTheDocument();
  });

  // C001-5: 클릭 → onClick 호출 ────────────────────────────────────────────
  // Red: 현재 TicketCard는 onClick prop을 받지 않는다
  it('C001-5: 카드 클릭 → onClick이 호출된다', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AnyCard = TicketCard as React.FC<any>;
    const { container } = render(
      <AnyCard ticket={baseTicket} onEdit={jest.fn()} onDelete={jest.fn()} onClick={onClick} />,
    );

    await user.click(container.firstChild as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // C001-6: 긴 제목 말줄임 ────────────────────────────────────────────────
  it('C001-6: 긴 제목에 line-clamp-2 클래스가 적용된다', () => {
    const ticket = { ...baseTicket, title: 'A'.repeat(100) };
    render(<TicketCard ticket={ticket} onEdit={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('line-clamp-2');
  });

  // C001-7: 우선순위별 data-priority 속성 ──────────────────────────────────
  // Red: 현재 PriorityBadge에 data-priority 속성이 없다
  it.each([
    ['LOW',    'Low'],
    ['MEDIUM', 'Medium'],
    ['HIGH',   'High'],
  ])(
    'C001-7: priority=%s → 뱃지에 data-priority="%s" 속성이 있다',
    (priority, label) => {
      const ticket = { ...baseTicket, priority: priority as TicketWithMeta['priority'] };
      render(<TicketCard ticket={ticket} onEdit={jest.fn()} onDelete={jest.fn()} />);

      expect(screen.getByText(label)).toHaveAttribute('data-priority', priority);
    },
  );
});
