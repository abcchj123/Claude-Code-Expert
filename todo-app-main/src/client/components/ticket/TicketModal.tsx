'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/client/components/ui/Button';
import { ConfirmDialog } from '@/client/components/ui/ConfirmDialog';
import type { Ticket } from '@/shared/types';
import type { CreateTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';
import { TicketDetailView } from './TicketDetailView';
import { TicketForm } from './TicketForm';

interface TicketModalProps {
  mode:         'create' | 'edit';
  ticket?:      Ticket;
  onClose:      () => void;
  onSubmit:     (data: CreateTicketInput | UpdateTicketInput) => Promise<void>;
  onDelete?:    () => Promise<void>;
  isSubmitting: boolean;
}

export function TicketModal({ mode, ticket, onClose, onSubmit, onDelete, isSubmitting }: TicketModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            {mode === 'create' ? '새 티켓' : '티켓 수정'}
          </h2>
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                삭제
              </Button>
            )}
            <button
              aria-label="닫기"
              onClick={onClose}
              className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
            >
              ×
            </button>
          </div>
        </header>

        {/* 읽기 전용 메타 정보 (수정 모드) */}
        {mode === 'edit' && ticket && (
          <TicketDetailView ticket={ticket} />
        )}

        {/* 편집 폼 */}
        <TicketForm
          defaultValues={defaultValues}
          onSubmit={onSubmit as (data: CreateTicketInput) => void}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />

        {/* 삭제 2단계 확인 */}
        {showDeleteConfirm && (
          <ConfirmDialog
            message="티켓을 삭제하시겠습니까?"
            onConfirm={async () => {
              await onDelete?.();
              setShowDeleteConfirm(false);
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
