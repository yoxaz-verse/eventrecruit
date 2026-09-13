"use client";

import { useActionState, type ReactNode } from "react";
import type { WorkflowFormState } from "@/app/actions/workflow";
import { usePreserveFormValues } from "@/components/use-preserve-form-values";

export function WorkflowActionForm({ action, children, className }: {
  action: (state: WorkflowFormState, data: FormData) => Promise<WorkflowFormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: "", success: "" });
  const { formRef, capture } = usePreserveFormValues(state.error, pending);
  return <form action={formAction} aria-busy={pending} className={className} onSubmit={(event) => { if (pending) event.preventDefault(); else capture(); }} ref={formRef}>
    {children}
    {!pending && state.error ? <p className="alert" role="alert">{state.error}</p> : null}
    {!pending && state.success ? <p className="text-sm font-bold text-[var(--accent)]" role="status">{state.success}</p> : null}
  </form>;
}
