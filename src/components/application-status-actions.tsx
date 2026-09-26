"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  X,
  FileText,
  UserCheck,
  Eye,
  CheckCircle2,
  Star,
  Sparkles,
  XCircle,
  Ban,
  CornerUpLeft,
  User,
  Archive,
} from "lucide-react";
import { updateApplicationStatus, type WorkflowFormState } from "@/app/actions/workflow";
import { StatusBadge } from "@/components/status-badge";
import {
  allowedApplicationTransitions,
  applicationStatusMeta,
  applicationStatusNeedsConfirmation,
} from "@/lib/application-workflow";
import type { ApplicationStatus } from "@/lib/types";

const initialState: WorkflowFormState = { error: "", success: "" };

const statusIconMap: Record<string, React.ElementType> = {
  assigned: UserCheck,
  documents_requested: FileText,
  approved: CheckCircle2,
  under_review: Eye,
  shortlisted: Star,
  completed: Sparkles,
  rejected: XCircle,
  cancelled: Ban,
  withdrawn: CornerUpLeft,
  applied: User,
  closed: Archive,
};

export function ApplicationStatusActions({ applicationId, currentStatus }: { applicationId: string; currentStatus: ApplicationStatus }) {
  const [state, formAction, pending] = useActionState(updateApplicationStatus, initialState);
  const [confirming, setConfirming] = useState<ApplicationStatus | null>(null);
  const transitions = allowedApplicationTransitions(currentStatus);
  const recommended = transitions.filter(status => !applicationStatusNeedsConfirmation(status)).slice(0, 4);
  const otherActions = transitions.filter(applicationStatusNeedsConfirmation);
  const current = applicationStatusMeta[currentStatus];

  return (
    <section className="application-status-panel mt-6 border-t border-[var(--line)] pt-6" aria-labelledby={`application-status-${applicationId}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]" id={`application-status-${applicationId}`}>
            Application status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <StatusBadge status={currentStatus} />
            <span className="text-xs font-semibold text-[var(--muted)]">{current.description}</span>
          </div>
        </div>
      </div>

      {transitions.length ? (
        <form action={formAction} aria-busy={pending} className="mt-4">
          <input type="hidden" name="application_id" value={applicationId} />

          {recommended.length ? (
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  <span>Recommended next actions</span>
                </p>
                {pending && (
                  <span className="text-xs font-bold text-[var(--accent)] animate-pulse flex items-center gap-1">
                    <span className="button-spinner !w-3 !h-3" />
                    Updating status…
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {recommended.map((status, index) => {
                  const meta = applicationStatusMeta[status];
                  const Icon = statusIconMap[status] ?? ArrowRight;
                  const isPrimary = index === 0;

                  return (
                    <button
                      className={`relative flex flex-col justify-between gap-3 p-5 rounded-2xl border text-left transition-all duration-200 group cursor-pointer overflow-hidden ${
                        isPrimary
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border-blue-400/40 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                          : "bg-white hover:bg-blue-50/60 text-slate-900 border-[var(--line)] hover:border-blue-400/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
                      }`}
                      disabled={pending}
                      key={status}
                      name="status"
                      type="submit"
                      value={status}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            isPrimary
                              ? "bg-white/20 text-white backdrop-blur-md"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isPrimary ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                              <span>Primary action</span>
                            </>
                          ) : (
                            <span>Recommended</span>
                          )}
                        </span>
                        <Icon size={18} className={isPrimary ? "text-white/90 group-hover:scale-110 transition-transform" : "text-[var(--accent)] group-hover:scale-110 transition-transform"} />
                      </div>

                      <div className="mt-2">
                        <strong
                          className={`text-base font-black tracking-tight flex items-center justify-between gap-2 ${
                            isPrimary ? "text-white" : "text-slate-900 group-hover:text-[var(--accent)] transition-colors"
                          }`}
                        >
                          <span>{meta.actionLabel}</span>
                          <ArrowRight
                            size={17}
                            className={`shrink-0 transition-transform ${
                              isPrimary ? "text-white group-hover:translate-x-1.5" : "text-[var(--accent)] group-hover:translate-x-1"
                            }`}
                          />
                        </strong>
                        <small
                          className={`mt-1 block text-xs font-medium leading-snug ${
                            isPrimary ? "text-blue-100/90" : "text-[var(--muted)]"
                          }`}
                        >
                          {meta.description}
                        </small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {otherActions.length ? (
            <details className="mt-4" onToggle={event => { if (!(event.currentTarget as HTMLDetailsElement).open) setConfirming(null); }}>
              <summary className="application-status-more text-xs font-extrabold text-[var(--muted)] hover:text-slate-900 cursor-pointer flex items-center gap-1 py-1">
                <span>Other actions ({otherActions.length})</span>
                <ChevronDown aria-hidden="true" size={16} />
              </summary>
              <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-[var(--line)]/60">
                {otherActions.map(status => (
                  <button
                    className="button button-secondary min-h-10 px-3.5 text-xs font-bold shadow-xs hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all"
                    disabled={pending}
                    key={status}
                    onClick={() => setConfirming(status)}
                    type="button"
                  >
                    {applicationStatusMeta[status].actionLabel}
                  </button>
                ))}
              </div>
            </details>
          ) : null}

          {confirming ? (
            <div className="application-status-confirm mt-4 rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-md space-y-4" role="alert" aria-labelledby={`confirm-${applicationId}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 border border-red-200">
                  <AlertTriangle aria-hidden="true" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="text-base font-black text-red-950" id={`confirm-${applicationId}`}>
                    Confirm {applicationStatusMeta[confirming].label.toLowerCase()}
                  </strong>
                  <p className="mt-1 text-xs font-semibold text-red-800/90 leading-relaxed">
                    {applicationStatusMeta[confirming].description} This change cannot be reversed from this screen.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-red-200/60">
                <button
                  className="button button-secondary min-h-9 px-4 text-xs font-bold hover:bg-white"
                  disabled={pending}
                  onClick={() => setConfirming(null)}
                  type="button"
                >
                  <X aria-hidden="true" size={15} />
                  <span>Cancel</span>
                </button>
                <button
                  className="button bg-red-600 hover:bg-red-700 text-white min-h-9 px-5 text-xs font-bold shadow-md hover:shadow-lg gap-1.5 transition-all"
                  disabled={pending}
                  name="status"
                  type="submit"
                  value={confirming}
                >
                  <Check aria-hidden="true" size={16} />
                  <span>{pending ? "Updating…" : `Confirm ${applicationStatusMeta[confirming].label}`}</span>
                </button>
              </div>
            </div>
          ) : null}

          {!pending && state.error ? <p className="alert mt-3" role="alert">{state.error}</p> : null}
          {!pending && state.success ? <p className="mt-3 text-sm font-bold text-[var(--success)]" role="status">{state.success}</p> : null}
        </form>
      ) : (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-bold text-emerald-900">
          <CheckCircle2 aria-hidden="true" className="text-emerald-600 shrink-0" size={20} />
          <span>This application workflow is complete.</span>
        </div>
      )}
    </section>
  );
}
