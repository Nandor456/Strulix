import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "../../database/prisma.js";
import {
  createUser,
  findByUsername,
  type CreateUserInput,
} from "./userService.js";
import { consumeInvitationToken } from "./invitationService.js";
import { syncCompanySeatQuantity } from "./billingService.js";

type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  role: string;
};

export class RegistrationError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
  }
}

export function isBootstrapRegistrationEnabled(
  value = process.env.ALLOW_BOOTSTRAP_REGISTRATION,
) {
  return value?.trim().toLowerCase() === "true";
}

export function canCreateBootstrapCompany(params: {
  allowBootstrapRegistration: boolean;
}) {
  return params.allowBootstrapRegistration;
}

export async function register(
  username: string,
  email: string,
  password: string,
  companyName?: string,
  token?: string,
): Promise<User> {
  const existing = await findByUsername(username);
  if (existing) throw new Error("Username already taken");

  let role: string;
  let companyId: string;

  if (token) {
    const consumed = await consumeInvitationToken({ token, email });
    if (!consumed) {
      throw new Error("Invitation is invalid, expired, or does not match this email");
    }
    role = consumed.role;
    companyId = consumed.companyId;
  } else {
    if (!isBootstrapRegistrationEnabled()) {
      throw new RegistrationError(
        "Registration is invite-only until payment is available.",
        403,
      );
    }

    return prisma.$transaction(async (tx) => {
      if (
        !canCreateBootstrapCompany({
          allowBootstrapRegistration: true,
        })
      ) {
        throw new RegistrationError(
          "Registration is invite-only until payment is available.",
          403,
        );
      }

      const trimmedCompanyName = companyName?.trim();
      if (!trimmedCompanyName) {
        throw new Error("Company name is required");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const company = await tx.company.create({
        data: { name: trimmedCompanyName, billingStatus: "ACTIVE" },
        select: { id: true },
      });

      return tx.user.create({
        data: {
          id: randomUUID(),
          username,
          email,
          password: passwordHash,
          role: "ADMIN",
          companyId: company.id,
        },
      });
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: CreateUserInput = {
    username,
    email,
    passwordHash,
    role,
    companyId,
  };
  const createdUser = await createUser(user);
  void syncCompanySeatQuantity(companyId).catch((error) => {
    console.error("Failed to sync Stripe seat quantity after registration:", error);
  });
  return createdUser;
}

export async function validateCredentials(
  username: string,
  password: string,
): Promise<User | null> {
  const user = await findByUsername(username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  return ok ? user : null;
}
