"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, ArrowRight, Check, ChevronDown, X } from "lucide-react";
import { updateApplicationStatus, type WorkflowFormState } from "@/app/actions/workflow";
import { StatusBadge } from "@/components/status-badge";
import {
  allowedApplicationTransitions,
  applicationStatusMeta,
  applicationStatusNeedsConfirmation,
} from "@/lib/application-workflow";
import type { ApplicationStatus } from "@/lib/types";

const initialState: WorkflowFormState = { error: "", success: "" };

export function ApplicationStatusActions({ applicationId, currentStatus }: { applicationId: string; currentStatus: ApplicationStatus }) {
  const [state, formAction, pending] = useActionState(updateApplicationStatus, initialState);
  const [confirming, setConfirming] = useState<ApplicationStatus | null>(null);
  const transitions = allowedApplicationTransitions(currentStatus);
  const recommended = transitions.filter(status => !applicationStatusNeedsConfirmation(status)).slice(0, 4);
  const otherActions = transitions.filter(applicationStatusNeedsConfirmation);
  const current = applicationStatusMeta[currentStatus];

  return <section className="application-status-panel mt-5 border-t border-[var(--line)] pt-5" aria-labelledby={`application-status-${applicationId}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]" id={`application-status-${applicationId}`}>Application status</p>
        <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={currentStatus}/><span className="text-sm text-[var(--muted)]">{current.description}</span></div>
      </div>
    </div>

    {transitions.length ? <form action={formAction} aria-busy={pending} className="mt-4">
      <input type="hidden" name="application_id" value={applicationId}/>
      {recommended.length ? <div>
        <p className="mb-2 text-sm font-bold">Recommended next actions</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {recommended.map((status, index) => {
            const meta = applicationStatusMeta[status];
            return <button className={`application-status-action ${index === 0 ? "application-status-action-primary" : ""}`} disabled={pending} key={status} name="status" type="submit" value={status}>
              <span><strong>{meta.actionLabel}</strong><small>{meta.description}</small></span><ArrowRight aria-hidden="true" size={17}/>
            </button>;
          })}
        </div>
      </div> : null}

      {otherActions.length ? <details className="mt-3" onToggle={event => { if (!(event.currentTarget as HTMLDetailsElement).open) setConfirming(null); }}>
        <summary className="application-status-more"><span>Other actions</span><ChevronDown aria-hidden="true" size={16}/></summary>
        <div className="mt-2 flex flex-wrap gap-2">
          {otherActions.map(status => <button className="button button-secondary min-h-10 px-3 text-xs" disabled={pending} key={status} onClick={() => setConfirming(status)} type="button">{applicationStatusMeta[status].actionLabel}</button>)}
        </div>
      </details> : null}

      {confirming ? <div className="application-status-confirm mt-3" role="alert" aria-labelledby={`confirm-${applicationId}`}>
        <AlertTriangle aria-hidden="true" className="shrink-0 text-[var(--danger)]" size={20}/>
        <div className="min-w-0 flex-1"><strong id={`confirm-${applicationId}`}>Confirm {applicationStatusMeta[confirming].label.toLowerCase()}</strong><p className="mt-1 text-sm text-[var(--muted)]">{applicationStatusMeta[confirming].description} This change cannot be reversed from this screen.</p></div>
        <div className="flex flex-wrap gap-2"><button className="button button-secondary min-h-10 px-3" disabled={pending} onClick={() => setConfirming(null)} type="button"><X aria-hidden="true" size={16}/>Cancel</button><button className="button button-danger min-h-10 px-3" disabled={pending} name="status" type="submit" value={confirming}><Check aria-hidden="true" size={16}/>{pending ? "Updating…" : "Confirm"}</button></div>
      </div> : null}

      {pending ? <p className="mt-3 text-sm font-bold text-[var(--accent)]" role="status" aria-live="polite"><span className="button-spinner mr-2 inline-block align-middle" aria-hidden="true"/>Updating application…</p> : null}
      {!pending && state.error ? <p className="alert mt-3" role="alert">{state.error}</p> : null}
      {!pending && state.success ? <p className="mt-3 text-sm font-bold text-[var(--success)]" role="status">{state.success}</p> : null}
    </form> : <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--surface)] p-3 text-sm font-bold"><Check aria-hidden="true" className="text-[var(--success)]" size={18}/>This application workflow is complete.</div>}
  </section>;
}
