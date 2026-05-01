'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

interface BookingMutationResult {
  ok: boolean;
  message: string;
}

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isMissingColumnError(error: { message?: string; code?: string } | null, column: string) {
  const message = error?.message?.toLowerCase() ?? '';

  return (
    error?.code === '42703' ||
    message.includes(`'${column.toLowerCase()}' column`) ||
    message.includes(`column bookings.${column.toLowerCase()} does not exist`) ||
    message.includes(`column "${column.toLowerCase()}" does not exist`)
  );
}

async function getAuthenticatedClient(): Promise<
  | { supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; userId: string }
  | BookingMutationResult
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      message: 'Please sign in again before changing this booking.',
    };
  }

  return { supabase, userId: data.user.id };
}

async function updateBooking(
  bookingId: string,
  values: Record<string, string>
): Promise<BookingMutationResult> {
  const authResult = await getAuthenticatedClient();

  if ('ok' in authResult) {
    return authResult;
  }

  const { supabase, userId } = authResult;
  const ownedUpdate = await supabase
    .from('bookings')
    .update(values)
    .eq('id', bookingId)
    .eq('customer_id', userId)
    .select('id')
    .maybeSingle();

  if (ownedUpdate.error && !isMissingColumnError(ownedUpdate.error, 'customer_id')) {
    return {
      ok: false,
      message: ownedUpdate.error.message,
    };
  }

  if (!ownedUpdate.error) {
    if (!ownedUpdate.data) {
      return {
        ok: false,
        message: 'Booking not found or already unavailable.',
      };
    }

    revalidatePath('/booking');
    return {
      ok: true,
      message: 'Booking updated.',
    };
  }

  const updateResult = await supabase
    .from('bookings')
    .update(values)
    .eq('id', bookingId)
    .select('id')
    .maybeSingle();

  if (updateResult.error) {
    return {
      ok: false,
      message: updateResult.error.message,
    };
  }

  if (!updateResult.data) {
    return {
      ok: false,
      message: 'Booking not found or already unavailable.',
    };
  }

  revalidatePath('/booking');
  return {
    ok: true,
    message: 'Booking updated.',
  };
}

export async function cancelBooking(bookingId: string): Promise<BookingMutationResult> {
  const safeBookingId = getStringValue(bookingId);

  if (!safeBookingId) {
    return {
      ok: false,
      message: 'Missing booking ID.',
    };
  }

  const result = await updateBooking(safeBookingId, { status: 'cancelled' });

  if (!result.ok) {
    return result;
  }

  revalidatePath('/booking-history');

  return {
    ok: true,
    message: 'Booking cancelled.',
  };
}

export async function rescheduleBooking(formData: FormData): Promise<BookingMutationResult> {
  const bookingId = getStringValue(formData.get('bookingId'));
  const startTime = getStringValue(formData.get('startTime'));

  if (!bookingId || !startTime) {
    return {
      ok: false,
      message: 'Choose a new appointment time.',
    };
  }

  const nextStartTime = new Date(startTime);

  if (Number.isNaN(nextStartTime.getTime())) {
    return {
      ok: false,
      message: 'Choose a valid appointment time.',
    };
  }

  const result = await updateBooking(bookingId, {
    start_time: nextStartTime.toISOString(),
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    message: 'Booking rescheduled.',
  };
}
