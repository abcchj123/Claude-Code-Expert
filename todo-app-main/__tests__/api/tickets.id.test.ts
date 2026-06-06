/** @jest-environment node */
import { GET, PATCH, DELETE } from '../../app/api/tickets/[id]/route';
import { POST } from '../../app/api/tickets/route';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';

const BASE     = 'http://localhost/api/tickets';
const makeGet  = (id: number) => new Request(`${BASE}/${id}`, { method: 'GET' });
const makeDel  = (id: number) => new Request(`${BASE}/${id}`, { method: 'DELETE' });
const makePatch = (id: number, body: unknown) =>
  new Request(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
const params = (id: number) => Promise.resolve({ id: String(id) });

async function createTicket(title = '테스트 티켓') {
  const res = await POST(
    new Request(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),
  );
  return res.json() as Promise<{ id: number; [k: string]: unknown }>;
}

beforeEach(async () => { await db.delete(tickets); });
afterAll(async ()  => { await db.delete(tickets); });

// ── TC-API-003: GET /api/tickets/:id ─────────────────────────────────────────

describe('GET /api/tickets/:id', () => {
  it('TC-3-1: 존재하는 티켓 조회 시 200과 티켓 데이터를 반환해야 한다', async () => {
    const created = await createTicket('조회 티켓');
    const res = await GET(makeGet(created.id), { params: params(created.id) });

    expect(res.status).toBe(200);
    const ticket = await res.json();
    expect(ticket.id).toBe(created.id);
    expect(ticket.title).toBe('조회 티켓');
    expect(ticket.status).toBe('BACKLOG');
  });

  it('TC-3-2: 존재하지 않는 id 조회 시 404와 TICKET_NOT_FOUND를 반환해야 한다', async () => {
    const res = await GET(makeGet(99999), { params: params(99999) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('TICKET_NOT_FOUND');
  });

  it('TC-3-3: 유효하지 않은 id(문자) 조회 시 400을 반환해야 한다', async () => {
    const req = new Request(`${BASE}/abc`, { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ id: 'abc' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── TC-API-004: PATCH /api/tickets/:id ───────────────────────────────────────

describe('PATCH /api/tickets/:id', () => {
  it('TC-4-1: 제목 수정 시 200과 수정된 티켓을 반환해야 한다', async () => {
    const created = await createTicket('원래 제목');
    const res = await PATCH(makePatch(created.id, { title: '수정된 제목' }), { params: params(created.id) });

    expect(res.status).toBe(200);
    const ticket = await res.json();
    expect(ticket.title).toBe('수정된 제목');
  });

  it('TC-4-2: 부분 수정 시 미전달 필드는 기존 값을 유지해야 한다', async () => {
    const created = await createTicket('원래 제목');
    const res = await PATCH(makePatch(created.id, { priority: 'HIGH' }), { params: params(created.id) });

    expect(res.status).toBe(200);
    const ticket = await res.json();
    expect(ticket.priority).toBe('HIGH');
    expect(ticket.title).toBe('원래 제목');
  });

  it('TC-4-3: 존재하지 않는 id 수정 시 404를 반환해야 한다', async () => {
    const res = await PATCH(makePatch(99999, { title: '수정' }), { params: params(99999) });
    expect(res.status).toBe(404);
  });

  it('TC-4-4: 빈 title 수정 시 400을 반환해야 한다', async () => {
    const created = await createTicket();
    const res = await PATCH(makePatch(created.id, { title: '' }), { params: params(created.id) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe('제목을 입력해주세요');
  });

  it('TC-4-5: 빈 body 전달 시 400을 반환해야 한다', async () => {
    const created = await createTicket();
    const res = await PATCH(makePatch(created.id, {}), { params: params(created.id) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── TC-API-005: DELETE /api/tickets/:id ──────────────────────────────────────

describe('DELETE /api/tickets/:id', () => {
  it('TC-5-1: 존재하는 티켓 삭제 시 204를 반환해야 한다', async () => {
    const created = await createTicket('삭제할 티켓');
    const res = await DELETE(makeDel(created.id), { params: params(created.id) });

    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });

  it('TC-5-2: 삭제 후 조회 시 404를 반환해야 한다', async () => {
    const created = await createTicket();
    await DELETE(makeDel(created.id), { params: params(created.id) });

    const res = await GET(makeGet(created.id), { params: params(created.id) });
    expect(res.status).toBe(404);
  });

  it('TC-5-3: 존재하지 않는 id 삭제 시 404를 반환해야 한다', async () => {
    const res = await DELETE(makeDel(99999), { params: params(99999) });
    expect(res.status).toBe(404);
  });

  it('TC-5-4: 티켓 삭제 후 같은 컬럼의 position 간격이 메워져야 한다', async () => {
    const t1 = await createTicket('티켓 A'); // position=1
    const t2 = await createTicket('티켓 B'); // position=1, t1=2
    const t3 = await createTicket('티켓 C'); // position=1, t2=2, t1=3

    // t2(position=2) 삭제 → t1은 position=3→2가 되어야 함
    await DELETE(makeDel(t2.id), { params: params(t2.id) });

    const getT1 = await GET(makeGet(t1.id), { params: params(t1.id) });
    const updated = await getT1.json() as { position: number };
    expect(updated.position).toBe(2);

    const getT3 = await GET(makeGet(t3.id), { params: params(t3.id) });
    const t3Data = await getT3.json() as { position: number };
    expect(t3Data.position).toBe(1);
  });
});
