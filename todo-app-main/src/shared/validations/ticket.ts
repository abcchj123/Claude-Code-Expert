import { z } from 'zod';
import { TICKET_PRIORITY, TICKET_STATUS } from '../constants/columns';

const dateBase = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: '날짜 형식은 YYYY-MM-DD이어야 합니다' });

const dateString = dateBase.nullable().optional();

const futureDateString = dateBase
  .refine(
    (val) => new Date(val) >= new Date(new Date().toISOString().slice(0, 10)),
    { message: '종료예정일은 오늘 이후여야합니다.' }
  )
  .nullable()
  .optional();

export const createTicketSchema = z.object({
  title: z
    .string({ required_error: '제목을 입력해주세요' })
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요.'),
  description: z.string().max(1000, '설명은 1000자 이내로 입력해주세요.').optional(),
  priority: z
    .enum([TICKET_PRIORITY.LOW, TICKET_PRIORITY.MEDIUM, TICKET_PRIORITY.HIGH], {
      errorMap: () => ({ message: '우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다.' }),
    })
    .optional(),
  plannedStartDate: dateString,
  dueDate: futureDateString,
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const getTicketsSchema = z.object({
  status: z
    .enum(
      [TICKET_STATUS.BACKLOG, TICKET_STATUS.TODO, TICKET_STATUS.IN_PROGRESS, TICKET_STATUS.DONE],
      { errorMap: () => ({ message: '유효하지 않은 status 값입니다' }) }
    )
    .optional(),
});

export type GetTicketsInput = z.infer<typeof getTicketsSchema>;
