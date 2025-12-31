-- Create sales_requests table for managing sales visit requests
CREATE TABLE IF NOT EXISTS public.sales_requests (
  id TEXT PRIMARY KEY,
  car_id TEXT REFERENCES public.cars(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sales_requests ENABLE ROW LEVEL SECURITY;

-- Policies for sales_requests
CREATE POLICY sales_requests_select_admin ON public.sales_requests
  FOR SELECT USING (true);

CREATE POLICY sales_requests_insert_public ON public.sales_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY sales_requests_update_admin ON public.sales_requests
  FOR UPDATE USING (true);

CREATE POLICY sales_requests_delete_admin ON public.sales_requests
  FOR DELETE USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_requests_status ON public.sales_requests(status);
CREATE INDEX IF NOT EXISTS idx_sales_requests_created_at ON public.sales_requests(created_at DESC);
