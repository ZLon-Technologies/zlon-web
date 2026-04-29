export interface BookingHistoryEntry {
  id: string;
  salonId: string;
  salonName: string;
  serviceName: string;
  image: string;
  visitedLabel: string;
  appointmentLabel: string;
  price: number;
  status: 'COMPLETED';
}

export const bookingHistorySummary = {
  totalAppointments: 24,
};

export const bookingHistoryEntries: BookingHistoryEntry[] = [
  {
    id: 'history-velvet-vine-1',
    salonId: 'velvet-vine',
    salonName: 'Velvet & Vine',
    serviceName: 'Classic Haircut',
    image:
      'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=800&h=800&fit=crop',
    visitedLabel: 'Last visited 12 days ago',
    appointmentLabel: '24 Oct, 2023 | 10:30 AM',
    price: 1250,
    status: 'COMPLETED',
  },
  {
    id: 'history-modern-man-1',
    salonId: 'the-modern-man',
    salonName: 'The Modern Man',
    serviceName: 'Classic Haircut',
    image:
      'https://images.unsplash.com/photo-1633681926022-ec8b1bc32b99?w=800&h=800&fit=crop',
    visitedLabel: 'Last visited 3 weeks ago',
    appointmentLabel: '11 Oct, 2023 | 04:15 PM',
    price: 980,
    status: 'COMPLETED',
  },
  {
    id: 'history-velvet-vine-2',
    salonId: 'velvet-vine',
    salonName: 'Velvet & Vine',
    serviceName: 'Beard Finish',
    image:
      'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=800&h=800&fit=crop',
    visitedLabel: 'Last visited 1 month ago',
    appointmentLabel: '29 Sep, 2023 | 01:00 PM',
    price: 720,
    status: 'COMPLETED',
  },
  {
    id: 'history-modern-man-2',
    salonId: 'the-modern-man',
    salonName: 'The Modern Man',
    serviceName: 'Executive Grooming',
    image:
      'https://images.unsplash.com/photo-1633681926022-ec8b1bc32b99?w=800&h=800&fit=crop',
    visitedLabel: 'Last visited 2 months ago',
    appointmentLabel: '02 Sep, 2023 | 06:45 PM',
    price: 1450,
    status: 'COMPLETED',
  },
];
