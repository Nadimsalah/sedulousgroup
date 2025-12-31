-- Create cars table for vehicle inventory
create table if not exists public.cars (
  id text primary key,
  name text not null,
  brand text not null,
  category text not null,
  year integer not null,
  price numeric not null,
  rating numeric default 4.5,
  image text not null,
  passengers integer not null,
  luggage integer not null,
  transmission text not null,
  fuel_type text not null,
  description text,
  features jsonb default '{"safety": [], "deviceConnectivity": [], "convenience": []}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.cars enable row level security;

-- Allow public read access to cars (no authentication required)
create policy "cars_select_public"
  on public.cars for select
  using (true);

-- Only authenticated users (admin) can insert cars
create policy "cars_insert_admin"
  on public.cars for insert
  with check (auth.role() = 'authenticated');

-- Only authenticated users (admin) can update cars
create policy "cars_update_admin"
  on public.cars for update
  using (auth.role() = 'authenticated');

-- Only authenticated users (admin) can delete cars
create policy "cars_delete_admin"
  on public.cars for delete
  using (auth.role() = 'authenticated');

-- Create index for faster queries
create index if not exists cars_category_idx on public.cars(category);
create index if not exists cars_brand_idx on public.cars(brand);
