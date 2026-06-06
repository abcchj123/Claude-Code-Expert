'use client';

interface ConfirmDialogProps {
  message:   string;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-[var(--color-surface)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-6 text-sm text-[var(--color-text-primary)]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-[var(--color-priority-high)] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
