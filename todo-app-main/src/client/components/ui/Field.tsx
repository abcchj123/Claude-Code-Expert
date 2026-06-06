'use client';

interface FieldProps {
  label:    string;
  error?:   string;
  children: React.ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-[var(--color-text-primary)]">{label}</label>
      {children}
      {error && (
        <span role="alert" className="text-xs text-[var(--color-priority-high)]">
          {error}
        </span>
      )}
    </div>
  );
}
