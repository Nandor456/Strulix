import { createServer } from "node:http";
import { URL } from "node:url";
import { loadEnvironment } from "./config/env.js";

const DEFAULT_PORT = 4000;

function logStartup(message: string) {
  console.log(`[startup] ${message}`);
}

function describeDatabaseTarget() {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  if (!rawDatabaseUrl) return "DATABASE_URL missing";

  try {
    const parsed = new URL(rawDatabaseUrl);
    const port = parsed.port || "5432";
    const dbName = parsed.pathname.replace(/^\//, "") || "(no database)";
    return `${parsed.hostname}:${port}/${dbName}`;
  } catch {
    return "DATABASE_URL set";
  }
}

async function startServer() {
  logStartup("Boot sequence started");

  const { nodeEnv, loadedFiles } = loadEnvironment(import.meta.url);
  const loadedFilesLabel = loadedFiles.length ? loadedFiles.join(", ") : "none";
  logStartup(`Environment loaded (${nodeEnv}); files: ${loadedFilesLabel}`);
  logStartup(`Database target: ${describeDatabaseTarget()}`);

  const port = Number(process.env.PORT ?? DEFAULT_PORT);

  logStartup("Loading application");
  const { default: app } = await import("./app.js");

  logStartup("Creating HTTP server");
  const httpServer = createServer(app);

  logStartup("Initializing socket server");
  const { initSocketServer } = await import("./realtime/socketServer.js");
  initSocketServer(httpServer);

  logStartup("Checking database connection");
  const { prisma } = await import("../database/prisma.js");
  try {
    await prisma.$connect();
    logStartup("Database connection ok");
  } catch (err) {
    console.error("[startup] Database connection failed", err);
  }

  httpServer.listen(port, async () => {
    logStartup(`Server listening on port ${port} (${nodeEnv})`);

    logStartup("Starting attendance auto-close job");
    const { startAttendanceAutoCloseJob } = await import(
      "./services/attendanceService.js",
    );
    startAttendanceAutoCloseJob();

    logStartup("Verifying SMTP connection");
    const { getTransporter } = await import("./services/emailService.js");
    const transporter = getTransporter();
    if (!transporter) {
      logStartup("SMTP transporter not configured");
      return;
    }

    try {
      await transporter.verify();
      logStartup("SMTP connection works");
    } catch (err) {
      console.error("[startup] SMTP connection failed", err);
    }
  });
}

startServer().catch((err) => {
  console.error("[startup] Fatal startup error", err);
  process.exit(1);
});
