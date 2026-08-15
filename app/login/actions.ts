"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fieldErrors: NonNullable<LoginState["fieldErrors"]> = {};

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    fieldErrors.email = "Saisissez une adresse e-mail valide.";
  }
  if (!password) {
    fieldErrors.password = "Saisissez votre mot de passe.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        error.status === 400
          ? "E-mail ou mot de passe incorrect. Vérifiez vos informations."
          : "La connexion est momentanément indisponible. Réessayez dans un instant.",
    };
  }

  redirect("/dashboard");
}
