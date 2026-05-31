import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/AuthRequest.js";
import {
  BillingConfigurationError,
  BillingError,
  constructStripeWebhookEvent,
  createBillingPortalSession,
  createCompanySignupCheckout,
  finalizeCompanySignupFromSession,
  getCompanyBillingStatus,
  processStripeWebhookEvent,
} from "../services/billingService.js";
import { issueAuthCookies } from "../services/authTokenService.js";

function sendBillingError(res: Response, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status =
    error instanceof BillingError || error instanceof BillingConfigurationError
      ? error.statusCode
      : 500;
  res.status(status).json({ error: message });
}

export async function createCompanySignupCheckoutController(
  req: Request,
  res: Response,
) {
  const { username, email, password, companyName } = req.body as {
    username: string;
    email: string;
    password: string;
    companyName: string;
  };

  try {
    const checkout = await createCompanySignupCheckout({
      username,
      email,
      password,
      companyName,
    });
    res.status(201).json(checkout);
  } catch (error) {
    sendBillingError(res, error, "Failed to start checkout");
  }
}

export async function completeCompanySignupController(
  req: Request,
  res: Response,
) {
  const { sessionId } = req.body as { sessionId: string };

  try {
    const user = await finalizeCompanySignupFromSession(sessionId);
    await issueAuthCookies(res, user.id);
    res.status(201).json(user);
  } catch (error) {
    sendBillingError(res, error, "Failed to complete paid registration");
  }
}

export async function stripeWebhookController(req: Request, res: Response) {
  try {
    const event = constructStripeWebhookEvent(
      req.body as Buffer,
      req.headers["stripe-signature"],
    );
    await processStripeWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    sendBillingError(res, error, "Stripe webhook failed");
  }
}

export async function billingStatusController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const status = await getCompanyBillingStatus(req.auth!.companyId);
    res.json(status);
  } catch (error) {
    sendBillingError(res, error, "Failed to load billing status");
  }
}

export async function billingPortalController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { returnUrl } = req.body as { returnUrl?: string };
    const portal = await createBillingPortalSession({
      companyId: req.auth!.companyId,
      returnUrl,
    });
    res.json(portal);
  } catch (error) {
    sendBillingError(res, error, "Failed to open billing portal");
  }
}
