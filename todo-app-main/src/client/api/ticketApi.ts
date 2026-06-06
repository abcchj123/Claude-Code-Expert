import type { Ticket } from '@/shared/types';
import type { CreateTicketInput, MoveTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';

const BASE = '/api/tickets';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? '요청에 실패했습니다');
  return data as T;
}

export const ticketApi = {
  getBoard: ()                                      => request<Ticket[]>(`${BASE}`),
  get:      (id: number)                            => request<Ticket>(`${BASE}/${id}`),
  create:   (input: CreateTicketInput)              => request<Ticket>(`${BASE}`, { method: 'POST',   body: JSON.stringify(input) }),
  update:   (id: number, input: UpdateTicketInput)  => request<Ticket>(`${BASE}/${id}`, { method: 'PATCH',  body: JSON.stringify(input) }),
  remove:   (id: number)                            => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
  reorder:  (id: number, input: MoveTicketInput)    => request<Ticket>(`${BASE}/${id}/move`, { method: 'PATCH',  body: JSON.stringify(input) }),
  complete: (id: number)                            => request<Ticket>(`${BASE}/${id}/move`, { method: 'PATCH',  body: JSON.stringify({ status: 'DONE', position: 1 }) }),
};
