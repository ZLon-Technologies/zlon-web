'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Crosshair, MapPin, MessageSquare, Rocket, ScanFace, Search, SearchX, Sparkles, Scissors, Star, Wind } from 'lucide-react';
import type { BookingRecord } from '../lib/booking-records';
import { mapBookingRows } from '../lib/booking-records';
import { CUSTOMER_SAFE_SALON_SELECT } from '../lib/public-salon-fields';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import { MobileBottomNav } from '../components/mobile-bottom-nav';
import { FALLBACK_SALON_IMAGE } from '../lib/media';

const categories = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'haircut', label: 'Haircut', icon: Scissors },
  { id: 'beard', label: 'Beard', icon: Sparkles },
  { id: 'facial', label: 'Facial', icon: Wind },
];

interface SearchMatch {
  id: string;
  name: string;
  result_type: 'salon' | 'service';
  salon_id?: string | number | null;
  salon_name?: string | null;
  price?: number | null;
}

interface SalonRecord {
  id: string | number;
  name: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface UserLocationState {
  lat: number | null;
  lng: number | null;
  displayText: string | null;
}

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getSafeSalonRecord(rawSalon: Record<string, unknown>): SalonRecord | null {
  const id = rawSalon.id;

  if (typeof id !== 'string' && typeof id !== 'number') {
    return null;
  }

  return {
    id,
    name: getStringValue(rawSalon.name),
    imageUrl:
      getStringValue(rawSalon.imageUrl) ??
      getStringValue(rawSalon.image_url) ??
      getStringValue(rawSalon.image),
    image_url:
      getStringValue(rawSalon.image_url) ??
      getStringValue(rawSalon.imageUrl) ??
      getStringValue(rawSalon.image),
    address: getStringValue(rawSalon.address),
    lat: getNumericValue(rawSalon.lat),
    lng: getNumericValue(rawSalon.lng),
  };
}

function getNumericValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const parsedValue = Number(trimmedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function isSearchResultType(value: unknown): value is SearchMatch['result_type'] {
  return value === 'salon' || value === 'service';
}

function getSafeSearchResult(rawResult: Record<string, unknown>): SearchMatch | null {
  const resultType = rawResult.result_type;

  if (!isSearchResultType(resultType)) {
    return null;
  }

  const fallbackId = resultType === 'salon' ? rawResult.salon_id : rawResult.service_id;
  const id = rawResult.id ?? rawResult.result_id ?? fallbackId;

  if (typeof id !== 'string' && typeof id !== 'number') {
    return null;
  }

  const name =
    getStringValue(rawResult.name) ??
    getStringValue(rawResult.result_name) ??
    (resultType === 'salon'
      ? getStringValue(rawResult.salon_name)
      : getStringValue(rawResult.service_name));

  if (!name) {
    return null;
  }

  const salonId = rawResult.salon_id;

  return {
    id: String(id),
    name,
    result_type: resultType,
    salon_id: typeof salonId === 'string' || typeof salonId === 'number' ? salonId : null,
    salon_name: getStringValue(rawResult.salon_name),
    price: getNumericValue(rawResult.price) ?? getNumericValue(rawResult.base_price),
  };
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
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
  const centralAngle = 2 * Math.atan2(
    Math.sqrt(haversineValue),
    Math.sqrt(1 - Math.min(haversineValue, 1))
  );

  return earthRadiusKm * centralAngle;
}

export default function HomePage() {
  const [selected, setSelected] = useState('all');
  const [salons, setSalons] = useState<SalonRecord[]>([]);
  const [salonRows, setSalonRows] = useState<Array<Record<string, unknown>>>([]);
  const [bookingRows, setBookingRows] = useState<Array<Record<string, unknown>>>([]);
  const [aiScannerAccess, setAiScannerAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    lat: null,
    lng: null,
    displayText: null,
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
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
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 300);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const bookings: BookingRecord[] = mapBookingRows(bookingRows, salonRows);
  const latestBooking = bookings?.[0] ?? null;

  const requestCurrentLocation = (showFallbackAlert = false) => {
    if (!navigator.geolocation) {
      if (showFallbackAlert) {
        window.alert('Please enable location permissions');
      }
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
          const data = await response.json();
          
          setUserLocation({
            lat: latitude,
            lng: longitude,
            displayText: data.city || 'Current Location',
          });
        } catch (err) {
          console.error('Geocoding error:', err);
          setUserLocation({
            lat: latitude,
            lng: longitude,
            displayText: 'Current Location',
          });
        } finally {
          setIsLocating(false);
          setIsLocationModalOpen(false);
        }
      },
      () => {
        setIsLocating(false);
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

    async function fetchUserData() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id ?? null;

        if (!userId || !isMounted) return;

        const [{ data: bookingData, error: bookingsError }, { data: profileData }] =
          await Promise.all([
            supabase.from('bookings').select('*').eq('user_id', userId),
            supabase.from('profiles').select('full_name, email, ai_scanner_access').eq('id', userId).maybeSingle(),
          ]);

        if (isMounted) {
          setBookingRows(
            bookingsError ? [] : ((bookingData ?? []) as Array<Record<string, unknown>>)
          );
          setAiScannerAccess(!!profileData?.ai_scanner_access);
        }

        if (bookingsError) {
          console.error('Unable to load recent bookings for quick rebook:', bookingsError);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    }

    fetchUserData();

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
        let query = supabase.from('salons').select(CUSTOMER_SAFE_SALON_SELECT);

        // DIRECTIVE 3: Move category filtering to the Supabase query level
        // We filter salons that have services matching the selected category ID
        if (selected && selected !== 'all') {
          // Join with services to filter salons by category
          // Note: This assumes a 1:N relationship between salons and services
          // We use a subquery or join-filter if supported, or a standard filter
          const { data: salonIdsWithCategory } = await supabase
            .from('services')
            .select('salon_id')
            .eq('category', selected);
          
          const validIds = Array.from(new Set((salonIdsWithCategory ?? []).map(s => s.salon_id)));
          
          if (validIds.length > 0) {
            query = query.in('id', validIds);
          } else {
            // No salons match this category
            setSalons([]);
            setSalonRows([]);
            setIsLoading(false);
            return;
          }
        }

        const { data: salonData, error: salonsError } = await query;

        if (salonsError) {
          throw salonsError;
        }

        if (isMounted) {
          const rawSalonRows = (salonData ?? []) as Array<Record<string, unknown>>;
          const nextSalons = rawSalonRows
            .map(getSafeSalonRecord)
            .filter((salon): salon is SalonRecord => Boolean(salon));
          
          setSalonRows(rawSalonRows);
          setSalons(nextSalons);
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
  }, [selected, refreshKey]);

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

  useEffect(() => {
    const query = debouncedSearchQuery.trim();
    let isCurrentSearch = true;

    if (query.length < 2) {
      return () => {
        isCurrentSearch = false;
      };
    }

    async function searchZLon() {
      const supabase = createSupabaseBrowserClient();

      try {
        const { data, error } = await supabase.rpc('search_zlon', {
          search_term: query,
        });

        if (!isCurrentSearch) {
          return;
        }

        if (error) {
          console.error('Search error:', error);
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        const nextResults = ((data ?? []) as Array<Record<string, unknown>>)
          .map(getSafeSearchResult)
          .filter((result): result is SearchMatch => Boolean(result));

        setSearchResults(nextResults);
      } catch (err) {
        if (!isCurrentSearch) {
          return;
        }

        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        if (isCurrentSearch) {
          setIsSearching(false);
        }
      }
    }

    searchZLon();

    return () => {
      isCurrentSearch = false;
    };
  }, [debouncedSearchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(query.trim().length >= 2);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setIsSearching(false);
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
  const locationDisplayLabel = isLocating
    ? 'Locating...'
    : userLocation.displayText?.trim() || 'Select Location';

  const salonResults = searchResults.filter((result) => result.result_type === 'salon');
  const serviceResults = searchResults.filter((result) => result.result_type === 'service');

  const servicesGroupedBySalon = serviceResults.reduce((acc, result) => {
    const salonName = result.salon_name ?? 'ZLon Salon';
    if (!acc[salonName]) {
      acc[salonName] = [];
    }
    acc[salonName].push(result);
    return acc;
  }, {} as Record<string, typeof serviceResults>);

  const groupedSearchResults = [
    ...(salonResults.length > 0 ? [{
      type: 'salon',
      label: 'Salons',
      results: salonResults,
    }] : []),
    ...Object.entries(servicesGroupedBySalon).map(([salonName, results]) => ({
      type: `service-${salonName}`,
      label: `Services at ${salonName}`,
      results,
    }))
  ];
  
  const shouldShowSearchResults = showResults && searchQuery.trim().length >= 2;

  const handleManualLocationSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextLocation = manualLocationInput.trim();

    if (!nextLocation) {
      return;
    }

    const matchedSalon = salons.find((salon) => {
      const salonAddress = salon.address?.toLowerCase().trim();
      const normalizedInput = nextLocation.toLowerCase();

      if (!salonAddress) {
        return false;
      }

      return salonAddress.includes(normalizedInput) || normalizedInput.includes(salonAddress);
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
    <div className="w-full relative flex flex-col">
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.2s ease-out forwards;
        }
        @keyframes listItemSlide {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-listItem {
          opacity: 0;
          animation: listItemSlide 0.15s ease-out forwards;
        }
        @keyframes categoryPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.96); }
        }
        .active\\:scale-\\[0\\.98\\]:active {
          animation: categoryPulse 0.1s ease-in-out;
        }
      `}</style>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <div className="flex items-center justify-between gap-4">
            <Image
              src="/logo.png"
              alt="ZLon"
              width={96}
              height={32}
              priority
              className="h-8 w-auto shrink-0 origin-left scale-[1.3] object-contain"
            />
            <div className="flex min-w-0 items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                aria-label="Choose location"
                className="flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-left transition-colors hover:bg-gray-100"
              >
                <MapPin className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="max-w-[8.5rem] truncate text-xs font-medium text-gray-700">
                  {locationDisplayLabel}
                </span>
              </button>
              <Link prefetch={false}
                href="/customer-support"
                aria-label="Open customer support chat"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="px-5 pt-3 pb-20">
          {/* Search Bar */}
          <div className="mb-5 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowResults(searchQuery.trim().length >= 2)}
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

            {/* Search Results Overlay */}
            {shouldShowSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-fadeSlideIn">
                {isSearching ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Searching…
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No exact matches found, try another term
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {groupedSearchResults.map(({ type, label, results }, groupIndex) => {
                      if (results.length === 0) return null;

                      return (
                        <div key={type}>
                          <div className="px-4 py-2 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {label}
                          </div>
                          {results.map((result, resultIndex) => (
                            <Link prefetch={false}
                              key={`${result.result_type}-${result.id}`}
                              href={
                                result.result_type === 'salon'
                                  ? `/salon-profile/${result.id}`
                                  : `/salon/${result.salon_id ?? result.id}`
                              }
                              style={{ animationDelay: `${(groupIndex * 10 + resultIndex) * 30}ms` }}
                              className="block px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-gray-900 animate-listItem"
                            >
                              {result.result_type === 'service'
                                ? `${result.name} - ${
                                    result.price !== null && result.price !== undefined
                                      ? result.price === 0 ? 'Free' : `₹${result.price}`
                                      : 'Price unavailable'
                                  }`
                                : result.name}
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

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
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap font-medium text-sm transition-all pointer-events-auto flex-shrink-0 ${
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
          {bookings && bookings.length > 0 && latestBooking ? (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Quick Rebook</h2>
                <Link prefetch={false}
                  href="/profile/booking-history"
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
            <Link prefetch={false}
              href={aiScannerAccess ? '/ai-stylist' : '#'}
              onClick={(e) => {
                if (!aiScannerAccess) {
                  e.preventDefault();
                }
              }}
              className={`mb-5 flex items-center gap-4 rounded-[1.5rem] bg-gray-900 px-4 py-4 text-white shadow-[0_16px_36px_rgba(17,24,39,0.16)] transition-transform ${
                aiScannerAccess ? 'hover:scale-[0.99]' : 'opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <ScanFace className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">ZLon AI Stylist</h2>
                  {!aiScannerAccess && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90">
                      Beta / Coming Soon
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-white/70">
                  Find your perfect cut based on your face shape.
                </p>
              </div>
            </Link>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Salons</h2>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading salons...</p>
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : salons.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[2.5rem] bg-gray-50 px-8 py-16 text-center border border-gray-100 shadow-inner">
                <div className="relative mb-8">
                  <div className="absolute inset-0 scale-150 rounded-full bg-gray-200/40 blur-3xl" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gray-50 to-white" />
                    <SearchX className="relative h-10 w-10 text-gray-400" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                  No salons found
                </h3>
                <p className="mt-3 max-w-[260px] text-sm leading-6 text-gray-600 font-medium">
                  We couldn&apos;t find any salons matching your exact style right now. Let&apos;s try something else!
                </p>
                <button
                  type="button"
                  onClick={() => setSelected('all')}
                  className="mt-8 rounded-full bg-gray-900 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-gray-800 active:scale-[0.98] shadow-lg shadow-gray-200"
                >
                  View All Services
                </button>
              </div>
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
                      salon.address ?? null,
                    ]
                      .filter(Boolean)
                      .join(' • ') || 'Location unavailable';

                  return (
                    <div key={salonId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                      <Link prefetch={false} href={`/salon-profile/${salonId}`} className="block">
                        <div className="relative h-56 overflow-hidden bg-gray-300">
                          <Image
                            src={salonImage}
                            alt={salonName}
                            fill
                            sizes="(max-width: 480px) 100vw, 480px"
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />

                          <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs font-semibold px-3 py-1.5">
                            LUXURY EXPERIENCE
                          </div>

                          <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-md">
                            <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                            <span className="font-bold text-gray-900 text-sm">New</span>
                          </div>
                        </div>

                        <div className="px-4 pb-0 pt-4">
                          <h3 className="font-bold text-gray-900 text-base mb-1">{salonName}</h3>
                          <div className="flex items-start gap-1 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>{locationLabel}</span>
                          </div>
                        </div>
                      </Link>

                      <div className="p-4 pt-4 flex flex-col h-full">
                        {/* Service Tags */}
                        <div className="flex gap-2 mb-4">
                          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                            NEARBY
                          </span>
                          {salon.address && (
                            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                              {salon.address}
                            </span>
                          )}
                        </div>

                        {/* Spacer */}
                        <div className="flex-1"></div>

                        {/* Book Now Button */}
                        <Link prefetch={false}
                          href={`/salon/${salonId}`}
                          onClick={(event) => event.stopPropagation()}
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
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
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
