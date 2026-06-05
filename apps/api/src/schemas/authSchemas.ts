import { z } from "zod";

const passwordSchema = z
  .string()
  .regex(/^[A-Z]/, "Password must start with an uppercase letter.")
  .min(6, "Password must be at least 6 characters.")
  .max(100, "Password must be at most 100 characters.");

export const registerSchema = z.object({
  body: z
    .object({
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
      password: passwordSchema,
      confirmPassword: z
        .string()
        .min(1, "Repeat password is required.")
        .max(100, "Password must be at most 100 characters."),
      companyName: z
        .string()
        .trim()
        .min(1, "Company name is required.")
        .max(120, "Company name must be at most 120 characters.")
        .optional(),
      token: z
        .string()
        .trim()
        .min(1, "Invitation token cannot be empty.")
        .max(200, "Invitation token is too long.")
        .optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(50, "Username must be at most 50 characters."),
    password: z.string().min(1, "Password is required."),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Please enter a valid email address.")
      .max(254, "Email must be at most 254 characters."),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string()
      .trim()
      .min(1, "Password reset token is required.")
      .max(300, "Password reset token is too long."),
    password: passwordSchema,
  }),
});
