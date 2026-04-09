-- ZLon Storage Setup for salon-assets bucket
-- Run this in Supabase SQL editor

-- Create the public bucket for salon assets
insert into storage.buckets (id, name, public)
values ('salon-assets', 'salon-assets', true)
on conflict (id) do nothing;

-- Enable RLS on objects
alter table storage.objects enable row level security;

-- Policy: Allow public read access to salon-assets bucket
drop policy if exists "Public read access for salon-assets" on storage.objects;
create policy "Public read access for salon-assets"
on storage.objects
for select
to public
using (bucket_id = 'salon-assets');

-- Policy: Allow authenticated users to upload to salon-assets if they own the salon
-- Assuming salon_id is part of the path, e.g., salon-assets/{salon_id}/...
drop policy if exists "Owners can upload salon assets" on storage.objects;
create policy "Owners can upload salon assets"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'salon-assets'
    and (storage.foldername(name))[1] = (select id::text from public.salons where owner_id = auth.uid())
);

-- Policy: Allow owners to delete their salon assets
drop policy if exists "Owners can delete salon assets" on storage.objects;
create policy "Owners can delete salon assets"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'salon-assets'
    and (storage.foldername(name))[1] = (select id::text from public.salons where owner_id = auth.uid())
);