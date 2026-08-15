import { sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";

export async function GET() {
  try {
    await getDatabase().execute(sql`select 1`);

    return Response.json({ database: "ok" });
  } catch (error) {
    console.error("Database health check failed", error);

    return Response.json({ database: "unavailable" }, { status: 503 });
  }
}
