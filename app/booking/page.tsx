import type { Metadata } from 'next';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { BookingDetailsScreen } from './booking-details-screen';
import type { BookedService, BookingDetails } from './booking-details-types';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type RawRow = Record<string, unknown>;

export const metadata: Metadata = {
  title: 'Booking Details',
};

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getNumericValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const parsedValue = Number(trimmedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function getFirstString(row: RawRow, keys: string[]) {
  for (const key of keys) {
    const value = getStringValue(row[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function getRelation(row: RawRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (Array.isArray(value)) {
      const firstValue = value[0];

      if (firstValue && typeof firstValue === 'object') {
        return firstValue as RawRow;
      }
    }

    if (value && typeof value === 'object') {
      return value as RawRow;
    }
  }

  return null;
}

function getDateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function formatTitleCase(value: string | null) {
  if (!value) {
    return 'Upcoming';
  }

  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function getDurationLabel(service: RawRow | null, startDate: Date | null, endDate: Date | null) {
  const explicitDuration = service
    ? getFirstString(service, ['time', 'duration', 'duration_label'])
    : null;

  if (explicitDuration) {
    return explicitDuration;
  }

  const durationMinutes = service
    ? getNumericValue(service.duration_minutes) ?? getNumericValue(service.durationMinutes)
    : null;

  if (durationMinutes !== null) {
    return `${durationMinutes} min`;
  }

  if (startDate && endDate) {
    const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));

    if (minutes > 0) {
      return `${minutes} min`;
    }
  }

  return 'Duration unavailable';
}

function getTimeSlot(startDate: Date | null, endDate: Date | null) {
  if (startDate && endDate) {
    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
  }

  if (startDate) {
    return formatTime(startDate);
  }

  return 'Time unavailable';
}

function toBookingDetails(row: RawRow, salon: RawRow | null, service: RawRow | null) {
  const idValue = row.id;

  if (typeof idValue !== 'string' && typeof idValue !== 'number') {
    return null;
  }

  const startDate = getDateValue(row.start_time) ?? getDateValue(row.created_at);
  const endDate = getDateValue(row.end_time);
  const servicePrice =
    getNumericValue(row.salon_revenue) ??
    (service
      ? getNumericValue(service.base_price) ??
        getNumericValue(service.price) ??
        getNumericValue(service.salon_revenue)
      : null) ??
    0;
  const serviceName = (service ? getFirstString(service, ['name']) : null) ?? 'Salon Service';
  const salonName = (salon ? getFirstString(salon, ['name']) : null) ?? 'ZLon Salon';
  const location = (salon ? getFirstString(salon, ['location']) : null) ?? 'Location unavailable';
  const duration = getDurationLabel(service, startDate, endDate);
  const services: BookedService[] = [
    {
      id: String((service?.id as string | number | undefined) ?? row.service_id ?? idValue),
      name: serviceName,
      duration,
      price: servicePrice,
    },
  ];

  return {
    id: String(idValue),
    serviceTitle: serviceName,
    salonName,
    location,
    date: startDate?.toISOString() ?? '',
    timeSlot: getTimeSlot(startDate, endDate),
    status: formatTitleCase(getFirstString(row, ['status'])),
    totalPrice: servicePrice,
    professionalName: 'ZLon Partner',
    professionalTitle: `${salonName} team`,
    services,
  } satisfies BookingDetails;
}

async function fetchJoinedUpcomingBooking(supabase: SupabaseServerClient) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
        id,
        salon_id,
        service_id,
        start_time,
        end_time,
        status,
        salon_revenue,
        salons:salon_id (
          id,
          name,
          location
        ),
        services:service_id (
          id,
          name,
          time,
          base_price
        )
      `
    )
    .neq('status', 'cancelled')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as RawRow;

  return toBookingDetails(
    row,
    getRelation(row, ['salons', 'salon']),
    getRelation(row, ['services', 'service'])
  );
}

async function fetchFallbackBookingRow(supabase: SupabaseServerClient, userId: string | null) {
  const baseQuery = () =>
    supabase
      .from('bookings')
      .select('*')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1);

  if (userId) {
    const ownedResult = await baseQuery().eq('customer_id', userId).maybeSingle();

    if (!ownedResult.error || !ownedResult.error.message.includes('customer_id')) {
      return ownedResult;
    }
  }

  return baseQuery().maybeSingle();
}

async function fetchFallbackUpcomingBooking(
  supabase: SupabaseServerClient,
  userId: string | null
) {
  const { data, error } = await fetchFallbackBookingRow(supabase, userId);

  if (error || !data) {
    return null;
  }

  const row = data as RawRow;
  const salonId = row.salon_id;
  const serviceId = row.service_id;
  const [salonResult, serviceResult] = await Promise.all([
    typeof salonId === 'string' || typeof salonId === 'number'
      ? supabase.from('salons').select('id,name,location').eq('id', salonId).maybeSingle()
      : Promise.resolve({ data: null }),
    typeof serviceId === 'string' || typeof serviceId === 'number'
      ? supabase.from('services').select('*').eq('id', serviceId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return toBookingDetails(
    row,
    salonResult.data && typeof salonResult.data === 'object'
      ? (salonResult.data as RawRow)
      : null,
    serviceResult.data && typeof serviceResult.data === 'object'
      ? (serviceResult.data as RawRow)
      : null
  );
}

async function getUpcomingBooking() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;

  if (!userId) {
    return null;
  }

  return (
    (await fetchJoinedUpcomingBooking(supabase)) ??
    (await fetchFallbackUpcomingBooking(supabase, userId))
  );
}

export default async function BookingPage() {
  const booking = await getUpcomingBooking();

  return <BookingDetailsScreen booking={booking} />;
}
