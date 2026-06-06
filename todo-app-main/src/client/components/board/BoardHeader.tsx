'use client';

interface BoardHeaderProps {
  onCreateClick: () => void;
}

export function BoardHeader({ onCreateClick }: BoardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex min-h-[var(--header-height)] items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
      <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Tika</h1>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="검색"
          disabled
          aria-label="검색"
          className="form-input h-9 w-56 bg-[var(--color-surface-hover)]"
        />
        <button
          type="button"
          onClick={onCreateClick}
          className="btn btn-primary btn-md"
        >
          새 업무
        </button>
      </div>
    </header>
  );
}
