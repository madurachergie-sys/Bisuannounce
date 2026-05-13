create extension if not exists pgcrypto;

create table if not exists public.announcements (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    type text not null check (type in ('request', 'events', 'academics', 'urgent', 'general')),
    scheduled_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

create table if not exists public.phone_numbers (
    id uuid primary key default gen_random_uuid(),
    phone_number text not null unique check (phone_number ~ '^(09|\\+639)[0-9]{9}$'),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists set_phone_numbers_updated_at on public.phone_numbers;
create trigger set_phone_numbers_updated_at
before update on public.phone_numbers
for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;
alter table public.phone_numbers enable row level security;

drop policy if exists "Allow public read announcements" on public.announcements;
create policy "Allow public read announcements"
on public.announcements for select
to anon
using (true);

drop policy if exists "Allow demo writes announcements" on public.announcements;
create policy "Allow demo writes announcements"
on public.announcements for all
to anon
using (true)
with check (true);

drop policy if exists "Allow demo phone directory access" on public.phone_numbers;
create policy "Allow demo phone directory access"
on public.phone_numbers for all
to anon
using (true)
with check (true);
