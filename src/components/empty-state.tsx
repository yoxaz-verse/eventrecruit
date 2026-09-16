import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] ${className}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-[var(--line)] text-[var(--accent)] shrink-0 shadow-xs">
          <Icon size={18} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <strong className="text-xs font-bold text-[var(--foreground)] block truncate">{title}</strong>
          {description && <p className="text-[11px] text-[var(--muted)] truncate">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  return (
    <div className={`panel p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-white border border-[var(--line)] rounded-2xl shadow-xs ${className}`}>
      <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[var(--accent)] border border-blue-100/80 shadow-xs">
        <Icon size={26} aria-hidden />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-black tracking-tight text-[var(--foreground)]">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-[var(--muted)] max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
