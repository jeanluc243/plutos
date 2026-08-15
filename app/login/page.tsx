import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

function PlutosMark() {
  return (
    <div className="relative flex size-9 items-center justify-center overflow-hidden rounded-[11px] bg-primary shadow-lg shadow-primary/25">
      <span className="absolute -left-1.5 top-1 size-7 rounded-full border-[5px] border-white/95" />
      <span className="absolute bottom-1.5 right-1.5 size-2 rounded-full bg-white" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-white">
      <div className="grid min-h-dvh w-full overflow-hidden bg-white lg:h-dvh lg:grid-cols-[1.08fr_minmax(520px,0.92fr)]">
        <section
          className="relative hidden min-h-dvh overflow-hidden lg:block"
          aria-hidden="true"
        >
          <Image
            src="/images/login-space.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 54vw, 0px"
            className="object-cover object-center"
          />
        </section>

        <section className="flex min-h-dvh flex-col px-6 py-7 sm:px-12 sm:py-10 lg:min-h-0 lg:px-[clamp(48px,6vw,96px)] lg:py-12">
          <div className="flex items-center gap-3">
            <PlutosMark />
            <span className="text-xl font-bold tracking-[-0.04em] text-slate-950">plutos</span>
          </div>

          <div className="mt-12 w-full max-w-[430px] self-center sm:mt-14 lg:mt-16">
            <h1 className="text-[34px] font-bold leading-[1.15] tracking-[-0.045em] text-slate-950 sm:text-[40px]">
              Welcome back
            </h1>
            <p className="mt-3 max-w-sm text-base leading-7 text-slate-500">
              Sign in to your account
            </p>
            <LoginForm />
            <p className="mt-8 text-center text-xs leading-5 text-slate-400">En vous connectant, vous acceptez nos conditions d’utilisation et notre politique de confidentialité.</p>
          </div>

          <p className="mt-auto pt-8 text-xs text-slate-400">© {new Date().getFullYear()} Plutos</p>
        </section>
      </div>
    </main>
  );
}
