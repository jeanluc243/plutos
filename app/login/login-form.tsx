"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";
import type { LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-9 space-y-5" noValidate>
      {state.error && (
        <Alert variant="destructive" className="px-4 py-3 text-base leading-6">
          <CircleAlert />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label className="text-base" htmlFor="email">Adresse e-mail</Label>
        <Input
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          autoFocus
          className="h-13 rounded-xl bg-card px-4 text-base"
          id="email"
          name="email"
          placeholder="vous@entreprise.com"
          type="email"
        />
        {state.fieldErrors?.email && <p className="text-sm text-destructive" id="email-error">{state.fieldErrors.email}</p>}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-base" htmlFor="password">Mot de passe</Label>
          <span className="text-sm text-muted-foreground">8 caractères minimum</span>
        </div>
        <div className="relative">
          <Input
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete="current-password"
            className="h-13 rounded-xl bg-card px-4 pr-12 text-base"
            id="password"
            minLength={8}
            name="password"
            placeholder="Votre mot de passe"
            type={showPassword ? "text" : "password"}
          />
          <Button
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 h-full w-12 rounded-l-none text-muted-foreground"
            onClick={() => setShowPassword((visible) => !visible)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        {state.fieldErrors?.password && <p className="text-sm text-destructive" id="password-error">{state.fieldErrors.password}</p>}
      </div>

      <div className="flex items-center justify-between gap-4 pt-0.5">
        <span className="flex items-center gap-2 text-base text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Session sécurisée
        </span>
        <span className="text-base font-medium text-primary/70" title="Bientôt disponible">Mot de passe oublié ?</span>
      </div>

      <Button
        className="h-13 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <><LoaderCircle className="animate-spin" />Connexion…</>
        ) : (
          <>Se connecter<ArrowRight data-icon="inline-end" /></>
        )}
      </Button>
    </form>
  );
}
