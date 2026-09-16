import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Handshake,
  MapPin,
  Megaphone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { SiteFooter } from "@/components/site-footer";
import { openRoles } from "@/lib/mock-data";
import { getCurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { indiaToday, type OrganizerEvent } from "@/lib/organizer";
import { EventStaffingNeeds } from "@/components/event-staffing-needs";

const services = [
  {
    icon: BadgeCheck,
    title: "Verified event talent",
    text: "Hosts, registration teams, demonstrators, ushers, lead capture staff, and field support.",
  },
  {
    icon: Store,
    title: "Retail and store activations",
    text: "Promoters, sampling staff, launch teams, mall activation crews, and brand representatives.",
  },
  {
    icon: ClipboardCheck,
    title: "Managed staffing records",
    text: "Applications, placement status, attendance context, feedback, and reliability signals stay visible.",
  },
];

const places = [
  "Exhibitions",
  "Conferences",
  "Retail stores",
  "Mall activations",
  "Product launches",
  "Roadshows",
  "Pop-ups",
  "Brand sampling",
];

const audiences = [
  {
    icon: Building2,
    title: "Brands and exhibitors",
    text: "Find people for counters, booths, launches, product demos, and high-footfall campaign days.",
  },
  {
    icon: Megaphone,
    title: "Agencies",
    text: "Coordinate staffing for clients across cities while keeping requests, recommendations, and commission records organized.",
  },
  {
    icon: ShoppingBag,
    title: "Retail and store teams",
    text: "Support store openings, sampling drives, promoter shifts, and local activations with verified people.",
  },
  {
    icon: Users,
    title: "Event talent",
    text: "Join as verified talent, apply for work, and build a reliable profile from completed placements.",
  },
];

const cityCoverage = [
  { city: "Delhi NCR", x: 32, y: 30, labelX: 10, labelY: -20, events: 42, people: 180 },
  { city: "Jaipur", x: 27, y: 37, labelX: 10, labelY: -8, events: 18, people: 74 },
  { city: "Ahmedabad", x: 18, y: 51, labelX: 10, labelY: -8, events: 21, people: 92 },
  { city: "Mumbai", x: 19, y: 65, labelX: 10, labelY: -10, events: 46, people: 210 },
  { city: "Pune", x: 22, y: 68, labelX: 10, labelY: 6, events: 29, people: 126 },
  { city: "Hyderabad", x: 37, y: 69, labelX: 10, labelY: -2, events: 34, people: 150 },
  { city: "Bengaluru", x: 34, y: 82, labelX: 10, labelY: -6, events: 39, people: 172 },
  { city: "Chennai", x: 44, y: 83, labelX: 10, labelY: -2, events: 31, people: 138 },
  { city: "Kochi", x: 30, y: 92, labelX: 10, labelY: -2, events: 16, people: 68 },
  { city: "Kolkata", x: 71, y: 51, labelX: 10, labelY: -8, events: 24, people: 96 },
];

const steps = [
  {
    icon: MapPin,
    title: "Tell us where",
    text: "Share the city, venue, store, event type, dates, shifts, and number of people needed.",
  },
  {
    icon: ShieldCheck,
    title: "Match verified people",
    text: "exporb helps coordinate suitable talent with profile, language, skill, and reliability signals.",
  },
  {
    icon: Handshake,
    title: "Run the work",
    text: "Track applications, placements, attendance context, feedback, and agency commission records.",
  },
];

const landingMetrics = [
  { label: "India markets", value: "10+", detail: "Events and retail activations covered" },
  { label: "Verified talent", value: "1,248", detail: "Hosts, promoters, demo teams, and field staff" },
  { label: "Active needs", value: "214", detail: "Open event and store positions requested" },
  { label: "Placements", value: "418", detail: "Tracked this quarter" },
];

export default async function Home() {
  const upcomingResultPromise = createClient().then((db) =>
    db
      ? db
          .from("organizer_events")
          .select("id,title,city,starts_at,ends_at,staffing_needs")
          .eq("status", "published")
          .gte("ends_at", indiaToday())
          .order("starts_at")
          .limit(3)
      : null,
  );
  const [account, upcomingResult] = await Promise.all([
    getCurrentAccount(),
    upcomingResultPromise,
  ]);
  const signedIn = Boolean(account);
  const upcomingEvents = (upcomingResult?.data ?? []) as Pick<OrganizerEvent,'id'|'title'|'city'|'starts_at'|'ends_at'|'staffing_needs'>[];
  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <TopNav signedIn={signedIn} />
      <main id="main-content">
        <section className="hero-band border-b border-[var(--line)] relative overflow-hidden">
          <div className="hero-pattern" aria-hidden="true">
            <span className="hero-orbit hero-orbit-one" />
            <span className="hero-orbit hero-orbit-two" />
            <span className="hero-coordinate">28.6139° N · 77.2090° E</span>
          </div>
          <div className="page hero-layout grid items-center gap-12 py-16 lg:grid-cols-[.95fr_1.05fr] lg:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/80 px-3.5 py-1.5 text-xs font-extrabold text-[var(--accent)] shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                <span>India-Wide Event & Retail Talent Ops</span>
              </div>

              <h1 className="hero-title mt-6 tracking-tight font-black">
                The right people make{" "}
                <em className="bg-gradient-to-r from-[var(--accent)] via-blue-600 to-[var(--accent-2)] bg-clip-text text-transparent not-italic">
                  every moment
                </em>{" "}
                matter.
              </h1>

              <p className="hero-description mt-6 max-w-2xl text-[var(--muted)] leading-relaxed text-lg">
                exporb helps brands, exhibitors, agencies, and store teams find
                verified people for exhibitions, retail stores, launches, roadshows,
                pop-ups, and campaign days across 10+ Indian cities.
              </p>

              <div className="mt-8 flex flex-wrap gap-3.5">
                <Link className="button button-primary gap-2 shadow-md hover:shadow-xl transition-all" href={signedIn ? "/dashboard" : "/signup"}>
                  <span>Find verified talent</span>
                  <ArrowRight size={18} aria-hidden />
                </Link>
                <Link className="button button-secondary gap-2 font-bold hover:bg-white" href={signedIn ? "/browse" : "/signup?role=talent"}>
                  <Sparkles size={17} className="text-[var(--accent-2)]" aria-hidden />
                  <span>{signedIn ? "Browse open roles" : "Join as talent"}</span>
                </Link>
              </div>

              <div className="hero-signals mt-10 grid gap-3.5 sm:grid-cols-2">
                {[
                  "Event staff, promoters, hosts & brand reps",
                  "Exhibitions, stores, malls & product launches",
                  "Verified profiles & placement track records",
                  "India-wide coordination from single portal",
                ].map((signal) => (
                  <div className="trust-line text-sm font-semibold flex items-center gap-2.5" key={signal}>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 shrink-0">
                      <ShieldCheck size={15} aria-hidden />
                    </div>
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-visual relative">
              <span className="hero-image-label" aria-hidden="true">FIELD / 01</span>
              <Image
                src="/brand/expo-sphere-event-team.webp"
                width={1672}
                height={941}
                priority
                className="rounded-2xl shadow-2xl border border-white/60 object-cover"
                sizes="(max-width: 1023px) 100vw, 55vw"
                alt="Indian event staff welcoming visitors and helping with registration at an exhibition booth"
              />

              <div className="hero-brief panel backdrop-blur-md bg-white/95 border border-[var(--line)] shadow-xl p-5 rounded-2xl">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                    <p className="text-xs font-black uppercase tracking-wider text-[var(--accent)]">Live India demand</p>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--muted)]">214+ Active</span>
                </div>

                <div className="grid gap-2.5">
                  {openRoles.slice(0, 2).map((role) => (
                    <div className="brief-row flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)]/50" key={role.id}>
                      <div>
                        <strong className="text-sm font-bold block">{role.role}</strong>
                        <p className="text-xs text-[var(--muted)]">{role.eventTitle}</p>
                      </div>
                      <span className="text-xs font-black text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full">{role.headcount} needed</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="venue-ribbon" aria-label="Event and activation formats">
          <div className="venue-ribbon-track">
            {[...places, ...places].map((place, index) => (
              <span key={`${place}-${index}`}>
                <Sparkles size={13} aria-hidden /> {place}
              </span>
            ))}
          </div>
        </div>

        <section className="home-section patterned-section page py-14" aria-labelledby="upcoming-events-heading">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="section-heading"><span className="badge">Find your next opportunity</span><h2 id="upcoming-events-heading">Upcoming events</h2><p className="mt-4 text-[var(--muted)]">See who is hiring and how many people each position needs.</p></div>
            <Link className="button button-secondary" href="/events">View all events <ArrowRight size={18} aria-hidden /></Link>
          </div>
          {!upcomingResult || upcomingResult.error ? <p className="panel mt-8 p-6" role="alert">Events are temporarily unavailable. Please try again later.</p> : upcomingEvents.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{upcomingEvents.map(event=><article className="panel event-card gap-4 p-6" key={event.id}><span className="badge self-start">{event.city}</span><h3 className="text-2xl font-bold"><Link href={`/events/${event.id}`}>{event.title}</Link></h3><p className="text-sm text-[var(--muted)]">{event.starts_at} – {event.ends_at}</p><EventStaffingNeeds needs={event.staffing_needs}/><Link className="button button-secondary" href={`/events/${event.id}`}>View event</Link></article>)}</div> : <p className="panel mt-8 p-6">No upcoming events are published yet. Check back soon.</p>}
        </section>

        <section className="home-section page py-14 section-numbered">
          <div className="section-heading">
            <span className="badge">What we do</span>
            <h2>We take care of the people behind your event, store, or campaign.</h2>
          </div>
          <div className="services-grid mt-10">
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <article className="service-card" key={item.title}>
                  <span className="service-icon"><Icon size={28} aria-hidden /></span>
                  <h3 className="mt-6 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 leading-7 text-[var(--muted)]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="home-section coverage-band border-y border-[var(--line)] section-numbered">
          <div className="page grid items-center gap-10 py-14 lg:grid-cols-[.95fr_1.05fr]">
            <div className="section-heading">
              <span className="badge">Where we help</span>
              <h2>No matter where in India your event or store activation is happening.</h2>
              <p className="mt-4 leading-8 text-[var(--muted)]">
                exporb helps coordinate the right people across major Indian
                markets, from exhibition halls and conference venues to retail stores,
                malls, pop-ups, and local brand activations.
              </p>
              <div className="coverage-tags mt-6">
                {places.map((place) => (
                  <span className="badge" key={place}>
                    {place}
                  </span>
                ))}
              </div>
            </div>
            <div className="coverage-map panel" aria-label="India coverage map for exporb">
              <div className="map-shell">
                <div className="map-viewport">
                  <Image
                    aria-hidden="true"
                    alt=""
                    className="india-map"
                    height={2000}
                    unoptimized
                    width={1871}
                    src="/brand/india-map.svg"
                  />
                  {cityCoverage.map((market) => (
                    <div
                      aria-label={`${market.city}: ${market.events} staffing needs, ${market.people} people`}
                      className="map-pin"
                      key={market.city}
                      style={{ left: `${market.x}%`, top: `${market.y}%` }}
                    >
                      <span className="pin-dot" />
                      <span
                        className="pin-label"
                        style={{
                          transform: `translate(${market.labelX}px, ${market.labelY}px)`,
                        }}
                      >
                        {market.city}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="city-grid">
                {cityCoverage.map((market) => (
                  <div className="city-row" key={market.city}>
                    <strong>{market.city}</strong>
                    <span>
                      {market.events} needs / {market.people} people
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="home-section page py-14 section-numbered">
          <div className="section-heading">
            <span className="badge">Who we serve</span>
            <h2>Built for the teams responsible for getting people on the ground.</h2>
          </div>
          <div className="audience-grid mt-10">
            {audiences.map((item) => {
              const Icon = item.icon;
              return (
                <article className="audience-card" key={item.title}>
                  <Icon className="text-[var(--accent)]" size={28} aria-hidden />
                  <h3 className="mt-4 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 leading-7 text-[var(--muted)]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="home-section process-band border-y border-[var(--line)] section-numbered">
          <div className="page py-14">
            <div className="section-heading">
              <span className="badge">How it works</span>
              <h2>From location and staffing need to verified people on site.</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <article className="step-card" key={step.title}>
                    <Icon className="text-[var(--accent)]" size={28} aria-hidden />
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="home-section page py-14 section-numbered metrics-section">
          <div className="section-heading">
            <span className="badge">Marketplace signals</span>
            <h2>Real operating context for teams that need people quickly.</h2>
          </div>
          <div className="metrics-strip mt-10">
            {landingMetrics.map((metric) => (
              <div className="metric-item" key={metric.label}>
                <p className="text-sm font-bold text-[var(--muted)]">{metric.label}</p>
                <strong className="mt-2 block text-4xl">{metric.value}</strong>
                <p className="mt-2 text-sm text-[var(--muted)]">{metric.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-section cta-band">
          <div className="page py-14">
            <div className="cta-content">
              <div>
                <span className="badge badge-light">
                  <Sparkles size={14} aria-hidden />
                  People-first operations
                </span>
                <h2>Need people for an event, store, launch, or activation?</h2>
                <p>
                  Start with your role and location. exporb keeps the process
                  simple: find verified people, coordinate placements, and keep trust
                  records visible.
                </p>
              </div>
              <Link className="button button-light" href={signedIn ? "/dashboard" : "/signup"}>
                {signedIn ? "Go to dashboard" : "Get started"} <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
