-- ZLon GPS salon discovery setup
-- Run this in the Supabase SQL editor after confirming salon latitude/longitude values.

create extension if not exists postgis with schema extensions;

alter table public.salons
    add column if not exists latitude double precision;

alter table public.salons
    add column if not exists longitude double precision;

alter table public.salons
    add column if not exists geo_location extensions.geography(extensions.Point, 4326);

create index if not exists salons_geo_location_idx
on public.salons
using gist (geo_location);

create or replace function public.sync_salon_geo_location()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
    if new.latitude is not null and new.longitude is not null then
        new.geo_location = extensions.ST_SetSRID(
            extensions.ST_MakePoint(new.longitude, new.latitude),
            4326
        )::extensions.geography;
    else
        new.geo_location = null;
    end if;

    return new;
end;
$$;

drop trigger if exists salons_sync_geo_location on public.salons;
create trigger salons_sync_geo_location
before insert or update of latitude, longitude
on public.salons
for each row
execute function public.sync_salon_geo_location();

update public.salons
set geo_location = extensions.ST_SetSRID(
    extensions.ST_MakePoint(longitude, latitude),
    4326
)::extensions.geography
where latitude is not null and longitude is not null;

create or replace function public.nearby_salons(
    user_lat double precision,
    user_lng double precision,
    radius_m integer default 5000,
    salon_type text default null
)
returns table (
    salon jsonb,
    distance_m double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
    with user_point as (
        select extensions.ST_SetSRID(
            extensions.ST_MakePoint(user_lng, user_lat),
            4326
        )::extensions.geography as geo
    )
    select
        to_jsonb(s) || jsonb_build_object(
            'distance_m',
            round(extensions.ST_Distance(s.geo_location, user_point.geo))
        ) as salon,
        extensions.ST_Distance(s.geo_location, user_point.geo) as distance_m
    from public.salons s, user_point
    where s.geo_location is not null
      and (salon_type is null or lower(s.type) = lower(salon_type))
      and extensions.ST_DWithin(s.geo_location, user_point.geo, radius_m)
    order by distance_m asc
    limit 50;
$$;

grant execute on function public.nearby_salons(double precision, double precision, integer, text)
to anon, authenticated;
