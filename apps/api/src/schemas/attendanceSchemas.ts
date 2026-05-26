import { z } from "zod";

const uuidSchema = z.string().uuid("Must be a valid UUID");

export const checkinSchema = z.object({
  body: z.object({
    qrToken: uuidSchema,
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

export const listAttendanceSchema = z.object({
  params: z.object({ id: uuidSchema }),
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export const manualMarkSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    workerId: uuidSchema,
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    checkedInAt: z.string().datetime().optional(),
    checkedOutAt: z.string().datetime().optional(),
  }),
});

export const deleteAttendanceSchema = z.object({
  params: z.object({ id: uuidSchema }),
});

export const updateCheckoutSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    checkedOutAt: z.string().datetime("Must be a valid ISO datetime"),
  }),
});

export const updateAttendanceTimesSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    checkedInAt: z.string().datetime("Must be a valid ISO datetime"),
    checkedOutAt: z.string().datetime("Must be a valid ISO datetime").nullable(),
  }),
});

export const qrSchema = z.object({
  params: z.object({ id: uuidSchema }),
});

export const exportSchema = z.object({
  params: z.object({ id: uuidSchema }),
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export const myStatsSchema = z.object({
  query: z.object({
    year: z
      .string()
      .regex(/^\d{4}$/)
      .transform(Number),
    month: z
      .string()
      .regex(/^([1-9]|1[0-2])$/)
      .transform(Number),
  }),
});
