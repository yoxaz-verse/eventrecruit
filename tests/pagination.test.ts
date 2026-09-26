import assert from "node:assert/strict";
import test from "node:test";
import { dashboardPagination, paginationHref } from "../src/lib/pagination";

test("dashboard pagination is bounded and defaults to 25 rows", () => {
  assert.deepEqual(dashboardPagination(undefined), { page: 1, pageSize: 25, from: 0, to: 24 });
  assert.deepEqual(dashboardPagination("2"), { page: 2, pageSize: 25, from: 25, to: 49 });
  assert.equal(dashboardPagination("-9").page, 1);
  assert.equal(dashboardPagination("invalid").page, 1);
  assert.equal(dashboardPagination("999999").page, 10_000);
});

test("pagination links retain filters and omit the first page", () => {
  assert.equal(paginationHref("/dashboard/agency/staff", { status: "active", page: "8" }, 2), "/dashboard/agency/staff?status=active&page=2");
  assert.equal(paginationHref("/dashboard/agency/staff", { status: "active" }, 1), "/dashboard/agency/staff?status=active");
});
