'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TicketCard } from '@/client/components/ticket/TicketCard';
import { withMeta } from '@/client/utils/ticketMeta';
import type { TicketStatus } from '@/shared/constants/columns';
import type { Ticket } from '@/shared/types';
import { AddTicketButton } from './AddTicketButton';
import { ColumnHeader } from './ColumnHeader';

const COLUMN_LABELS: Record<TicketStatus, string> = {
  BACKLOG:     'Backlog',
  TODO:        'TODO',
  IN_PROGRESS: 'In Progress',
  DONE:        'Done',
};

const STATUS_BG: Record<TicketStatus, string> = {
  BACKLOG:     '',
  TODO:        'bg-column-todo',
  IN_PROGRESS: 'bg-column-in-progress',
  DONE:        'bg-column-done',
};

interface ColumnProps {
  status:         TicketStatus;
  tickets:        Ticket[];
  onTicketEdit:   (id: number) => void;
  onTicketDelete: (id: number) => void;
  onAddTicket:    () => void;
  isOver?:        boolean;
}

export function Column({ status, tickets, onTicketEdit, onTicketDelete, onAddTicket, isOver }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const ticketIds = tickets.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border border-[var(--color-border)] p-2 transition-colors ${STATUS_BG[status]}${isOver ? ' is-over' : ''}`}
    >
      <ColumnHeader title={COLUMN_LABELS[status]} count={tickets.length} />
      <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 overflow-y-auto py-1">
          {tickets.length === 0 ? (
            <p className="py-4 text-center text-xs text-[var(--color-text-placeholder)]">
              이 컬럼에 티켓이 없습니다
            </p>
          ) : (
            tickets.map((t) => (
              <TicketCard
                key={t.id}
                ticket={withMeta(t)}
                onEdit={onTicketEdit}
                onDelete={onTicketDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
      <AddTicketButton onClick={onAddTicket} />
    </div>
  );
}
