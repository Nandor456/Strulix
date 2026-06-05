import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreateBootstrapCompany,
  isBootstrapRegistrationEnabled,
} from "../src/services/authService.js";

test("bootstrap registration flag only accepts true", () => {
  assert.equal(isBootstrapRegistrationEnabled("true"), true);
  assert.equal(isBootstrapRegistrationEnabled(" TRUE "), true);
  assert.equal(isBootstrapRegistrationEnabled("false"), false);
  assert.equal(isBootstrapRegistrationEnabled(undefined), false);
});

test("bootstrap company registration requires the flag", () => {
  assert.equal(
    canCreateBootstrapCompany({
      allowBootstrapRegistration: true,
    }),
    true,
  );

  assert.equal(
    canCreateBootstrapCompany({
      allowBootstrapRegistration: false,
    }),
    false,
  );
});
