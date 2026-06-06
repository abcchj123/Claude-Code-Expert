import type { Ticket, TicketWithMeta } from '@/shared/types';

export function withMeta(ticket: Ticket): TicketWithMeta {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...ticket,
    isOverdue:
      ticket.dueDate !== null &&
      ticket.dueDate < today &&
      ticket.status !== 'DONE',
  };
}
