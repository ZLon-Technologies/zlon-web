'use client';

import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface LocationData {
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
  display_name?: string;
}

export function UserLocation() {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationName('Select Location');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          if (!response.ok) throw new Error('Failed to fetch location');
          
          const data: LocationData = await response.json();
          const address = data.address;

          // Try to get the most specific relevant name
          const name = 
            address?.suburb || 
            address?.neighbourhood || 
            address?.city || 
            address?.town || 
            address?.village || 
            address?.state || 
            'Unknown Location';

          setLocationName(name);
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          setLocationName('Select Location');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationName('Select Location');
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="flex items-center gap-2 text-right">
      <div className="text-xs text-gray-500 leading-tight">
        {loading ? (
          <div className="flex flex-col items-end gap-1">
            <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
            <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="font-medium text-gray-700">{locationName}</span>
          </div>
        )}
      </div>
      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </div>
  );
}
