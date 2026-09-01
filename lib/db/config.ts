export type DatabaseTarget = "demo" | "production";

export type DatabaseProvider = "postgresql" | "supabase";

type DatabaseEnvironment = NodeJS.ProcessEnv;

const SUPABASE_HOST_SUFFIXES = [".supabase.co", ".pooler.supabase.com"];

export function getDatabaseTarget(
  environment: DatabaseEnvironment = process.env,
): DatabaseTarget {
  const target = environment.DATABASE_TARGET;

  if (target === "demo" || target === "production") {
    return target;
  }

  if (target) {
    throw new Error(
      `DATABASE_TARGET must be "demo" or "production". Received "${target}".`,
    );
  }

  if (environment.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_TARGET is required in production builds to prevent connecting to the wrong database.",
    );
  }

  return "demo";
}

export function getDatabaseUrlVariable(target: DatabaseTarget) {
  return target === "production"
    ? "SUPABASE_DATABASE_URL"
    : "DEMO_DATABASE_URL";
}

export function getDatabaseProvider(target: DatabaseTarget): DatabaseProvider {
  return target === "production" ? "supabase" : "postgresql";
}

export function validateDatabaseUrl(target: DatabaseTarget, value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${getDatabaseUrlVariable(target)} is not a valid URL.`);
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(
      `${getDatabaseUrlVariable(target)} must use the postgres:// or postgresql:// protocol.`,
    );
  }

  const isSupabaseHost = SUPABASE_HOST_SUFFIXES.some((suffix) =>
    url.hostname.endsWith(suffix),
  );

  if (target === "production") {
    if (!isSupabaseHost) {
      throw new Error(
        "SUPABASE_DATABASE_URL must point to an official Supabase database or pooler host.",
      );
    }

    if (url.searchParams.get("sslmode") !== "require") {
      throw new Error(
        "SUPABASE_DATABASE_URL must include sslmode=require for an encrypted production connection.",
      );
    }
  } else if (isSupabaseHost) {
    throw new Error(
      "DEMO_DATABASE_URL must point to the demo PostgreSQL database, not Supabase.",
    );
  }
}

export function getDatabaseConfig(
  environment: DatabaseEnvironment = process.env,
) {
  const target = getDatabaseTarget(environment);
  const variableName = getDatabaseUrlVariable(target);
  const url = environment[variableName];

  if (!url) {
    throw new Error(
      `${variableName} is missing for DATABASE_TARGET=${target}. See .env.example.`,
    );
  }

  validateDatabaseUrl(target, url);

  return {
    provider: getDatabaseProvider(target),
    target,
    url,
    variableName,
  } as const;
}
