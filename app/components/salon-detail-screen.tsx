'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Check, Clock3, MapPin, Plus, Star } from 'lucide-react';
import type { SalonProfile } from '../lib/salons';

interface SalonDetailScreenProps {
  salon: SalonProfile;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function SalonDetailScreen({ salon }: SalonDetailScreenProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(salon.categories[0]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const visibleServices = salon.menu.filter(
    (service) => service.category === selectedCategory
  );
  const selectedServices = salon.menu.filter((service) =>
    selectedServiceIds.includes(service.id)
  );
  const totalPrice = selectedServices.reduce(
    (runningTotal, service) => runningTotal + service.price,
    0
  );

  function toggleService(serviceId: string) {
    setSelectedServiceIds((previous) =>
      previous.includes(serviceId)
        ? previous.filter((id) => id !== serviceId)
        : [...previous, serviceId]
    );
  }

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/home');
  }

  return (
    <div className="max-w-md mx-auto w-full min-h-screen bg-white relative pb-20">
      <header className="border-b border-neutral-100">
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="px-4 pb-4 pt-3">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-400">
            Salon Detail
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            {salon.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">{salon.tagline}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} />
              {salon.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              {salon.rating}
            </span>
            <span>{salon.distance} away</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-neutral-50">
            <div className="relative h-72">
              <Image
                src={salon.heroImages[activeImageIndex]}
                alt={salon.name}
                fill
                unoptimized
                sizes="448px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700">
                {String(activeImageIndex + 1).padStart(2, '0')} /{' '}
                {String(salon.heroImages.length).padStart(2, '0')}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3">
              {salon.heroImages.map((image, index) => {
                const isActive = index === activeImageIndex;

                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`View salon image ${index + 1}`}
                    className={`relative h-16 overflow-hidden rounded-2xl border transition-all ${
                      isActive
                        ? 'border-neutral-900 ring-1 ring-neutral-900'
                        : 'border-neutral-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${salon.name} preview ${index + 1}`}
                      fill
                      unoptimized
                      sizes="120px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pb-8 pt-4">
        <section>
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex min-w-max gap-2">
              {salon.categories.map((category) => {
                const isActive = category === selectedCategory;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 space-y-3">
          {visibleServices.map((service) => {
            const isSelected = selectedServiceIds.includes(service.id);

            return (
              <article
                key={service.id}
                className="flex items-center gap-4 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500">
                    <Clock3 size={14} />
                    {service.duration}
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-neutral-950">
                    {service.name}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-neutral-500">
                    {formatCurrency(service.price)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleService(service.id)}
                  aria-pressed={isSelected}
                  className={`inline-flex min-w-20 items-center justify-center gap-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {isSelected ? <Check size={16} /> : <Plus size={16} />}
                  {isSelected ? 'Added' : 'Add'}
                </button>
              </article>
            );
          })}
        </section>
      </main>

      {selectedServices.length > 0 ? (
        <div className="fixed bottom-4 left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-4">
          <Link
            href="/booking"
            className="flex items-center justify-between rounded-full bg-neutral-950 px-5 py-4 text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)]"
          >
            <div>
              <p className="text-base font-semibold">Continue to Book</p>
              <p className="text-xs text-white/70">
                {selectedServices.length} service
                {selectedServices.length === 1 ? '' : 's'} selected
              </p>
            </div>
            <span className="text-lg font-semibold">{formatCurrency(totalPrice)}</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
