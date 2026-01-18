-- Create fleet_vehicles table
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id TEXT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- active, maintenance, retired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'maintenance', 'retired'))
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_car_id ON fleet_vehicles(car_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_reg_number ON fleet_vehicles(registration_number);

-- Enable RLS
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access" ON fleet_vehicles
  FOR SELECT USING (true);

CREATE POLICY "Admin write access" ON fleet_vehicles
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Migrate existing VRNs from cars table to fleet_vehicles
INSERT INTO fleet_vehicles (car_id, registration_number)
SELECT id, registration_number
FROM cars
WHERE registration_number IS NOT NULL
ON CONFLICT (registration_number) DO NOTHING;
