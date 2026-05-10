/**
 * Server Actions are not supported in static export mode.
 * These are stubs for build compatibility.
 * Refactor to client-side Supabase logic for Capacitor.
 */

interface BookingMutationResult {
  ok: boolean;
  message: string;
}

export async function rechargeWallet(amount: number): Promise<BookingMutationResult> {
  console.warn('rechargeWallet called in static mode. Refactor to client-side Supabase.');
  return { ok: false, message: 'Action not available in static mode.' };
}

export async function cancelBooking(bookingId: string): Promise<BookingMutationResult> {
  return { ok: false, message: 'Action not available in static mode.' };
}

export async function rescheduleBooking(formData: FormData): Promise<BookingMutationResult> {
  return { ok: false, message: 'Action not available in static mode.' };
}

export async function createBooking(formData: FormData): Promise<BookingMutationResult & { bookingId?: string }> {
  return { ok: false, message: 'Action not available in static mode.' };
}
