import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { FALLBACK_SALON_IMAGE } from './media';

type RawRecord = Record<string, unknown>;

const BOOKING_SELECT_VARIANTS: string[] = [
  `
    id,
    salon_id,
    service_id,
    staff_id,
    status,
    appointment_timestamp,
    start_time,
    date,
    time_slot,
    total_amount,
    created_at,
    salons:salon_id (
      id,
      name,
      address,
      imageUrl
    )
  `,
  `
    id,
    salon_id,
    service_id,
    staff_id,
    status,
    appointment_timestamp,
    date,
    time_slot,
    total_amount,
    created_at
  `,
];

export interface BookingSnapshot {
  id: string;
  salonId: string;
  serviceId: string;
  staffId: string;
  salonName: string;
  salonImage: string;
  salonLocation: string;
  serviceName: string;
  staffName: string;
  staffTitle: string;
  statusKey: string;
  statusLabel: string;
  appointmentAt: Date | null;
  sortTime: number;
  dateLabel: string;
  timeLabel: string;
  dateTimeLabel: string;
  durationLabel: string;
  price: number;
  total: number;
}

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

function getDateValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const nextDate = new Date(value);

    if (!Number.isNaN(nextDate.getTime())) {
      return nextDate;
    }
  }

  return null;
}

