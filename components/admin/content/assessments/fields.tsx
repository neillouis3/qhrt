import type { ReactNode } from 'react';

export const inputClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50';

export const primaryButtonClass =
  'px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50';

export const secondaryButtonClass =
  'px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:bg-muted/5 transition-colors disabled:opacity-50';

export const smallButtonClass =
  'px-2.5 py-1 text-xs font-medium rounded-md border border-border text-muted hover:bg-muted/5 transition-colors disabled:opacity-40';

export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
