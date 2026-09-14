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
    text: "expo sphere helps coordinate suitable talent with profile, language, skill, and reliability signals.",
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
  const signedIn = Boolean(await getCurrentAccount());
  const db = await createClient();
  const upcomingResult = db ? await db.from('organizer_events').select('id,title,city,starts_at,ends_at,staffing_needs').eq('status','published').gte('ends_at',indiaToday()).order('starts_at').limit(3) : null;
  const upcomingEvents = (upcomingResult?.data ?? []) as Pick<OrganizerEvent,'id'|'title'|'city'|'starts_at'|'ends_at'|'staffing_needs'>[];
  return (
    <div className="shell">
      <TopNav />
      <main>
        <section className="hero-band border-b border-[var(--line)]">
          <div className="page hero-layout grid items-center gap-12 py-16 lg:grid-cols-[.9fr_1.1fr] lg:py-24">
            <div className="max-w-2xl">
              <span className="badge badge-accent">India-wide people operations</span>
              <h1 className="hero-title mt-6">
                The right people make <em>every moment</em> matter.
              </h1>
              <p className="hero-description mt-6 max-w-2xl text-[var(--muted)]">
                expo sphere helps brands, exhibitors, agencies, and store teams find
                verified people for exhibitions, retail stores, launches, roadshows,
                pop-ups, and campaign days. Wherever the work is happening in India,
                the people can be coordinated.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="button button-primary" href={signedIn ? "/dashboard" : "/signup"}>
                  Find people <ArrowRight size={18} aria-hidden />
                </Link>
                <Link className="button button-secondary" href={signedIn ? "/browse" : "/signup?role=talent"}>
                  {signedIn ? "Browse roles" : "Join as talent"}
                </Link>
              </div>
              <div className="hero-signals mt-10 grid gap-3 sm:grid-cols-2">
                {[
                  "Event staff, promoters, hosts, and brand reps",
                  "Coverage for events, stores, malls, and launches",
                  "Verified profiles and placement records",
                  "India-wide coordination from one workflow",
                ].map((signal) => (
                  <div className="trust-line" key={signal}>
                    <ShieldCheck size={18} aria-hidden />
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-visual">
              <Image
                src="/brand/expo-sphere-event-team.webp"
                width={1672}
                height={941}
                priority
                sizes="(max-width: 1023px) 100vw, 55vw"
                alt="Indian event staff welcoming visitors and helping with registration at an exhibition booth"
              />
              <div className="hero-brief panel">
                <p className="text-sm font-bold text-[var(--muted)]">Live India demand</p>
                <div className="mt-3 grid gap-3">
                  {openRoles.slice(0, 2).map((role) => (
                    <div className="brief-row" key={role.id}>
                      <div>
                        <strong>{role.role}</strong>
                        <p>{role.eventTitle}</p>
                      </div>
                      <span>{role.headcount} needed</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page py-14" aria-labelledby="upcoming-events-heading">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="section-heading"><span className="badge">Find your next opportunity</span><h2 id="upcoming-events-heading">Upcoming events</h2><p className="mt-4 text-[var(--muted)]">See who is hiring and how many people each position needs.</p></div>
            <Link className="button button-secondary" href="/events">View all events <ArrowRight size={18} aria-hidden /></Link>
          </div>
          {!db || upcomingResult?.error ? <p className="panel mt-8 p-6" role="alert">Events are temporarily unavailable. Please try again later.</p> : upcomingEvents.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{upcomingEvents.map(event=><article className="panel event-card gap-4 p-6" key={event.id}><span className="badge self-start">{event.city}</span><h3 className="text-2xl font-bold"><Link href={`/events/${event.id}`}>{event.title}</Link></h3><p className="text-sm text-[var(--muted)]">{event.starts_at} – {event.ends_at}</p><EventStaffingNeeds needs={event.staffing_needs}/><Link className="button button-secondary" href={`/events/${event.id}`}>View event</Link></article>)}</div> : <p className="panel mt-8 p-6">No upcoming events are published yet. Check back soon.</p>}
        </section>

        <section className="page py-14">
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

        <section className="coverage-band border-y border-[var(--line)]">
          <div className="page grid items-center gap-10 py-14 lg:grid-cols-[.95fr_1.05fr]">
            <div className="section-heading">
              <span className="badge">Where we help</span>
              <h2>No matter where in India your event or store activation is happening.</h2>
              <p className="mt-4 leading-8 text-[var(--muted)]">
                expo sphere helps coordinate the right people across major Indian
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
            <div className="coverage-map panel" aria-label="India coverage map for expo sphere">
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

        <section className="page py-14">
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

        <section className="process-band border-y border-[var(--line)]">
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

        <section className="page py-14">
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

        <section className="cta-band">
          <div className="page py-14">
            <div className="cta-content">
              <div>
                <span className="badge badge-light">
                  <Sparkles size={14} aria-hidden />
                  People-first operations
                </span>
                <h2>Need people for an event, store, launch, or activation?</h2>
                <p>
                  Start with your role and location. expo sphere keeps the process
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
    </div>
  );
}
