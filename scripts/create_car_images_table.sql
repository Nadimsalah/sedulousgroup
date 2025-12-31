-- Create car_images table to store multiple images per car
CREATE TABLE IF NOT EXISTS car_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE car_images ENABLE ROW LEVEL SECURITY;

-- Public can view all car images
CREATE POLICY "car_images_select_public" ON car_images
  FOR SELECT USING (true);

-- Only admins can insert car images
CREATE POLICY "car_images_insert_admin" ON car_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can update car images
CREATE POLICY "car_images_update_admin" ON car_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can delete car images
CREATE POLICY "car_images_delete_admin" ON car_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS car_images_car_id_idx ON car_images(car_id);
CREATE INDEX IF NOT EXISTS car_images_display_order_idx ON car_images(display_order);
