'use client';

import type { Ticket } from '@/shared/types';

const STATUS_LABEL: Record<Ticket['status'], string> = {
  BACKLOG:     '백로그',
  TODO:        'TODO',
  IN_PROGRESS: '진행 중',
  DONE:        '완료',
};

function formatDate(date: string | null): string {
  if (!date) return '—';
  return date.slice(0, 10);
}

interface TicketDetailViewProps {
  ticket: Ticket;
}

export function TicketDetailView({ ticket }: TicketDetailViewProps) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-[var(--color-background)] p-3 text-sm">
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">상태</dt>
        <dd className="font-medium text-[var(--color-text-primary)]">{STATUS_LABEL[ticket.status]}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">생성일</dt>
        <dd className="font-medium text-[var(--color-text-primary)]">{formatDate(ticket.createdAt)}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">시작일</dt>
        <dd className="font-medium text-[var(--color-text-primary)]">{formatDate(ticket.startedAt)}</dd>
      </div>
      <div>
        <dt className="text-xs text-[var(--color-text-secondary)]">완료일</dt>
        <dd className="font-medium text-[var(--color-text-primary)]">{formatDate(ticket.completedAt)}</dd>
      </div>
    </dl>
  );
}
