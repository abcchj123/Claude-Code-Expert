'use client';

interface DateRowProps {
  plannedStartDate: string | null;
  dueDate:          string | null;
  isOverdue:        boolean;
}

export function DateRow({ plannedStartDate, dueDate, isOverdue }: DateRowProps) {
  if (!plannedStartDate && !dueDate) return null;

  const dateText = [plannedStartDate, dueDate].filter(Boolean).join(' → ');
  const textColor = isOverdue ? 'text-[var(--color-overdue)]' : 'text-[var(--color-text-secondary)]';

  return (
    <div className={`flex items-center gap-1 text-xs ${textColor}`}>
      <span>📅 {dateText}</span>
      {isOverdue && (
        <span className="rounded bg-[var(--color-overdue)] px-1 py-0.5 text-white">기한초과</span>
      )}
    </div>
  );
}
