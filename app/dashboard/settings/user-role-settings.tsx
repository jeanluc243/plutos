"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardLanguage } from "../language";
import { settingsCopy } from "./copy";
import { setUserRole } from "./user-role-actions";

type ManagedUser = {
  id: string;
  email: string;
  role: "admin" | "user";
};

export function UserRoleSettings({
  language,
  currentUserId,
  users,
}: {
  language: DashboardLanguage;
  currentUserId: string;
  users: ManagedUser[];
}) {
  const copy = settingsCopy[language];
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeRole(user: ManagedUser) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setError(null);
    setPendingId(user.id);
    startTransition(async () => {
      const result = await setUserRole(user.id, nextRole);
      if (result.status === "error") setError(copy.roleErrors[result.error]);
      setPendingId(null);
    });
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-muted-foreground" />
          {copy.userAccess}
        </CardTitle>
        <CardDescription>{copy.userAccessDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const changing = isPending && pendingId === user.id;

          return (
            <div key={user.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <UserRound className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.email}</p>
                <Badge variant={user.role === "admin" ? "secondary" : "outline"} className="mt-1">
                  {user.role === "admin" ? copy.admin : copy.member}
                </Badge>
              </div>
              <Button
                type="button"
                variant={user.role === "admin" ? "outline" : "default"}
                disabled={isCurrentUser || changing}
                onClick={() => changeRole(user)}
              >
                {changing && <LoaderCircle className="animate-spin" />}
                {user.role === "admin" ? copy.removeAdmin : copy.makeAdmin}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
