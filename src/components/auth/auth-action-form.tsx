"use client";

import { useActionState, type ReactNode } from "react";
import type { AuthFormState } from "@/app/actions/auth";
import { usePreserveFormValues } from "@/components/use-preserve-form-values";

export function AuthActionForm({ action, children, className = "grid gap-4" }: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: "" });
  const { formRef, capture } = usePreserveFormValues(state.error, pending);
  return <form action={formAction} aria-busy={pending} className={className} onSubmit={(event) => { if (pending) event.preventDefault(); else capture(); }} ref={formRef}>
    {!pending && state.error ? <p className="alert" role="alert">{state.error}</p> : null}
    {children}
  </form>;
}
