-- Create bookings table for rental transactions
create table if not exists public.bookings (
  id text primary key,
  car_id text not null references public.cars(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  pickup_location text not null,
  dropoff_location text not null,
  pickup_date date not null,
  dropoff_date date not null,
  pickup_time time not null,
  dropoff_time time not null,
  total_amount numeric not null,
  status text default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.bookings enable row level security;

-- Allow authenticated users to read all bookings (admin dashboard)
create policy "bookings_select_admin"
  on public.bookings for select
  using (auth.role() = 'authenticated');

-- Allow public to insert bookings (customers can book without auth)
create policy "bookings_insert_public"
  on public.bookings for insert
  with check (true);

-- Only authenticated users can update bookings
create policy "bookings_update_admin"
  on public.bookings for update
  using (auth.role() = 'authenticated');

-- Only authenticated users can delete bookings
create policy "bookings_delete_admin"
  on public.bookings for delete
  using (auth.role() = 'authenticated');

-- Create indexes for faster queries
create index if not exists bookings_car_id_idx on public.bookings(car_id);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_customer_email_idx on public.bookings(customer_email);
