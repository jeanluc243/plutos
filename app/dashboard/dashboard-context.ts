import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ensureApplicationUser } from "@/lib/auth/roles";
import {
  isDashboardLanguage,
  type DashboardLanguage,
} from "./language";

export const getDashboardContext = cache(async () => {
  const [cookieStore, supabase] = await Promise.all([cookies(), createClient()]);
  const savedLanguage = cookieStore.get("plutos-language")?.value ?? "en";
  const language: DashboardLanguage = isDashboardLanguage(savedLanguage)
    ? savedLanguage
    : "en";
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  const userId = claims?.sub;
  if (!userId) redirect("/login");

  const user = {
    id: userId,
    email: typeof claims.email === "string" ? claims.email : null,
  };

  const applicationUser = await ensureApplicationUser(user);
  const role = applicationUser.role === "admin" ? "admin" : "user";

  return {
    language,
    user,
    role,
    isAdmin: role === "admin",
  };
});
