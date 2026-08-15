import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  plutosSqlClient?: SqlClient;
};

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. Copy .env.example to .env.local for development.",
    );
  }

  return postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
  });
}

export function getDatabase() {
  const client = globalForDatabase.plutosSqlClient ?? createClient();

  if (process.env.NODE_ENV !== "production") {
    globalForDatabase.plutosSqlClient = client;
  }

  return drizzle(client);
}
