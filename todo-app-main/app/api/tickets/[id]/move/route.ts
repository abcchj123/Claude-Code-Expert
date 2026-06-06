import { ticketService } from '@/server/services/ticketService';
import { moveTicketSchema, ticketIdSchema } from '@/shared/validations/ticket';

function notFound() {
  return Response.json(
    { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
    { status: 404 },
  );
}

function validationError(message: string | undefined) {
  return Response.json(
    { error: { code: 'VALIDATION_ERROR', message } },
    { status: 400 },
  );
}

function internalError() {
  return Response.json(
    { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
    { status: 500 },
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const idResult = ticketIdSchema.safeParse(await params);
    if (!idResult.success) return validationError(idResult.error.errors[0]?.message);

    const body = await request.json();
    const bodyResult = moveTicketSchema.safeParse(body);
    if (!bodyResult.success) return validationError(bodyResult.error.errors[0]?.message);

    const ticket = await ticketService.move(idResult.data.id, bodyResult.data);
    if (!ticket) return notFound();

    return Response.json(ticket, { status: 200 });
  } catch {
    return internalError();
  }
}
