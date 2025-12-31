-- Create stories table for Instagram-style car stories
create table if not exists public.stories (
  id text primary key,
  title text not null,
  thumbnail text not null,
  images jsonb not null default '[]'::jsonb,
  linked_car_id text references public.cars(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.stories enable row level security;

-- Allow public read access to stories
create policy "stories_select_public"
  on public.stories for select
  using (true);

-- Only authenticated users (admin) can insert stories
create policy "stories_insert_admin"
  on public.stories for insert
  with check (auth.role() = 'authenticated');

-- Only authenticated users (admin) can update stories
create policy "stories_update_admin"
  on public.stories for update
  using (auth.role() = 'authenticated');

-- Only authenticated users (admin) can delete stories
create policy "stories_delete_admin"
  on public.stories for delete
  using (auth.role() = 'authenticated');

-- Create index for faster queries
create index if not exists stories_linked_car_idx on public.stories(linked_car_id);
