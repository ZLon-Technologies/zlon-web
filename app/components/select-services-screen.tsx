'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, MapPin, Plus, Scissors, Sparkles, Star } from 'lucide-react';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SalonService } from '../lib/booking-flow';
import { formatCurrency, serializeSelectedServices } from '../lib/booking-flow';
import { CUSTOMER_SAFE_SALON_SELECT } from '../lib/public-salon-fields';
import { useBooking } from '../lib/booking-state';

interface SelectServicesScreenProps {
  salonId: string;
}

interface SalonRecord {
  id: string | number;
  name: string | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  distance?: string | null;
  location?: string | null;
  rating?: number | string | null;
  services?: string[] | null;
}

interface ServiceRecord {
  id: string | number;
  salon_id: string | number;
  name: string | null;
  price: number | string | null;
  duration?: number | string | null;
  duration_minutes?: number | string | null;
  category?: string | null;
  badge?: string | null;
  description?: string | null;
  featured?: boolean | null;
}

const FALLBACK_SALON_IMAGE =
  'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop';

function getNumericValue(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function getServiceCategory(service: ServiceRecord) {
  return service.category?.trim() || 'All Services';
}

function getServiceBadge(service: ServiceRecord) {
  return service.badge?.trim() || service.category?.trim() || 'Service';
}

function getServiceDescription(service: ServiceRecord) {
  return service.description?.trim() || 'Professional salon service tailored to your appointment.';
}

function mapServiceRecordToBookingService(service: ServiceRecord): SalonService {
  const category = getServiceCategory(service);

  return {
    id: String(service.id),
    name: service.name?.trim() || 'Salon Service',
    category,
    badge: getServiceBadge(service),
    description: getServiceDescription(service),
    durationMinutes: getNumericValue(service.duration_minutes) ?? getNumericValue(service.duration) ?? 0,
    price: getNumericValue(service.price) ?? 0,
    featured: Boolean(service.featured),
  };
}

export function SelectServicesScreen({ salonId }: SelectServicesScreenProps) {
  const router = useRouter();
  const { state: bookingState, updateSalon, addToCart, removeFromCart, subtotal } = useBooking();
  const [salon, setSalon] = useState<SalonRecord | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let isMounted = true;

    async function fetchSalonDetails() {
      setIsLoading(true);
      setError(null);

      try {
        const [{ data: salonData, error: salonError }, { data: servicesData, error: servicesError }] =
          await Promise.all([
            supabase.from('salons').select(CUSTOMER_SAFE_SALON_SELECT).eq('id', salonId).single(),
            supabase.from('services').select('*').eq('salon_id', salonId),
          ]);

        if (salonError) throw salonError;
        if (servicesError) throw servicesError;

        if (!isMounted) return;

        const nextServices = (servicesData ?? []) as ServiceRecord[];
        const currentSalon = (salonData ?? null) as SalonRecord | null;

        setSalon(currentSalon);
        setServices(nextServices);
        
        // Sync salon data to global store
        if (currentSalon) {
          updateSalon({
            id: String(currentSalon.id),
            name: currentSalon.name,
            location: currentSalon.location || (currentSalon as any).address,
            image: currentSalon.image || currentSalon.image_url || currentSalon.imageUrl,
            distance: currentSalon.distance,
          });
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Unable to load salon details right now.'
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchSalonDetails();
    return () => { isMounted = false; };
  }, [salonId, updateSalon]);

  const categories = [
    'All Services',
    ...Array.from(
      new Set(
        services
          .map((service) => getServiceCategory(service))
          .filter((category) => category !== 'All Services')
      )
    ),
  ];

  const visibleServices = services.filter(
    (service) =>
      selectedCategory === 'All Services' || getServiceCategory(service) === selectedCategory
  );

  const salonName = salon?.name ?? 'Salon';
  const salonImage = salon?.image || salon?.image_url || salon?.imageUrl || FALLBACK_SALON_IMAGE;
  const locationLabel =
    [
      salon?.distance ? `${salon.distance} away` : null,
      salon?.location ?? null,
    ]
      .filter(Boolean)
      .join(' • ') || 'Location unavailable';
  
  const serviceTags =
    Array.isArray(salon?.services) && salon.services.length > 0
      ? salon.services
      : categories
          .filter((category) => category !== 'All Services')
          .map((category) => category.toUpperCase());

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/home');
  }

  function toggleService(serviceRecord: ServiceRecord) {
    const serviceId = String(serviceRecord.id);
    const isSelected = bookingState.cart.some(s => s.id === serviceId);
    
    if (isSelected) {
      removeFromCart(serviceId);
    } else {
      addToCart(mapServiceRecordToBookingService(serviceRecord));
    }
  }

  function handleContinue() {
    if (bookingState.cart.length === 0) return;

    const query = new URLSearchParams({
      salon: String(salon?.id ?? salonId),
      services: bookingState.cart.map((s) => s.id).join(','),
      cart: serializeSelectedServices(bookingState.cart),
      totalPrice: String(subtotal),
    });

    router.push(`/booking/choose-slot?${query.toString()}`);
  }

  return (
    <div className="w-full relative pb-24">
      <header className="border-b border-neutral-100 bg-white">
        <div className="flex items-center gap-3 px-5 py-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-950">SERVICES</h1>
        </div>
      </header>

      <main className="px-5 pt-3 pb-32">
        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="relative h-56 overflow-hidden">
            <Image
              src={salonImage}
              alt={salonName}
              fill
              unoptimized
              sizes="448px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              Luxury Experience
            </div>
            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-950 shadow-sm">
              <Star size={14} className="fill-neutral-950 text-neutral-950" />
              {salon?.rating ?? 'New'}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                  {salonName}
                </h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                  <MapPin size={14} />
                  {locationLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {serviceTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] text-neutral-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="-mx-4 mt-6 overflow-x-auto px-4 pb-2">
          <div className="flex min-w-max gap-3">
            {categories.map((category) => {
              const active = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
                      : 'bg-white text-neutral-500'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-1 w-7 rounded-full bg-neutral-400" />
            <h3 className="text-xl font-semibold tracking-tight text-neutral-950">
              Popular Services
            </h3>
          </div>

          <div className="space-y-4">
            {isLoading && <p className="text-sm text-neutral-500">Loading services...</p>}
            {!isLoading && error && <p className="text-sm text-neutral-500">{error}</p>}
            {!isLoading && !error && visibleServices.length === 0 && (
              <p className="text-sm text-neutral-500">No services available right now.</p>
            )}

            {visibleServices.map((service) => {
              const selected = bookingState.cart.some(s => s.id === String(service.id));
              const serviceCategory = getServiceCategory(service);
              const usesScissors =
                serviceCategory.toLowerCase().includes('hair') ||
                serviceCategory.toLowerCase().includes('shav') ||
                serviceCategory.toLowerCase().includes('beard');
              const numericPrice = getNumericValue(service.price);
              const numericDuration = getNumericValue(service.duration_minutes) ?? getNumericValue(service.duration);

              return (
                <article
                  key={service.id}
                  className={`rounded-[2rem] border p-4 transition-colors ${
                    selected
                      ? 'border-neutral-400 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]'
                      : 'border-transparent bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] text-neutral-500">
                      {selected ? 'Selected' : getServiceBadge(service)}
                    </span>
                    {usesScissors ? (
                      <Scissors size={18} className="text-neutral-500" />
                    ) : (
                      <Sparkles size={18} className="text-neutral-500" />
                    )}
                  </div>

                  <h4 className="mt-4 text-xl font-semibold leading-tight tracking-tight text-neutral-950">
                    {service.name}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {getServiceDescription(service)}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-neutral-600">
                    <span className="text-xl font-semibold text-neutral-950">
                      {numericPrice !== null
                        ? formatCurrency(numericPrice)
                        : service.price || 'Price on request'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <Clock3 size={14} />
                      {numericDuration !== null
                        ? `${numericDuration} min`
                        : service.duration || 'Duration unavailable'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                      selected
                        ? 'bg-neutral-500 text-white'
                        : 'bg-black text-white hover:bg-neutral-900'
                    }`}
                  >
                    {selected ? <Check size={18} /> : <Plus size={18} />}
                    {selected ? 'Added' : 'Add Service'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 w-full border-t border-neutral-200 bg-white px-5 py-3 shadow-[0_-16px_30px_rgba(15,23,42,0.08)] [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-neutral-500">
              {bookingState.cart.length} Service{bookingState.cart.length === 1 ? '' : 's'} Selected
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-950">
              Subtotal: {formatCurrency(subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={bookingState.cart.length === 0}
            className="inline-flex items-center justify-center rounded-[1.5rem] bg-black px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
