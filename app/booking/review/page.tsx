import type { Metadata } from 'next';
import { ReviewBookingScreen } from '../../components/review-booking-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices, SalonProfile } from '../../lib/booking-flow';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { CUSTOMER_SAFE_SALON_SELECT } from '../../lib/public-salon-fields';

export const metadata: Metadata = {
  title: 'Review Booking',
};

interface ReviewBookingPageProps {
  searchParams: Promise<{
    salon?: string;
    services?: string;
    cart?: string;
    totalPrice?: string;
    totalDuration?: string;
    date?: string;
    slot?: string;
  }>;
}

export default async function ReviewBookingPage({ searchParams }: ReviewBookingPageProps) {
  const params = await searchParams;
  const salonId = params.salon ?? 'velvet-vine';
  
  let salonName = 'ZLon Salon';
  let salonImage = 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop';
  let salonLocation = 'Location unavailable';
  let salonDistance = '';

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('salons')
      .select(CUSTOMER_SAFE_SALON_SELECT)
      .eq('id', salonId)
      .maybeSingle();

    if (data) {
      const salonData = data as any;
      salonName = data.name || salonName;
      salonImage = salonData.image || salonData.image_url || data.imageUrl || salonImage;
      salonLocation = salonData.location || data.address || salonLocation;
      salonDistance = salonData.distance || salonDistance;
    } else {
      const fallbackSalon = getSalonById(salonId);
      salonName = fallbackSalon.name;
      salonImage = fallbackSalon.image;
      salonLocation = fallbackSalon.location;
      salonDistance = fallbackSalon.distance;
    }
  } catch (error) {
    const fallbackSalon = getSalonById(salonId);
    salonName = fallbackSalon.name;
    salonImage = fallbackSalon.image;
    salonLocation = fallbackSalon.location;
    salonDistance = fallbackSalon.distance;
  }

  const salon: SalonProfile = {
    id: salonId,
    name: salonName,
    image: salonImage,
    distance: salonDistance,
    location: salonLocation,
    rating: 4.8,
    price: 0,
    services: [],
    categories: ['All Services'],
    menu: [],
    staff: [],
  };

  const selectedServiceIds = (params.services ?? '')
    .split(',')
    .map((serviceId) => serviceId.trim())
    .filter(Boolean);
  const cartServices = parseSelectedServices(params.cart);
  const selectedServices =
    cartServices.length > 0 ? cartServices : getServicesForSalon(getSalonById(salonId), selectedServiceIds);

  return (
    <ReviewBookingScreen
      salon={salon}
      selectedServices={selectedServices}
      selectedDate={params.date ?? '2026-10-23'}
      selectedSlot={params.slot ?? '10:00 AM'}
    />
  );
}
