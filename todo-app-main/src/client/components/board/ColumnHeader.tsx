'use client';

interface ColumnHeaderProps {
  title: string;
  count: number;
}

export function ColumnHeader({ title, count }: ColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
        {count}
      </span>
    </div>
  );
}
