/** @jest-environment node */
import { PATCH } from '../../app/api/tickets/[id]/move/route';
import { POST } from '../../app/api/tickets/route';
import { GET } from '../../app/api/tickets/[id]/route';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';

const BASE = 'http://localhost/api/tickets';

const params = (id: number) => Promise.resolve({ id: String(id) });

const makeMove = (id: number, body: unknown) =>
  new Request(`${BASE}/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

async function createTicket(title = '티켓', priority?: string) {
  const res = await POST(
    new Request(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ...(priority ? { priority } : {}) }),
    }),
  );
  return res.json() as Promise<{ id: number; position: number; status: string; startedAt: string | null; completedAt: string | null }>;
}

async function getTicket(id: number) {
  const res = await GET(
    new Request(`${BASE}/${id}`),
    { params: params(id) },
  );
  return res.json() as Promise<{ id: number; position: number; status: string; startedAt: string | null; completedAt: string | null }>;
}

beforeEach(async () => { await db.delete(tickets); });
afterAll(async ()  => { await db.delete(tickets); });

// ── TC-API-006: 상태 전환 + 비즈니스 규칙 ────────────────────────────────────

describe('PATCH /api/tickets/:id/move — 상태 전환 (TC-API-006)', () => {
  it('TC-6-1: BACKLOG → TODO 최초 이동 시 startedAt이 설정되어야 한다 (BR-004)', async () => {
    const ticket = await createTicket('BR-004 검증');
    expect(ticket.startedAt).toBeNull();

    const res = await PATCH(makeMove(ticket.id, { status: 'TODO', position: 1 }), { params: params(ticket.id) });
    expect(res.status).toBe(200);
    const moved = await res.json() as { startedAt: string | null; status: string };
    expect(moved.status).toBe('TODO');
    expect(moved.startedAt).not.toBeNull();
  });

  it('TC-6-2: DONE으로 이동 시 completedAt이 설정되어야 한다 (BR-002)', async () => {
    const ticket = await createTicket('BR-002 검증');

    const res = await PATCH(makeMove(ticket.id, { status: 'DONE', position: 1 }), { params: params(ticket.id) });
    expect(res.status).toBe(200);
    const moved = await res.json() as { completedAt: string | null; status: string };
    expect(moved.status).toBe('DONE');
    expect(moved.completedAt).not.toBeNull();
  });

  it('TC-6-3: DONE에서 복귀 시 completedAt이 null로 초기화되어야 한다 (BR-003)', async () => {
    const ticket = await createTicket('BR-003 검증');
    await PATCH(makeMove(ticket.id, { status: 'DONE', position: 1 }), { params: params(ticket.id) });

    const res = await PATCH(makeMove(ticket.id, { status: 'BACKLOG', position: 1 }), { params: params(ticket.id) });
    expect(res.status).toBe(200);
    const moved = await res.json() as { completedAt: string | null; status: string };
    expect(moved.status).toBe('BACKLOG');
    expect(moved.completedAt).toBeNull();
  });

  it('TC-6-4: BACKLOG → TODO 재이동 시 startedAt이 변경되지 않아야 한다 (BR-004 이후 유지)', async () => {
    const ticket = await createTicket('startedAt 유지 검증');
    await PATCH(makeMove(ticket.id, { status: 'TODO', position: 1 }), { params: params(ticket.id) });
    const firstMove = await getTicket(ticket.id);
    const firstStartedAt = firstMove.startedAt;

    await PATCH(makeMove(ticket.id, { status: 'BACKLOG', position: 1 }), { params: params(ticket.id) });
    await PATCH(makeMove(ticket.id, { status: 'TODO', position: 1 }), { params: params(ticket.id) });
    const secondMove = await getTicket(ticket.id);

    expect(secondMove.startedAt).toBe(firstStartedAt);
  });

  it('TC-6-5: 존재하지 않는 티켓 이동 시 404를 반환해야 한다', async () => {
    const res = await PATCH(makeMove(99999, { status: 'TODO', position: 1 }), { params: params(99999) });
    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
  });

  it('TC-6-6: 유효하지 않은 status 시 400을 반환해야 한다', async () => {
    const ticket = await createTicket();
    const res = await PATCH(makeMove(ticket.id, { status: 'INVALID', position: 1 }), { params: params(ticket.id) });
    expect(res.status).toBe(400);
  });
});

// ── TC-API-007: position 재계산 ───────────────────────────────────────────────

describe('PATCH /api/tickets/:id/move — position 재계산 (TC-API-007)', () => {
  it('TC-7-1: 컬럼 간 이동 시 출발 컬럼 position이 재계산되어야 한다', async () => {
    const t1 = await createTicket('티켓 A'); // BACKLOG pos=1
    const t2 = await createTicket('티켓 B'); // BACKLOG pos=1, t1=2
    const t3 = await createTicket('티켓 C'); // BACKLOG pos=1, t2=2, t1=3

    // t2(pos=2)를 TODO로 이동 → t1은 pos=2가 되어야 함
    await PATCH(makeMove(t2.id, { status: 'TODO', position: 1 }), { params: params(t2.id) });

    const updatedT1 = await getTicket(t1.id);
    const updatedT3 = await getTicket(t3.id);
    expect(updatedT3.position).toBe(1); // 최상단
    expect(updatedT1.position).toBe(2); // 한 단계 당김
  });

  it('TC-7-2: 같은 컬럼 내 위로 이동 시 사이 티켓들이 밀려야 한다', async () => {
    const t1 = await createTicket('티켓 1'); // pos=1 after all inserts → pos=3
    const t2 = await createTicket('티켓 2'); // pos=2
    const t3 = await createTicket('티켓 3'); // pos=1

    // 현재 상태: t3=1, t2=2, t1=3
    // t1(pos=3)을 pos=1로 이동
    await PATCH(makeMove(t1.id, { status: 'BACKLOG', position: 1 }), { params: params(t1.id) });

    const updatedT1 = await getTicket(t1.id);
    const updatedT2 = await getTicket(t2.id);
    const updatedT3 = await getTicket(t3.id);
    expect(updatedT1.position).toBe(1);
    expect(updatedT3.position).toBe(2);
    expect(updatedT2.position).toBe(3);
  });

  it('TC-7-3: 컬럼 간 이동 시 도착 컬럼의 기존 티켓 position이 밀려야 한다', async () => {
    const src = await createTicket('출발 티켓');
    // TODO 컬럼에 먼저 티켓 만들어두기
    const existing = await createTicket('TODO 기존 티켓');
    await PATCH(makeMove(existing.id, { status: 'TODO', position: 1 }), { params: params(existing.id) });

    // src를 TODO pos=1에 삽입
    await PATCH(makeMove(src.id, { status: 'TODO', position: 1 }), { params: params(src.id) });

    const updatedSrc      = await getTicket(src.id);
    const updatedExisting = await getTicket(existing.id);
    expect(updatedSrc.position).toBe(1);
    expect(updatedExisting.position).toBe(2);
  });
});
