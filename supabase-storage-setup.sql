-- ZLon storage setup for owner salon assets
-- Bucket: salon-assets (public read)

insert into storage.buckets (id, name, public)
values ('salon-assets', 'salon-assets', true)
on conflict (id) do update
set public = excluded.public;

-- File path convention:
-- salon-assets/<salon_id>/<filename>
-- Owners can only upload/delete under their own salon_id folder.

drop policy if exists "Public read salon assets" on storage.objects;
create policy "Public read salon assets"
on storage.objects
for select
to public
using (bucket_id = 'salon-assets');

drop policy if exists "Owners upload own salon assets" on storage.objects;
create policy "Owners upload own salon assets"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'salon-assets'
    and (storage.foldername(name))[1] in (
        select id::text from public.salons where owner_id = auth.uid()
    )
);

drop policy if exists "Owners update own salon assets" on storage.objects;
create policy "Owners update own salon assets"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'salon-assets'
    and (storage.foldername(name))[1] in (
        select id::text from public.salons where owner_id = auth.uid()
    )
)
with check (
    bucket_id = 'salon-assets'
    and (storage.foldername(name))[1] in (
        select id::text from public.salons where owner_id = auth.uid()
    )
);

drop policy if exists "Owners delete own salon assets" on storage.objects;
create policy "Owners delete own salon assets"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'salon-assets'
    and (storage.foldername(name))[1] in (
        select id::text from public.salons where owner_id = auth.uid()
    )
);
