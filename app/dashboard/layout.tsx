import type { ReactNode } from "react";

import { getDashboardContext } from "./dashboard-context";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { language, user } = await getDashboardContext();

  return (
    <DashboardShell
      email={user.email ?? "member@plutos.app"}
      language={language}
    >
      {children}
    </DashboardShell>
  );
}
