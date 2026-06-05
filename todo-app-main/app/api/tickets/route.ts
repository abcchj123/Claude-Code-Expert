import { ticketService } from '@/server/services/ticketService';
import { createTicketSchema, getTicketsSchema } from '@/shared/validations/ticket';

function validationError(message: string | undefined) {
  return Response.json(
    { error: { code: 'VALIDATION_ERROR', message } },
    { status: 400 }
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;

  const result = getTicketsSchema.safeParse({ status });
  if (!result.success) {
    return validationError(result.error.errors[0]?.message);
  }

  const list = await ticketService.findAll(result.data.status);
  return Response.json(list, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createTicketSchema.safeParse(body);

  if (!result.success) {
    return validationError(result.error.errors[0]?.message);
  }

  const ticket = await ticketService.create(result.data);
  return Response.json(ticket, { status: 201 });
}
