import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";

type StripeClient = InstanceType<typeof Stripe>;
type StripeSubscription = Awaited<ReturnType<StripeClient["subscriptions"]["retrieve"]>>;
type StripeInvoice = Awaited<ReturnType<StripeClient["invoices"]["retrieve"]>>;
type StripeEvent = ReturnType<StripeClient["webhooks"]["constructEvent"]>;
type StripeCheckoutSession = Awaited<ReturnType<StripeClient["checkout"]["sessions"]["retrieve"]>>;
import { prisma } from "../../database/prisma.js";

export type CompanyBillingStatus =
  | "UNPAID"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED";

const PAID_SIGNUP_TTL_MS = 1000 * 60 * 60 * 24;
const BILLING_ACTIVE_STATUSES = new Set<CompanyBillingStatus>([
  "ACTIVE",
  "TRIALING",
]);

let stripeClient: StripeClient | null = null;
let stripeClientKey: string | null = null;

export class BillingConfigurationError extends Error {
  statusCode = 503;

  constructor(message = "Stripe billing is not configured.") {
    super(message);
  }
}

export class BillingError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

function getStripePriceId() {
  return process.env.STRIPE_PRICE_ID?.trim() ?? "";
}

function getFrontendBaseUrl() {
  return (
    process.env.FRONTEND_BASE_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
}

export function isStripeTaxEnabled(
  value = process.env.STRIPE_TAX_ENABLED,
): boolean {
  return value?.trim().toLowerCase() !== "false";
}

export function isBillingActive(status: string | undefined): boolean {
  return BILLING_ACTIVE_STATUSES.has(status as CompanyBillingStatus);
}

function getStripeClient() {
  const secretKey = getStripeSecretKey();
  if (!secretKey) throw new BillingConfigurationError();

  if (!stripeClient || stripeClientKey !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeClientKey = secretKey;
  }

  return stripeClient;
}

function getStripeCheckoutConfig() {
  const priceId = getStripePriceId();
  if (!priceId) {
    throw new BillingConfigurationError(
      "Stripe billing price is not configured.",
    );
  }

  return {
    priceId,
    stripe: getStripeClient(),
    frontendBaseUrl: getFrontendBaseUrl(),
  };
}

function unixSecondsToDate(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

export function mapStripeSubscriptionStatus(
  status: string | undefined,
): CompanyBillingStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "paused":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    default:
      return "UNPAID";
  }
}

function getStripeObjectId(
  value: string | { id?: string } | null | undefined,
): string | null {
  if (typeof value === "string") return value;
  return typeof value?.id === "string" ? value.id : null;
}

function selectSeatSubscriptionItem(
  subscription: StripeSubscription,
  priceId = getStripePriceId(),
) {
  const items = subscription.items.data;
  return (
    items.find((item) => item.price.id === priceId) ??
    items[0] ??
    null
  );
}

async function retrieveSubscription(subscriptionId: string) {
  return getStripeClient().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
}

export async function getActiveUserSeatCount(companyId: string) {
  return prisma.user.count({ where: { companyId } });
}

export async function createCompanySignupCheckout(input: {
  username: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const { stripe, priceId, frontendBaseUrl } = getStripeCheckoutConfig();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName.trim();

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { id: true, username: true, email: true },
  });
  if (existingUser?.username === username) {
    throw new BillingError("Username already taken", 409);
  }
  if (existingUser?.email === email) {
    throw new BillingError("A user with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const pending = await prisma.pendingPaidRegistration.create({
    data: {
      id: randomUUID(),
      username,
      email,
      passwordHash,
      companyName,
      expiresAt: new Date(Date.now() + PAID_SIGNUP_TTL_MS),
    },
    select: { id: true },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    client_reference_id: pending.id,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    automatic_tax: { enabled: isStripeTaxEnabled() },
    success_url: `${frontendBaseUrl}/register/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendBaseUrl}/register?paid=1`,
    metadata: {
      pendingRegistrationId: pending.id,
      companyName,
      email,
    },
    subscription_data: {
      metadata: {
        pendingRegistrationId: pending.id,
        companyName,
        email,
      },
    },
  });

  if (!session.url) {
    throw new BillingError("Stripe did not return a checkout URL", 502);
  }

  await prisma.pendingPaidRegistration.update({
    where: { id: pending.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { url: session.url };
}

export async function finalizeCompanySignupFromSession(sessionId: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.mode !== "subscription" || session.status !== "complete") {
    throw new BillingError("Checkout session is not complete", 400);
  }

  const pending = await prisma.pendingPaidRegistration.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (!pending) {
    throw new BillingError("Paid registration was not found", 404);
  }

  if (pending.completedAt && pending.userId) {
    return { id: pending.userId };
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    throw new BillingError("Paid registration has expired", 400);
  }

  const subscriptionId = getStripeObjectId(session.subscription);
  const customerId = getStripeObjectId(session.customer);
  if (!subscriptionId || !customerId) {
    throw new BillingError("Checkout session is missing billing references", 400);
  }

  const subscription = await retrieveSubscription(subscriptionId);
  const subscriptionItem = selectSeatSubscriptionItem(subscription);
  if (!subscriptionItem) {
    throw new BillingError("Subscription does not include a billable seat item", 400);
  }

  const billingStatus = mapStripeSubscriptionStatus(subscription.status);
  const activeUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: pending.username }, { email: pending.email }],
    },
    select: { id: true },
  });
  if (activeUser) {
    throw new BillingError("A user with this username or email already exists", 409);
  }

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: pending.companyName,
        billingStatus,
        paymentProvider: "stripe",
        paymentCustomerId: customerId,
        paymentSubscriptionId: subscription.id,
        paymentSubscriptionItemId: subscriptionItem.id,
        paymentSeatQuantity: subscriptionItem.quantity ?? 1,
        paidUntil: unixSecondsToDate(subscriptionItem.current_period_end),
      },
      select: { id: true },
    });

    const user = await tx.user.create({
      data: {
        id: randomUUID(),
        username: pending.username,
        email: pending.email,
        password: pending.passwordHash,
        role: "ADMIN",
        companyId: company.id,
      },
      select: { id: true },
    });

    await tx.pendingPaidRegistration.update({
      where: { id: pending.id },
      data: {
        completedAt: new Date(),
        companyId: company.id,
        userId: user.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
      },
    });

    return user;
  });

  return result;
}

