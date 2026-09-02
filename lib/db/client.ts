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
    // A Vercel function can serve concurrent requests. Reusing one small pool per
    // function instance avoids multiplying Supabase connections on every query.
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
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

  globalForDatabase.plutosSqlClient = client;
  globalForDatabase.plutosDatabaseUrl = config.url;

  return drizzle(client);
}
