'use client';

import { useMemo, useState } from 'react';
import { ticketApi } from '@/client/api/ticketApi';
import { COLUMN_ORDER, type TicketStatus } from '@/shared/constants/columns';
import type { Ticket } from '@/shared/types';
import type { CreateTicketInput, MoveTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';

export function useTickets(initialTickets: Ticket[]) {
  const [tickets, setTickets]   = useState<Ticket[]>(initialTickets);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const boardColumns = useMemo(
    () =>
      COLUMN_ORDER.reduce(
        (acc, status) => {
          acc[status] = tickets
            .filter((t) => t.status === status)
            .sort((a, b) => a.position - b.position);
          return acc;
        },
        {} as Record<TicketStatus, Ticket[]>,
      ),
    [tickets],
  );

  async function createTicket(input: CreateTicketInput) {
    setLoading(true);
    setError(null);
    try {
      const created = await ticketApi.create(input);
      setTickets((prev) => [created, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '티켓 생성에 실패했습니다');
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function updateTicket(id: number, input: UpdateTicketInput) {
    setLoading(true);
    setError(null);
    try {
      const updated = await ticketApi.update(id, input);
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : '티켓 수정에 실패했습니다');
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function deleteTicket(id: number) {
    const prev = tickets;
    setTickets((t) => t.filter((x) => x.id !== id));
    try {
      await ticketApi.delete(id);
    } catch (e) {
      setTickets(prev);
      setError(e instanceof Error ? e.message : '티켓 삭제에 실패했습니다');
      throw e;
    }
  }

  async function moveTicket(id: number, input: MoveTicketInput) {
    const prev = tickets;
    // Optimistic update: reflect status + position immediately
    setTickets((ts) => {
      const ticket = ts.find((t) => t.id === id);
      if (!ticket) return ts;
      return ts.map((t) => (t.id === id ? { ...t, status: input.status, position: input.position } : t));
    });
    try {
      const moved = await ticketApi.move(id, input);
      setTickets((ts) => ts.map((t) => (t.id === id ? moved : t)));
    } catch (e) {
      setTickets(prev);
      setError(e instanceof Error ? e.message : '티켓 이동에 실패했습니다');
      throw e;
    }
  }

  return { tickets, boardColumns, isLoading, error, createTicket, updateTicket, deleteTicket, moveTicket };
}
