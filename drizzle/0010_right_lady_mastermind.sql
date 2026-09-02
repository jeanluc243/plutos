CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" varchar(16) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_users_role_valid" CHECK ("app_users"."role" IN ('user', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "app_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "app_users_email_unique" ON "app_users" USING btree ("email");--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'clients_authenticated_read'
  ) THEN
    ALTER POLICY "clients_authenticated_read" ON "clients" RENAME TO "clients_admin_read";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
    AND EXISTS (
      SELECT 1
      FROM pg_proc
      JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
      WHERE pg_namespace.nspname = 'auth' AND pg_proc.proname = 'uid'
    ) THEN
    EXECUTE $function$
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS 'SELECT EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = ''admin'')'
    $function$;
    REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

    CREATE POLICY "articles_admin_read" ON "articles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
    CREATE POLICY "carriers_admin_read" ON "carriers" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
    CREATE POLICY "orders_admin_read" ON "orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
    CREATE POLICY "todos_admin_read" ON "todos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
    CREATE POLICY "user_settings_admin_read" ON "user_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.is_admin());
    CREATE POLICY "app_users_self_read" ON "app_users" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "app_users"."id");
  END IF;
END $$;
