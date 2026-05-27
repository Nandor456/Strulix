import assert from "node:assert/strict";
import test from "node:test";
import {
  countInclusiveLeaveDays,
  leaveDateRangesOverlap,
  parseLeaveDateOnly,
} from "../src/services/leaveRequestService.js";

test("leave date parsing accepts real date-only values", () => {
  const parsed = parseLeaveDateOnly("2026-06-15");

  assert.equal(parsed.toISOString(), "2026-06-15T00:00:00.000Z");
});

test("leave date parsing rejects malformed or impossible dates", () => {
  for (const value of ["2026-6-15", "2026-02-31", "not-a-date"]) {
    assert.throws(() => parseLeaveDateOnly(value), /Date must/);
  }
});

test("inclusive leave day count includes both selected endpoints", () => {
  assert.equal(
    countInclusiveLeaveDays(
      parseLeaveDateOnly("2026-06-15"),
      parseLeaveDateOnly("2026-06-17"),
    ),
    3,
  );
});

test("leave overlap helper detects touching and contained ranges", () => {
  const firstStart = parseLeaveDateOnly("2026-06-10");
  const firstEnd = parseLeaveDateOnly("2026-06-15");

  assert.equal(
    leaveDateRangesOverlap({
      firstStart,
      firstEnd,
      secondStart: parseLeaveDateOnly("2026-06-15"),
      secondEnd: parseLeaveDateOnly("2026-06-18"),
    }),
    true,
  );

  assert.equal(
    leaveDateRangesOverlap({
      firstStart,
      firstEnd,
      secondStart: parseLeaveDateOnly("2026-06-16"),
      secondEnd: parseLeaveDateOnly("2026-06-18"),
    }),
    false,
  );
});
