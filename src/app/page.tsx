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
  { city: "Delhi NCR", x: 48, y: 22, events: 42, people: 180 },
  { city: "Jaipur", x: 39, y: 31, events: 18, people: 74 },
  { city: "Ahmedabad", x: 32, y: 44, events: 21, people: 92 },
  { city: "Mumbai", x: 35, y: 58, events: 46, people: 210 },
  { city: "Pune", x: 42, y: 62, events: 29, people: 126 },
  { city: "Hyderabad", x: 52, y: 66, events: 34, people: 150 },
  { city: "Bengaluru", x: 48, y: 78, events: 39, people: 172 },
  { city: "Chennai", x: 58, y: 82, events: 31, people: 138 },
  { city: "Kochi", x: 43, y: 88, events: 16, people: 68 },
  { city: "Kolkata", x: 76, y: 46, events: 24, people: 96 },
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
    text: "EventRecruit helps coordinate suitable talent with profile, language, skill, and reliability signals.",
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

export default function Home() {
  return (
    <div className="shell">
      <TopNav />
      <main>
        <section className="hero-band border-b border-[var(--line)]">
          <div className="page grid min-h-[650px] items-center gap-10 py-12 lg:grid-cols-[.92fr_1.08fr]">
            <div className="max-w-2xl">
              <span className="badge badge-accent">India-wide people operations</span>
              <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">
                People for events and retail activations across India.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
                EventRecruit helps brands, exhibitors, agencies, and store teams find
                verified people for exhibitions, retail stores, launches, roadshows,
                pop-ups, and campaign days. Wherever the work is happening in India,
                the people can be coordinated.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="button button-primary" href="/signup">
                  Find people <ArrowRight size={18} aria-hidden />
                </Link>
                <Link className="button button-secondary" href="/signup">
                  Join as talent
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
                src="/brand/eventrecruit-hero.png"
                width={1728}
                height={921}
                priority
                alt="Verified event staff assisting exhibitors at a trade show booth"
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

        <section className="page py-14">
          <div className="section-heading">
            <span className="badge">What we do</span>
            <h2>We take care of the people behind your event, store, or campaign.</h2>
          </div>
          <div className="grid-auto mt-8">
            {services.map((item) => {
              const Icon = item.icon;
              return (
                <article className="panel p-5" key={item.title}>
                  <Icon className="text-[var(--accent)]" size={28} aria-hidden />
                  <h3 className="mt-4 text-xl font-black">{item.title}</h3>
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
                EventRecruit helps coordinate the right people across major Indian
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
            <div className="coverage-map panel" aria-label="India coverage map">
              <div className="map-shell">
                <svg
                  aria-hidden="true"
                  className="india-map"
                  viewBox="0 0 100 110"
                  role="img"
                >
                  <path
                    d="M48 7 58 14 61 23 72 27 80 39 73 50 78 62 69 71 62 88 50 102 41 88 34 79 27 68 20 54 27 43 32 31 39 24Z"
                    fill="rgba(13, 107, 95, 0.12)"
                    stroke="rgba(13, 107, 95, 0.36)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M37 89 43 102 48 91"
                    fill="none"
                    stroke="rgba(13, 107, 95, 0.26)"
                    strokeWidth="1.5"
                  />
                </svg>
                {cityCoverage.map((market) => (
                  <div
                    className="map-pin"
                    key={market.city}
                    style={{ left: `${market.x}%`, top: `${market.y}%` }}
                  >
                    <span className="pin-dot" />
                    <span className="pin-label">{market.city}</span>
                  </div>
                ))}
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
          <div className="grid-auto mt-8">
            {audiences.map((item) => {
              const Icon = item.icon;
              return (
                <article className="panel p-5" key={item.title}>
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
          <div className="grid-auto mt-8">
            {landingMetrics.map((metric) => (
              <div className="panel p-5" key={metric.label}>
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
                  Start with your role and location. EventRecruit keeps the process
                  simple: find verified people, coordinate placements, and keep trust
                  records visible.
                </p>
              </div>
              <Link className="button button-light" href="/signup">
                Get started <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
