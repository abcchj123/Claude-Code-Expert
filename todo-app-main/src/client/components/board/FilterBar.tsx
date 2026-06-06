'use client';

export type BoardFilter = 'all' | 'thisWeek' | 'overdue';

interface FilterBarProps {
  activeFilter: BoardFilter;
  thisWeekCount: number;
  overdueCount: number;
  onFilterChange: (filter: BoardFilter) => void;
}

export function FilterBar({
  activeFilter,
  thisWeekCount,
  overdueCount,
  onFilterChange,
}: FilterBarProps) {
  const filters: Array<{
    value: Exclude<BoardFilter, 'all'>;
    label: string;
    count: number;
  }> = [
    { value: 'thisWeek', label: '이번주 업무', count: thisWeekCount },
    { value: 'overdue', label: '일정초과', count: overdueCount },
  ];

  function selectFilter(filter: Exclude<BoardFilter, 'all'>) {
    onFilterChange(activeFilter === filter ? 'all' : filter);
  }

  return (
    <div className="flex items-center gap-2" aria-label="업무 필터">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;

        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => selectFilter(filter.value)}
            className={[
              'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'active border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]',
            ].join(' ')}
          >
            <span>{filter.label}</span>
            <span className="ml-2 inline-flex min-w-5 justify-center rounded-full bg-current/10 px-1.5 text-xs">
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
