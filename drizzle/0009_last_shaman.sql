DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'CREATE POLICY "clients_authenticated_read" ON "clients" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true)';
  END IF;
END
$$;
