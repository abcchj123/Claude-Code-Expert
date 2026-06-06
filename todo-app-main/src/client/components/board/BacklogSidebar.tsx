'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TicketCard } from '@/client/components/ticket/TicketCard';
import { withMeta } from '@/client/utils/ticketMeta';
import { TICKET_STATUS } from '@/shared/constants/columns';
import type { Ticket } from '@/shared/types';
import { AddTicketButton } from './AddTicketButton';
import { ColumnHeader } from './ColumnHeader';

interface BacklogSidebarProps {
  tickets:        Ticket[];
  onTicketEdit:   (id: number) => void;
  onTicketDelete: (id: number) => void;
  onAddTicket:    () => void;
}

export function BacklogSidebar({ tickets, onTicketEdit, onTicketDelete, onAddTicket }: BacklogSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({ id: TICKET_STATUS.BACKLOG });
  const ticketIds = tickets.map((t) => t.id);

  return (
    <aside
      ref={setNodeRef}
      className={`flex w-[280px] shrink-0 flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 transition-colors${isOver ? ' is-over' : ''}`}
    >
      <ColumnHeader title="Backlog" count={tickets.length} />
      <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-1">
          {tickets.length === 0 ? (
            <p className="py-4 text-center text-xs text-[var(--color-text-placeholder)]">
              백로그에 티켓이 없습니다
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
    </aside>
  );
}
