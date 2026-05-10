'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ReviewBookingScreen } from '../../components/review-booking-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices, SalonProfile, SalonService } from '../../lib/booking-flow';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SalonData } from '@/lib/types/booking';

export default function ReviewBookingPage() {
  const searchParams = useSearchParams();
  const salonId = searchParams.get('salon') ?? '';
  const servicesParam = searchParams.get('services') ?? '';
  const cartParam = searchParams.get('cart') ?? '';
  const staffId = searchParams.get('staff') ?? 'any';
  const dateParam = searchParams.get('date') ?? '';
  const slotParam = searchParams.get('slot') ?? '';

  const [salon, setSalon] = useState<SalonProfile | null>(null);
  const [selectedServices, setSelectedServices] = useState<SalonService[]>([]);
  const [staffName, setStaffName] = useState(staffId === 'any' ? 'Any Staff' : 'Professional Staff');
  const [isLoading, setIsLoading] = useState(true);

  const selectedServiceIds = servicesParam
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      let currentSalonName = 'Salon';
      let currentSalonImage = 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop';
      let currentSalonLocation = 'Location unavailable';
      let currentSalonDistance = '';
      let dbServices: SalonService[] = [];
      let currentStaffName = staffId === 'any' ? 'Any Staff' : 'Professional Staff';

      try {
        const supabase = createSupabaseBrowserClient();
        
        // Fetch staff name if not "any"
        if (staffId !== 'any') {
          const { data: staffData } = await supabase
            .from('staff')
            .select('name')
            .eq('id', staffId)
            .single();
          
          if (staffData) {
            currentStaffName = staffData.name;
          }
        }

        // Strict JOIN logic: Fetch services and their parent salon in a single inner join query.
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
              imageUrl,
              image_url,
              image,
              distance,
              lat,
              lng
            )
          `)
          .eq('salon_id', salonId)
          .in('id', selectedServiceIds);

        if (!error && joinedData && joinedData.length > 0) {
          const firstRecord = joinedData[0];
          // @ts-ignore - handling complex join result
          const salonData = Array.isArray(firstRecord.salon) ? firstRecord.salon[0] : firstRecord.salon;
          
          currentSalonName = salonData.name || currentSalonName;
          currentSalonImage = salonData.imageUrl || salonData.image_url || salonData.image || currentSalonImage;
          currentSalonLocation = salonData.address || currentSalonLocation;
          currentSalonDistance = salonData.distance || currentSalonDistance;

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
          if (fallbackSalon) {
            currentSalonName = fallbackSalon.name;
            currentSalonImage = fallbackSalon.image;
            currentSalonLocation = fallbackSalon.address;
            currentSalonDistance = fallbackSalon.distance;
          }
        }
      } catch (e) {
        console.error('Error fetching review data:', e);
        const fallbackSalon = getSalonById(salonId);
        if (fallbackSalon) {
          currentSalonName = fallbackSalon.name;
          currentSalonImage = fallbackSalon.image;
          currentSalonLocation = fallbackSalon.address;
          currentSalonDistance = fallbackSalon.distance;
        }
      }

      const salonProfile: SalonProfile = {
        id: salonId,
        name: currentSalonName,
        image: currentSalonImage,
        distance: currentSalonDistance,
        address: currentSalonLocation,
        rating: 4.8,
        lat: 0,
        lng: 0,
        categories: ['All Services'],
        menu: [],
        staff: [],
      };

      const cartServices = parseSelectedServices(cartParam);
      const fallback = getSalonById(salonId);
      const finalServices =
        dbServices.length > 0
          ? dbServices
          : cartServices.length > 0
            ? cartServices
            : fallback
              ? getServicesForSalon(fallback, selectedServiceIds)
              : [];

      setSalon(salonProfile);
      setSelectedServices(finalServices);
      setStaffName(currentStaffName);
      setIsLoading(false);
    }

    if (salonId) {
      fetchData();
    }
  }, [salonId, servicesParam, cartParam, staffId]);

  if (isLoading || !salon) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4efe8]">Loading...</div>;
  }

  return (
    <ReviewBookingScreen
      salon={salon}
      selectedServices={selectedServices}
      selectedDate={dateParam}
      selectedSlot={slotParam}
      staffId={staffId}
      staffName={staffName}
    />
  );
}
