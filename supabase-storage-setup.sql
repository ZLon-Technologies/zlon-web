-- ZLon Storage Setup for salon-assets bucket
-- Run this in Supabase SQL editor.
--
-- Path convention enforced by RLS:
--   salon-assets/<salon_id>/logo-*.png
--   salon-assets/<salon_id>/banner-*.jpg

insert into storage.buckets (id, name, public)
values ('salon-assets', 'salon-assets', true)
on conflict (id) do update
set public = excluded.public;

alter table storage.objects enable row level security;

drop policy if exists "Public read access for salon-assets" on storage.objects;
create policy "Public read access for salon-assets"
on storage.objects
for select
to public
using (bucket_id = 'salon-assets');

drop policy if exists "Owners can upload salon assets" on storage.objects;
create policy "Owners can upload salon assets"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'salon-assets'
    and exists (
        select 1
        from public.salons s
        where s.owner_id = auth.uid()
          and s.id::text = (storage.foldername(name))[1]
    )
);

drop policy if exists "Owners can update salon assets" on storage.objects;
create policy "Owners can update salon assets"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'salon-assets'
    and exists (
        select 1
        from public.salons s
        where s.owner_id = auth.uid()
          and s.id::text = (storage.foldername(name))[1]
    )
)
with check (
    bucket_id = 'salon-assets'
    and exists (
        select 1
        from public.salons s
        where s.owner_id = auth.uid()
          and s.id::text = (storage.foldername(name))[1]
    )
);

drop policy if exists "Owners can delete salon assets" on storage.objects;
create policy "Owners can delete salon assets"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'salon-assets'
    and exists (
        select 1
        from public.salons s
        where s.owner_id = auth.uid()
          and s.id::text = (storage.foldername(name))[1]
    )
);