function getFirstString(row: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = getStringValue(row[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function getRelation(row: RawRecord, key: string) {
  const value = row[key];

  if (Array.isArray(value)) {
    const firstValue = value[0];
    return firstValue && typeof firstValue === 'object' ? (firstValue as RawRecord) : null;
  }

  return value && typeof value === 'object' ? (value as RawRecord) : null;
}

function getRelations(row: RawRecord, key: string): RawRecord[] {
  const value = row[key];
  if (Array.isArray(value)) {
    return value.filter(v => v && typeof v === 'object') as RawRecord[];
  }
  return value && typeof value === 'object' ? [value as RawRecord] : [];
}

function getIdValue(value: unknown) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return '';
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function normalizeStatus(value: string | null) {
  const normalizedValue = value?.toLowerCase() ?? 'confirmed';

  if (['upcoming', 'active', 'scheduled', 'confirmed'].includes(normalizedValue)) {
    return 'confirmed';
  }

  if (normalizedValue === 'completed') {
    return 'completed';
  }

  if (normalizedValue === 'cancelled' || normalizedValue === 'canceled') {
    return 'cancelled';
  }

  return normalizedValue;
}

function getStatusLabel(statusKey: string) {
  if (statusKey === 'confirmed') {
    return 'Confirmed';
  }

  return titleCase(statusKey);
}

function parseDateAndTime(dateValue: string | null, timeValue: string | null) {
  const candidates = [
    dateValue && timeValue ? `${dateValue} ${timeValue}` : null,
    dateValue,
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    const nextDate = new Date(candidate);

    if (!Number.isNaN(nextDate.getTime())) {
      return nextDate;
    }
  }

  return null;
}

function getAppointmentDate(row: RawRecord) {
  return (
    getDateValue(row.start_time) ??
    getDateValue(row.appointment_timestamp) ??
    parseDateAndTime(getStringValue(row.date), getStringValue(row.time_slot)) ??
    getDateValue(row.created_at)
  );
}

function formatDateLabel(date: Date | null) {
  if (!date) {
    return 'Date to be confirmed';
  }

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTimeLabel(date: Date | null, row: RawRecord) {
  const hasPreciseTimestamp =
    getDateValue(row.start_time) !== null || getDateValue(row.appointment_timestamp) !== null;

  if (hasPreciseTimestamp && date) {
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  return getStringValue(row.time_slot) ?? 'Time to be confirmed';
}

function formatDateTimeLabel(dateLabel: string, timeLabel: string) {
  if (!dateLabel) {
    return timeLabel;
  }

  if (!timeLabel) {
    return dateLabel;
  }

  return `${dateLabel} • ${timeLabel}`;
}

function getDurationLabel(service: RawRecord | null) {
  const durationMinutes = service ? getNumericValue(service.duration_minutes) : null;

  if (durationMinutes !== null) {
    return `${durationMinutes} min`;
  }

  return 'Duration on arrival';
}

function mapBookingRow(row: RawRecord) {
  const idValue = row.id;

  if (typeof idValue !== 'string' && typeof idValue !== 'number') {
    return null;
  }

  const salon = getRelation(row, 'salons');
  const services = getRelations(row, 'services');
  const service = services[0] ?? null;
  const staff = getRelation(row, 'staff');
  const appointmentAt = getAppointmentDate(row);
  const statusKey = normalizeStatus(getFirstString(row, ['status']));
  const dateLabel = formatDateLabel(appointmentAt);
  const timeLabel = formatTimeLabel(appointmentAt, row);
  const servicePrice = getNumericValue(row.total_amount) ?? (service ? getNumericValue(service.price) : null) ?? 0;

  let serviceName = 'Salon Service';
  if (services.length > 0) {
    const firstServiceName = getFirstString(services[0], ['name']);
    if (firstServiceName) {
      serviceName = services.length === 1 ? firstServiceName : `${firstServiceName} +${services.length - 1} more`;
    }
  }

  return {
    id: String(idValue),
    salonId: getIdValue(row.salon_id),
    serviceId: getIdValue(row.service_id),
    staffId: getIdValue(row.staff_id),
    salonName: (salon ? getFirstString(salon, ['name']) : null) ?? 'ZLon Salon',
    salonImage: (salon ? getFirstString(salon, ['imageUrl']) : null) ?? FALLBACK_SALON_IMAGE,
    salonLocation: (salon ? getFirstString(salon, ['address']) : null) ?? 'Location unavailable',
    serviceName,
    staffName: (staff ? getFirstString(staff, ['name']) : null) ?? 'Assigned Professional',
    staffTitle: 'Salon professional',
    statusKey,
    statusLabel: getStatusLabel(statusKey),
    appointmentAt,
    sortTime: appointmentAt?.getTime() ?? 0,
    dateLabel,
    timeLabel,
    dateTimeLabel: formatDateTimeLabel(dateLabel, timeLabel),
    durationLabel: getDurationLabel(service),
    price: servicePrice,
    total: servicePrice,
  } satisfies BookingSnapshot;
}

function isRecoverableJoinError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? '';

  return (
    error?.code === '42703' ||
    message.includes('column') ||
    message.includes('relationship') ||
    message.includes('schema cache')
  );
}

async function getAuthenticatedUserId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

async function attachStaffDetails(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: RawRecord[]
) {
  const staffIds = Array.from(
    new Set(
      rows
        .map((row) => row.staff_id)
        .map(getIdValue)
        .filter(Boolean)
    )
  );

  if (staffIds.length === 0) {
    return rows;
  }

  const { data, error } = await supabase
    .from('staff')
    .select('id,name')
    .in('id', staffIds);

  if (error || !data) {
    if (error) {
      console.error('Unable to load staff details for bookings:', error);
    }

    return rows;
  }

  const staffLookup = new Map(
    (data as RawRecord[]).flatMap((staffRow) => {
      const staffId = getIdValue(staffRow.id);

      if (!staffId) {
        return [];
      }

      return [[staffId, staffRow] as const];
    })
  );

  return rows.map((row) => {
    const staffId = getIdValue(row.staff_id);

    if (!staffId) {
      return row;
    }

    return {
      ...row,
      staff: staffLookup.get(staffId) ?? null,
    } satisfies RawRecord;
  });
}

async function attachServiceDetails(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  rows: RawRecord[]
) {
  const allServiceIds = new Set<string>();

  rows.forEach((row) => {
    const ids = getIdValue(row.service_id).split(',').map(s => s.trim()).filter(Boolean);
    ids.forEach(id => allServiceIds.add(id));
  });

  if (allServiceIds.size === 0) {
    return rows;
  }

  const { data, error } = await supabase
    .from('services')
    .select('id,name,price,duration_minutes')
    .in('id', Array.from(allServiceIds));

  if (error || !data) {
    return rows;
  }

  const serviceLookup = new Map(
    (data as RawRecord[]).map((s) => [getIdValue(s.id), s])
  );

  return rows.map((row) => {
    const ids = getIdValue(row.service_id).split(',').map(s => s.trim()).filter(Boolean);
    const resolvedServices = ids.map(id => serviceLookup.get(id)).filter(Boolean);
    
    if (resolvedServices.length > 0) {
      return { ...row, services: resolvedServices } satisfies RawRecord;
    }
    return row;
  });
}

async function runJoinedBookingQuery(options: { bookingId?: string }) {
  const supabase = await createSupabaseServerClient();
  const userId = await getAuthenticatedUserId(supabase);

  if (!userId) {
    return [];
  }

  let lastError: { message?: string } | null = null;

  for (const select of BOOKING_SELECT_VARIANTS) {
    const buildQuery = () => {
      let query = supabase
        .from('bookings')
        .select(select)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.bookingId) {
        query = query.eq('id', options.bookingId).limit(1);
      }

      return query;
    };

    const result = options.bookingId
      ? await buildQuery().maybeSingle()
      : await buildQuery();

    if (!result.error) {
      let rows = options.bookingId
        ? result.data
          ? [result.data as unknown as RawRecord]
          : []
        : ((result.data ?? []) as unknown as RawRecord[]);

      rows = await attachStaffDetails(supabase, rows);
      rows = await attachServiceDetails(supabase, rows);
      return rows;
    }

    lastError = result.error;

    if (!isRecoverableJoinError(result.error)) {
      break;
    }
  }

  if (lastError) {
    console.error('Unable to load joined booking records:', lastError);
  }

  return [];
}


function byUpcomingOrder(firstBooking: BookingSnapshot, secondBooking: BookingSnapshot) {
  return firstBooking.sortTime - secondBooking.sortTime;
}

function byHistoryOrder(firstBooking: BookingSnapshot, secondBooking: BookingSnapshot) {
  return secondBooking.sortTime - firstBooking.sortTime;
}

export function isPastBooking(booking: BookingSnapshot) {
  if (booking.statusKey === 'completed' || booking.statusKey === 'cancelled') {
    return true;
  }

  if (!booking.appointmentAt) {
    return false;
  }

  return booking.appointmentAt.getTime() < Date.now();
}

export function isActiveBooking(booking: BookingSnapshot) {
  return !isPastBooking(booking) && booking.statusKey !== 'cancelled';
}

export function getUpcomingBookings(bookings: BookingSnapshot[]) {
  return bookings.filter(isActiveBooking).sort(byUpcomingOrder);
}

export function getPastBookings(bookings: BookingSnapshot[]) {
  return bookings.filter(isPastBooking).sort(byHistoryOrder);
}

export async function getUserBookings() {
  const rows = await runJoinedBookingQuery({});

  return rows
    .map(mapBookingRow)
    .filter((booking): booking is BookingSnapshot => booking !== null);
}

export async function getBookingById(bookingId: string) {
  const safeBookingId = getStringValue(bookingId);

  if (!safeBookingId) {
    return null;
  }

  const rows = await runJoinedBookingQuery({ bookingId: safeBookingId });
  const booking = rows.map(mapBookingRow).find((entry) => entry !== null) ?? null;

  return booking;
}
