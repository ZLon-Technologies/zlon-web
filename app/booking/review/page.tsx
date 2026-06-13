'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ReviewBookingScreen } from '../../components/review-booking-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices, SalonProfile, SalonService } from '../../lib/booking-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
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
        // Fetch staff name if not "any"
        if (staffId !== 'any') {
          const staffDoc = await getDoc(doc(db, 'staff', staffId));
          if (staffDoc.exists()) {
            const staffData = staffDoc.data();
            currentStaffName = staffData.name || currentStaffName;
          }
        }

        // Fetch Salon Data
        const salonDoc = await getDoc(doc(db, 'salons', salonId));
        
        if (salonDoc.exists()) {
          const salonData = salonDoc.data() as SalonData;
          currentSalonName = salonData.name || currentSalonName;
          currentSalonImage = salonData.imageUrl || salonData.image_url || salonData.image || currentSalonImage;
          currentSalonLocation = salonData.address || currentSalonLocation;
          currentSalonDistance = salonData.distance || currentSalonDistance;

          // Fetch specific services
          if (selectedServiceIds.length > 0) {
            const servicesQuery = query(
              collection(db, 'services'),
              where('salon_id', '==', salonId),
              where(documentId(), 'in', selectedServiceIds)
            );
            const servicesSnap = await getDocs(servicesQuery);
            
            dbServices = servicesSnap.docs.map(doc => {
              const s = doc.data();
              return {
                id: doc.id,
                name: s.name || 'Service',
                price: Number(s.price) || 0,
                durationMinutes: Number(s.duration_minutes) || 0,
                category: s.category || 'Service',
                badge: s.badge || s.category || 'Service',
                description: s.description || '',
                featured: Boolean(s.featured)
              };
            });
          }
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
