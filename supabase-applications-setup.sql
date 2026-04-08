-- ZLon partner application setup
-- Run this in the Supabase SQL editor so public application submissions can be stored.

alter table public.applications enable row level security;

grant insert on public.applications to anon;

drop policy if exists "Public can submit partner applications" on public.applications;
create policy "Public can submit partner applications"
on public.applications
for insert
to anon
with check (
    plan_type in ('standard', 'premium')
    and nullif(trim(salon_name), '') is not null
    and nullif(trim(owner_name), '') is not null
    and nullif(trim(email), '') is not null
    and nullif(trim(phone), '') is not null
    and nullif(trim(address), '') is not null
    and biz_age is not null
    and chairs in ('1-3', '4-7', '8+')
    and revenue in ('below_50k', '50k_2l', 'above_2l')
);
