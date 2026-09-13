"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText, className = "button button-primary", disabled = false }: {
  children: ReactNode;
  pendingText: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} data-pending={pending || undefined} disabled={disabled} aria-disabled={disabled || pending} onClick={pending ? (event) => event.preventDefault() : undefined} type="submit">
      {pending ? <><span className="button-spinner" aria-hidden="true" /><span role="status" aria-live="polite">{pendingText}</span></> : children}
    </button>
  );
}
