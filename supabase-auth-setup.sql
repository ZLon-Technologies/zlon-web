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

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    user_type text not null default 'customer',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
    add column if not exists email text;

alter table public.profiles
    add column if not exists user_type text;

alter table public.profiles
    add column if not exists created_at timestamptz not null default now();

alter table public.profiles
    add column if not exists updated_at timestamptz not null default now();

update public.profiles
set created_at = now()
where created_at is null;

update public.profiles
set updated_at = now()
where updated_at is null;

update public.profiles
set user_type = 'customer'
where user_type is null;

alter table public.profiles
    alter column created_at set default now();

alter table public.profiles
    alter column updated_at set default now();

alter table public.profiles
    alter column created_at set not null;

alter table public.profiles
    alter column updated_at set not null;

alter table public.profiles
    alter column user_type set default 'customer';

alter table public.profiles
    alter column user_type set not null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_user_type_check'
          and conrelid = 'public.profiles'::regclass
    ) then
        alter table public.profiles
            add constraint profiles_user_type_check
            check (user_type in ('customer', 'owner'));
    end if;
end
$$;

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Customers can create own profile" on public.profiles;
create policy "Customers can create own profile"
on public.profiles
for insert
to authenticated
with check (
    id = auth.uid()
    and user_type = 'customer'
);

drop policy if exists "Customers can update own profile" on public.profiles;
create policy "Customers can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
    id = auth.uid()
    and user_type = 'customer'
);

create or replace function public.sync_current_user_profile(next_user_type text default 'customer')
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
    resolved_type text := lower(coalesce(next_user_type, 'customer'));
    current_email text := auth.jwt() ->> 'email';
    profile public.profiles;
begin
    if auth.uid() is null then
        raise exception 'Not authenticated.';
    end if;

    if resolved_type not in ('customer', 'owner') then
        resolved_type := 'customer';
    end if;

    if resolved_type = 'owner' and not exists (
        select 1
        from public.salons
        where owner_id = auth.uid()
           or (
                current_email is not null
                and owner_email is not null
                and lower(owner_email) = lower(current_email)
           )
    ) then
        raise exception 'Owner profile requires a linked salon.';
    end if;

    insert into public.profiles (id, email, user_type, updated_at)
    values (auth.uid(), current_email, resolved_type, now())
    on conflict (id) do update
        set email = excluded.email,
            user_type = excluded.user_type,
            updated_at = now()
    returning * into profile;

    return profile;
end;
$$;

grant execute on function public.sync_current_user_profile(text) to authenticated;
