
import { ShieldCheck, Star, CheckCircle2, Clock, MessageSquare, Sparkles, TrendingUp, Info, Award } from "lucide-react";
import { requireExhibitorWorkspace } from "@/lib/dashboard-workspace";

function RatingStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rounded ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"}
        />
      ))}
    </div>
  );
}

function getTrustTier(score: number) {
  if (score >= 85) return { label: "Top Rated Exhibitor", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" };
  if (score >= 70) return { label: "Verified Exhibitor", color: "bg-blue-500/10 text-blue-700 border-blue-200" };
  if (score >= 50) return { label: "Active Partner", color: "bg-amber-500/10 text-amber-700 border-amber-200" };
  return { label: "Building Reputation", color: "bg-slate-500/10 text-slate-700 border-slate-200" };
}

export default async function ExhibitorReputation() {
  const { db, entity } = await requireExhibitorWorkspace();
  const { data: r, error } = await db
    .from("exhibitor_reputation")
    .select("trust_score,average_rating,completed_count,reliability_score,communication_score,professionalism_score,cancellations,disputes")
    .eq("exhibitor_id", entity.id)
    .maybeSingle();

  if (error) throw new Error("Unable to load reputation.");

  const trustScore = r?.trust_score ?? 100;
  const avgRating = Number(r?.average_rating ?? 0);
  const completedCount = r?.completed_count ?? 0;
  const reliability = r?.reliability_score ?? 100;
  const communication = r?.communication_score ?? 100;
  const professionalism = r?.professionalism_score ?? 100;
  const cancellations = r?.cancellations ?? 0;
  const disputes = r?.disputes ?? 0;

  const trustTier = getTrustTier(trustScore);

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header Banner */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge">Exhibitor panel</span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${trustTier.color}`}>
            <Award size={13} />
            {trustTier.label}
          </span>
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">{entity.company_name} reputation</h1>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
          Live reputation scores belong to your exhibitor business, reflecting performance from direct events and operations managed by authorized agencies.
        </p>
      </div>

      {/* Primary KPI Overview Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Trust Score Card */}
        <div className="panel p-6 rounded-2xl bg-white border border-[var(--line)] shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">Trust score</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <strong className="text-4xl font-black text-[var(--foreground)]">{trustScore}</strong>
              <span className="text-sm font-semibold text-[var(--muted)]">/ 100</span>
            </div>

            {/* Score Bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  trustScore >= 80 ? "bg-emerald-500" : trustScore >= 50 ? "bg-blue-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="panel p-6 rounded-2xl bg-white border border-[var(--line)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">Average rating</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Star size={20} className="fill-amber-400" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <strong className="text-4xl font-black text-[var(--foreground)]">{avgRating.toFixed(2)}</strong>
              <span className="text-sm font-semibold text-[var(--muted)]">/ 5.0</span>
            </div>

            <div className="mt-2.5 flex items-center justify-between">
              <RatingStars rating={avgRating} />
              <span className="text-xs text-[var(--muted)]">Organizer & staff feedback</span>
            </div>
          </div>
        </div>

        {/* Completed Operations Card */}
        <div className="panel p-6 rounded-2xl bg-white border border-[var(--line)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">Completed engagements</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="mt-4">
            <strong className="text-4xl font-black text-[var(--foreground)]">{completedCount}</strong>
            <div className="mt-2.5 flex items-center gap-3 text-xs text-[var(--muted)]">
              <span>{cancellations} cancellations</span>
              <span>•</span>
              <span>{disputes} disputes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Breakdown Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            <span>Detailed Performance Breakdown</span>
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Scores measured across reliability, communication, and overall professionalism.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Reliability */}
          <div className="panel p-5 rounded-2xl bg-white border border-[var(--line)] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Clock size={16} />
                </div>
                <strong className="text-sm font-bold text-[var(--foreground)]">Reliability</strong>
              </div>
              <span className="text-lg font-black text-[var(--foreground)]">{reliability}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${reliability}%` }} />
            </div>
          </div>

          {/* Communication */}
          <div className="panel p-5 rounded-2xl bg-white border border-[var(--line)] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <MessageSquare size={16} />
                </div>
                <strong className="text-sm font-bold text-[var(--foreground)]">Communication</strong>
              </div>
              <span className="text-lg font-black text-[var(--foreground)]">{communication}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${communication}%` }} />
            </div>
          </div>

          {/* Professionalism */}
          <div className="panel p-5 rounded-2xl bg-white border border-[var(--line)] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Sparkles size={16} />
                </div>
                <strong className="text-sm font-bold text-[var(--foreground)]">Professionalism</strong>
              </div>
              <span className="text-lg font-black text-[var(--foreground)]">{professionalism}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-violet-600 transition-all duration-500" style={{ width: `${professionalism}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Info Card */}
      <div className="panel p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-0.5">How is exhibitor reputation calculated?</strong>
          Reputation scores update automatically as event organizers and hired staff submit placement reviews. Maintaining timely responses to space inquiries, clear staffing briefs, and prompt settlement processing ensures your company retains top verified status.
        </div>
      </div>
    </div>
  );
}
