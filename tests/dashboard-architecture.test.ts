import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../src/app/dashboard/", import.meta.url);
const roles = ["admin", "agency", "exhibitor", "organizer", "talent"];

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

test("each dashboard role owns exactly one persistent shell layout", () => {
  for (const role of roles) {
    const directory = new URL(`./${role}`, root).pathname;
    const layout = readFileSync(join(directory, "layout.tsx"), "utf8");
    assert.match(layout, new RegExp(`DashboardShell active=["']${role}["']`));
    for (const page of files(directory).filter((path) => path.endsWith("page.tsx"))) {
      assert.doesNotMatch(readFileSync(page, "utf8"), /DashboardShell/);
    }
  }
});

test("role loading states share the reusable dashboard loader", () => {
  for (const role of roles) {
    const loading = readFileSync(new URL(`./${role}/loading.tsx`, root), "utf8");
    assert.match(loading, new RegExp(`DashboardLoading role=["']${role}["']`));
  }
});

test("workspace data remains request memoized rather than persistently cached", () => {
  const workspace = readFileSync(new URL("../src/lib/dashboard-workspace.ts", import.meta.url), "utf8");
  assert.match(workspace, /cache\(async/);
  assert.doesNotMatch(workspace, /use cache/);
  assert.doesNotMatch(workspace, /unstable_cache/);
});
