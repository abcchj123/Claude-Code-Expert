/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanBoard } from './KanbanBoard';
import type { Ticket } from '@/shared/types';

// Column mock — status별 구분을 위해 data-testid와 내부 티켓 제목을 노출한다
jest.mock('./Column', () => ({
  Column: ({ status, tickets, onAddTicket }: {
    status: string;
    tickets: Ticket[];
    onAddTicket: () => void;
  }) => (
    <div data-testid={`col-${status}`}>
      {tickets.map((t) => (
        <span key={t.id} data-testid="col-ticket">{t.title}</span>
      ))}
      <button onClick={onAddTicket}>add-{status}</button>
    </div>
  ),
}));

const makeTicket = (override: Partial<Ticket> = {}): Ticket => ({
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
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  ...override,
});

describe('KanbanBoard', () => {
  const defaultProps = {
    tickets: [] as Ticket[],
    onTicketEdit: jest.fn(),
    onTicketDelete: jest.fn(),
    onAddTicket: jest.fn(),
  };

  it('TODO · IN_PROGRESS · DONE 3개 컬럼이 렌더링된다', () => {
    render(<KanbanBoard {...defaultProps} />);
    expect(screen.getByTestId('col-TODO')).toBeInTheDocument();
    expect(screen.getByTestId('col-IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByTestId('col-DONE')).toBeInTheDocument();
  });

  it('각 status 티켓이 해당 컬럼에만 전달된다', () => {
    const tickets = [
      makeTicket({ id: 1, title: 'todo-1',   status: 'TODO' }),
      makeTicket({ id: 2, title: 'ip-1',     status: 'IN_PROGRESS' }),
      makeTicket({ id: 3, title: 'done-1',   status: 'DONE' }),
    ];
    render(<KanbanBoard {...defaultProps} tickets={tickets} />);

    expect(screen.getByTestId('col-TODO')).toHaveTextContent('todo-1');
    expect(screen.getByTestId('col-IN_PROGRESS')).toHaveTextContent('ip-1');
    expect(screen.getByTestId('col-DONE')).toHaveTextContent('done-1');
  });

  it('BACKLOG 티켓은 어느 컬럼에도 표시되지 않는다', () => {
    const tickets = [makeTicket({ id: 9, title: 'backlog-1', status: 'BACKLOG' })];
    render(<KanbanBoard {...defaultProps} tickets={tickets} />);

    expect(screen.getByTestId('col-TODO')).not.toHaveTextContent('backlog-1');
    expect(screen.getByTestId('col-IN_PROGRESS')).not.toHaveTextContent('backlog-1');
    expect(screen.getByTestId('col-DONE')).not.toHaveTextContent('backlog-1');
  });

  it('onAddTicket이 컬럼 버튼 클릭 시 호출된다', async () => {
    const user = userEvent.setup();
    const onAddTicket = jest.fn();
    render(<KanbanBoard {...defaultProps} onAddTicket={onAddTicket} />);
    await user.click(screen.getByText('add-TODO'));
    expect(onAddTicket).toHaveBeenCalledTimes(1);
  });
});
