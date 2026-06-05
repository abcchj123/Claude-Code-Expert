import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { tickets, type Ticket } from '../db/schema';
import type { CreateTicketInput } from '@/shared/validations/ticket';

export const ticketService = {
  async create(input: CreateTicketInput): Promise<Ticket> {
    return db.transaction(async (tx) => {
      await tx
        .update(tickets)
        .set({ position: sql`${tickets.position} + 1` })
        .where(eq(tickets.status, 'BACKLOG'));

      const [ticket] = await tx
        .insert(tickets)
        .values({
          title: input.title,
          description: input.description ?? null,
          status: 'BACKLOG',
          priority: input.priority ?? 'MEDIUM',
          position: 1,
          plannedStartDate: input.plannedStartDate ?? null,
          dueDate: input.dueDate ?? null,
        })
        .returning();

      return ticket!;
    });
  },
};
