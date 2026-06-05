/** @jest-environment node */
import { POST } from '../../app/api/tickets/route';
import { db } from '@/server/db';
import { tickets } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'http://localhost/api/tickets';

function makeRequest(body: unknown) {
  return new Request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  await db.delete(tickets);
});

afterAll(async () => {
  await db.delete(tickets);
});

// --- TC-API-002 정상 케이스 ---

describe('POST /api/tickets — 정상 케이스', () => {
  it('TC-2-1: title만으로 생성하면 201, status=BACKLOG, position=1, priority=MEDIUM을 반환해야 한다', async () => {
    const res = await POST(makeRequest({ title: '새 티켓' }));
    expect(res.status).toBe(201);
    const ticket = await res.json();
    expect(ticket.title).toBe('새 티켓');
    expect(ticket.status).toBe('BACKLOG');
    expect(ticket.position).toBe(1);
    expect(ticket.priority).toBe('MEDIUM');
    expect(ticket.id).toBeDefined();
    expect(ticket.createdAt).toBeDefined();
  });

  it('TC-2-2: 모든 선택 필드 포함 시 입력값 그대로 반환해야 한다', async () => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const dueDate = today.toISOString().slice(0, 10);

    const res = await POST(
      makeRequest({
        title: 'API 설계',
        description: '엔드포인트 정의',
        priority: 'HIGH',
        plannedStartDate: '2026-06-06',
        dueDate,
      })
    );
    expect(res.status).toBe(201);
    const ticket = await res.json();
    expect(ticket.description).toBe('엔드포인트 정의');
    expect(ticket.priority).toBe('HIGH');
    expect(ticket.dueDate).toBe(dueDate);
  });

  it('TC-2-3: 기존 BACKLOG 티켓이 있을 때 신규 position=1, 기존 position=2로 재계산되어야 한다', async () => {
    // 기존 티켓 먼저 생성
    const first = await POST(makeRequest({ title: '기존 티켓' }));
    const firstTicket = await first.json();
    expect(firstTicket.position).toBe(1);

    // 신규 티켓 생성
    const res = await POST(makeRequest({ title: '신규 티켓' }));
    expect(res.status).toBe(201);
    const newTicket = await res.json();
    expect(newTicket.position).toBe(1);

    // DB에서 기존 티켓 position 확인
    const [updated] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, firstTicket.id));
    expect(updated?.position).toBe(2);
  });
});

// --- TC-API-002 예외 케이스 ---

describe('POST /api/tickets — 예외 케이스', () => {
  it('TC-2-4: title 누락 시 400과 "제목을 입력해주세요" 반환해야 한다', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('제목을 입력해주세요');
  });

  it('TC-2-5: title 빈 문자열 시 400과 "제목을 입력해주세요" 반환해야 한다', async () => {
    const res = await POST(makeRequest({ title: '' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe('제목을 입력해주세요');
  });

  it('TC-2-6: title 201자 시 400과 "제목은 200자 이내로 입력해주세요." 반환해야 한다', async () => {
    const res = await POST(makeRequest({ title: '가'.repeat(201) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe('제목은 200자 이내로 입력해주세요.');
  });

  it('TC-2-7: description 1001자 시 400과 VALIDATION_ERROR 반환해야 한다', async () => {
    const res = await POST(makeRequest({ title: '테스트', description: 'x'.repeat(1001) }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('TC-2-8: 잘못된 priority 시 400과 "우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다." 반환해야 한다', async () => {
    const res = await POST(makeRequest({ title: '테스트', priority: 'URGENT' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe('우선순위는 LOW, MEDIUM, HIGH 중 하나여야 합니다.');
  });

  it('TC-2-9: 과거 dueDate 시 400과 "종료예정일은 오늘 이후여야합니다." 반환해야 한다', async () => {
    const res = await POST(makeRequest({ title: '테스트', dueDate: '2020-01-01' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe('종료예정일은 오늘 이후여야합니다.');
  });

  it('TC-2-10: 날짜 형식 오류 시 400과 VALIDATION_ERROR 반환해야 한다', async () => {
    const res = await POST(makeRequest({ title: '테스트', dueDate: '2026/06/10' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
