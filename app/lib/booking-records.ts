const FALLBACK_SALON_IMAGE =
  'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop';

type RawRow = Record<string, unknown>;

export interface BookingRecord {
  id: string;
  salonId: string;
  salonName: string;
  serviceName: string;
  image: string;
  visitedLabel: string;
  appointmentLabel: string;
  price: number;
  status: string;
}

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getNumericValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
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

function getFirstString(row: RawRow, keys: string[]) {
  for (const key of keys) {
    const value = getStringValue(row[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function getFirstDate(row: RawRow, keys: string[]) {
  for (const key of keys) {
    const value = getDateValue(row[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function formatRelativeVisitedLabel(date: Date | null) {
  if (!date) {
    return 'Recent visit';
  }

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays < 7) {
    return `Last visited ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);

  if (diffWeeks < 5) {
    return `Last visited ${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);

  return `Last visited ${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
}

function formatAppointmentLabel(date: Date | null, timeLabel: string | null, fallback: string | null) {
  if (fallback) {
    return fallback;
  }

  if (!date) {
    return timeLabel ?? 'Appointment details unavailable';
  }

  const datePart = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

  if (!timeLabel) {
    return datePart;
  }

  return `${datePart} | ${timeLabel}`;
}

function getStatusLabel(row: RawRow) {
  return getFirstString(row, ['status', 'booking_status'])?.toUpperCase() ?? 'COMPLETED';
}

function getSalonImage(row: RawRow) {
  return getFirstString(row, ['image', 'image_url', 'imageUrl', 'salon_image', 'salon_image_url']);
}

function getSalonLookupMap(salonRows: RawRow[]) {
  return new Map(
    salonRows.flatMap((salonRow) => {
      const salonId = salonRow.id;

      if (typeof salonId !== 'string' && typeof salonId !== 'number') {
        return [];
      }

      return [
        [
          String(salonId),
          {
            salonName: getFirstString(salonRow, ['name']) ?? 'Unnamed Salon',
            image: getSalonImage(salonRow),
          },
        ] as const,
      ];
    })
  );
}

export function mapBookingRows(bookingRows: RawRow[], salonRows: RawRow[] = []) {
  const salonLookup = getSalonLookupMap(salonRows);

  return bookingRows
    .flatMap((bookingRow) => {
      const idValue = bookingRow.id;

      if (typeof idValue !== 'string' && typeof idValue !== 'number') {
        return [];
      }

      const salonId =
        getFirstString(bookingRow, ['salon_id', 'salonId']) ??
        (typeof bookingRow.salon_id === 'number' ? String(bookingRow.salon_id) : null) ??
        '';
      const linkedSalon = salonLookup.get(salonId);
      const bookingDate = getFirstDate(bookingRow, [
        'appointment_at',
        'appointment_date',
        'booked_for',
        'date',
        'visited_at',
        'created_at',
      ]);
      const timeLabel = getFirstString(bookingRow, ['slot', 'time_slot', 'appointment_time', 'time']);
      const explicitAppointmentLabel = getFirstString(bookingRow, ['appointment_label']);
      const price =
        getNumericValue(bookingRow.total_price) ??
        getNumericValue(bookingRow.price) ??
        getNumericValue(bookingRow.amount) ??
        0;

      return [
        {
          id: String(idValue),
          salonId,
          salonName:
            getFirstString(bookingRow, ['salon_name', 'salonName']) ??
            linkedSalon?.salonName ??
            'Unnamed Salon',
          serviceName:
            getFirstString(bookingRow, ['service_name', 'service_title', 'serviceName', 'service']) ??
            'Salon Service',
          image: getSalonImage(bookingRow) ?? linkedSalon?.image ?? FALLBACK_SALON_IMAGE,
          visitedLabel: formatRelativeVisitedLabel(bookingDate),
          appointmentLabel: formatAppointmentLabel(bookingDate, timeLabel, explicitAppointmentLabel),
          price,
          status: getStatusLabel(bookingRow),
          sortTime: bookingDate?.getTime() ?? 0,
        },
      ];
    })
    .sort((firstBooking, secondBooking) => secondBooking.sortTime - firstBooking.sortTime)
    .map((bookingWithSortTime) => {
      const { sortTime, ...booking } = bookingWithSortTime;
      void sortTime;

      return booking satisfies BookingRecord;
    });
}
