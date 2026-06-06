import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreateUnpaidCompany,
  isNonProductionEnvironment,
} from "../src/services/authService.js";

test("unpaid company registration is enabled only outside production", () => {
  assert.equal(
    canCreateUnpaidCompany({
      isNonProduction: false,
    }),
    false,
  );

  assert.equal(
    canCreateUnpaidCompany({
      isNonProduction: true,
    }),
    true,
  );
});

test("non-production environment detection only blocks production", () => {
  assert.equal(isNonProductionEnvironment("production"), false);
  assert.equal(isNonProductionEnvironment("development"), true);
  assert.equal(isNonProductionEnvironment("test"), true);
  assert.equal(isNonProductionEnvironment(""), false);
});
