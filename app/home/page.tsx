'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Crosshair, MapPin, Rocket, Search, Sparkles, Scissors, Star, Wind } from 'lucide-react';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { bookingHistoryEntries } from '../lib/booking-history';
import { MobileBottomNav } from '../components/mobile-bottom-nav';

const categories = [
  { id: 'haircut', label: 'Haircut', icon: Scissors },
  { id: 'beard', label: 'Beard', icon: Sparkles },
  { id: 'facial', label: 'Facial', icon: Wind },
];

interface SearchMatch {
  id: string;
  name: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface SalonRecord {
  id: string | number;
  name: string | null;
  imageUrl?: string | null;
  location?: string | null;
  price?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
}

interface UserLocationState {
  lat: number | null;
  lng: number | null;
  displayText: string;
}

const FALLBACK_SALON_IMAGE =
  'https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=1200&h=900&fit=crop';

function getNumericValue(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function calculateDistanceInKilometers(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(endLat - startLat);
  const longitudeDelta = toRadians(endLng - startLng);
  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(startLat)) *
      Math.cos(toRadians(endLat)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * centralAngle;
}

export default function HomePage() {
  const [selected, setSelected] = useState('haircut');
  const [salons, setSalons] = useState<SalonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    lat: null,
    lng: null,
    displayText: 'Select Location',
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // AI Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const userHistory = bookingHistoryEntries;
  const latestBooking = userHistory[0] ?? null;

  const requestCurrentLocation = (showFallbackAlert = false) => {
    if (!navigator.geolocation) {
      if (showFallbackAlert) {
        window.alert('Please enable location permissions');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          displayText: 'Current Location',
        });
        setIsLocationModalOpen(false);
      },
      () => {
        if (showFallbackAlert) {
          window.alert('Please enable location permissions');
        }
      }
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function syncGrantedLocation() {
      if (!navigator.geolocation || !navigator.permissions?.query) {
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });

        if (!isMounted) {
          return;
        }

        if (permissionStatus.state === 'granted') {
          requestCurrentLocation();
        }
      } catch (permissionError) {
        console.error('Unable to read geolocation permissions:', permissionError);
      }
    }

    syncGrantedLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let isMounted = true;

