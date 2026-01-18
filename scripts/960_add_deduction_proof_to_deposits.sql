-- Add deduction_proof_url column to deposits table
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS deduction_proof_url TEXT;
