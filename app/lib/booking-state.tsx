'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
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
    selectedStaffId: string;
  };
}

interface BookingContextType {
  state: BookingState;
  hasHydrated: boolean;
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
    selectedStaffId: 'any',
  },
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Load from localStorage on mount (Client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zlon_booking_state_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState(parsed);
        } catch (e) {
          console.error('Failed to parse booking state', e);
        }
      }
      setHasHydrated(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (hasHydrated && typeof window !== 'undefined') {
      localStorage.setItem('zlon_booking_state_v2', JSON.stringify(state));
    }
  }, [state, hasHydrated]);

  const updateSalon = useCallback((salon: Partial<BookingState['salon']>) => {
    setState((prev) => ({ ...prev, salon: { ...prev.salon, ...salon } }));
  }, []);

  const addToCart = useCallback((service: SalonService) => {
    setState((prev) => {
      if (prev.cart.some(s => s.id === service.id)) return prev;
      return { ...prev, cart: [...prev.cart, service] };
    });
  }, []);

  const removeFromCart = useCallback((serviceId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((s) => s.id !== serviceId),
    }));
  }, []);

  const setCart = useCallback((services: SalonService[]) => {
    setState((prev) => ({ ...prev, cart: services }));
  }, []);

  const updateAppointment = useCallback((appointment: Partial<BookingState['appointment']>) => {
    setState((prev) => ({
      ...prev,
      appointment: { ...prev.appointment, ...appointment },
    }));
  }, []);

  const clearState = useCallback(() => {
    setState(initialState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zlon_booking_state_v2');
    }
  }, []);

  const subtotal = state.cart.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = state.cart.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <BookingContext.Provider
      value={{
        state,
        hasHydrated,
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
