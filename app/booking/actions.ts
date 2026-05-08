'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

interface BookingMutationResult {
  ok: boolean;
  message: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type StaffIdRow = { id: string };
type BookedStaffRow = { staff_id: string | null };

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
    revalidatePath('/bookings');
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath('/profile/booking-history');
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
  revalidatePath('/bookings');
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath('/profile/booking-history');
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
  revalidatePath('/profile/booking-history');

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

export async function createBooking(formData: FormData): Promise<BookingMutationResult & { bookingId?: string }> {
  const authResult = await getAuthenticatedClient();
  if ('ok' in authResult && !authResult.ok) return authResult as BookingMutationResult;
  const { supabase, userId } = authResult as {
    supabase: SupabaseServerClient;
    userId: string;
  };

  const salonId = getStringValue(formData.get('salonId'));
  const serviceId = getStringValue(formData.get('serviceId'));
  const date = getStringValue(formData.get('date'));
  const slot = getStringValue(formData.get('slot'));
  const staffId = getStringValue(formData.get('staffId')) || 'any';
  const totalAmount = Number(formData.get('totalAmount') || 0);
  const paymentMethod = getStringValue(formData.get('paymentMethod')) || 'pay-at-salon';

  if (!salonId || !serviceId || !date || !slot) {
    return { ok: false, message: 'Missing booking details.' };
  }

  // appointment_timestamp is used in the directive
  const appointmentTimestamp = `${date} ${slot}`;
  let assignedStaffId = staffId;

  if (staffId === 'any') {
    // Auto-assignment logic
    const { data: allStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('salon_id', salonId);

    if (!allStaff || allStaff.length === 0) {
      return { ok: false, message: 'No staff available for this salon.' };
    }

    const { data: bookedBookings } = await supabase
      .from('bookings')
      .select('staff_id')
      .eq('salon_id', salonId)
      .eq('time_slot', slot) // The DB might use time_slot or appointment_timestamp
      .eq('date', date)
      .not('status', 'eq', 'cancelled');

    const bookedStaffIds = new Set(
      ((bookedBookings ?? []) as BookedStaffRow[])
        .map((booking) => booking.staff_id)
        .filter((staffMemberId): staffMemberId is string => Boolean(staffMemberId))
    );
    const availableStaffIds = ((allStaff ?? []) as StaffIdRow[])
      .map((staffMember) => staffMember.id)
      .filter((id: string) => !bookedStaffIds.has(id));

    if (availableStaffIds.length === 0) {
      return { ok: false, message: 'No staff available at this time.' };
    }

    assignedStaffId = availableStaffIds[Math.floor(Math.random() * availableStaffIds.length)];
  }

  // Wallet payment handling
  if (paymentMethod === 'wallet') {
    const { data: walletData, error: walletFetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletFetchError && !isMissingColumnError(walletFetchError, 'user_id')) {
      return { ok: false, message: `Wallet check failed: ${walletFetchError.message}` };
    }

    const currentBalance = (walletData as { balance?: number } | null)?.balance ?? 0;

    if (currentBalance < totalAmount) {
      return { ok: false, message: 'Insufficient wallet balance. Please try another payment method.' };
    }

    const newBalance = currentBalance - totalAmount;

    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (walletUpdateError) {
      return { ok: false, message: `Wallet update failed: ${walletUpdateError.message}` };
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: userId,
      salon_id: salonId,
      service_id: serviceId,
      staff_id: assignedStaffId,
      appointment_timestamp: appointmentTimestamp,
      total_amount: totalAmount,
      status: 'upcoming',
      date: date,
      time_slot: slot,
      payment_method: paymentMethod,
    })
    .select('id')
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath('/booking-history');
  revalidatePath('/profile/booking-history');
  revalidatePath('/booking');
  revalidatePath('/bookings');
  revalidatePath(`/bookings/${data.id}`);

  return {
    ok: true,
    message: 'Booking confirmed!',
    bookingId: data.id,
  };
}
