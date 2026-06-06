'use client';

import { useState } from 'react';
import { Field } from '@/client/components/ui/Field';
import { createTicketSchema } from '@/shared/validations/ticket';
import type { CreateTicketInput } from '@/shared/validations/ticket';

interface TicketFormProps {
  defaultValues?: Partial<CreateTicketInput>;
  onSubmit:       (data: CreateTicketInput) => void;
  onCancel:       () => void;
  isSubmitting:   boolean;
}

const EMPTY: CreateTicketInput = {
  title:            '',
  description:      undefined,
  priority:         'MEDIUM',
  plannedStartDate: undefined,
  dueDate:          undefined,
};

export function TicketForm({ defaultValues, onSubmit, onCancel, isSubmitting }: TicketFormProps) {
  const [values, setValues] = useState<CreateTicketInput>({ ...EMPTY, ...defaultValues });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: keyof CreateTicketInput, value: unknown) {
    setValues((v) => ({ ...v, [field]: value || undefined }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = createTicketSchema.safeParse(values);
    if (!result.success) {
      const mapped: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (key && !mapped[key]) mapped[key] = err.message;
      });
      setErrors(mapped);
      return;
    }
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="제목 *" error={errors.title}>
        <input
          type="text"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          placeholder="티켓 제목을 입력하세요"
        />
      </Field>

      <Field label="설명" error={errors.description}>
        <textarea
          value={values.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          placeholder="설명 (선택)"
        />
      </Field>

      <Field label="우선순위">
        <select
          value={values.priority ?? 'MEDIUM'}
          onChange={(e) => set('priority', e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="계획 시작일" error={errors.plannedStartDate}>
          <input
            type="date"
            value={values.plannedStartDate ?? ''}
            onChange={(e) => set('plannedStartDate', e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </Field>
        <Field label="계획 종료일" error={errors.dueDate}>
          <input
            type="date"
            value={values.dueDate ?? ''}
            onChange={(e) => set('dueDate', e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </Field>
      </div>

      <footer className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </footer>
    </form>
  );
}
