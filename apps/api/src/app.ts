import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes/index.js";
import { prisma } from "../database/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(morgan("tiny"));

app.use("/api", router);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.get("/db-check", async (_req, res, next) => {
  try {
    // This sends a simple "1" to the DB. If it responds, the connection is alive.
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const status =
    typeof err === "object" && err !== null
      ? ((err as { status?: number; statusCode?: number }).status ??
        (err as { statusCode?: number }).statusCode ??
        500)
      : 500;
  const message =
    status >= 500
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Request failed";
  res.status(status).json({ error: message });
});


export default app;
