'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ChevronRight, Mic, MicOff, History, Trash2 } from 'lucide-react'; 
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import Image from 'next/image';
import { algoliasearch } from 'algoliasearch'; 
import { getBestSearchQuery } from '@/lib/search-normalizer';
import { useLocale } from 'next-intl';

const client = (process.env.NEXT_PUBLIC_ALGOLIA_APP_ID && process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY) 
    ? algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID, process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY)
    : null;

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const isHindi = locale === 'hi';

    const { mode } = useSelector((state: RootState) => state.mode);
    const isGrocery = mode === 'grocery';

    const borderTheme = isGrocery ? 'border-green-200' : 'border-blue-200';
    const ringFocus = isGrocery ? 'focus-within:ring-green-300' : 'focus-within:ring-blue-300';
    const gradientBg = isGrocery ? 'bg-gradient-to-r from-lime-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600';
    const micColor = isListening ? 'text-red-500 bg-red-50 animate-pulse ring-2 ring-red-200' : 'text-gray-400 hover:text-green-600 hover:bg-gray-100';

    // 1. Load History
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // 2. Sync URL
    useEffect(() => {
        const urlQuery = searchParams.get('query');
        setQuery(urlQuery || "");
    }, [searchParams]);

    // 3. Click Outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- HELPER: History ---
    const addToHistory = (term: string) => {
        if (!term.trim()) return;
        const updated = [term, ...recentSearches.filter(item => item !== term)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const removeFromHistory = (e: React.MouseEvent, term: string) => {
        e.stopPropagation(); 
        const updated = recentSearches.filter(item => item !== term);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const clearHistory = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    // --- FIXED VOICE SEARCH ---
    const startListening = () => {
        if (isListening) return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert("Voice search is not supported in this browser. Please use Chrome or Edge.");
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
            setQuery(transcript);
            handleFullSearch(transcript); 
        };

        // 👇 UPDATED ERROR HANDLING
        recognition.onerror = (event: any) => {
            setIsListening(false);

            if (event.error === 'network') {
                // Suppress the console error and show a helpful alert
                alert(isHindi ? "बोलकर खोज अभी ब्राउज़र में ब्लॉक है। कृपया Chrome/Edge में खोलें।" : "Voice Search is blocked by your browser. Please use Chrome or Edge.");
            } else if (event.error === 'not-allowed') {
                alert(isHindi ? "माइक्रोफोन की अनुमति दें, फिर दोबारा बोलकर खोजें।" : "Microphone permission denied. Please enable it in settings.");
            } else if (event.error === 'no-speech') {
                // Ignore silent errors
                return;
            } else {
                console.warn("Speech API Error:", event.error);
            }
        };

        try {
            recognition.start();
        } catch (err) {
            console.warn("Recognition start failed", err);
            setIsListening(false);
        }
    };

    // --- ALGOLIA SEARCH ---
    useEffect(() => {
        const handleSearch = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                if (client) {
                    const { results } = await client.search({
                        requests: [{ indexName: 'products', query: getBestSearchQuery(query), hitsPerPage: 5 }]
                    });
                    
                    const hits = (results[0] as any).hits.map((hit: any) => ({
                        _id: hit.objectID,
                        name: hit.name,
                        category: hit.category,
                        image: hit.image,
                        price: hit.price
                    }));
                    if (hits.length > 0) {
                        setResults(hits);
                    } else {
                        const res = await fetch(`/api/products/search?query=${encodeURIComponent(query)}`);
                        const data = await res.json();
                        setResults(data.products || []);
                    }
                    setShowResults(true);
                } else {
                    const res = await fetch(`/api/products/search?query=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    setResults(data.products || []);
                    setShowResults(true);
                }
            } catch (error) {
                console.error("Search Error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(handleSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    // --- EXECUTE SEARCH ---
    const handleFullSearch = (searchTerm: string) => {
        if (!searchTerm) return;
        addToHistory(searchTerm); 
        setShowResults(false);
        setQuery(searchTerm);
        router.push(`/?query=${encodeURIComponent(searchTerm)}`); 
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setShowResults(true);
        router.push('/');
    };

    return (
        <div className="relative w-full" ref={searchRef}>
            <div className={`w-full flex items-center bg-gray-50 rounded-lg border-2 ${borderTheme} transition-colors overflow-hidden group focus-within:ring-2 ring-offset-1 ring-opacity-50 ${ringFocus}`}>
                <div className='pl-3 text-gray-400'>
                    <Search className='w-5 h-5' />
                </div>

                <input
                    type="text"
                    placeholder={isListening ? (isHindi ? "सुन रहा है..." : "Listening...") : (isHindi ? (isGrocery ? "सब्जी, फल, राशन खोजें..." : "किताब, कॉपी, नोट्स खोजें...") : (isGrocery ? "Search vegetables, fruits..." : "Search books, notes..."))}
                    className='w-full bg-transparent p-2.5 outline-none text-gray-700 placeholder:text-gray-400 text-sm font-medium'
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if(e.target.value.length === 0) setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleFullSearch(query)}
                />

                <div className="flex items-center gap-2 mr-2">
                    {query && (
                        <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600">
                            {loading ? <Loader2 size={16} className="animate-spin text-green-600" /> : <X size={16} />}
                        </button>
                    )}

                    <button 
                        onClick={startListening} 
                        className={`p-1.5 rounded-full transition-all ${micColor}`}
                        title={isHindi ? "बोलकर खोजें" : "Voice Search"}
                        type="button"
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                </div>

                <button 
                    onClick={() => handleFullSearch(query)}
                    className={`hidden md:block px-5 py-2.5 text-white font-bold text-sm transition-all hover:brightness-105 ${gradientBg}`}
                >
                    {isHindi ? "खोजें" : "Search"}
                </button>
            </div>

            {/* --- DROPDOWN AREA --- */}
            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100]">
                    
                    {/* A. RECENT SEARCHES */}
                    {query.length < 2 && recentSearches.length > 0 && (
                        <div className="py-2">
                            <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-50">
                                <span className="text-xs font-bold text-gray-400 uppercase">{isHindi ? "हाल की खोज" : "Recent Searches"}</span>
                                <button onClick={clearHistory} className="text-[10px] text-red-500 hover:underline">{isHindi ? "साफ करें" : "Clear All"}</button>
                            </div>
                            {recentSearches.map((term, index) => (
                                <div 
                                    key={index}
                                    onClick={() => handleFullSearch(term)}
                                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <History size={16} className="text-gray-400" />
                                        <span className="text-sm font-medium">{term}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => removeFromHistory(e, term)}
                                        className="text-gray-300 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* B. LIVE SEARCH RESULTS */}
                    {query.length >= 2 && results.length > 0 && (
                        <div className="py-1">
                            {results.map((product) => (
                                <Link 
                                    href={`/product/${product._id}`} 
                                    key={product._id}
                                    onClick={() => {
                                        addToHistory(query); 
                                        setShowResults(false);
                                    }}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group cursor-pointer"
                                >
                                    <div className="w-10 h-10 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                                        {product.image ? (
                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">IMG</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-700 group-hover:text-black truncate">
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 truncate">{product.category} • ₹{product.price}</p>
                                    </div>
                                    
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                                </Link>
                            ))}
                            <button 
                                onClick={() => handleFullSearch(query)}
                                className={`w-full text-center py-2.5 text-xs font-bold border-t border-gray-100 hover:bg-gray-50 transition-colors ${isGrocery ? 'text-green-600' : 'text-blue-600'}`}
                            >
                                {isHindi ? `"${query}" के सभी नतीजे देखें` : `See all results for "${query}"`}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
