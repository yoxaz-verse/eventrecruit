'use client';
export default function OrganizerError({reset}:{reset:()=>void}) { return <main className="page py-12"><h1 className="text-3xl font-bold">Unable to load the portal</h1><p className="my-4">Please try again. If this continues, contact the platform administrator.</p><button className="button button-primary" onClick={reset}>Try again</button></main>; }
