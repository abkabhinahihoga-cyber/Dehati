'use client'
import React from 'react';
import CategorySlider from "./CategorySlider";
import HeroSection from "./HeroSection";
import ProductFeed from "./ProductFeed";
import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

interface UserDashboardProps {
  user: any;
  products: any[];
  searchQuery?: string;
}

function UserDashboard({ user, products, searchQuery }: UserDashboardProps) {

  // --- 1. SEARCH MODE ---
  if (searchQuery) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-4 md:pt-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Header: Back Button & Title */}
          <div className="flex flex-col gap-4 mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 w-fit transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Back to Home
            </Link>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Results for <span className="text-green-600">"{searchQuery}"</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Found {products.length} products matching your search
              </p>
            </div>
          </div>

          {/* Empty State Handle */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <SearchX className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">No products found</h3>
              <p className="text-gray-500 max-w-sm mt-2">
                We couldn't find anything matching "{searchQuery}". Try searching for a different keyword or category.
              </p>
              <Link href="/" className="mt-6 px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition">
                Browse All Products
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
      
      <div className="pt-6">
         <CategorySlider />
      </div>
      
      {/* Default Feed (Self-fetching based on Geolocation) */}
      <ProductFeed isSearch={false} />
    </div>
  );
}

export default UserDashboard;