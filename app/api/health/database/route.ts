import { sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import {
  getDatabaseProvider,
  getDatabaseTarget,
} from "@/lib/db/config";

export async function GET() {
  try {
    const target = getDatabaseTarget();

    await getDatabase().execute(sql`select 1`);

    return Response.json({
      database: "ok",
      provider: getDatabaseProvider(target),
      target,
    });
  } catch (error) {
    console.error("Database health check failed", error);

    return Response.json({ database: "unavailable" }, { status: 503 });
  }
}
