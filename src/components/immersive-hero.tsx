"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown, ArrowRight, BriefcaseBusiness, MapPin, Pause, Play, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const ImmersiveHeroScene = dynamic(
  () => import("@/components/immersive-hero-scene").then((module) => module.ImmersiveHeroScene),
  { ssr: false, loading: () => <div className="hero-scene-fallback" aria-hidden="true" /> },
);

const hotspots = [
  { className: "hero-hotspot hero-hotspot-one", icon: ShieldCheck, label: "1,248 verified people" },
  { className: "hero-hotspot hero-hotspot-two", icon: BriefcaseBusiness, label: "214 active staffing needs" },
  { className: "hero-hotspot hero-hotspot-three", icon: MapPin, label: "10+ India markets" },
];

export function ImmersiveHero() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(query.matches);
      if (query.matches) setPaused(true);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <section className="immersive-hero" aria-labelledby="home-hero-heading">
      <div className="hero-scene" aria-hidden="true">
        <ImmersiveHeroScene paused={paused || reducedMotion} />
        <div className="hero-scene-wash" />
      </div>

      <div className="page immersive-hero-inner">
        <div className="hero-copy-panel">
          <div className="hero-eyebrow">
            <span className="live-dot" aria-hidden="true" />
            India-wide event talent operations
          </div>
          <h1 id="home-hero-heading">Put the right people <em>on the ground.</em></h1>
          <p>
            Find and coordinate verified hosts, promoters, registration teams,
            demonstrators, and event crews across India—without staffing chaos.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/dashboard">
              Find verified talent <ArrowRight size={18} aria-hidden />
            </Link>
            <Link className="button button-glass" href="/browse">
              <Sparkles size={17} aria-hidden /> Browse open roles
            </Link>
          </div>
          <div className="hero-proof" aria-label="Platform highlights">
            <span><strong>10+</strong> markets</span>
            <span><strong>1,248</strong> verified talent</span>
            <span><strong>418</strong> placements this quarter</span>
          </div>
        </div>

        <div className="hero-exhibit-ui" aria-label="Live marketplace snapshot">
          <div className="hero-scene-label"><span>Live field</span><strong>India / 01</strong></div>
          {hotspots.map(({ className, icon: Icon, label }) => (
            <div className={className} key={label}>
              <span className="hero-hotspot-pulse" aria-hidden="true" />
              <span className="hero-hotspot-label"><Icon size={14} aria-hidden />{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-controls">
        <a className="hero-explore" href="#upcoming-events-heading">
          Explore opportunities <ArrowDown size={17} aria-hidden />
        </a>
        {!reducedMotion && (
          <button className="hero-pause" type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
            {paused ? <Play size={15} aria-hidden /> : <Pause size={15} aria-hidden />}
            {paused ? "Play scene" : "Pause scene"}
          </button>
        )}
      </div>
    </section>
  );
}
