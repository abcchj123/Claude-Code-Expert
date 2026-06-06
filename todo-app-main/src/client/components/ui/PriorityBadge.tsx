'use client';

import type { TicketPriority } from '@/shared/types';

const LABEL: Record<TicketPriority, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
const COLOR: Record<TicketPriority, string> = {
  LOW:    'bg-[var(--color-priority-low)]    text-white',
  MEDIUM: 'bg-[var(--color-priority-medium)] text-white',
  HIGH:   'bg-[var(--color-priority-high)]   text-white',
};

interface PriorityBadgeProps { priority: TicketPriority }

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${COLOR[priority]}`}>
      {LABEL[priority]}
    </span>
  );
}
