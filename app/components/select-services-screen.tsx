'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Check, Clock3, MapPin, Plus, Scissors, Sparkles, Star } from 'lucide-react';
import type { SalonProfile } from '../lib/booking-flow';
import { formatCurrency, formatDuration } from '../lib/booking-flow';

interface SelectServicesScreenProps {
  salon: SalonProfile;
}

export function SelectServicesScreen({ salon }: SelectServicesScreenProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<
    'All Services' | 'Haircut' | 'Shaving' | 'Face care'
  >('All Services');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    salon.menu.filter((service) => service.featured).map((service) => service.id)
  );

  const visibleServices = salon.menu.filter(
    (service) => selectedCategory === 'All Services' || service.category === selectedCategory
  );
  const selectedServices = salon.menu.filter((service) =>
    selectedServiceIds.includes(service.id)
  );
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/home');
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((previous) =>
      previous.includes(serviceId)
        ? previous.filter((id) => id !== serviceId)
        : [...previous, serviceId]
    );
  }

  function handleContinue() {
    if (selectedServiceIds.length === 0) {
      return;
    }

    const query = new URLSearchParams({
      salon: salon.id,
      services: selectedServiceIds.join(','),
    });

    router.push(`/booking/choose-slot?${query.toString()}`);
  }

  return (
    <div className="max-w-md mx-auto w-full min-h-screen bg-white relative pb-24">
      <header className="border-b border-neutral-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">SERVICES</h1>
        </div>
      </header>

      <main className="px-4 pb-10 pt-4">
        <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="relative h-64 overflow-hidden">
            <Image
              src={salon.image}
              alt={salon.name}
              fill
              unoptimized
              sizes="448px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              Luxury Experience
            </div>
            <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-semibold text-neutral-950 shadow-sm">
              <Star size={16} className="fill-neutral-950 text-neutral-950" />
              {salon.rating}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
                  {salon.name}
                </h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
                  <MapPin size={16} />
                  {salon.distance} away • {salon.location}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {salon.services.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-neutral-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-neutral-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="-mx-4 mt-6 overflow-x-auto px-4 pb-2">
          <div className="flex min-w-max gap-3">
            {salon.categories.map((category) => {
              const active = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-5 py-3 text-base font-semibold transition-colors ${
                    active
                      ? 'bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]'
                      : 'bg-white text-neutral-500'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-1 w-7 rounded-full bg-neutral-400" />
            <h3 className="text-2xl font-semibold tracking-tight text-neutral-950">
              Popular Services
            </h3>
          </div>

          <div className="space-y-6">
            {visibleServices.map((service) => {
              const selected = selectedServiceIds.includes(service.id);

              return (
                <article
                  key={service.id}
                  className={`rounded-[2rem] border p-6 transition-colors ${
                    selected
                      ? 'border-neutral-400 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]'
                      : 'border-transparent bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] text-neutral-500">
                      {selected ? 'Selected' : service.badge}
                    </span>
                    {service.category === 'Shaving' ? (
                      <Scissors size={22} className="text-neutral-500" />
                    ) : (
                      <Sparkles size={22} className="text-neutral-500" />
                    )}
                  </div>

                  <h4 className="mt-5 text-[2rem] font-semibold leading-tight tracking-tight text-neutral-950">
                    {service.name}
                  </h4>
                  <p className="mt-3 text-base leading-8 text-neutral-500">
                    {service.description}
                  </p>

                  <div className="mt-5 flex items-center gap-4 text-neutral-600">
                    <span className="text-2xl font-semibold text-neutral-950">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-base">
                      <Clock3 size={16} />
                      {formatDuration(service.durationMinutes)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-xl font-semibold transition-colors ${
                      selected
                        ? 'bg-neutral-500 text-white'
                        : 'bg-black text-white hover:bg-neutral-900'
                    }`}
                  >
                    {selected ? <Check size={20} /> : <Plus size={20} />}
                    {selected ? 'Added' : 'Add Service'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-neutral-200 bg-gradient-to-b from-white to-[#f7fbff] p-6 shadow-[0_16px_34px_rgba(148,163,184,0.12)]">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Limited Offer
          </p>
          <h3 className="mt-4 text-[2rem] font-semibold leading-tight tracking-tight text-neutral-950">
            The Gentleman&apos;s Combo
          </h3>
          <p className="mt-3 text-lg leading-8 text-neutral-500">
            Bundle Haircut &amp; Beard Trim for a luxury experience and save 15%.
          </p>
          <button
            type="button"
            className="mx-auto mt-8 block rounded-full bg-[#d8b247] px-7 py-4 text-xl font-semibold text-white shadow-[0_14px_28px_rgba(216,178,71,0.24)]"
          >
            Claim Offer
          </button>
        </section>
      </main>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white px-4 py-4 shadow-[0_-16px_30px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-neutral-500">
              {selectedServices.length} Service{selectedServices.length === 1 ? '' : 's'} Selected
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">
              Subtotal: {formatCurrency(totalPrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={selectedServices.length === 0}
            className="inline-flex items-center justify-center rounded-[1.5rem] bg-black px-7 py-4 text-xl font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
