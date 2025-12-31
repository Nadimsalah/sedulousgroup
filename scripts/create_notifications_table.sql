-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking', 'damage', 'payment', 'system', 'pcn', 'deposit', 'agreement')),
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
CREATE POLICY "Admins can manage all notifications"
  ON notifications FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert some sample notifications for testing
INSERT INTO notifications (user_id, title, message, type, link)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'New Booking Request',
  'A new booking request has been submitted for Toyota Camry',
  'booking',
  '/admin/requests'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

INSERT INTO notifications (user_id, title, message, type, link)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Deposit Refund Processed',
  'Deposit refund of £500 has been processed for booking #12345',
  'deposit',
  '/admin/deposits'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

INSERT INTO notifications (user_id, title, message, type, link)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'PCN Ticket Received',
  'A new PCN ticket has been uploaded for registration ABC123',
  'pcn',
  '/admin/pcn-tickets'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);
