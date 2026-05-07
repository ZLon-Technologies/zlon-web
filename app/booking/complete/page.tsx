import type { Metadata } from 'next';
import { BookingCompleteScreen } from '../../components/booking-complete-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices, SalonProfile } from '../../lib/booking-flow';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { CUSTOMER_SAFE_SALON_SELECT } from '../../lib/public-salon-fields';

export const metadata: Metadata = {
  title: 'Booking Complete',
};

interface BookingCompletePageProps {
  searchParams: Promise<{
    salon?: string;
    services?: string;
    cart?: string;
    totalPrice?: string;
    totalDuration?: string;
    date?: string;
    slot?: string;
    total?: string;
    payment?: 'wallet' | 'pay-at-salon';
    staff?: string;
  }>;
}

export default async function BookingCompletePage({
  searchParams,
}: BookingCompletePageProps) {
  const params = await searchParams;
  const salonId = params.salon ?? '';
  const staffId = params.staff ?? 'any';
  
  let salonName = 'Salon';
  let salonImage = 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop';
  let salonLocation = 'Location unavailable';
  let salonDistance = '';
  let staffName = staffId === 'any' ? 'Any Staff' : 'Professional Staff';

  try {
    const supabase = await createSupabaseServerClient();

    // Fetch staff name if not "any"
    if (staffId !== 'any') {
      const { data: staffData } = await supabase
        .from('staff')
        .select('name')
        .eq('id', staffId)
        .single();
      
      if (staffData) {
        staffName = staffData.name;
      }
    }

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
  const total =
    Number(params.total) ||
    selectedServices.reduce((sum, service) => sum + service.price, 0);

  return (
    <BookingCompleteScreen
      salon={salon}
      selectedServices={selectedServices}
      selectedDate={params.date ?? ''}
      selectedSlot={params.slot ?? ''}
      total={total}
      paymentMethod={params.payment ?? 'wallet'}
      staffName={staffName}
    />
  );
}
