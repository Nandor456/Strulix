import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateLiveFollowStatus,
  limitLiveFollowEvents,
} from "../src/services/attendanceService.js";

const now = new Date("2026-06-01T12:00:00.000Z");

test("live follow warning status takes priority over active status", () => {
  const result = evaluateLiveFollowStatus({
    now,
    activeCheckIns: [{ checkedInAt: "2026-06-01T01:59:59.000Z" }],
    latestEvent: { event: "CHECK_IN", checkoutSource: null },
  });

  assert.equal(result.status, "WARNING");
  assert.deepEqual(result.warningReasons, ["STALE_OPEN_CHECKIN"]);
});

test("live follow marks fresh open check-ins as active", () => {
  const result = evaluateLiveFollowStatus({
    now,
    activeCheckIns: [{ checkedInAt: "2026-06-01T08:00:00.000Z" }],
    latestEvent: { event: "CHECK_IN", checkoutSource: null },
  });

  assert.equal(result.status, "ACTIVE");
  assert.deepEqual(result.warningReasons, []);
});

test("live follow warns when latest activity was auto checkout", () => {
  const result = evaluateLiveFollowStatus({
    now,
    activeCheckIns: [],
    latestEvent: { event: "CHECK_OUT", checkoutSource: "AUTO" },
  });

  assert.equal(result.status, "WARNING");
  assert.deepEqual(result.warningReasons, ["AUTO_CHECKOUT"]);
});

test("live follow event limiting sorts newest events first", () => {
  const events = [
    { event: "CHECK_IN" as const, occurredAt: "2026-06-01T08:00:00.000Z", id: "1" },
    { event: "CHECK_OUT" as const, occurredAt: "2026-06-01T12:00:00.000Z", id: "2" },
    { event: "CHECK_IN" as const, occurredAt: "2026-06-01T12:00:00.000Z", id: "3" },
    { event: "CHECK_IN" as const, occurredAt: "2026-06-01T09:00:00.000Z", id: "4" },
  ];

  assert.deepEqual(
    limitLiveFollowEvents(events, 3).map((event) => event.id),
    ["2", "3", "4"],
  );
});
