import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const data = JSON.parse(
  await readFile(new URL("../data/consumidor-gov-sector-trends.json", import.meta.url), "utf8"),
);

const pct = (numerator, denominator) => (numerator / denominator) * 100;
const nearRounded = (actual, expected, tolerance = 0.16) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);

test("sector trend dataset declares a secondary, sector-only scope", () => {
  assert.equal(data.scope, "sector_level_only");
  assert.match(data.status, /^secondary_aggregate_dataset_verified/);
  assert.ok(data.not_for.includes("company_specific_scores"));
  assert.ok(data.not_for.includes("generic_filtra_reputation_benchmarks"));
  assert.ok(data.not_for.includes("mixing_with_private_filtra_reviews"));
  assert.equal(data.windows.length, 3);
});

test("each window has six unique sectors and valid chronological month bounds", () => {
  for (const window of data.windows) {
    assert.match(window.startMonth, /^\d{4}-(0[1-9]|1[0-2])$/);
    assert.match(window.endMonth, /^\d{4}-(0[1-9]|1[0-2])$/);
    assert.ok(window.startMonth <= window.endMonth);
    assert.equal(window.sectors.length, 6);
    assert.equal(new Set(window.sectors.map((row) => row.sector)).size, 6);
    assert.deepEqual(
      [...window.sectors.map((row) => row.sector)].sort(),
      ["airlines", "all", "banks", "energy", "health_plans", "telecom"].sort(),
    );
  }
});

test("counts reconcile and published percentages match their stated denominators", () => {
  for (const window of data.windows) {
    for (const row of window.sectors) {
      assert.ok(Number.isSafeInteger(row.finalized) && row.finalized > 0);
      for (const count of [row.resolved, row.notResolved, row.notEvaluated]) {
        assert.ok(Number.isSafeInteger(count) && count >= 0);
      }
      assert.equal(
        row.resolved + row.notResolved + row.notEvaluated,
        row.finalized,
        `${window.window}/${row.sector}: outcome counts must sum to finalized`,
      );
      nearRounded(row.resolvedOverFinalizedPct, pct(row.resolved, row.finalized));
      nearRounded(
        row.resolvedOverEvaluatedPct,
        pct(row.resolved, row.resolved + row.notResolved),
      );
      nearRounded(
        row.officialSolutionIndexPct,
        pct(row.resolved + row.notEvaluated, row.finalized),
      );
      for (const field of [
        "resolvedOverFinalizedPct",
        "resolvedOverEvaluatedPct",
        "officialSolutionIndexPct",
        "soughtCompanyBeforePct",
        "resolvedAmongEvaluatedSoughtCompanyPct",
        "resolvedAmongEvaluatedDidNotSeekPct",
      ]) {
        assert.ok(Number.isFinite(row[field]) && row[field] >= 0 && row[field] <= 100);
      }
    }
  }
});

test("recent-window headline values stay pinned to the published dataset", () => {
  const recent = data.windows.find((window) => window.window === "recent");
  const all = recent.sectors.find((row) => row.sector === "all");
  const banks = recent.sectors.find((row) => row.sector === "banks");
  assert.equal(all.finalized, 3796145);
  assert.equal(all.resolvedOverFinalizedPct, 11.7);
  assert.equal(all.resolvedOverEvaluatedPct, 38);
  assert.equal(all.officialSolutionIndexPct, 81);
  assert.equal(banks.finalized, 1634105);
  assert.equal(banks.resolvedOverFinalizedPct, 6.5);
});
