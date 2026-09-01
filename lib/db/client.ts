import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseConfig } from "@/lib/db/config";

type SqlClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  plutosSqlClient?: SqlClient;
  plutosDatabaseUrl?: string;
};

function createClient(config: ReturnType<typeof getDatabaseConfig>) {
  return postgres(config.url, {
    max: config.target === "production" ? 10 : 1,
    prepare: false,
  });
}

export function getDatabase() {
  const config = getDatabaseConfig();
  const cachedClient =
    globalForDatabase.plutosDatabaseUrl === config.url
      ? globalForDatabase.plutosSqlClient
      : undefined;
  const client = cachedClient ?? createClient(config);

  if (process.env.NODE_ENV !== "production") {
    globalForDatabase.plutosSqlClient = client;
    globalForDatabase.plutosDatabaseUrl = config.url;
  }

  return drizzle(client);
}
