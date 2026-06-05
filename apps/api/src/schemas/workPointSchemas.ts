import { z } from "zod";

const uuidSchema = z.string().uuid("Must be a valid UUID");

const workPointBodySchema = {
  name: z.string().trim().min(1, "Name is required").max(120),
  address: z.string().trim().min(1, "Address is required").max(300),
  lat: z.coerce.number().min(-90).max(90).nullable().optional(),
  lng: z.coerce.number().min(-180).max(180).nullable().optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  deadline: z.string().datetime("Deadline must be an ISO datetime").nullable().optional(),
};

const updateWorkPointBodySchema = z
  .object({
    name: workPointBodySchema.name.optional(),
    address: workPointBodySchema.address.optional(),
    lat: workPointBodySchema.lat,
    lng: workPointBodySchema.lng,
    description: workPointBodySchema.description,
    deadline: workPointBodySchema.deadline,
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one field is required",
  });

export const workPointIdSchema = z.object({
  params: z.object({ id: uuidSchema }),
});

export const createWorkPointSchema = z.object({
  body: z.strictObject(workPointBodySchema),
});

export const updateWorkPointSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: updateWorkPointBodySchema,
});
