import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

type LoadedEnvironment = {
  appRoot: string;
  loadedFiles: string[];
  nodeEnv: string;
};

const DEFAULT_NODE_ENV = "development";
const DEV_CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];

let cachedEnvironment: LoadedEnvironment | null = null;

function findAppRoot(startDir: string) {
  let currentDir = startDir;

  while (true) {
    if (fs.existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Could not find apps/api package root from ${startDir}`);
    }

    currentDir = parentDir;
  }
}

function loadEnvFile(appRoot: string, fileName: string, loadedFiles: string[]) {
  const filePath = path.join(appRoot, fileName);
  if (!fs.existsSync(filePath)) return;

  dotenv.config({ path: filePath });
  loadedFiles.push(fileName);
}

function requireEnvVars(names: string[]) {
  const missing = names.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function ensureMinimumSecretLength(name: string, minLength: number) {
  const value = process.env[name];
  if (!value) return;

  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters long`);
  }
}

function ensureDatabaseUrl() {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  if (rawDatabaseUrl && !rawDatabaseUrl.includes("${")) return;

  const dbUser = process.env.DB_USER ?? "";
  const dbPassword = process.env.DB_PASSWORD ?? "";
  const dbHost = process.env.DB_HOST ?? "localhost";
  const dbPort = process.env.DB_PORT ?? "5432";
  const dbName = process.env.DB_NAME ?? "";
  const dbSsl = process.env.DB_SSL ?? "false";

  if (!dbUser || !dbPassword || !dbName) {
    throw new Error(
      "DATABASE_URL is required, or provide DB_USER, DB_PASSWORD, and DB_NAME",
    );
  }

  const sslMode =
    dbSsl === "true" ? "require" : dbSsl === "false" ? "disable" : dbSsl;

  process.env.DATABASE_URL =
    `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?sslmode=${sslMode}`;
}

function validateEnvironment() {
  requireEnvVars(["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]);

  if (process.env.NODE_ENV === "production") {
    requireEnvVars(["APP_BASE_URL", "FRONTEND_BASE_URL"]);
    ensureMinimumSecretLength("JWT_ACCESS_SECRET", 32);
    ensureMinimumSecretLength("JWT_REFRESH_SECRET", 32);
  }
}

export function loadEnvironment(importMetaUrl: string): LoadedEnvironment {
  if (cachedEnvironment) return cachedEnvironment;

  const startDir = path.dirname(fileURLToPath(importMetaUrl));
  const appRoot = findAppRoot(startDir);
  const nodeEnv = process.env.NODE_ENV?.trim() || DEFAULT_NODE_ENV;
  const loadedFiles: string[] = [];

  process.env.NODE_ENV = nodeEnv;

  loadEnvFile(appRoot, `.env.${nodeEnv}`, loadedFiles);
  loadEnvFile(appRoot, ".env", loadedFiles);

  ensureDatabaseUrl();
  validateEnvironment();

  cachedEnvironment = { appRoot, loadedFiles, nodeEnv };
  return cachedEnvironment;
}

export function getAllowedCorsOrigins() {
  const origins = new Set<string>();

  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of configuredOrigins ?? []) {
    origins.add(origin);
  }

  const frontendBaseUrl = process.env.FRONTEND_BASE_URL?.trim();
  if (frontendBaseUrl) {
    origins.add(frontendBaseUrl);
  }

  if (process.env.NODE_ENV !== "production") {
    for (const origin of DEV_CORS_ORIGINS) {
      origins.add(origin);
    }
  }

  if (origins.size === 0) {
    for (const origin of DEV_CORS_ORIGINS) {
      origins.add(origin);
    }
  }

  return [...origins];
}

export function createCorsOriginValidator() {
  const allowedOrigins = new Set(getAllowedCorsOrigins());

  return (origin: string | undefined) => !origin || allowedOrigins.has(origin);
}
