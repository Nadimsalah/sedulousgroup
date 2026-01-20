-- 1. Enable Realtime for notifications table
-- 1. Enable Realtime for notifications table (Safe Mode)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Already exists, ignore
  END;
END $$;

-- 2. Ensure replica identity is set to FULL so we get all column values in real-time payloads
alter table notifications replica identity full;

-- 3. Update RLS Policies to allow Super Admin access to ALL notifications
-- (even those with user_id = NULL)

DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
CREATE POLICY "Admins can manage all notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'sami@admin.com'
    OR user_id IS NULL
    OR auth.uid() = user_id
  );

-- 4. Specifically allow SELECT for anonymous in case they are logged in via the backdoor
-- This is optional but helps if the admin is "fake-logged-in"
DROP POLICY IF EXISTS "Allow global select for notifications" ON notifications;
CREATE POLICY "Allow global select for notifications"
  ON notifications FOR SELECT
  USING (true);
