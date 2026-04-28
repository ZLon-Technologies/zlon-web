'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, Star, Scissors, Sparkles, Wind } from 'lucide-react';
import { MobileBottomNav } from '../components/mobile-bottom-nav';
import { UserLocation } from '../components/user-location';
import { salons } from '../lib/booking-flow';

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

export default function HomePage() {
  const [selected, setSelected] = useState('haircut');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // AI Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

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
            <UserLocation />
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Quick Rebook</h2>
              <button className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                VIEW ALL
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 rounded-xl bg-gray-300 flex-shrink-0 overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1585747860715-cd4628902d4a?w=200&h=200&fit=crop"
                    alt="The Grooming Society"
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Last visited 12 days ago
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
                    The Grooming Society
                  </h3>
                  <p className="text-xs text-gray-600">Classic Haircut + Beard Trim</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Salons */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Salons</h2>
            <div className="space-y-4">
              {salons.map((salon) => (
                <div key={salon.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image Container */}
                  <div className="relative h-56 overflow-hidden bg-gray-300">
                    <Image
                      src={salon.image}
                      alt={salon.name}
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
                      <span className="font-bold text-gray-900 text-sm">{salon.rating}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col h-full">
                    {/* Salon Name */}
                    <h3 className="font-bold text-gray-900 text-base mb-1">{salon.name}</h3>

                    {/* Location */}
                    <div className="flex items-start gap-1 mb-4 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        {salon.distance} away • {salon.location}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-xs text-gray-500">Starts from</span>
                      <span className="text-xl font-bold text-gray-900">₹{salon.price}</span>
                    </div>

                    {/* Service Tags */}
                    <div className="flex gap-2 mb-4">
                      {salon.services.map((service) => (
                        <span
                          key={service}
                          className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Book Now Button */}
                    <Link
                      href={`/salon/${salon.id}`}
                      className="block w-full rounded-full bg-gray-900 py-3 text-center text-sm font-bold text-white transition-all hover:bg-gray-800 active:bg-gray-950"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}

