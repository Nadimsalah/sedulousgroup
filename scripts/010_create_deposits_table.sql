-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  vehicle_name VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'held',
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255),
  refund_amount DECIMAL(10,2),
  refunded_at TIMESTAMP WITH TIME ZONE,
  deduction_amount DECIMAL(10,2),
  deduction_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposits_booking_id ON deposits(booking_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_customer_email ON deposits(customer_email);
