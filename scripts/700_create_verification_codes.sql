create table if not exists verification_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Add RLS policies
alter table verification_codes enable row level security;

-- Only allow server-side access (service role) to read/write verification codes
-- We don't want public access to this table
create policy "Service role can do everything on verification_codes"
  on verification_codes
  using (true)
  with check (true);
