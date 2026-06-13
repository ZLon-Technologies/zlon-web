'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChooseSlotScreen } from '../../components/choose-slot-screen';
import { getSalonById, getServicesForSalon, parseSelectedServices, SalonProfile, SalonService } from '../../lib/booking-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { FALLBACK_SALON_IMAGE } from '../../lib/media';
import type { SalonData } from '@/lib/types/booking';

export default function ChooseSlotPage() {
  const searchParams = useSearchParams();
  const salonId = searchParams.get('salon') ?? '';
  const servicesParam = searchParams.get('services') ?? '';
  const cartParam = searchParams.get('cart') ?? '';
  
  const selectedServiceIds = servicesParam
    .split(',')
    .map((serviceId) => serviceId.trim())
    .filter(Boolean);

  const [salon, setSalon] = useState<SalonProfile | null>(null);
  const [selectedServices, setSelectedServices] = useState<SalonService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      let salonName = 'Salon';
      let salonImage = FALLBACK_SALON_IMAGE;
      let salonLocation = 'Location unavailable';
      let salonDistance = '';
      let dbServices: SalonService[] = [];

      try {
        // Fetch Salon Data
        const salonDoc = await getDoc(doc(db, 'salons', salonId));
        
        if (salonDoc.exists()) {
          const salonData = salonDoc.data() as SalonData;
          salonName = salonData.name || salonName;
          salonImage = salonData.imageUrl || salonData.image_url || salonData.image || salonImage;
          salonLocation = salonData.location || salonData.address || salonLocation;
          salonDistance = salonData.distance || salonDistance;

          // Fetch specific services if we have IDs
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
          salonName = fallbackSalon?.name ?? salonName;
          salonImage = fallbackSalon?.image ?? salonImage;
          salonLocation = fallbackSalon?.address ?? salonLocation;
          salonDistance = fallbackSalon?.distance ?? salonDistance;
        }
      } catch (e) {
        console.error('Error fetching slot data:', e);
        const fallbackSalon = getSalonById(salonId);
        salonName = fallbackSalon?.name ?? salonName;
        salonImage = fallbackSalon?.image ?? salonImage;
        salonLocation = fallbackSalon?.address ?? salonLocation;
        salonDistance = fallbackSalon?.distance ?? salonDistance;
      }

      const salonProfile: SalonProfile = {
        id: salonId,
        name: salonName,
        image: salonImage,
        distance: salonDistance,
        address: salonLocation,
        rating: 4.8,
        lat: 0,
        lng: 0,
        categories: ['All Services'],
        menu: [],
        staff: [],
      };

      const cartServices = parseSelectedServices(cartParam);
      const finalServices =
        dbServices.length > 0 
          ? dbServices 
          : cartServices.length > 0 
            ? cartServices 
            : getServicesForSalon(salonProfile, selectedServiceIds);

      setSalon(salonProfile);
      setSelectedServices(finalServices);
      setIsLoading(false);
    }

    if (salonId) {
      fetchData();
    }
  }, [salonId, servicesParam, cartParam]);

  if (isLoading || !salon) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4efe8]">Loading...</div>;
  }

  return <ChooseSlotScreen salon={salon} selectedServices={selectedServices} />;
}
