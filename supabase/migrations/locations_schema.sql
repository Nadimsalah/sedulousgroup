-- Create locations table for dynamic pickup/dropoff points
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policies for locations
-- Public can view active locations
CREATE POLICY "Anyone can view active locations" 
ON locations FOR SELECT 
USING (is_active = true);

-- Admin can manage all locations
CREATE POLICY "Admins can manage locations" 
ON locations FOR ALL
USING (auth.jwt() ->> 'email' = 'sami@admin.com')
WITH CHECK (auth.jwt() ->> 'email' = 'sami@admin.com');

-- Add some default locations
INSERT INTO locations (name, address) VALUES 
('London, UK', 'London, United Kingdom'),
('Heathrow Airport (LHR)', 'Longford TW6, United Kingdom'),
('Gatwick Airport (LGW)', 'Horley, Gatwick RH6 0NP, United Kingdom')
ON CONFLICT (name) DO NOTHING;
