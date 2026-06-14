'use client'
import React from 'react';
import CategorySlider from "./CategorySlider";
import HeroSection from "./HeroSection";
import ProductFeed from "./ProductFeed";
import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';
import { usePathname } from 'next/navigation';
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
    </div>
  );
}

export default UserDashboard;