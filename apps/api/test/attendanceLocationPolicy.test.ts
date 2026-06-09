import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAttendanceLocationCheckpointDueAt,
  checkpointNumberForDueAt,
  isCapturedAtWithinCheckpointWindow,
  monitoringStatusForPlatform,
  nextAttendanceLocationCheckpointDueAt,
} from "../src/services/attendanceLocationService.js";
import { evaluateLiveFollowStatus } from "../src/services/attendanceService.js";

test("attendance location checkpoints stay anchored to check-in minute", () => {
  const checkedInAt = new Date("2026-06-01T08:17:00.000Z");

  assert.equal(
    calculateAttendanceLocationCheckpointDueAt(checkedInAt, 1).toISOString(),
    "2026-06-01T09:17:00.000Z",
  );
  assert.equal(
    calculateAttendanceLocationCheckpointDueAt(checkedInAt, 2).toISOString(),
    "2026-06-01T10:17:00.000Z",
  );
  assert.equal(
    nextAttendanceLocationCheckpointDueAt(
      checkedInAt,
      new Date("2026-06-01T09:18:00.000Z"),
    ).toISOString(),
    "2026-06-01T10:17:00.000Z",
  );
});

test("checkpoint due time validation accepts only whole hours after check-in", () => {
  const checkedInAt = new Date("2026-06-01T08:17:00.000Z");

  assert.equal(
    checkpointNumberForDueAt(
      checkedInAt,
      new Date("2026-06-01T09:17:00.000Z"),
    ),
    1,
  );
  assert.equal(
    checkpointNumberForDueAt(
      checkedInAt,
      new Date("2026-06-01T09:18:00.000Z"),
    ),
    null,
  );
});

test("location samples must be captured within the checkpoint window", () => {
  const dueAt = new Date("2026-06-01T09:17:00.000Z");

  assert.equal(
    isCapturedAtWithinCheckpointWindow({
      dueAt,
      capturedAt: new Date("2026-06-01T09:32:00.000Z"),
    }),
    true,
  );
  assert.equal(
    isCapturedAtWithinCheckpointWindow({
      dueAt,
      capturedAt: new Date("2026-06-01T09:32:01.000Z"),
    }),
    false,
  );
});

test("monitoring platform maps native apps to active and web to unavailable", () => {
  assert.equal(monitoringStatusForPlatform("ios"), "ACTIVE");
  assert.equal(monitoringStatusForPlatform("android"), "ACTIVE");
  assert.equal(monitoringStatusForPlatform("web"), "UNAVAILABLE");
});

test("open location alerts make live follow status warning without auto-closing", () => {
  const result = evaluateLiveFollowStatus({
    now: new Date("2026-06-01T12:00:00.000Z"),
    activeCheckIns: [{ checkedInAt: "2026-06-01T11:30:00.000Z" }],
    latestEvent: { event: "CHECK_IN", checkoutSource: null },
    openLocationAlertCount: 1,
  });

  assert.equal(result.status, "WARNING");
  assert.deepEqual(result.warningReasons, ["LOCATION_ALERT"]);
});
