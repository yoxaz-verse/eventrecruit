import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("public catalog caching is short-lived, tagged, and explicitly invalidated", () => {
  const data = source("src/lib/public-data.ts");
  assert.match(data, /revalidate:\s*60/);
  for (const tag of ["public-events", "public-exhibitor-events", "public-event-participation", "public-open-roles"]) assert.match(data, new RegExp(tag));
  assert.match(source("src/app/actions/organizer.ts"), /invalidatePublicData\(PUBLIC_CACHE_TAGS\.events\)/);
  assert.match(source("src/app/actions/participation.ts"), /invalidatePublicData\(PUBLIC_CACHE_TAGS\.participation\)/);
});

test("private media and public brand assets keep distinct cache policies", () => {
  assert.match(source("src/app/api/media/[scope]/[id]/route.ts"), /private, max-age=300/);
  assert.match(source("next.config.ts"), /public, max-age=86400, stale-while-revalidate=604800/);
});

test("crawl metadata excludes private surfaces and publishes public discovery", () => {
  const robots = source("src/app/robots.ts");
  assert.match(robots, /\/dashboard\//);
  assert.match(robots, /\/client-review\//);
  assert.match(robots, /sitemap\.xml/);
  assert.match(source("src/app/events/[id]/page.tsx"), /application\/ld\+json/);
});

test("approved event participation has a targeted directory index", () => {
  const migration = source("supabase/migrations/023_public_directory_performance.sql");
  assert.match(migration, /exhibitor_event_participation\(event_id, exhibitor_id\)/);
  assert.match(migration, /where status = 'approved'/);
});

test("public navigation is session-neutral so discovery pages can be prerendered", () => {
  const navigation = source("src/components/top-nav.tsx");
  assert.doesNotMatch(navigation, /getCurrentAccount|cookies\(/);
  assert.match(navigation, /href="\/dashboard"/);
  assert.doesNotMatch(source("src/app/page.tsx"), /getCurrentAccount/);
});

test("the homepage uses a bounded dedicated event preview", () => {
  const data = source("src/lib/public-data.ts");
  assert.match(data, /public-homepage-events-v1/);
  assert.match(data, /\.limit\(3\)/);
  assert.match(source("src/app/page.tsx"), /getPublicHomepageEvents/);
});

test("loading fallbacks remain server-rendered and lightweight", () => {
  assert.doesNotMatch(source("src/app/loading.tsx"), /DualTextSpinner|use client/);
  assert.doesNotMatch(source("src/components/loading-skeleton.tsx"), /use client/);
  assert.match(source("src/components/dashboard-loading.tsx"), /LoadingSkeleton/);
});

test("server performance logs are opt-in and contain no user identifiers", () => {
  const performance = source("src/lib/server-performance.ts");
  assert.match(performance, /SERVER_PERFORMANCE_LOGGING/);
  assert.doesNotMatch(performance, /email|account_id|profile_id|token/);
});
