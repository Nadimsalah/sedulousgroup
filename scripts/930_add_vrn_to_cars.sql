-- Add registration_number column to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS registration_number TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS cars_registration_number_idx ON public.cars(registration_number);
