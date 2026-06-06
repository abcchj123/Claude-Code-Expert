/** @jest-environment node */
/**
 * TC-API-CLIENT: ticketApi fetch 래퍼 단위 테스트
 *
 * Red 상태 (아직 미구현 함수):
 *   getBoard · remove · reorder · complete
 *   → 구현 후 Green 전환 예정
 */
import { ticketApi } from './ticketApi';
import type { CreateTicketInput, MoveTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';
import type { Ticket } from '@/shared/types';

// 아직 존재하지 않는 함수 호출을 위한 타입 우회 (TDD Red 상태)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = ticketApi as any;

// ── 공통 픽스처 ───────────────────────────────────────────────────────────────
const MOCK_TICKET: Ticket = {
  id:               1,
  title:            '테스트 티켓',
  description:      null,
  status:           'TODO',
  priority:         'MEDIUM',
  position:         1,
  plannedStartDate: null,
  dueDate:          null,
  startedAt:        null,
  completedAt:      null,
  createdAt:        '2026-06-06T00:00:00.000Z',
  updatedAt:        '2026-06-06T00:00:00.000Z',
};

// ── fetch 모킹 헬퍼 ───────────────────────────────────────────────────────────
function mockOk(data: unknown, status = 200) {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  });
}

function mockError(message: string, status = 400) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: { message } }),
  });
}

// ── 테스트 ────────────────────────────────────────────────────────────────────
describe('ticketApi', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ── getBoard ─────────────────────────────────────────────────────────────────
  describe('getBoard', () => {
    it('GET /api/tickets 로 fetch를 호출한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk([]));

      await api.getBoard();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets',
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );
    });

    it('응답 Ticket[]을 반환한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk([MOCK_TICKET]));

      const result = await api.getBoard();

      expect(result).toEqual([MOCK_TICKET]);
    });

    it('에러 응답 시 error.message를 throw한다', async () => {
      mockFetch.mockReturnValueOnce(mockError('서버 오류', 500));

      await expect(api.getBoard()).rejects.toThrow('서버 오류');
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    const input: CreateTicketInput = { title: '새 티켓' };

    it('POST /api/tickets 로 fetch를 호출한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk(MOCK_TICKET, 201));

      await api.create(input);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('요청 body에 input을 JSON으로 전송한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk(MOCK_TICKET, 201));

      await api.create(input);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets',
        expect.objectContaining({ body: JSON.stringify(input) }),
      );
    });

    it('생성된 Ticket을 반환한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk(MOCK_TICKET, 201));

      const result = await api.create(input);

      expect(result).toEqual(MOCK_TICKET);
    });

    it('에러 응답 시 error.message를 throw한다', async () => {
      mockFetch.mockReturnValueOnce(mockError('제목을 입력해주세요', 400));

      await expect(api.create(input)).rejects.toThrow('제목을 입력해주세요');
    });
  });

  // ── update ───────────────────────────────────────────────────────────────────
  describe('update', () => {
    const input: UpdateTicketInput = { title: '수정된 제목' };

    it('PATCH /api/tickets/:id 로 fetch를 호출한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk(MOCK_TICKET));

      await api.update(1, input);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets/1',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('요청 body에 input을 JSON으로 전송한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk(MOCK_TICKET));

      await api.update(1, input);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets/1',
        expect.objectContaining({ body: JSON.stringify(input) }),
      );
    });

    it('수정된 Ticket을 반환한다', async () => {
      const updated = { ...MOCK_TICKET, title: '수정된 제목' };
      mockFetch.mockReturnValueOnce(mockOk(updated));

      const result = await api.update(1, input);

      expect(result).toEqual(updated);
    });

    it('에러 응답 시 error.message를 throw한다', async () => {
      mockFetch.mockReturnValueOnce(mockError('티켓을 찾을 수 없습니다', 404));

      await expect(api.update(99, input)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('DELETE /api/tickets/:id 로 fetch를 호출한다', async () => {
      mockFetch.mockReturnValueOnce(Promise.resolve({ ok: true, status: 204 }));

      await api.remove(1);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets/1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('204 응답 시 undefined를 반환한다', async () => {
      mockFetch.mockReturnValueOnce(Promise.resolve({ ok: true, status: 204 }));

      const result = await api.remove(1);

      expect(result).toBeUndefined();
    });

    it('에러 응답 시 error.message를 throw한다', async () => {
      mockFetch.mockReturnValueOnce(mockError('티켓을 찾을 수 없습니다', 404));

      await expect(api.remove(99)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  // ── reorder ──────────────────────────────────────────────────────────────────
  describe('reorder', () => {
    const input: MoveTicketInput = { status: 'IN_PROGRESS', position: 2 };

    it('PATCH /api/tickets/:id/move 로 fetch를 호출한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk(MOCK_TICKET));

      await api.reorder(1, input);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets/1/move',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('요청 body에 input을 JSON으로 전송한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk(MOCK_TICKET));

      await api.reorder(1, input);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets/1/move',
        expect.objectContaining({ body: JSON.stringify(input) }),
      );
    });

    it('이동된 Ticket을 반환한다', async () => {
      const moved = { ...MOCK_TICKET, status: 'IN_PROGRESS' as const, position: 2 };
      mockFetch.mockReturnValueOnce(mockOk(moved));

      const result = await api.reorder(1, input);

      expect(result).toEqual(moved);
    });

    it('에러 응답 시 error.message를 throw한다', async () => {
      mockFetch.mockReturnValueOnce(mockError('티켓을 찾을 수 없습니다', 404));

      await expect(api.reorder(99, input)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });

  // ── complete ─────────────────────────────────────────────────────────────────
  describe('complete', () => {
    it('PATCH /api/tickets/:id/move 로 fetch를 호출한다', async () => {
      mockFetch.mockReturnValueOnce(mockOk({ ...MOCK_TICKET, status: 'DONE' }));

      await api.complete(1);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tickets/1/move',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('요청 body에 status: "DONE"이 포함된다', async () => {
      mockFetch.mockReturnValueOnce(mockOk({ ...MOCK_TICKET, status: 'DONE' }));

      await api.complete(1);

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string) as { status: string };
      expect(body.status).toBe('DONE');
    });

    it('완료된 Ticket을 반환한다', async () => {
      const completed = { ...MOCK_TICKET, status: 'DONE' as const, completedAt: '2026-06-06T00:00:00.000Z' };
      mockFetch.mockReturnValueOnce(mockOk(completed));

      const result = await api.complete(1);

      expect(result).toEqual(completed);
    });

    it('에러 응답 시 error.message를 throw한다', async () => {
      mockFetch.mockReturnValueOnce(mockError('티켓을 찾을 수 없습니다', 404));

      await expect(api.complete(99)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });
});
