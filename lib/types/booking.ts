export interface Booking {
  id: string;
  user_id: string;
  salon_id: string;
  service_id: string;
  staff_id: string | null;
  status: string;
  appointment_timestamp: string | null;
  start_time: string | null;
  date: string | null;
  time_slot: string | null;
  total_amount: number;
  payment_method: string | null;
  created_at: string;
}

export interface SalonData {
  id?: string;
  name: string;
  address?: string;
  location?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  distance?: string;
}