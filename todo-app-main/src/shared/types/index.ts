export type { TicketStatus, TicketPriority } from '../constants/columns';

// API 응답 기준 티켓 타입 (날짜는 모두 string)
export interface Ticket {
  id:               number;
  title:            string;
  description:      string | null;
  status:           'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority:         'LOW' | 'MEDIUM' | 'HIGH';
  position:         number;
  plannedStartDate: string | null;
  dueDate:          string | null;
  startedAt:        string | null;
  completedAt:      string | null;
  createdAt:        string;
  updatedAt:        string;
}

// 파생 필드 포함 (isOverdue)
export interface TicketWithMeta extends Ticket {
  isOverdue: boolean;
}
