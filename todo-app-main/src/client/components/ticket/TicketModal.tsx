'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TicketForm } from './TicketForm';
import type { Ticket } from '@/shared/types';
import type { CreateTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';

interface TicketModalProps {
  mode:         'create' | 'edit';
  ticket?:      Ticket;
  onClose:      () => void;
  onSubmit:     (data: CreateTicketInput | UpdateTicketInput) => Promise<void>;
  isSubmitting: boolean;
}

export function TicketModal({ mode, ticket, onClose, onSubmit, isSubmitting }: TicketModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const defaultValues = ticket
    ? {
        title:            ticket.title,
        description:      ticket.description ?? undefined,
        priority:         ticket.priority,
        plannedStartDate: ticket.plannedStartDate ?? undefined,
        dueDate:          ticket.dueDate ?? undefined,
      }
    : undefined;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col gap-4 rounded-xl bg-[var(--color-surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            {mode === 'create' ? '새 티켓' : '티켓 수정'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
          >
            ×
          </button>
        </header>
        <TicketForm
          defaultValues={defaultValues}
          onSubmit={onSubmit as (data: CreateTicketInput) => void}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
