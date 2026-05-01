export interface BookedService {
  id: string;
  name: string;
  duration: string;
  price: number;
}

export interface BookingDetails {
  id: string;
  serviceTitle: string;
  salonName: string;
  location: string;
  date: string;
  timeSlot: string;
  status: string;
  totalPrice: number;
  professionalName: string;
  professionalTitle: string;
  services: BookedService[];
}
