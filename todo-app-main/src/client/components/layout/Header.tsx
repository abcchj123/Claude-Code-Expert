'use client';

import { NewTicketButton } from './NewTicketButton';

interface HeaderProps {
  onNewTicket: () => void;
}

export function Header({ onNewTicket }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
      <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">TIKA</h1>
      <NewTicketButton onClick={onNewTicket} />
    </header>
  );
}
