'use client';

import { TICKET_STATUS, type TicketStatus } from '@/shared/constants/columns';
import type { Ticket } from '@/shared/types';
import { Column } from './Column';

const BOARD_STATUSES: TicketStatus[] = [TICKET_STATUS.TODO, TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.DONE];

interface KanbanBoardProps {
  tickets:        Ticket[];
  onTicketEdit:   (id: number) => void;
  onTicketDelete: (id: number) => void;
  onAddTicket:    () => void;
}

export function KanbanBoard({ tickets, onTicketEdit, onTicketDelete, onAddTicket }: KanbanBoardProps) {
  const byStatus = BOARD_STATUSES.reduce(
    (acc, s) => {
      acc[s] = tickets.filter((t) => t.status === s).sort((a, b) => a.position - b.position);
      return acc;
    },
    {} as Record<TicketStatus, Ticket[]>,
  );

  return (
    <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden">
      {BOARD_STATUSES.map((status) => (
        <Column
          key={status}
          status={status}
          tickets={byStatus[status] ?? []}
          onTicketEdit={onTicketEdit}
          onTicketDelete={onTicketDelete}
          onAddTicket={onAddTicket}
        />
      ))}
    </div>
  );
}
