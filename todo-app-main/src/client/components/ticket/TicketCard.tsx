'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmDialog } from '@/client/components/ui/ConfirmDialog';
import { DateRow } from '@/client/components/ui/DateRow';
import { PriorityBadge } from '@/client/components/ui/PriorityBadge';
import type { TicketWithMeta } from '@/shared/types';

interface TicketCardProps {
  ticket:   TicketWithMeta;
  onEdit:   (id: number) => void;
  onDelete: (id: number) => void;
}

export function TicketCard({ ticket, onEdit, onDelete }: TicketCardProps) {
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

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className={`relative rounded-lg border bg-[var(--color-surface)] p-3 shadow-sm ${
          ticket.isOverdue ? 'border-[var(--color-overdue)]' : 'border-[var(--color-border)]'
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            {...listeners}
            className="mt-0.5 cursor-grab select-none text-[var(--color-text-secondary)] active:cursor-grabbing"
          >
            ≡
          </span>
          <div className="min-w-0 flex-1">
            <h3
              className={`line-clamp-2 text-sm font-medium ${
                isCompleted
                  ? 'text-[var(--color-text-secondary)] line-through'
                  : 'text-[var(--color-text-primary)]'
              }`}
            >
              {ticket.title}
            </h3>
            {ticket.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                {ticket.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <PriorityBadge priority={ticket.priority} />
              <DateRow
                plannedStartDate={ticket.plannedStartDate}
                dueDate={ticket.dueDate}
                isOverdue={ticket.isOverdue}
              />
            </div>
          </div>
          {showActions && (
            <div className="flex shrink-0 flex-col gap-1">
              <button
                onClick={() => onEdit(ticket.id)}
                className="rounded px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
              >
                수정
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
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
