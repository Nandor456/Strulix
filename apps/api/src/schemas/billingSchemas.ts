import { z } from "zod";

export const companySignupCheckoutSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(50, "Username must be at most 50 characters."),
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Please enter a valid email address.")
      .max(254, "Email must be at most 254 characters."),
    password: z
      .string()
      .regex(/^[A-Z]/, "Password must start with an uppercase letter.")
      .min(6, "Password must be at least 6 characters.")
      .max(100, "Password must be at most 100 characters."),
    companyName: z
      .string()
      .trim()
      .min(1, "Company name is required.")
      .max(120, "Company name must be at most 120 characters."),
  }),
});

export const companySignupCompleteSchema = z.object({
  body: z.object({
    sessionId: z
      .string()
      .trim()
      .min(1, "Checkout session is required.")
      .max(300, "Checkout session is too long."),
  }),
});
