'use client';

interface FieldProps {
  label:    string;
  error?:   string;
  children: React.ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="form-field">
      <label className="text-sm font-medium text-[var(--color-text-primary)]">{label}</label>
      {children}
      {error && (
        <span role="alert" className="form-error">
          {error}
        </span>
      )}
    </div>
  );
}
