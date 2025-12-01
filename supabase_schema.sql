-- Create the table for storing student progress
create table public.estudiantes (
  id text primary key,
  materias jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- For now, we'll allow public access since we don't have user auth implemented yet.
-- In a production app with auth, you would restrict this.
alter table public.estudiantes enable row level security;

create policy "Enable read access for all users"
on public.estudiantes for select
using (true);

create policy "Enable insert/update access for all users"
on public.estudiantes for insert
with check (true);

create policy "Enable update access for all users"
on public.estudiantes for update
using (true);
