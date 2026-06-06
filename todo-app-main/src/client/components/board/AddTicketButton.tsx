'use client';

interface AddTicketButtonProps {
  onClick: () => void;
}

export function AddTicketButton({ onClick }: AddTicketButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]"
    >
      <span className="text-lg leading-none">+</span>
      <span>추가</span>
    </button>
  );
}
