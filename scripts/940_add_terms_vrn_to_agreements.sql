-- Add terms and vehicle_registration fields to agreements table
ALTER TABLE agreements 
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS vehicle_registration TEXT;

-- Verify columns were added
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'terms') THEN
        RAISE EXCEPTION 'Column "terms" was not added to "agreements" table';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'vehicle_registration') THEN
        RAISE EXCEPTION 'Column "vehicle_registration" was not added to "agreements" table';
    END IF;
END $$;
