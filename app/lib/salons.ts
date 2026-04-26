export interface SalonService {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
}

export interface SalonProfile {
  id: string;
  name: string;
  image: string;
  heroImages: string[];
  distance: string;
  location: string;
  rating: number;
  price: number;
  tagline: string;
  services: string[];
  categories: string[];
  menu: SalonService[];
}

export const salons: SalonProfile[] = [
  {
    id: 'velvet-vine',
    name: 'Velvet & Vine',
    image: 'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=600&h=400&fit=crop',
    heroImages: [
      'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=900&h=700&fit=crop',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&h=700&fit=crop',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&h=700&fit=crop',
    ],
    distance: '1.2 km',
    location: 'Indiranagar',
    rating: 4.8,
    price: 300,
    tagline: 'Quiet luxury grooming with polished finishing touches.',
    services: ['HAIR', 'COLOR', 'SPA'],
    categories: ['Haircut', 'Color', 'Spa'],
    menu: [
      {
        id: 'precision-haircut',
        name: 'Precision Haircut',
        category: 'Haircut',
        duration: '45 min',
        price: 600,
      },
      {
        id: 'fringe-refresh',
        name: 'Fringe Refresh',
        category: 'Haircut',
        duration: '30 min',
        price: 300,
      },
      {
        id: 'root-touch-up',
        name: 'Root Touch Up',
        category: 'Color',
        duration: '60 min',
        price: 1200,
      },
      {
        id: 'gloss-tone',
        name: 'Gloss & Tone',
        category: 'Color',
        duration: '50 min',
        price: 950,
      },
      {
        id: 'scalp-reset',
        name: 'Scalp Reset Ritual',
        category: 'Spa',
        duration: '30 min',
        price: 500,
      },
      {
        id: 'head-neck-massage',
        name: 'Head & Neck Massage',
        category: 'Spa',
        duration: '40 min',
        price: 700,
      },
    ],
  },
  {
    id: 'the-modern-man',
    name: 'The Modern Man',
    image: 'https://images.unsplash.com/photo-1633681926022-ec8b1bc32b99?w=600&h=400&fit=crop',
    heroImages: [
      'https://images.unsplash.com/photo-1633681926022-ec8b1bc32b99?w=900&h=700&fit=crop',
      'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=900&h=700&fit=crop',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=900&h=700&fit=crop',
    ],
    distance: '2.4 km',
    location: 'Domlur',
    rating: 4.6,
    price: 450,
    tagline: 'Sharp cuts, thoughtful color, and low-key recovery treatments.',
    services: ['HAIR', 'BEARD', 'SPA'],
    categories: ['Haircut', 'Color', 'Spa'],
    menu: [
      {
        id: 'classic-cut',
        name: 'Classic Cut',
        category: 'Haircut',
        duration: '40 min',
        price: 450,
      },
      {
        id: 'fade-finish',
        name: 'Fade & Finish',
        category: 'Haircut',
        duration: '50 min',
        price: 650,
      },
      {
        id: 'beard-blend-color',
        name: 'Beard Blend Color',
        category: 'Color',
        duration: '35 min',
        price: 700,
      },
      {
        id: 'global-tone',
        name: 'Global Tone Refresh',
        category: 'Color',
        duration: '75 min',
        price: 1400,
      },
      {
        id: 'express-detox',
        name: 'Express Detox',
        category: 'Spa',
        duration: '25 min',
        price: 450,
      },
      {
        id: 'steam-face-cleanup',
        name: 'Steam Face Cleanup',
        category: 'Spa',
        duration: '35 min',
        price: 650,
      },
    ],
  },
] as const satisfies SalonProfile[];

export function getSalonById(id: string) {
  return salons.find((salon) => salon.id === id);
}
