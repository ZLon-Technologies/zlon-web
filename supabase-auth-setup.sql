-- ZLon barber auth setup
-- Run this once in the Supabase SQL editor before enabling owner dashboard access.

alter table public.salons
    add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.salons
    add column if not exists owner_email text;

alter table public.salons
    add column if not exists queue_status text default 'available';

create index if not exists salons_owner_id_idx on public.salons(owner_id);
create index if not exists salons_owner_email_idx on public.salons(lower(owner_email));

alter table public.salons enable row level security;

drop policy if exists "Public can read salon directory" on public.salons;
create policy "Public can read salon directory"
on public.salons
for select
to anon, authenticated
using (true);

drop policy if exists "Salon owners can claim matching email" on public.salons;
create policy "Salon owners can claim matching email"
on public.salons
for update
to authenticated
using (
    owner_id is null
    and owner_email is not null
    and lower(owner_email) = lower(auth.jwt() ->> 'email')
)
with check (owner_id = auth.uid());

drop policy if exists "Salon owners can update own salon" on public.salons;
create policy "Salon owners can update own salon"
on public.salons
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
