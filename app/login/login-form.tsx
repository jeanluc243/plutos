"use client";

import { useActionState, useState } from "react";
import { login } from "./actions";
import type { LoginState } from "./actions";

const initialState: LoginState = {};

function EyeIcon({ crossed = false }: { crossed?: boolean }) {
  return (
    <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {crossed && <path d="m4 4 16 16" />}
    </svg>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-9 space-y-5" noValidate>
      {state.error && (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base leading-6 text-red-700" role="alert">
          <svg aria-hidden="true" className="mt-0.5 size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16.5h.01" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label className="mb-2 block text-base font-medium text-slate-700" htmlFor="email">Adresse e-mail</label>
        <input
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          autoFocus
          className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
          id="email"
          name="email"
          placeholder="vous@entreprise.com"
          type="email"
        />
        {state.fieldErrors?.email && <p className="mt-1.5 text-base text-red-600" id="email-error">{state.fieldErrors.email}</p>}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label className="text-base font-medium text-slate-700" htmlFor="password">Mot de passe</label>
          <span className="text-sm font-medium text-slate-400">8 caractères minimum</span>
        </div>
        <div className="relative">
          <input
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete="current-password"
            className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-base text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
            id="password"
            minLength={8}
            name="password"
            placeholder="Votre mot de passe"
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            <EyeIcon crossed={showPassword} />
          </button>
        </div>
        {state.fieldErrors?.password && <p className="mt-1.5 text-base text-red-600" id="password-error">{state.fieldErrors.password}</p>}
      </div>

      <div className="flex items-center justify-between gap-4 pt-0.5">
        <span className="flex items-center gap-2 text-base text-slate-500">
          <svg aria-hidden="true" className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" />
          </svg>
          Session sécurisée
        </span>
        <span className="text-base font-medium text-primary/70" title="Bientôt disponible">Mot de passe oublié ?</span>
      </div>

      <button
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:bg-primary/60"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <><svg aria-hidden="true" className="animate-spin-slow size-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-30" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" /><path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" /></svg>Connexion…</>
        ) : (
          <>Se connecter<svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-5-5 5 5-5 5" /></svg></>
        )}
      </button>
    </form>
  );
}
