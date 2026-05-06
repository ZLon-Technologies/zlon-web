'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SalonService } from './booking-flow';

export interface BookingState {
  salon: {
    id: string | null;
    name: string | null;
    location: string | null;
    image: string | null;
    distance: string | null;
  };
  cart: SalonService[];
  appointment: {
    date: string | null;
    slot: string | null;
    staffId: string | null;
  };
}

interface BookingContextType {
  state: BookingState;
  updateSalon: (salon: Partial<BookingState['salon']>) => void;
  addToCart: (service: SalonService) => void;
  removeFromCart: (serviceId: string) => void;
  setCart: (services: SalonService[]) => void;
  updateAppointment: (appointment: Partial<BookingState['appointment']>) => void;
  clearState: () => void;
  subtotal: number;
  totalDuration: number;
}

const initialState: BookingState = {
  salon: {
    id: null,
    name: null,
    location: null,
    image: null,
    distance: null,
  },
  cart: [],
  appointment: {
    date: null,
    slot: null,
    staffId: null,
  },
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zlon_booking_state_v2');
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
    localStorage.setItem('zlon_booking_state_v2', JSON.stringify(state));
  }, [state]);

  const updateSalon = (salon: Partial<BookingState['salon']>) => {
    setState((prev) => ({ ...prev, salon: { ...prev.salon, ...salon } }));
  };

  const addToCart = (service: SalonService) => {
    setState((prev) => {
      if (prev.cart.some(s => s.id === service.id)) return prev;
      return { ...prev, cart: [...prev.cart, service] };
    });
  };

  const removeFromCart = (serviceId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((s) => s.id !== serviceId),
    }));
  };

  const setCart = (services: SalonService[]) => {
    setState((prev) => ({ ...prev, cart: services }));
  };

  const updateAppointment = (appointment: Partial<BookingState['appointment']>) => {
    setState((prev) => ({
      ...prev,
      appointment: { ...prev.appointment, ...appointment },
    }));
  };

  const clearState = () => {
    setState(initialState);
    localStorage.removeItem('zlon_booking_state_v2');
  };

  const subtotal = state.cart.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = state.cart.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <BookingContext.Provider
      value={{
        state,
        updateSalon,
        addToCart,
        removeFromCart,
        setCart,
        updateAppointment,
        clearState,
        subtotal,
        totalDuration,
      }}
    >
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
