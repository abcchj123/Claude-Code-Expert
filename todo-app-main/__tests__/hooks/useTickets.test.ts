import { act, renderHook } from '@testing-library/react';
import { ticketApi } from '@/client/api/ticketApi';
import { useTickets } from '@/client/hooks/useTickets';
import type { Ticket } from '@/shared/types';
import type {
  CreateTicketInput,
  MoveTicketInput,
  UpdateTicketInput,
} from '@/shared/validations/ticket';

jest.mock('@/client/api/ticketApi', () => ({
  ticketApi: {
    getBoard: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn(),
    complete: jest.fn(),
  },
}));

const mockedTicketApi = jest.mocked(ticketApi);

const ticket: Ticket = {
  id: 1,
  title: 'Test ticket',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  position: 1,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-06-06T00:00:00.000Z',
  updatedAt: '2026-06-06T00:00:00.000Z',
};

const initialBoard: Ticket[] = [ticket];
const refreshedBoard: Ticket[] = [{ ...ticket, id: 2, title: 'Refreshed ticket' }];

describe('useTickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTicketApi.getBoard.mockResolvedValue(refreshedBoard);
  });

  it('initializes board with initialData', () => {
    const { result } = renderHook(() => useTickets(initialBoard));

    expect(result.current.board).toEqual(initialBoard);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls ticketApi.create and refreshes board', async () => {
    const input: CreateTicketInput = { title: 'New ticket' };
    mockedTicketApi.create.mockResolvedValueOnce(ticket);

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.create(input);
    });

    expect(mockedTicketApi.create).toHaveBeenCalledWith(input);
    expect(mockedTicketApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toEqual(refreshedBoard);
  });

  it('calls ticketApi.update and refreshes board', async () => {
    const input: UpdateTicketInput = { title: 'Updated ticket' };
    mockedTicketApi.update.mockResolvedValueOnce({ ...ticket, ...input });

    const { result } = renderHook(() => useTickets(initialBoard));

    await act(async () => {
      await result.current.update(1, input);
    });

    expect(mockedTicketApi.update).toHaveBeenCalledWith(1, input);
    expect(mockedTicketApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toEqual(refreshedBoard);
  });

  it('calls ticketApi.remove and refreshes board', async () => {
    mockedTicketApi.remove.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTickets(initialBoard));

    await act(async () => {
      await result.current.remove(1);
    });

    expect(mockedTicketApi.remove).toHaveBeenCalledWith(1);
    expect(mockedTicketApi.getBoard).toHaveBeenCalledTimes(1);
    expect(result.current.board).toEqual(refreshedBoard);
  });

  it('calls ticketApi.reorder and refreshes board', async () => {
    const input: MoveTicketInput = { status: 'IN_PROGRESS', position: 2 };
    const movedTicket: Ticket = {
      ...ticket,
      status: 'IN_PROGRESS',
      position: 2,
      updatedAt: '2026-06-06T01:00:00.000Z',
    };
    mockedTicketApi.reorder.mockResolvedValueOnce(movedTicket);

    const { result } = renderHook(() => useTickets(initialBoard));

    await act(async () => {
      await result.current.reorder(1, input);
    });

    expect(mockedTicketApi.reorder).toHaveBeenCalledWith(1, input);
    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board).toEqual([movedTicket]);
  });

  it('calls ticketApi.complete and refreshes board', async () => {
    const completedTicket: Ticket = {
      ...ticket,
      status: 'DONE',
      completedAt: '2026-06-06T01:00:00.000Z',
      updatedAt: '2026-06-06T01:00:00.000Z',
    };
    mockedTicketApi.complete.mockResolvedValueOnce(completedTicket);

    const { result } = renderHook(() => useTickets(initialBoard));

    await act(async () => {
      await result.current.complete(1);
    });

    expect(mockedTicketApi.complete).toHaveBeenCalledWith(1);
    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();
    expect(result.current.board).toEqual([completedTicket]);
  });

  it('sets error when an API call fails', async () => {
    const error = new Error('Server error');
    mockedTicketApi.create.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.create({ title: 'Failed ticket' });
    });

    expect(result.current.error).toBe(error);
    expect(mockedTicketApi.getBoard).not.toHaveBeenCalled();
  });

  it('sets error for non-Error failures', async () => {
    mockedTicketApi.update.mockRejectedValueOnce('Network failed');

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.update(1, { title: 'Updated ticket' });
    });

    expect(result.current.error).toEqual(new Error('Network failed'));
  });

  it('sets isLoading to true while an API call is pending', async () => {
    let resolveCreate!: (value: Ticket) => void;
    mockedTicketApi.create.mockReturnValueOnce(
      new Promise<Ticket>((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const { result } = renderHook(() => useTickets());

    act(() => {
      void result.current.create({ title: 'Pending ticket' });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveCreate(ticket);
    });
  });

  it('sets isLoading back to false after an API call completes', async () => {
    mockedTicketApi.create.mockResolvedValueOnce(ticket);

    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.create({ title: 'New ticket' });
    });

    expect(result.current.isLoading).toBe(false);
  });
});
