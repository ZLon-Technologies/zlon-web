-- ZLon auth + role setup
-- Run this in the Supabase SQL editor.
--
-- Dashboard provider setup required (not configurable via SQL):
-- 1) Authentication > Providers > Phone (OTP) -> Enable
-- 2) Authentication > Providers > Google -> Enable and set client ID/secret
-- 3) Authentication > Providers > Email -> Enable (password sign-in)
-- 4) Add redirect URLs:
--    https://zlon.in/
--    https://www.zlon.in/
--    https://mybusiness.zlon.in/
--    http://localhost:3000/
--    http://localhost:3000/business

alter table public.salons
    add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.salons
    add column if not exists owner_email text;

alter table public.salons
    add column if not exists queue_status text default 'available';

alter table public.salons
    add column if not exists logo_url text;

alter table public.salons
    add column if not exists banner_url text;

create index if not exists salons_owner_id_idx on public.salons(owner_id);
create index if not exists salons_owner_email_idx on public.salons(lower(owner_email));
create index if not exists salons_queue_status_idx on public.salons(lower(coalesce(queue_status, 'available')));

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

do $$
begin
    if not exists (
        select 1
        from pg_type t
        join pg_namespace n on n.oid = t.typnamespace
        where t.typname = 'user_type_enum'
          and n.nspname = 'public'
    ) then
        create type public.user_type_enum as enum ('customer', 'owner');
    end if;
end
$$;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    phone text,
    user_type public.user_type_enum not null default 'customer',
    is_premium boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
    add column if not exists email text;

alter table public.profiles
    add column if not exists phone text;

alter table public.profiles
    add column if not exists user_type text;

alter table public.profiles
    add column if not exists is_premium boolean;

alter table public.profiles
    add column if not exists created_at timestamptz;

alter table public.profiles
    add column if not exists updated_at timestamptz;

update public.profiles
set created_at = now()
where created_at is null;

update public.profiles
set updated_at = now()
where updated_at is null;

update public.profiles
set is_premium = false
where is_premium is null;

update public.profiles
set user_type = 'customer'
where user_type is null
   or lower(user_type::text) not in ('customer', 'owner');

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'user_type'
          and udt_name <> 'user_type_enum'
    ) then
        alter table public.profiles
            alter column user_type type public.user_type_enum
            using case
                when lower(coalesce(user_type::text, 'customer')) = 'owner'
                    then 'owner'::public.user_type_enum
                else 'customer'::public.user_type_enum
            end;
    end if;
end
$$;

alter table public.profiles
    drop constraint if exists profiles_user_type_check;

alter table public.profiles
    alter column user_type set default 'customer';

alter table public.profiles
    alter column user_type set not null;

alter table public.profiles
    alter column is_premium set default false;

alter table public.profiles
    alter column is_premium set not null;

alter table public.profiles
    alter column created_at set default now();

alter table public.profiles
    alter column created_at set not null;

alter table public.profiles
    alter column updated_at set default now();

alter table public.profiles
    alter column updated_at set not null;

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles
for insert
to authenticated
with check (
    id = auth.uid()
    and user_type in ('customer'::public.user_type_enum, 'owner'::public.user_type_enum)
);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
    id = auth.uid()
    and user_type in ('customer'::public.user_type_enum, 'owner'::public.user_type_enum)
);

drop policy if exists "Customers can create own profile" on public.profiles;
drop policy if exists "Customers can update own profile" on public.profiles;

drop function if exists public.sync_current_user_profile(text);

create or replace function public.sync_current_user_profile(
    next_user_type text default 'customer',
    next_phone text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
    requested_type text := lower(coalesce(next_user_type, 'customer'));
    resolved_type public.user_type_enum := 'customer'::public.user_type_enum;
    current_email text := auth.jwt() ->> 'email';
    current_phone text := coalesce(nullif(next_phone, ''), nullif(auth.jwt() ->> 'phone', ''));
    profile public.profiles;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated.';
    end if;

    if requested_type = 'owner' then
        resolved_type := 'owner'::public.user_type_enum;
    end if;

    if resolved_type = 'owner'::public.user_type_enum and not exists (
        select 1
        from public.salons
        where owner_id = auth.uid()
           or (
                current_email is not null
                and (
                    (owner_email is not null and lower(owner_email) = lower(current_email))
                    or (email is not null and lower(email) = lower(current_email))
                )
           )
    ) then
        raise exception 'Owner profile requires a linked salon.';
    end if;

    insert into public.profiles (id, email, phone, user_type, updated_at)
    values (auth.uid(), current_email, current_phone, resolved_type, now())
    on conflict (id) do update
        set email = excluded.email,
            phone = coalesce(excluded.phone, public.profiles.phone),
            user_type = excluded.user_type,
            updated_at = now()
    returning * into profile;

    return profile;
end;
$$;

grant execute on function public.sync_current_user_profile(text, text) to authenticated;
