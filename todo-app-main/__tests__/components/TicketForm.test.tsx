/**
 * TC-COMP-004: TicketForm
 *
 * C004-4는 의도적 Red 테스트:
 *   스키마 메시지 '종료예정일은 오늘 이후여야합니다.' 와
 *   UI 스펙 메시지   '종료예정일은 오늘 이후 날짜를 선택해주세요.' 가 다름.
 *   → 폼에서 UI 전용 메시지로 재매핑 구현이 필요.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketForm } from '@/client/components/ticket/TicketForm';
import type { CreateTicketInput } from '@/shared/validations/ticket';

const defaultProps = {
  onSubmit:     jest.fn(),
  onCancel:     jest.fn(),
  isSubmitting: false,
};

describe('TicketForm', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── C004-1 ─────────────────────────────────────────────────────────────────
  it('C004-1: defaultValues 없이 렌더링 시 title 빈값, 우선순위 MEDIUM 기본값', () => {
    render(<TicketForm {...defaultProps} />);

    expect(screen.getByPlaceholderText('티켓 제목을 입력하세요')).toHaveValue('');
    expect(screen.getByRole('combobox')).toHaveValue('MEDIUM');
  });

  // ── C004-2 ─────────────────────────────────────────────────────────────────
  it('C004-2: defaultValues 전달 시 title·priority·plannedStartDate가 필드에 반영된다', () => {
    const defaultValues: Partial<CreateTicketInput> = {
      title:            '기존 제목',
      priority:         'HIGH',
      plannedStartDate: '2026-06-10',
    };
    render(<TicketForm {...defaultProps} defaultValues={defaultValues} />);

    expect(screen.getByPlaceholderText('티켓 제목을 입력하세요')).toHaveValue('기존 제목');
    expect(screen.getByRole('combobox')).toHaveValue('HIGH');
    expect(screen.getByDisplayValue('2026-06-10')).toBeInTheDocument();
  });

  // ── C004-3 ─────────────────────────────────────────────────────────────────
  it('C004-3: 빈 제목으로 제출 → "제목을 입력해주세요" 에러가 표시되고 onSubmit은 호출되지 않는다', async () => {
    const user = userEvent.setup();
    render(<TicketForm {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(screen.getByRole('alert')).toHaveTextContent('제목을 입력해주세요');
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  // ── C004-4 ─────────────────────────────────────────────────────────────────
  // Red: 스키마는 '종료예정일은 오늘 이후여야합니다.' 를 반환하지만
  //      UI 스펙은 '종료예정일은 오늘 이후 날짜를 선택해주세요.' 를 요구함.
  it('C004-4: 과거 종료예정일 제출 → "종료예정일은 오늘 이후 날짜를 선택해주세요." 에러가 표시된다', async () => {
    const user = userEvent.setup();
    const { container } = render(<TicketForm {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('티켓 제목을 입력하세요'), '제목 입력');

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const dueDateInput = dateInputs[1] as Element; // index 0 = plannedStartDate, index 1 = dueDate
    fireEvent.change(dueDateInput, { target: { value: '2024-01-01' } });

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      '종료예정일은 오늘 이후 날짜를 선택해주세요.'
    );
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  // ── C004-5 ─────────────────────────────────────────────────────────────────
  it('C004-5: plannedStartDate가 type="date" input으로 렌더링되고 라벨이 표시된다', () => {
    const { container } = render(<TicketForm {...defaultProps} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBeGreaterThanOrEqual(1);
    expect(dateInputs[0]).toBeInTheDocument();
    expect(screen.getByText('계획 시작일')).toBeInTheDocument();
  });

  // ── C004-6 ─────────────────────────────────────────────────────────────────
  it('C004-6: 유효한 데이터 제출 → onSubmit이 올바른 데이터로 1회 호출된다', async () => {
    const onSubmit = jest.fn();
    const user     = userEvent.setup();
    render(<TicketForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('티켓 제목을 입력하세요'), '새 티켓');
    await user.selectOptions(screen.getByRole('combobox'), 'HIGH');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: '새 티켓', priority: 'HIGH' })
    );
  });

  // ── C004-7 ─────────────────────────────────────────────────────────────────
  it('C004-7: isSubmitting=true → 제출 버튼이 "저장 중..." 텍스트로 disabled 상태', () => {
    render(<TicketForm {...defaultProps} isSubmitting />);

    expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled();
  });
});
