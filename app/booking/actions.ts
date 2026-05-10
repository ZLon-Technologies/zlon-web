'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

interface BookingMutationResult {
  ok: boolean;
  message: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type StaffIdRow = { id: string };

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
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (ownedUpdate.error && !isMissingColumnError(ownedUpdate.error, 'user_id')) {
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

  const authResult = await getAuthenticatedClient();
  if ('ok' in authResult && !authResult.ok) return authResult as BookingMutationResult;
  const { supabase, userId } = authResult as { supabase: SupabaseServerClient, userId: string };

  // Fetch the booking details before cancelling
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select('payment_method, total_amount, status')
    .eq('id', safeBookingId)
    .eq('user_id', userId)
    .single();

  if (bookingError || !bookingData) {
    return {
      ok: false,
      message: 'Booking not found or unavailable.',
    };
  }

  if (bookingData.status === 'cancelled') {
    return {
      ok: false,
      message: 'Booking is already cancelled.',
    };
  }

  const result = await updateBooking(safeBookingId, { status: 'cancelled' });

  if (!result.ok) {
    return result;
  }

  // DIRECTIVE 1: Prevent double-spending and ensure atomicity
  // Refund if payment method was wallet
  if (bookingData.payment_method === 'wallet' && bookingData.total_amount) {
    // 1. Transactional check for double refund
    const { data: alreadyRefunded } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('booking_id', safeBookingId)
      .eq('type', 'refund')
      .maybeSingle();

    if (!alreadyRefunded) {
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      const currentBalance = walletData?.balance || 0;
      const refundAmount = Number(bookingData.total_amount);
      const newBalance = currentBalance + refundAmount;

      // 2. Perform refund and log transaction
      await Promise.all([
        supabase
          .from('wallets')
          .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() })
          .eq('user_id', userId),
        supabase.from('wallet_transactions').insert({
          user_id: userId,
          booking_id: safeBookingId,
          amount: refundAmount,
          type: 'refund',
          description: 'Booking cancellation refund',
        }),
      ]);
    }
  }

  revalidatePath('/booking-history');
  revalidatePath('/profile/booking-history');
  revalidatePath('/wallet');

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

  const authResult = await getAuthenticatedClient();
  if ('ok' in authResult && !authResult.ok) return authResult as BookingMutationResult;
  const { supabase, userId } = authResult as { supabase: SupabaseServerClient, userId: string };

  const { data: bookingData } = await supabase
    .from('bookings')
    .select('salon_id, staff_id, service_id, status')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .single();

  if (!bookingData || bookingData.status === 'cancelled') {
    return { ok: false, message: 'Booking not found or cannot be rescheduled.' };
  }

  const salonId = bookingData.salon_id;
  const staffId = bookingData.staff_id;
  
  const { data: servicesData } = await supabase
    .from('services')
    .select('id, duration_minutes')
    .eq('salon_id', salonId);
  const servicesMap = new Map((servicesData || []).map(s => [String(s.id), Number(s.duration_minutes) || 0]));

  const serviceIds = (bookingData.service_id || '').split(',').map((id: string) => id.trim());
  const totalDuration = serviceIds.reduce((sum: number, id: string) => sum + (servicesMap.get(id) || 0), 0) || 30;

  const dateStr = nextStartTime.toISOString().split('T')[0];
  const timeSlot = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(nextStartTime);

  const { data: bookedBookings } = await supabase
    .from('bookings')
    .select('staff_id, time_slot, service_id')
    .eq('salon_id', salonId)
    .eq('date', dateStr)
    .not('status', 'eq', 'cancelled')
    .neq('id', bookingId);

  const newStart = parseTimeToMinutes(timeSlot);
  const newEnd = newStart + totalDuration;

  const isOverlap = (b: { service_id: string | null; time_slot: string | null }) => {
    const sIds = (b.service_id || '').split(',').map((id: string) => id.trim());
    const duration = sIds.reduce((sum: number, id: string) => sum + (servicesMap.get(id) || 0), 0);
    const bStart = parseTimeToMinutes(b.time_slot || '');
    const bEnd = bStart + (duration || 30);
    return newStart < bEnd && bStart < newEnd;
  };

  const overlappingBookings = (bookedBookings || []).filter(isOverlap);
  const hasOverlap = overlappingBookings.some((b) => b.staff_id === staffId);

  if (hasOverlap) {
    return { ok: false, message: 'This slot is no longer available for your assigned professional. Please choose another time.' };
  }

  const result = await updateBooking(bookingId, {
    start_time: nextStartTime.toISOString(),
    date: dateStr,
    time_slot: timeSlot,
    appointment_timestamp: `${dateStr} ${timeSlot}`
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    message: 'Booking rescheduled.',
  };
}

