import type { Metadata } from 'next';
import { ChooseSlotScreen } from '../../components/choose-slot-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices, SalonProfile, SalonService } from '../../lib/booking-flow';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Choose Slot',
};

interface ChooseSlotPageProps {
  searchParams: Promise<{
    salon?: string;
    services?: string;
    cart?: string;
    totalPrice?: string;
    totalDuration?: string;
  }>;
}

export default async function ChooseSlotPage({ searchParams }: ChooseSlotPageProps) {
  const params = await searchParams;
  const salonId = params.salon ?? '';
  const selectedServiceIds = (params.services ?? '')
    .split(',')
    .map((serviceId) => serviceId.trim())
    .filter(Boolean);

  let salonName = 'Salon';
  let salonImage = 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop';
  let salonLocation = 'Location unavailable';
  let salonDistance = '';
  let dbServices: SalonService[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    
    // Enforce strict JOIN logic to verify salon-service link and pull correct duration_minutes
    const { data: joinedData, error } = await supabase
      .from('services')
      .select(`
        id,
        name,
        price,
        duration_minutes,
        category,
        badge,
        description,
        featured,
        salon:salons!inner (
          id,
          name,
          address,
          location,
          imageUrl,
          image_url,
          image,
          distance
        )
      `)
      .eq('salon_id', salonId)
      .in('id', selectedServiceIds);

    if (!error && joinedData && joinedData.length > 0) {
      const firstRecord = joinedData[0];
      const salonData = firstRecord.salon as any;
      
      salonName = salonData.name || salonName;
      salonImage = salonData.imageUrl || salonData.image_url || salonData.image || salonImage;
      salonLocation = salonData.location || salonData.address || salonLocation;
      salonDistance = salonData.distance || salonDistance;

      dbServices = joinedData.map(s => ({
        id: String(s.id),
        name: s.name || 'Service',
        price: Number(s.price) || 0,
        durationMinutes: Number(s.duration_minutes) || 0,
        category: s.category || 'Service',
        badge: s.badge || s.category || 'Service',
        description: s.description || '',
        featured: Boolean(s.featured)
      }));
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

  const cartServices = parseSelectedServices(params.cart);
  const selectedServices =
    dbServices.length > 0 
      ? dbServices 
      : cartServices.length > 0 
        ? cartServices 
        : getServicesForSalon(getSalonById(salonId), selectedServiceIds);

  return <ChooseSlotScreen salon={salon} selectedServices={selectedServices} />;
}
