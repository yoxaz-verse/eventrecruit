import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeCheck, BriefcaseBusiness, MapPin, Sparkles, Users } from "lucide-react";

export function ImmersiveHero() {
  return (
    <section className="immersive-hero" aria-labelledby="home-hero-heading">
      <div className="page immersive-hero-inner">
        <div className="hero-copy-panel">
          <div className="hero-eyebrow">
            <span className="live-dot" aria-hidden="true" />
            India-wide event talent operations
          </div>
          <h1 id="home-hero-heading">The right people for every <em>event moment.</em></h1>
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

        <div className="hero-photo-stage">
          <div className="hero-photo-frame">
            <Image
              src="/brand/expo-sphere-event-team.webp"
              alt="Indian event staff welcoming and assisting visitors at an exhibition"
              fill
              priority
              sizes="(max-width: 767px) calc(100vw - 28px), (max-width: 1100px) 52vw, 680px"
              className="hero-photo"
            />
            <div className="hero-photo-scrim" aria-hidden="true" />
            <div className="hero-photo-caption">
              <span><MapPin size={14} aria-hidden /> Live across India</span>
              <strong>People make the experience</strong>
            </div>
          </div>

          <div className="hero-float-card hero-float-card-talent">
            <span className="hero-float-icon"><BadgeCheck size={19} aria-hidden /></span>
            <div><strong>1,248</strong><span>verified people</span></div>
          </div>
          <div className="hero-float-card hero-float-card-demand">
            <span className="hero-float-icon hero-float-icon-amber"><BriefcaseBusiness size={19} aria-hidden /></span>
            <div><strong>214</strong><span>active staffing needs</span></div>
          </div>
          <div className="hero-photo-note">
            <Users size={18} aria-hidden />
            <span><strong>Built for real teams</strong>Exhibitions, launches, stores & activations</span>
          </div>
        </div>
      </div>

      <div className="hero-controls">
        <a className="hero-explore" href="#upcoming-events-heading">
          Explore opportunities <ArrowDown size={17} aria-hidden />
        </a>
      </div>
    </section>
  );
}
