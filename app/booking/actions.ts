/**
 * Server Actions are not supported in static export mode.
 * These are stubs for build compatibility.
 */

interface BookingMutationResult {
  ok: boolean;
  message: string;
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
