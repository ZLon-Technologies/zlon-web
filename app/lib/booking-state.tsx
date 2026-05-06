'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface BookingState {
  salonId: string | null;
  salonName: string | null;
  salonLocation: string | null;
  serviceId: string | null;
  serviceName: string | null;
  price: number | null;
  duration: number | null;
}

interface BookingContextType {
  state: BookingState;
  updateState: (newState: Partial<BookingState>) => void;
  clearState: () => void;
}

const initialState: BookingState = {
  salonId: null,
  salonName: null,
  salonLocation: null,
  serviceId: null,
  serviceName: null,
  price: null,
  duration: null,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);
  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zlon_booking_state');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse booking state', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('zlon_booking_state', JSON.stringify(state));
  }, [state]);

  const updateState = (newState: Partial<BookingState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const clearState = () => {
    setState(initialState);
    localStorage.removeItem('zlon_booking_state');
  };

  return (
    <BookingContext.Provider value={{ state, updateState, clearState }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
