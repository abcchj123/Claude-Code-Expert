/**
 * TC-COMP-005: TicketDetailView
 * status · startedAt · completedAt · createdAt 읽기 전용 표시
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TicketDetailView } from './TicketDetailView';
import type { Ticket } from '@/shared/types';

const makeTicket = (override: Partial<Ticket> = {}): Ticket => ({
  id: 1,
  title: '테스트 티켓',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 1,
  plannedStartDate: null,
  dueDate: null,
  startedAt: '2026-06-01T09:00:00.000Z',
  completedAt: null,
  createdAt: '2026-05-30T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
  ...override,
});

describe('TicketDetailView', () => {
  // ── DV-1 ──────────────────────────────────────────────────────────────────
  it('DV-1: status에 해당하는 한국어 레이블이 렌더링된다', () => {
    render(<TicketDetailView ticket={makeTicket({ status: 'IN_PROGRESS' })} />);
    expect(screen.getByText('진행 중')).toBeInTheDocument();
  });

  // ── DV-2 ──────────────────────────────────────────────────────────────────
  it('DV-2: startedAt · createdAt 날짜를 YYYY-MM-DD 형식으로 렌더링한다', () => {
    render(
      <TicketDetailView
        ticket={makeTicket({
          startedAt: '2026-06-01T09:00:00.000Z',
          createdAt: '2026-05-30T09:00:00.000Z',
        })}
      />,
    );
    expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    expect(screen.getByText('2026-05-30')).toBeInTheDocument();
  });

  // ── DV-3 ──────────────────────────────────────────────────────────────────
  it('DV-3: null 날짜 필드는 "—"로 표시된다', () => {
    render(<TicketDetailView ticket={makeTicket({ startedAt: null, completedAt: null })} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2); // startedAt + completedAt
  });
});
