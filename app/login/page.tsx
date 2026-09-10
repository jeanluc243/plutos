import type { Metadata } from "next";
import Image from "next/image";
import { PlutosLogo } from "@/components/plutos-logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="grid min-h-dvh w-full overflow-hidden bg-background lg:h-dvh lg:grid-cols-[1.08fr_minmax(520px,0.92fr)]">
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
          <PlutosLogo className="w-44" eager />

          <div className="mt-12 w-full max-w-[430px] self-center sm:mt-14 lg:mt-16">
            <h1 className="text-[34px] font-bold leading-[1.15] tracking-[-0.045em] text-foreground sm:text-[40px]">
              Welcome back
            </h1>
            <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground">
              Sign in to your account
            </p>
            <LoginForm />
            <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">En vous connectant, vous acceptez nos conditions d’utilisation et notre politique de confidentialité.</p>
          </div>

          <p className="mt-auto pt-8 text-xs text-muted-foreground">© {new Date().getFullYear()} Plutos</p>
        </section>
      </div>
    </main>
  );
}
