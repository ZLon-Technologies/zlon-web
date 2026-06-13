'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Bot, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface LegalSection {
  title: string;
  text: string;
}

export default function TermsAndConditionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTerms() {
      try {
        const q = query(
          collection(db, 'legal_documents'),
          where('type', '==', 'terms_and_conditions'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          if (data?.content && Array.isArray(data.content)) {
            setSections(data.content as LegalSection[]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching terms:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTerms();
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-white font-sans antialiased">
      {/* Fixed Header */}
      <header className="flex-none border-b bg-white pt-[max(env(safe-area-inset-top),48px)] px-4 pb-4 flex items-center justify-between relative">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors z-10"
          aria-label="Go back"
        >
          <ChevronLeft size={24} className="text-black" />
        </button>
        
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-black tracking-tight whitespace-nowrap">
          Terms & Conditions
        </h1>

        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shrink-0 z-10">
          <Bot className="w-5 h-5" />
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto pb-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-neutral-400" size={32} />
              <p className="text-sm text-neutral-500 font-medium">Loading terms...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              Failed to load terms: {error}
            </div>
          ) : sections.length > 0 ? (
            <div className="space-y-8">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Last Updated: May 2026
              </p>
              
              {sections.map((section, index) => (
                <section key={index}>
                  <h2 className="text-black font-bold text-lg mb-3">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {section.text}
                  </p>
                </section>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No terms found.</p>
          )}
        </div>
      </main>
    </div>
  );
}
