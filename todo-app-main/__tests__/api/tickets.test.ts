/** @jest-environment node */
import { GET } from '../../app/api/tickets/route';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';

const BASE_URL = 'http://localhost/api/tickets';

function makeGetRequest(query?: string) {
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;
  return new Request(url, { method: 'GET' });
}

beforeEach(async () => {
  await db.delete(tickets);
});

afterAll(async () => {
  await db.delete(tickets);
});

describe('GET /api/tickets — 정상 케이스', () => {
  it('TC-1-1: 티켓 목록을 position 오름차순으로 반환해야 한다', async () => {
    await db.insert(tickets).values([
      { title: 'A', status: 'BACKLOG', priority: 'MEDIUM', position: 2 },
      { title: 'B', status: 'TODO',    priority: 'LOW',    position: 1 },
    ]);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0].position).toBeLessThanOrEqual(body[1].position);
  });

  it('TC-1-2: 티켓이 없으면 빈 배열을 반환해야 한다', async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('TC-1-3: status 쿼리 파라미터로 특정 컬럼 티켓만 필터링해야 한다', async () => {
    await db.insert(tickets).values([
      { title: 'BACKLOG 티켓', status: 'BACKLOG', priority: 'MEDIUM', position: 1 },
      { title: 'TODO 티켓',    status: 'TODO',    priority: 'MEDIUM', position: 1 },
    ]);
    const res = await GET(makeGetRequest('status=BACKLOG'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].status).toBe('BACKLOG');
  });
});

describe('GET /api/tickets — 예외 케이스', () => {
  it('TC-1-4: 유효하지 않은 status 값이면 400을 반환해야 한다', async () => {
    const res = await GET(makeGetRequest('status=INVALID'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
