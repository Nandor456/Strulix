import { z } from "zod";

const tokenSchema = z.string().trim().min(1).max(4096);

export const registerPushDeviceSchema = z.object({
  body: z.object({
    token: tokenSchema,
    platform: z.enum(["ios", "android"]),
  }),
});

export const unregisterPushDeviceSchema = z.object({
  body: z.object({
    token: tokenSchema,
  }),
});
