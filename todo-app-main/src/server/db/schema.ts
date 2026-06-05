import { sql } from 'drizzle-orm';
import { date, index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TICKET_PRIORITY, TICKET_STATUS } from '@/shared/constants/columns';

export const tickets = pgTable(
  'tickets',
  {
    id:          serial('id').primaryKey(),

    title:       varchar('title', { length: 200 }).notNull(),
    description: text('description'),

    status:   varchar('status',   { length: 20 }).notNull().default(TICKET_STATUS.BACKLOG),
    priority: varchar('priority', { length: 10 }).notNull().default(TICKET_PRIORITY.MEDIUM),
    position: integer('position').notNull().default(1),

    plannedStartDate: date('planned_start_date'),
    dueDate:          date('due_date'),

    startedAt:   timestamp('started_at'),
    completedAt: timestamp('completed_at'),

    createdAt: timestamp('created_at').notNull().default(sql`NOW()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`NOW()`),
  },
  (t) => [
    // FR-002 핵심 쿼리: 컬럼별 티켓 목록 정렬
    index('idx_tickets_status_position').on(t.status, t.position),
    // BR-005: 일정 초과 판정 (NULL 행 제외 partial index)
    index('idx_tickets_due_date').on(t.dueDate).where(sql`${t.dueDate} IS NOT NULL`),
    // 생성 순 정렬 지원
    index('idx_tickets_created_at').on(t.createdAt.desc()),
  ],
);

export type TicketSelect = typeof tickets.$inferSelect;
export type TicketInsert = typeof tickets.$inferInsert;