function parseTimeToMinutes(timeStr: string) {
  if (!timeStr) return 0;
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let adjustedHours = hours;
  if (period === 'PM' && adjustedHours !== 12) adjustedHours += 12;
  if (period === 'AM' && adjustedHours === 12) adjustedHours = 0;
  return adjustedHours * 60 + minutes;
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
  const platformFee = Number(formData.get('platformFee') || 0);
  const totalDuration = Number(formData.get('totalDuration') || 30);
  const paymentMethod = getStringValue(formData.get('paymentMethod')) || 'pay-at-salon';

  if (!salonId || !serviceId || !date || !slot) {
    return { ok: false, message: 'Missing booking details.' };
  }

  // appointment_timestamp is used in the directive
  const appointmentTimestamp = `${date} ${slot}`;
  let assignedStaffId = staffId;

  // Re-validate slot availability with duration overlap
  const { data: allStaff } = await supabase
    .from('staff')
    .select('id')
    .eq('salon_id', salonId);

  const { data: servicesData } = await supabase
    .from('services')
    .select('id, duration_minutes')
    .eq('salon_id', salonId);
  const servicesMap = new Map((servicesData || []).map(s => [String(s.id), Number(s.duration_minutes) || 0]));

  const { data: bookedBookings } = await supabase
    .from('bookings')
    .select('staff_id, time_slot, service_id')
    .eq('salon_id', salonId)
    .eq('date', date)
    .not('status', 'eq', 'cancelled');

  const newStart = parseTimeToMinutes(slot);
  const newEnd = newStart + totalDuration;

  const isOverlap = (b: { service_id: string | null; time_slot: string | null }) => {
    const serviceIds = (b.service_id || '').split(',').map((id: string) => id.trim());
    const duration = serviceIds.reduce((sum: number, id: string) => sum + (servicesMap.get(id) || 0), 0);
    const bStart = parseTimeToMinutes(b.time_slot || '');
    const bEnd = bStart + (duration || 30);
    return newStart < bEnd && bStart < newEnd;
  };

  const overlappingBookings = (bookedBookings || []).filter(isOverlap);

  if (staffId === 'any') {
    if (!allStaff || allStaff.length === 0) {
      return { ok: false, message: 'No staff available for this salon.' };
    }

    const bookedStaffIds = new Set(
      overlappingBookings
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
  } else {
    // Specific staff chosen
    const hasOverlap = overlappingBookings.some((b) => b.staff_id === staffId);
    if (hasOverlap) {
      return { ok: false, message: 'This slot is no longer available. Please choose another time.' };
    }
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

    // DIRECTIVE 1: Log payment transaction
    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (walletUpdateError) {
      return { ok: false, message: `Wallet update failed: ${walletUpdateError.message}` };
    }

    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      amount: -totalAmount,
      type: 'payment',
      description: `Payment for booking at salon ${salonId}`,
    });
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      salon_id: salonId,
      service_id: serviceId,
      staff_id: assignedStaffId,
      appointment_timestamp: appointmentTimestamp,
      total_amount: totalAmount,
      platform_fee: platformFee,
      status: 'upcoming',
      date: date,
      time_slot: slot,
      payment_method: paymentMethod,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, message: 'This slot was just booked by someone else. Please choose another time.' };
    }
    return { ok: false, message: error.message };
  }

  // DIRECTIVE 1: Increment monthly_bookings for AI Paywall enforcement
  await supabase.rpc('increment_monthly_bookings', { user_id: userId });

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
