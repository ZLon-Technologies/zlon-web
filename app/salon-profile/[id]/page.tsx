import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { salons as localSalons } from '../../lib/booking-flow';

export const metadata: Metadata = {
  title: 'Salon Details',
};

interface SalonProfilePageProps {
  params: Promise<{ id: string }>;
}

interface SalonRow {
  id: string | number;
  name?: string | null;
  image?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  location?: string | null;
  services?: string[] | string | null;
  amenities?: string[] | string | null;
  gallery?: string[] | string | null;
  photos?: string[] | string | null;
  about?: string | null;
  description?: string | null;
}

const FALLBACK_SALON_IMAGE =
  'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop';

const DEFAULT_GALLERY = [
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=900&fit=crop',
  'https://images.unsplash.com/photo-1512690459411-b0fdacec10fd?w=1200&h=900&fit=crop',
];

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    );
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function dedupe(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));
}

function getSafeSalonRow(rawSalon: Record<string, unknown>): SalonRow | null {
  const id = rawSalon.id;

  if (typeof id !== 'string' && typeof id !== 'number') {
    return null;
  }

  return {
    id,
    name: getStringValue(rawSalon.name),
    image: getStringValue(rawSalon.image),
    image_url: getStringValue(rawSalon.image_url),
    imageUrl: getStringValue(rawSalon.imageUrl),
    location: getStringValue(rawSalon.location),
    services: Array.isArray(rawSalon.services) || typeof rawSalon.services === 'string'
      ? (rawSalon.services as string[] | string)
      : null,
    amenities: Array.isArray(rawSalon.amenities) || typeof rawSalon.amenities === 'string'
      ? (rawSalon.amenities as string[] | string)
      : null,
    gallery: Array.isArray(rawSalon.gallery) || typeof rawSalon.gallery === 'string'
      ? (rawSalon.gallery as string[] | string)
      : null,
    photos: Array.isArray(rawSalon.photos) || typeof rawSalon.photos === 'string'
      ? (rawSalon.photos as string[] | string)
      : null,
    about: getStringValue(rawSalon.about),
    description: getStringValue(rawSalon.description),
  };
}

export default async function SalonProfilePage({ params }: SalonProfilePageProps) {
  const { id } = await params;
  const localSalon = localSalons.find((salon) => salon.id === id) ?? null;
  let remoteSalon: SalonRow | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from('salons').select('*').eq('id', id).maybeSingle();
    remoteSalon =
      data && typeof data === 'object' && !Array.isArray(data)
        ? getSafeSalonRow(data as Record<string, unknown>)
        : null;
  } catch (error) {
    console.error('Unable to load salon profile details:', error);
  }

  const salonName = remoteSalon?.name?.trim() || localSalon?.name || 'ZLon Salon';
  const primaryImage =
    remoteSalon?.image ||
    remoteSalon?.image_url ||
    remoteSalon?.imageUrl ||
    localSalon?.image ||
    FALLBACK_SALON_IMAGE;
  const galleryImages = dedupe([
    primaryImage,
    ...toStringArray(remoteSalon?.photos),
    ...toStringArray(remoteSalon?.gallery),
    localSalon?.image,
    ...DEFAULT_GALLERY,
  ]);
  const locationText =
    remoteSalon?.location?.trim() || localSalon?.location || 'Location unavailable';
  const amenities = dedupe([
    ...toStringArray(remoteSalon?.amenities),
    ...toStringArray(remoteSalon?.services),
    ...(localSalon?.services ?? []),
    'Premium Styling',
    'Clean Interiors',
    'Expert Consultation',
  ]).slice(0, 6);
  const aboutText =
    remoteSalon?.about?.trim() ||
    remoteSalon?.description?.trim() ||
    localSalon?.menu[0]?.description ||
    'A modern grooming destination with polished service, sharp detailing, and a refined in-salon experience.';

  return (
    <div className="w-full min-h-screen relative bg-white pb-24">
      <Link
        href="/home"
        aria-label="Go back"
        className="fixed left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
      >
        <ArrowLeft size={18} />
      </Link>

      <section className="overflow-x-auto snap-x snap-mandatory">
        <div className="flex">
          {galleryImages.map((photo, index) => (
            <div key={`${photo}-${index}`} className="relative h-80 w-full shrink-0 snap-center bg-neutral-200">
              <Image
                src={photo}
                alt={`${salonName} photo ${index + 1}`}
                fill
                unoptimized
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
            </div>
          ))}
        </div>
      </section>

      <section className="p-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">{salonName}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin size={16} className="shrink-0" />
          <span>{locationText}</span>
        </p>

        <div className="mt-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Features &amp; Amenities
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-neutral-600"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
            About
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">{aboutText}</p>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 w-full border-t border-neutral-200 bg-white p-4 [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)]">
        <Link
          href={`/salon/${id}`}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-900"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
