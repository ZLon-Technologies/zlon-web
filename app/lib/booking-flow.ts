export interface SalonStaff {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
}

export interface SalonService {
  id: string;
  name: string;
  category: 'Haircut' | 'Shaving' | 'Face care';
  badge: 'Hair' | 'Shaving' | 'Skincare';
  description: string;
  durationMinutes: number;
  price: number;
  featured?: boolean;
}

export interface SalonProfile {
  id: string;
  name: string;
  image: string;
  distance: string;
  location: string;
  rating: number;
  price: number;
  services: string[];
  categories: Array<'All Services' | 'Haircut' | 'Shaving' | 'Face care'>;
  menu: SalonService[];
  staff: SalonStaff[];
}

export const salons: SalonProfile[] = [
  {
    id: 'velvet-vine',
    name: 'Velvet & Vine',
    image:
      'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop',
    distance: '1.2 km',
    location: 'Indiranagar',
    rating: 4.8,
    price: 300,
    services: ['HAIR', 'SKIN', 'BEARD'],
    categories: ['All Services', 'Haircut', 'Shaving', 'Face care'],
    staff: [
      { id: 'sarah-j', name: 'Sarah J.', initials: 'SJ', colorClass: 'bg-stone-800 text-white' },
      { id: 'david-k', name: 'David K.', initials: 'DK', colorClass: 'bg-amber-100 text-amber-950' },
      { id: 'elena-m', name: 'Elena M.', initials: 'EM', colorClass: 'bg-slate-200 text-slate-900' },
    ],
    menu: [
      {
        id: 'signature-beard-trim',
        name: 'Signature Beard Trim',
        category: 'Shaving',
        badge: 'Shaving',
        description:
          'Hot towel treatment, precision sculpting, and premium beard oil finish.',
        durationMinutes: 30,
        price: 300,
        featured: true,
      },
      {
        id: 'classic-haircut',
        name: 'Classic Haircut',
        category: 'Haircut',
        badge: 'Hair',
        description:
          'Precision cutting, wash, and signature styling tailored to your face shape.',
        durationMinutes: 45,
        price: 500,
      },
      {
        id: 'revitalizing-facial',
        name: 'Revitalizing Facial',
        category: 'Face care',
        badge: 'Skincare',
        description: 'Deep pore cleansing and hydration therapy for a refreshed look.',
        durationMinutes: 60,
        price: 1200,
      },
      {
        id: 'executive-shave',
        name: 'Executive Shave',
        category: 'Shaving',
        badge: 'Shaving',
        description: 'Straight razor shave with soothing aftercare and cooling towel.',
        durationMinutes: 35,
        price: 450,
      },
      {
        id: 'texture-restyle',
        name: 'Texture Restyle',
        category: 'Haircut',
        badge: 'Hair',
        description: 'Restyle cut with texture work, detailing, and finish product.',
        durationMinutes: 50,
        price: 650,
      },
    ],
  },
  {
    id: 'the-modern-man',
    name: 'The Modern Man',
    image:
      'https://images.unsplash.com/photo-1633681926022-ec8b1bc32b99?w=1200&h=900&fit=crop',
    distance: '2.4 km',
    location: 'Domlur',
    rating: 4.6,
    price: 450,
    services: ['HAIR', 'BEARD', 'SKINCARE'],
    categories: ['All Services', 'Haircut', 'Shaving', 'Face care'],
    staff: [
      { id: 'aarav-r', name: 'Aarav R.', initials: 'AR', colorClass: 'bg-zinc-900 text-white' },
      { id: 'maya-d', name: 'Maya D.', initials: 'MD', colorClass: 'bg-rose-100 text-rose-950' },
      { id: 'liam-p', name: 'Liam P.', initials: 'LP', colorClass: 'bg-sky-100 text-sky-950' },
    ],
    menu: [
      {
        id: 'fade-and-finish',
        name: 'Fade & Finish',
        category: 'Haircut',
        badge: 'Hair',
        description: 'Skin fade with scissor blending and matte finish styling.',
        durationMinutes: 50,
        price: 650,
        featured: true,
      },
      {
        id: 'clean-beard-reshape',
        name: 'Clean Beard Reshape',
        category: 'Shaving',
        badge: 'Shaving',
        description: 'Beard shaping, line-up work, and conditioning treatment.',
        durationMinutes: 30,
        price: 350,
      },
      {
        id: 'brightening-cleanup',
        name: 'Brightening Cleanup',
        category: 'Face care',
        badge: 'Skincare',
        description: 'Express cleanup with brightening mask and hydration boost.',
        durationMinutes: 45,
        price: 900,
      },
      {
        id: 'signature-cut',
        name: 'Signature Cut',
        category: 'Haircut',
        badge: 'Hair',
        description: 'Classic shape-up, wash, and premium blow-dry finish.',
        durationMinutes: 40,
        price: 450,
      },
    ],
  },
] as const satisfies SalonProfile[];

export function getSalonById(id: string) {
  return salons.find((salon) => salon.id === id) ?? salons[0];
}

export function getServicesForSalon(salon: SalonProfile, serviceIds: string[]) {
  const requestedServices = salon.menu.filter((service) => serviceIds.includes(service.id));

  if (requestedServices.length > 0) {
    return requestedServices;
  }

  return salon.menu.filter((service) => service.featured).slice(0, 1);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDuration(minutes: number) {
  return `${minutes} min`;
}

export function formatDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateValue));
}

export function formatLongDate(dateValue: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateValue));
}

export function generateBookingId(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return `ZL-${Math.abs(hash).toString(36).toUpperCase().slice(0, 6).padEnd(6, '0')}`;
}
