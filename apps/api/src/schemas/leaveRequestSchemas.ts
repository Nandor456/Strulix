import { z } from "zod";

const uuidSchema = z.string().uuid("Must be a valid UUID");
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const createLeaveRequestSchema = z.object({
  body: z.object({
    type: z.enum(["VACATION", "SICK"]),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
  }),
});

export const leaveRequestIdSchema = z.object({
  params: z.object({ id: uuidSchema }),
});
