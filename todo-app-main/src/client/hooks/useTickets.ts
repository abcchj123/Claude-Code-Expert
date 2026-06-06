'use client';

import { useCallback, useState } from 'react';
import { ticketApi } from '@/client/api/ticketApi';
import { COLUMN_ORDER, TICKET_STATUS } from '@/shared/constants/columns';
import type { Ticket } from '@/shared/types';
import type { CreateTicketInput, MoveTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';

function sortByBoardOrder(tickets: Ticket[]) {
  return [...tickets].sort((a, b) => {
    const statusDiff = COLUMN_ORDER.indexOf(a.status) - COLUMN_ORDER.indexOf(b.status);
    if (statusDiff !== 0) return statusDiff;
    return a.position - b.position;
  });
}

function normalizePositions(tickets: Ticket[]): Ticket[] {
  const normalized = COLUMN_ORDER.flatMap((status) =>
    tickets
      .filter((ticket) => ticket.status === status)
      .sort((a, b) => a.position - b.position)
      .map((ticket, index) => ({ ...ticket, position: index + 1 })),
  );

  return sortByBoardOrder(normalized);
}

function applyMove(tickets: Ticket[], id: number, input: MoveTicketInput): Ticket[] {
  const moving = tickets.find((ticket) => ticket.id === id);
  if (!moving) return tickets;

  const now = new Date().toISOString();
  const remaining = tickets.filter((ticket) => ticket.id !== id);
  const targetColumn = remaining
    .filter((ticket) => ticket.status === input.status)
    .sort((a, b) => a.position - b.position);
  const targetIndex = Math.max(0, Math.min(input.position - 1, targetColumn.length));

  const moved: Ticket = {
    ...moving,
    status: input.status,
    updatedAt: now,
    startedAt:
      moving.status === TICKET_STATUS.BACKLOG && input.status === TICKET_STATUS.TODO && !moving.startedAt
        ? now
        : moving.startedAt,
    completedAt:
      input.status === TICKET_STATUS.DONE
        ? now
        : moving.status === TICKET_STATUS.DONE
          ? null
          : moving.completedAt,
  };

  targetColumn.splice(targetIndex, 0, moved);

  return normalizePositions([
    ...remaining.filter((ticket) => ticket.status !== input.status),
    ...targetColumn,
  ]);
}

export function useTickets(initialData: Ticket[] = []) {
  const [board, setBoard]       = useState<Ticket[]>(initialData);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState<Error | null>(null);

  const refreshBoard = useCallback(async () => {
    const tickets = await ticketApi.getBoard();
    setBoard(tickets);
  }, []);

  const withLoading = useCallback(async (fn: () => Promise<void>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    (input: CreateTicketInput) =>
      withLoading(async () => {
        await ticketApi.create(input);
        await refreshBoard();
      }),
    [withLoading, refreshBoard],
  );

  const update = useCallback(
    (id: number, input: UpdateTicketInput) =>
      withLoading(async () => {
        await ticketApi.update(id, input);
        await refreshBoard();
      }),
    [withLoading, refreshBoard],
  );

  const remove = useCallback(
    (id: number) =>
      withLoading(async () => {
        await ticketApi.remove(id);
        await refreshBoard();
      }),
    [withLoading, refreshBoard],
  );

  const reorder = useCallback(
    async (id: number, input: MoveTicketInput) => {
      const backup = board;
      setLoading(true);
      setError(null);
      setBoard(applyMove(backup, id, input));

      try {
        const moved = await ticketApi.reorder(id, input);
        setBoard((current) =>
          sortByBoardOrder(current.map((ticket) => (ticket.id === moved.id ? moved : ticket))),
        );
      } catch (e) {
        setBoard(backup);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    [board],
  );

  const complete = useCallback(
    async (id: number) => {
      const backup = board;
      const input: MoveTicketInput = { status: TICKET_STATUS.DONE, position: 1 };
      setLoading(true);
      setError(null);
      setBoard(applyMove(backup, id, input));

      try {
        const completed = await ticketApi.complete(id);
        setBoard((current) =>
          sortByBoardOrder(current.map((ticket) => (ticket.id === completed.id ? completed : ticket))),
        );
      } catch (e) {
        setBoard(backup);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    [board],
  );

  return { board, isLoading, error, create, update, remove, reorder, complete };
}
