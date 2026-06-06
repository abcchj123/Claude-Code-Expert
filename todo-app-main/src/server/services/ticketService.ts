import { and, asc, eq, gt, gte, lt, lte, ne, sql } from 'drizzle-orm';
import { db } from '../db';
import { tickets, type TicketSelect } from '../db/schema';
import { TICKET_PRIORITY, TICKET_STATUS, type TicketStatus } from '@/shared/constants/columns';
import type { Ticket } from '@/shared/types';
import type { CreateTicketInput, MoveTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';

function toTicket(row: TicketSelect): Ticket {
  return {
    ...row,
    status:      row.status as Ticket['status'],
    priority:    row.priority as Ticket['priority'],
    createdAt:   row.createdAt.toISOString(),
    updatedAt:   row.updatedAt.toISOString(),
    startedAt:   row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export const ticketService = {
  async findAll(status?: TicketStatus): Promise<TicketSelect[]> {
    return db
      .select()
      .from(tickets)
      .where(status ? eq(tickets.status, status) : undefined)
      .orderBy(asc(tickets.position));
  },

  async getBoard(): Promise<Ticket[]> {
    const doneVisibleAfter = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await db
      .select()
      .from(tickets)
      .where(
        sql`${tickets.status} <> ${TICKET_STATUS.DONE} OR ${tickets.completedAt} IS NULL OR ${tickets.completedAt} >= ${doneVisibleAfter}`,
      )
      .orderBy(asc(tickets.position));

    return rows.map(toTicket);
  },

  async findById(id: number): Promise<TicketSelect | null> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket ?? null;
  },

  async create(input: CreateTicketInput): Promise<TicketSelect> {
    return db.transaction(async (tx) => {
      await tx
        .update(tickets)
        .set({ position: sql`${tickets.position} + 1` })
        .where(eq(tickets.status, TICKET_STATUS.BACKLOG));

      const [ticket] = await tx
        .insert(tickets)
        .values({
          title:            input.title,
          description:      input.description ?? null,
          status:           TICKET_STATUS.BACKLOG,
          priority:         input.priority ?? TICKET_PRIORITY.MEDIUM,
          position:         1,
          plannedStartDate: input.plannedStartDate ?? null,
          dueDate:          input.dueDate ?? null,
        })
        .returning();

      return ticket!;
    });
  },

  async update(id: number, input: UpdateTicketInput): Promise<TicketSelect | null> {
    const { startedAt, completedAt, ...rest } = input;
    const updates = {
      ...rest,
      ...(startedAt  !== undefined ? { startedAt:  startedAt  ? new Date(startedAt)  : null } : {}),
      ...(completedAt !== undefined ? { completedAt: completedAt ? new Date(completedAt) : null } : {}),
      updatedAt: new Date(),
    };
    const [ticket] = await db
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, id))
      .returning();
    return ticket ?? null;
  },

  async delete(id: number): Promise<boolean> {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(tickets).where(eq(tickets.id, id));
      if (!existing) return false;

      // 삭제 후 같은 컬럼의 position 간격 메우기
      await tx
        .update(tickets)
        .set({ position: sql`${tickets.position} - 1` })
        .where(and(eq(tickets.status, existing.status), gt(tickets.position, existing.position)));

      await tx.delete(tickets).where(eq(tickets.id, id));
      return true;
    });
  },

  async move(id: number, input: MoveTicketInput): Promise<TicketSelect | null> {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(tickets).where(eq(tickets.id, id));
      if (!existing) return null;

      const { status: newStatus, position: newPosition } = input;
      const { status: oldStatus, position: oldPosition } = existing;

      if (oldStatus === newStatus) {
        // 같은 컬럼 내 순서 변경
        if (oldPosition < newPosition) {
          await tx.update(tickets)
            .set({ position: sql`${tickets.position} - 1` })
            .where(and(
              eq(tickets.status, oldStatus),
              gt(tickets.position, oldPosition),
              lte(tickets.position, newPosition),
            ));
        } else if (oldPosition > newPosition) {
          await tx.update(tickets)
            .set({ position: sql`${tickets.position} + 1` })
            .where(and(
              eq(tickets.status, oldStatus),
              gte(tickets.position, newPosition),
              lt(tickets.position, oldPosition),
            ));
        }
      } else {
        // 컬럼 간 이동: 출발 컬럼 간격 메우기 → 도착 컬럼 자리 만들기
        await tx.update(tickets)
          .set({ position: sql`${tickets.position} - 1` })
          .where(and(eq(tickets.status, oldStatus), gt(tickets.position, oldPosition)));

        await tx.update(tickets)
          .set({ position: sql`${tickets.position} + 1` })
          .where(and(
            eq(tickets.status, newStatus),
            gte(tickets.position, newPosition),
            ne(tickets.id, id),
          ));
      }

      const now = new Date();
      const updates: Partial<typeof tickets.$inferInsert> = {
        status:    newStatus,
        position:  newPosition,
        updatedAt: now,
      };

      // BR-002: → DONE → completedAt = NOW()
      if (newStatus === TICKET_STATUS.DONE) {
        updates.completedAt = now;
      }
      // BR-003: DONE → 복귀 → completedAt = NULL
      if (oldStatus === TICKET_STATUS.DONE && newStatus !== TICKET_STATUS.DONE) {
        updates.completedAt = null;
      }
      // BR-004: BACKLOG → TODO 최초 이동 → startedAt = NOW()
      if (oldStatus === TICKET_STATUS.BACKLOG && newStatus === TICKET_STATUS.TODO && !existing.startedAt) {
        updates.startedAt = now;
      }

      const [updated] = await tx
        .update(tickets)
        .set(updates)
        .where(eq(tickets.id, id))
        .returning();

      return updated ?? null;
    });
  },
};
