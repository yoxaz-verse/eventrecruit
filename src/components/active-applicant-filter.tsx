import Link from "next/link";

export function ActiveApplicantFilter({ activeOnly, allHref, activeHref }: { activeOnly: boolean; allHref: string; activeHref: string }) {
  return <nav className="flex flex-wrap gap-2" aria-label="Applicant activity filter">
    <Link className={`button ${activeOnly ? "button-secondary" : "button-primary"}`} href={allHref}>All applicants</Link>
    <Link className={`button ${activeOnly ? "button-primary" : "button-secondary"}`} href={activeHref}>Active now</Link>
  </nav>;
}
