import { ticketService } from '@/server/services/ticketService';
import { BoardPage } from '@/client/components/board/BoardPage';
import type { Ticket } from '@/shared/types';

export default async function Page() {
  const rows = await ticketService.findAll();
  const initialTickets: Ticket[] = rows.map((t) => ({
    ...t,
    status:      t.status as Ticket['status'],
    priority:    t.priority as Ticket['priority'],
    createdAt:   t.createdAt.toISOString(),
    updatedAt:   t.updatedAt.toISOString(),
    startedAt:   t.startedAt?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
  }));
  return <BoardPage initialTickets={initialTickets} />;
}
