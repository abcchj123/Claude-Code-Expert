import { ticketService } from '@/server/services/ticketService';
import { createTicketSchema } from '@/shared/validations/ticket';

export async function POST(request: Request) {
  const body = await request.json();
  const result = createTicketSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력값을 확인해주세요' } },
      { status: 400 }
    );
  }

  try {
    const ticket = await ticketService.create(result.data);
    return Response.json(ticket, { status: 201 });
  } catch {
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 }
    );
  }
}
