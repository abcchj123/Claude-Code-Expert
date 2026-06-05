import { sql } from 'drizzle-orm';
import { date, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const tickets = pgTable('tickets', {
  id:               serial('id').primaryKey(),
  title:            varchar('title', { length: 200 }).notNull(),
  description:      text('description'),
  status:           varchar('status', { length: 20 }).notNull().default('BACKLOG'),
  priority:         varchar('priority', { length: 10 }).notNull().default('MEDIUM'),
  position:         integer('position').notNull().default(1),
  plannedStartDate: date('planned_start_date'),
  dueDate:          date('due_date'),
  startedAt:        timestamp('started_at'),
  completedAt:      timestamp('completed_at'),
  createdAt:        timestamp('created_at').notNull().default(sql`NOW()`),
  updatedAt:        timestamp('updated_at').notNull().default(sql`NOW()`),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
