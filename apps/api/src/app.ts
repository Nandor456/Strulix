import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes/index.js";
import { createCorsOriginValidator, loadEnvironment } from "./config/env.js";
import { prisma } from "../database/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { nodeEnv } = loadEnvironment(import.meta.url);
const isAllowedCorsOrigin = createCorsOriginValidator();

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan(nodeEnv === "production" ? "combined" : "tiny"));

app.use("/api", router);
app.use(
  "/uploads/messaging",
  express.static(path.join(__dirname, "../uploads/messaging")),
);

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
