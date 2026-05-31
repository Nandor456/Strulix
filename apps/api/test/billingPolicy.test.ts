import assert from "node:assert/strict";
import test from "node:test";
import {
  isBillingActive,
  isStripeTaxEnabled,
  mapStripeSubscriptionStatus,
} from "../src/services/billingService.js";

test("Stripe subscription statuses map to company billing statuses", () => {
  assert.equal(mapStripeSubscriptionStatus("active"), "ACTIVE");
  assert.equal(mapStripeSubscriptionStatus("trialing"), "TRIALING");
  assert.equal(mapStripeSubscriptionStatus("past_due"), "PAST_DUE");
  assert.equal(mapStripeSubscriptionStatus("paused"), "PAST_DUE");
  assert.equal(mapStripeSubscriptionStatus("canceled"), "CANCELED");
  assert.equal(mapStripeSubscriptionStatus("unpaid"), "UNPAID");
  assert.equal(mapStripeSubscriptionStatus("incomplete"), "UNPAID");
  assert.equal(mapStripeSubscriptionStatus("incomplete_expired"), "UNPAID");
  assert.equal(mapStripeSubscriptionStatus(undefined), "UNPAID");
});

test("only active and trialing companies pass the write gate policy", () => {
  assert.equal(isBillingActive("ACTIVE"), true);
  assert.equal(isBillingActive("TRIALING"), true);
  assert.equal(isBillingActive("UNPAID"), false);
  assert.equal(isBillingActive("PAST_DUE"), false);
  assert.equal(isBillingActive("CANCELED"), false);
  assert.equal(isBillingActive(undefined), false);
});

test("Stripe Tax is enabled unless explicitly disabled", () => {
  assert.equal(isStripeTaxEnabled("true"), true);
  assert.equal(isStripeTaxEnabled(" TRUE "), true);
  assert.equal(isStripeTaxEnabled(undefined), true);
  assert.equal(isStripeTaxEnabled("false"), false);
  assert.equal(isStripeTaxEnabled(" FALSE "), false);
});
