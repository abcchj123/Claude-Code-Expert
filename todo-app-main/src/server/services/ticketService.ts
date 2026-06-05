import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { tickets, type Ticket } from '../db/schema';
import { TICKET_PRIORITY, TICKET_STATUS, type TicketStatus } from '@/shared/types';
import type { CreateTicketInput } from '@/shared/validations/ticket';

export const ticketService = {
  async findAll(status?: TicketStatus): Promise<Ticket[]> {
    return db
      .select()
      .from(tickets)
      .where(status ? eq(tickets.status, status) : undefined)
      .orderBy(asc(tickets.position));
  },

  async create(input: CreateTicketInput): Promise<Ticket> {
    return db.transaction(async (tx) => {
      await tx
        .update(tickets)
        .set({ position: sql`${tickets.position} + 1` })
        .where(eq(tickets.status, TICKET_STATUS.BACKLOG));

      const [ticket] = await tx
        .insert(tickets)
        .values({
          title: input.title,
          description: input.description ?? null,
          status: TICKET_STATUS.BACKLOG,
          priority: input.priority ?? TICKET_PRIORITY.MEDIUM,
          position: 1,
          plannedStartDate: input.plannedStartDate ?? null,
          dueDate: input.dueDate ?? null,
        })
        .returning();

      return ticket!;
    });
  },
};
