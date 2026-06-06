import { ticketService } from '@/server/services/ticketService';
import { createTicketSchema, getTicketsSchema } from '@/shared/validations/ticket';

function validationError(message: string | undefined) {
  return Response.json(
    { error: { code: 'VALIDATION_ERROR', message } },
    { status: 400 }
  );
}

function internalError() {
  return Response.json(
    { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;

    const result = getTicketsSchema.safeParse({ status });
    if (!result.success) {
      return validationError(result.error.errors[0]?.message);
    }

    const list = result.data.status
      ? await ticketService.findAll(result.data.status)
      : await ticketService.getBoard();
    return Response.json(list, { status: 200 });
  } catch {
    return internalError();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createTicketSchema.safeParse(body);

    if (!result.success) {
      return validationError(result.error.errors[0]?.message);
    }

    const ticket = await ticketService.create(result.data);
    return Response.json(ticket, { status: 201 });
  } catch {
    return internalError();
  }
}