    async function fetchSalons() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: salonsError } = await supabase.from('salons').select('*');

        if (salonsError) {
          throw salonsError;
        }

        if (isMounted) {
          setSalons((data ?? []) as SalonRecord[]);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(
            fetchError instanceof Error ? fetchError.message : 'Unable to load salons right now.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSalons();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  const nearbySalons = salons.filter((salon) => {
    const salonLat = getNumericValue(salon.lat);
    const salonLng = getNumericValue(salon.lng);

    if (
      userLocation.lat === null ||
      userLocation.lng === null ||
      salonLat === null ||
      salonLng === null
    ) {
      return false;
    }

    return (
      calculateDistanceInKilometers(userLocation.lat, userLocation.lng, salonLat, salonLng) <= 5
    );
  });

  const handleManualLocationSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextLocation = manualLocationInput.trim();

    if (!nextLocation) {
      return;
    }

    const matchedSalon = salons.find((salon) => {
      const salonLocation = salon.location?.toLowerCase().trim();
      const normalizedInput = nextLocation.toLowerCase();

      if (!salonLocation) {
        return false;
      }

      return salonLocation.includes(normalizedInput) || normalizedInput.includes(salonLocation);
    });
    const matchedLat = getNumericValue(matchedSalon?.lat);
    const matchedLng = getNumericValue(matchedSalon?.lng);

    setUserLocation({
      lat: matchedLat,
      lng: matchedLng,
      displayText: nextLocation,
    });
    setIsLocationModalOpen(false);
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-black tracking-tight text-gray-700">ZLon.</div>
            <div className="flex items-center gap-2 text-right">
              <div className="text-xs text-gray-500 leading-tight">
                <div className="flex flex-col items-end">
                  <span className="font-medium text-gray-700">{userLocation.displayText}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                aria-label="Choose location"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
              >
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-20">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search services (e.g., 'fade haircut', 'beard cleanup')"
                className="w-full pl-12 pr-10 py-4 bg-gray-200 rounded-full text-gray-700 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
              />
              {(searchQuery.length > 0 || isSearching) && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* AI Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {isSearching ? 'Searching...' : `Found ${searchResults.length} service${searchResults.length !== 1 ? 's' : ''}`}
                </h2>
                <button
                  onClick={clearSearch}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{result.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              result.confidence === 'high'
                                ? 'bg-green-100 text-green-700'
                                : result.confidence === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {result.confidence} match
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 capitalize">Category: {result.category}</p>
                        <p className="text-xs text-gray-600 mt-2">{result.reason}</p>
                      </div>
                      <button className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {showResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
            <div className="mb-8 text-center py-8">
              <div className="text-gray-400 mb-2">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">
                No services found for &quot;{searchQuery}&quot;
              </p>
              <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Category Pills */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="mb-8 flex gap-3 overflow-x-auto pb-2 scroll-smooth cursor-grab active:cursor-grabbing select-none hide-scrollbar"
            style={{ scrollBehavior: 'smooth' }}
          >
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selected === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelected(category.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-medium text-sm transition-all pointer-events-auto ${
                    isSelected
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* Quick Rebook */}
          {userHistory && userHistory.length > 0 && latestBooking ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Quick Rebook</h2>
                <Link
                  href="/booking-history"
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  VIEW ALL
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 rounded-xl bg-gray-300 flex-shrink-0 overflow-hidden">
                    <Image
                      src={latestBooking.image}
                      alt={latestBooking.salonName}
                      fill
                      unoptimized
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {latestBooking.visitedLabel}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                      {latestBooking.salonName}
                    </h3>
                    <p className="text-xs text-gray-600">{latestBooking.serviceName}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Recommended Salons */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Salons</h2>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading salons...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : nearbySalons.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-gray-200 bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f3f4f6_70%,_#e5e7eb_100%)]" />
                  <div className="absolute inset-4 rounded-full border border-dashed border-gray-300" />
                  <div className="absolute left-5 top-7 h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <div className="absolute bottom-7 right-6 h-3 w-3 rounded-full bg-gray-900" />
                  <Rocket className="relative h-10 w-10 -rotate-12 text-gray-900" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                  Oops! We haven&apos;t reached your neighborhood yet.
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-gray-500">
                  We are expanding fast, try searching another area!
                </p>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="mt-6 rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                >
                  Try Another Area
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {nearbySalons.map((salon) => {
                  const salonId = String(salon.id);
                  const salonName = salon.name ?? 'Unnamed Salon';
                  const salonImage = salon.imageUrl ?? FALLBACK_SALON_IMAGE;
                  const price = getNumericValue(salon.price);
                  const salonLat = getNumericValue(salon.lat);
                  const salonLng = getNumericValue(salon.lng);
                  const distanceFromUser =
                    userLocation.lat !== null &&
                    userLocation.lng !== null &&
                    salonLat !== null &&
                    salonLng !== null
                      ? calculateDistanceInKilometers(
                          userLocation.lat,
                          userLocation.lng,
                          salonLat,
                          salonLng
                        )
                      : null;
                  const locationLabel =
                    [
                      distanceFromUser !== null ? `${distanceFromUser.toFixed(1)} km away` : null,
                      salon.location ?? null,
                    ]
                      .filter(Boolean)
                      .join(' • ') || 'Location unavailable';

                  return (
                    <div key={salonId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Image Container */}
                      <div className="relative h-56 overflow-hidden bg-gray-300">
                        <Image
                          src={salonImage}
                          alt={salonName}
                          fill
                          unoptimized
                          sizes="448px"
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />

                        {/* Badge - Luxury Experience */}
                        <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs font-semibold px-3 py-1.5">
                          LUXURY EXPERIENCE
                        </div>

                        {/* Rating Badge */}
                        <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-md">
                          <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                          <span className="font-bold text-gray-900 text-sm">New</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col h-full">
                        {/* Salon Name */}
                        <h3 className="font-bold text-gray-900 text-base mb-1">{salonName}</h3>

                        {/* Location */}
                        <div className="flex items-start gap-1 mb-4 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{locationLabel}</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-xs text-gray-500">Starts from</span>
                          <span className="text-xl font-bold text-gray-900">
                            {price !== null ? `₹${price}` : 'Contact'}
                          </span>
                        </div>

                        {/* Service Tags */}
                        <div className="flex gap-2 mb-4">
                          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                            NEARBY
                          </span>
                          {salon.location && (
                            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                              {salon.location}
                            </span>
                          )}
                        </div>

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Book Now Button */}
                        <Link
                          href={`/salon/${salonId}`}
                          className="block w-full rounded-full bg-gray-900 py-3 text-center text-sm font-bold text-white transition-all hover:bg-gray-800 active:bg-gray-950"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLocationModalOpen && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 px-4 pb-24 pt-6">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                  Change Area
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">Search your location</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition-colors hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleManualLocationSave} className="mt-6">
              <label htmlFor="manual-location" className="mb-3 block text-sm text-gray-300">
                Enter a neighborhood, area, or landmark
              </label>
              <input
                id="manual-location"
                type="text"
                value={manualLocationInput}
                onChange={(event) => setManualLocationInput(event.target.value)}
                placeholder="Try Indiranagar, Koramangala..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button
                type="button"
                onClick={() => requestCurrentLocation(true)}
                className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-white"
              >
                <Crosshair size={16} />
                <span>Use my current location</span>
              </button>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="flex-1 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-gray-200"
                >
                  Update Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
