'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookingCompleteScreen } from '../../components/booking-complete-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices, SalonProfile, SalonService } from '../../lib/booking-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FALLBACK_SALON_IMAGE } from '../../lib/media';
import type { SalonData } from '@/lib/types/booking';

export default function BookingCompletePage() {
  const searchParams = useSearchParams();
  const salonId = searchParams.get('salon') ?? '';
  const staffId = searchParams.get('staff') ?? 'any';
  const bookingId = searchParams.get('bookingId') ?? '';
  const dateParam = searchParams.get('date') ?? '';
  const slotParam = searchParams.get('slot') ?? '';
  const totalParam = searchParams.get('total') ?? '';
  const paymentParam = searchParams.get('payment') as 'wallet' | 'pay-at-salon' | null;
  const servicesParam = searchParams.get('services') ?? '';
  const cartParam = searchParams.get('cart') ?? '';

  const [salon, setSalon] = useState<SalonProfile | null>(null);
  const [selectedServices, setSelectedServices] = useState<SalonService[]>([]);
  const [staffName, setStaffName] = useState(staffId === 'any' ? 'Any Staff' : 'Professional Staff');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      let currentSalonName = 'Salon';
      let currentSalonImage = FALLBACK_SALON_IMAGE;
      let currentSalonLocation = 'Location unavailable';
      let currentSalonDistance = '';
      let currentStaffName = staffId === 'any' ? 'Any Staff' : 'Professional Staff';

      try {
        // Fetch staff name if not "any"
        if (staffId !== 'any') {
          const staffDoc = await getDoc(doc(db, 'staff', staffId));
          if (staffDoc.exists()) {
            const staffData = staffDoc.data();
            currentStaffName = staffData.name || currentStaffName;
          }
        }

        const salonDoc = await getDoc(doc(db, 'salons', salonId));

        if (salonDoc.exists()) {
          const data = salonDoc.data();
          const salonData = data as SalonData;
          currentSalonName = data.name || currentSalonName;
          currentSalonImage = salonData.image || salonData.image_url || data.imageUrl || currentSalonImage;
          currentSalonLocation = data.address || currentSalonLocation;
          currentSalonDistance = salonData.distance || currentSalonDistance;
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
        console.error('Error fetching complete data:', e);
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

      const selectedServiceIds = servicesParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const cartServices = parseSelectedServices(cartParam);
      const fallback = getSalonById(salonId);
      const finalServices =
        cartServices.length > 0
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
  }, [salonId, staffId, servicesParam, cartParam]);

  if (isLoading || !salon) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4efe8]">Loading...</div>;
  }

  const total =
    Number(totalParam) ||
    selectedServices.reduce((sum, service) => sum + service.price, 0);

  return (
    <BookingCompleteScreen
      salon={salon}
      selectedServices={selectedServices}
      selectedDate={dateParam}
      selectedSlot={slotParam}
      total={total}
      paymentMethod={paymentParam ?? 'wallet'}
      staffName={staffName}
      bookingId={bookingId}
    />
  );
}
