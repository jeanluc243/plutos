import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import {
  getDatabaseTarget,
  getDatabaseUrlVariable,
  validateDatabaseUrl,
} from "./lib/db/config";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const databaseTarget = getDatabaseTarget();
const databaseUrlVariable = getDatabaseUrlVariable(databaseTarget);
const databaseUrl = process.env[databaseUrlVariable];

if (databaseUrl) {
  validateDatabaseUrl(databaseTarget, databaseUrl);
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
});
