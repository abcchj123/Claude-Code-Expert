'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmDialog } from '@/client/components/ui/ConfirmDialog';
import { PriorityBadge, DueDateBadge } from '@/client/components/ui/Badge';
import type { TicketWithMeta } from '@/shared/types';

interface TicketCardProps {
  ticket:   TicketWithMeta;
  onEdit:   (id: number) => void;
  onDelete: (id: number) => void;
  onClick?: () => void;
}

export function TicketCard({ ticket, onEdit, onDelete, onClick }: TicketCardProps) {
  const [showActions,   setShowActions]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.4 : 1,
  };

  const isCompleted = ticket.status === 'DONE';

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        role="button"
        tabIndex={0}
        aria-label={ticket.title}
        data-overdue={ticket.isOverdue ? 'true' : undefined}
        className={`ticket-card${isCompleted ? ' ticket-card-done' : ''}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-start gap-2">
          <span
            {...listeners}
            className="mt-0.5 cursor-grab select-none text-[var(--color-text-secondary)] active:cursor-grabbing"
          >
            ≡
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="ticket-title line-clamp-2 text-sm font-medium text-[var(--color-text-primary)]">
              {ticket.title}
            </h3>
            {ticket.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                {ticket.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <PriorityBadge priority={ticket.priority} />
              <DueDateBadge
                plannedStartDate={ticket.plannedStartDate}
                dueDate={ticket.dueDate}
                isOverdue={ticket.isOverdue}
              />
            </div>
          </div>
          {showActions && (
            <div className="flex shrink-0 flex-col gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(ticket.id); }}
                className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
              >
                수정
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(true); }}
                className="rounded px-2 py-0.5 text-xs text-[var(--color-priority-high)] hover:bg-[var(--color-border)]"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          message="티켓을 삭제하시겠습니까?"
          onConfirm={() => onDelete(ticket.id)}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </>
  );
}
