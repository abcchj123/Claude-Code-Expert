import { ticketService } from '@/server/services/ticketService';
import { ticketIdSchema, updateTicketSchema } from '@/shared/validations/ticket';

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

function parseId(params: { id: string }) {
  return ticketIdSchema.safeParse(params);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const idResult = parseId(await params);
    if (!idResult.success) return validationError(idResult.error.errors[0]?.message);

    const ticket = await ticketService.findById(idResult.data.id);
    if (!ticket) return notFound();

    return Response.json(ticket, { status: 200 });
  } catch {
    return internalError();
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const idResult = parseId(await params);
    if (!idResult.success) return validationError(idResult.error.errors[0]?.message);

    const body = await request.json();
    const bodyResult = updateTicketSchema.safeParse(body);
    if (!bodyResult.success) return validationError(bodyResult.error.errors[0]?.message);

    const ticket = await ticketService.update(idResult.data.id, bodyResult.data);
    if (!ticket) return notFound();

    return Response.json(ticket, { status: 200 });
  } catch {
    return internalError();
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const idResult = parseId(await params);
    if (!idResult.success) return validationError(idResult.error.errors[0]?.message);

    const deleted = await ticketService.delete(idResult.data.id);
    if (!deleted) return notFound();

    return new Response(null, { status: 204 });
  } catch {
    return internalError();
  }
}
