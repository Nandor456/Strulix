import { z } from "zod";

const uuidSchema = z.string().uuid("Must be a valid UUID");

export const createSubcontractorInvitationSchema = z.object({
  body: z.object({
    invitedAdminEmail: z.string().email().max(254),
  }),
});

export const acceptSubcontractorInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(1).max(128),
  }),
});

export const revokeSubcontractorAccessSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});
