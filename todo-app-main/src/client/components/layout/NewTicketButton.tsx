'use client';

interface NewTicketButtonProps {
  onClick: () => void;
}

export function NewTicketButton({ onClick }: NewTicketButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
    >
      + 새 티켓
    </button>
  );
}
