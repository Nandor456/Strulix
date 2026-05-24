import type { Request, Response } from "express";
import { prisma } from "../../database/prisma.js";

export async function healthController(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check database query failed:", error);
    res.status(503).json({ status: "error", database: "unavailable" });
  }
}
