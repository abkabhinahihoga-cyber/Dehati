'use client'
import React, { useState } from 'react';
import CategorySlider from "./CategorySlider";
import HeroSection from "./HeroSection";
import ProductFeed from "./ProductFeed";
import Link from 'next/link';
import { ArrowLeft, SearchX, Mic, MicOff } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import MandiBhavTicker from "./MandiBhavTicker";
import HorizontalReelsFeed from "./HorizontalReelsFeed";

interface UserDashboardProps {
  user: any;
  products: any[];
  searchQuery?: string;
}

function UserDashboard({ user, products, searchQuery }: UserDashboardProps) {
  const locale = useLocale();
  const isHindi = locale === 'hi';

  const t = {
    backToHome: isHindi ? 'होम पर वापस जाएं' : 'Back to Home',
    resultsFor: isHindi ? 'के लिए परिणाम' : 'Results for',
    foundProducts: isHindi ? (len: number) => `आपकी खोज से मेल खाने वाले ${len} उत्पाद मिले` : (len: number) => `Found ${len} products matching your search`,
    noProductsFound: isHindi ? 'कोई उत्पाद नहीं मिला' : 'No products found',
    noProductsDesc: isHindi ? (query: string) => `हमें "${query}" से मेल खाने वाला कुछ नहीं मिला। किसी अन्य कीवर्ड या श्रेणी की खोज करने का प्रयास करें।` : (query: string) => `We couldn't find anything matching "${query}". Try searching for a different keyword or category.`,
    browseAll: isHindi ? 'सभी उत्पाद ब्राउज़ करें' : 'Browse All Products',
  };

  const router = useRouter();
  const [isListening, setIsListening] = useState(false);

  // --- MASSIVE VOICE SEARCH LOGIC ---
  const startListening = () => {
      if (isListening) return;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert(isHindi ? "आपका फोन बोल कर खोजने का समर्थन नहीं करता है।" : "Voice search is not supported on this browser.");
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = isHindi ? 'hi-IN' : 'en-IN'; 
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          router.push(`/?query=${encodeURIComponent(transcript)}`); 
      };

      recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'not-allowed') {
              alert(isHindi ? "माइक्रोफोन की अनुमति नहीं है। (Microphone Denied)" : "Microphone permission denied.");
          }
      };

      try { recognition.start(); } catch (err) { setIsListening(false); }
  };

  // --- 1. SEARCH MODE ---
  if (searchQuery) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-4 md:pt-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Header: Back Button & Title */}
          <div className="flex flex-col gap-4 mb-6">
            <Link 
              href={isHindi ? "/hi" : "/en"} 
              className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 w-fit transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              {t.backToHome}
            </Link>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {t.resultsFor} <span className="text-green-600">"{searchQuery}"</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {t.foundProducts(products.length)}
              </p>
            </div>
          </div>

          {/* Empty State Handle */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <SearchX className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">{t.noProductsFound}</h3>
              <p className="text-gray-500 max-w-sm mt-2">
                {t.noProductsDesc(searchQuery)}
              </p>
              <Link href={isHindi ? "/hi" : "/en"} className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
                {t.browseAll}
              </Link>
            </div>
          ) : (
            /* 👇 FIX: Changed 'initialProducts' to 'searchProducts' */
            <ProductFeed 
               searchProducts={products} 
               isSearch={true} 
            />
          )}
        </div>
      </div>
    );
  }

  // --- 2. DEFAULT HOME VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <HeroSection />
      
      {/* Mandi Bhav Ticker */}
      <MandiBhavTicker hubId={user?.connectedHub || 'public'} />
      
      <div className="pt-6">
         <CategorySlider />
      </div>

      {/* Horizontal Reels Feed */}
      <HorizontalReelsFeed />
      
      {/* Default Feed (Self-fetching based on Geolocation) */}
      <ProductFeed isSearch={false} />

      {/* MASSIVE FLOATING VOICE SEARCH BUTTON (For Rural / Illiterate Users) */}
      <div className="fixed right-3 bottom-24 md:right-6 md:bottom-8 z-[60]">
        <button
          onClick={startListening}
          className={`group flex items-center gap-2 md:gap-3 rounded-full shadow-[0_10px_30px_rgba(13,105,56,0.28)] transition-all border-2 px-4 py-3 md:px-5 md:py-4 ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse scale-105 border-red-300' 
              : 'bg-[#0d6938] text-white hover:bg-[#0a522c] hover:scale-105 border-white'
          }`}
          aria-label={isHindi ? 'बोलकर खोजें' : 'Speak to search'}
        >
          {isListening ? (
            <>
               <MicOff size={24} />
               <span className="font-black text-xl tracking-wide">{isHindi ? 'सुन रहा हूँ...' : 'Listening...'}</span>
            </>
          ) : (
            <>
               <Mic size={24} />
               <span className="font-black text-xl tracking-wide">{isHindi ? 'बोल कर खोजें' : 'Speak to Search'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default UserDashboard;
