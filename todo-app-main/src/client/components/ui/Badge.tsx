'use client';

import type { TicketPriority } from '@/shared/types';

// ── PriorityBadge ─────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  LOW:    'Low',
  MEDIUM: 'Medium',
  HIGH:   'High',
};

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  LOW:    'bg-[var(--color-priority-low)]    text-white',
  MEDIUM: 'bg-[var(--color-priority-medium)] text-white',
  HIGH:   'bg-[var(--color-priority-high)]   text-white',
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      data-priority={priority}
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${PRIORITY_COLOR[priority]}`}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

// ── DueDateBadge ──────────────────────────────────────────────────────────────

interface DueDateBadgeProps {
  plannedStartDate: string | null;
  dueDate:          string | null;
  isOverdue:        boolean;
}

export function DueDateBadge({ plannedStartDate, dueDate, isOverdue }: DueDateBadgeProps) {
  if (!plannedStartDate && !dueDate) return null;

  const dateText = [plannedStartDate, dueDate].filter(Boolean).join(' → ');

  return (
    <div
      className={`flex items-center gap-1 text-xs ${
        isOverdue ? 'text-[var(--color-overdue)]' : 'text-[var(--color-text-secondary)]'
      }`}
    >
      <span>📅 {dateText}</span>
      {isOverdue && (
        <span className="rounded bg-[var(--color-overdue)] px-1 py-0.5 text-white">기한초과</span>
      )}
    </div>
  );
}
