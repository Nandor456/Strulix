import assert from "node:assert/strict";
import test from "node:test";
import { parseAddressCoordinates } from "../src/services/workPointService.js";

test("workpoint address parsing accepts latitude and longitude pairs", () => {
  assert.deepEqual(parseAddressCoordinates("45.761186, 25.371426"), {
    lat: 45.761186,
    lng: 25.371426,
  });

  assert.deepEqual(parseAddressCoordinates(" -12.5 , .75 "), {
    lat: -12.5,
    lng: 0.75,
  });
});

test("workpoint address parsing ignores non-coordinate addresses", () => {
  assert.equal(parseAddressCoordinates("Bulevardul Lacu Rosu 16, 535500 Gheorgheni"), null);
  assert.equal(parseAddressCoordinates("91, 25"), null);
  assert.equal(parseAddressCoordinates("45, 181"), null);
});