export async function updateCompanyFromStripeSubscription(
  subscription: StripeSubscription,
  overrideStatus?: CompanyBillingStatus,
) {
  const customerId = getStripeObjectId(subscription.customer);
  const subscriptionItem = selectSeatSubscriptionItem(subscription);
  const data = {
    billingStatus: overrideStatus ?? mapStripeSubscriptionStatus(subscription.status),
    paymentProvider: "stripe",
    paymentCustomerId: customerId,
    paymentSubscriptionId: subscription.id,
    paymentSubscriptionItemId: subscriptionItem?.id ?? null,
    paymentSeatQuantity: subscriptionItem?.quantity ?? 0,
    paidUntil: unixSecondsToDate(subscriptionItem?.current_period_end),
  };

  await prisma.company.updateMany({
    where: {
      OR: [
        { paymentSubscriptionId: subscription.id },
        ...(customerId ? [{ paymentCustomerId: customerId }] : []),
      ],
    },
    data,
  });
}

async function updateCompanyFromSubscriptionId(
  subscriptionId: string,
  status?: CompanyBillingStatus,
) {
  const subscription = await retrieveSubscription(subscriptionId);
  await updateCompanyFromStripeSubscription(subscription, status);
}

function getInvoiceSubscriptionId(invoice: StripeInvoice) {
  const subscription =
    invoice.parent?.subscription_details?.subscription as
    | string
    | { id?: string }
    | undefined;
  return getStripeObjectId(subscription);
}

export async function processStripeWebhookEvent(event: StripeEvent) {
  const existing = await prisma.processedStripeWebhookEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) return;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as StripeCheckoutSession;
      await finalizeCompanySignupFromSession(session.id);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as StripeSubscription;
      await updateCompanyFromStripeSubscription(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as StripeSubscription;
      await updateCompanyFromStripeSubscription(subscription, "CANCELED");
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as StripeInvoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (subscriptionId) await updateCompanyFromSubscriptionId(subscriptionId);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as StripeInvoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (subscriptionId) await updateCompanyFromSubscriptionId(subscriptionId, "PAST_DUE");
      break;
    }
  }

  await prisma.processedStripeWebhookEvent.create({
    data: { id: event.id, type: event.type },
  });
}

export function constructStripeWebhookEvent(
  payload: Buffer,
  signature: string | string[] | undefined,
) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    throw new BillingConfigurationError(
      "Stripe webhook secret is not configured.",
    );
  }

  if (!signature || Array.isArray(signature)) {
    throw new BillingError("Stripe signature is missing", 400);
  }

  try {
    return getStripeClient().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch {
    throw new BillingError("Invalid Stripe webhook signature", 400);
  }
}

export async function syncCompanySeatQuantity(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      paymentProvider: true,
      paymentSubscriptionItemId: true,
    },
  });
  if (
    company?.paymentProvider !== "stripe" ||
    !company.paymentSubscriptionItemId
  ) {
    return;
  }

  const quantity = await getActiveUserSeatCount(companyId);
  const item = await getStripeClient().subscriptionItems.update(
    company.paymentSubscriptionItemId,
    {
      quantity,
      proration_behavior: "create_prorations",
    },
  );

  await prisma.company.update({
    where: { id: companyId },
    data: {
      paymentSeatQuantity: item.quantity ?? quantity,
      paidUntil: unixSecondsToDate(item.current_period_end),
    },
  });
}

export async function getCompanyBillingStatus(companyId: string) {
  const [company, activeUserCount] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        billingStatus: true,
        paymentProvider: true,
        paymentCustomerId: true,
        paymentSubscriptionId: true,
        paymentSeatQuantity: true,
        paidUntil: true,
      },
    }),
    getActiveUserSeatCount(companyId),
  ]);

  if (!company) {
    throw new BillingError("Company not found", 404);
  }

  return {
    billingStatus: company.billingStatus,
    paymentProvider: company.paymentProvider,
    hasStripeCustomer: Boolean(company.paymentCustomerId),
    hasStripeSubscription: Boolean(company.paymentSubscriptionId),
    paidSeatCount: company.paymentSeatQuantity,
    activeUserCount,
    paidUntil: company.paidUntil?.toISOString() ?? null,
  };
}

export async function createBillingPortalSession(params: {
  companyId: string;
  returnUrl?: string;
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.companyId },
    select: { paymentCustomerId: true },
  });
  if (!company?.paymentCustomerId) {
    throw new BillingError("Stripe customer was not found for this company", 404);
  }

  const session = await getStripeClient().billingPortal.sessions.create({
    customer: company.paymentCustomerId,
    return_url: params.returnUrl?.trim() || `${getFrontendBaseUrl()}/settings`,
  });

  return { url: session.url };
}
