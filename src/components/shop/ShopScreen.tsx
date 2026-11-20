'use client';

import React, { useState, useEffect } from 'react';
import { useWardrobe } from '@/lib/store';
import { ShoppingSuggestion, PriceTier } from '@/lib/types';
import {
  ShoppingBag,
  Sparkles,
  ExternalLink,
  Loader2,
  Filter,
  RefreshCw,
  Check,
  Tag,
  Search,
  Store,
} from 'lucide-react';

type StoreType = 'all' | 'myntra' | 'amazon' | 'flipkart' | 'meesho';

const STORES = [
  { id: 'all', name: 'All Stores', icon: '🛍️' },
  { id: 'myntra', name: 'Myntra', icon: '👗', badge: 'Fashion' },
  { id: 'amazon', name: 'Amazon', icon: '📦', badge: 'Fast Delivery' },
  { id: 'flipkart', name: 'Flipkart', icon: '⚡', badge: 'Trending' },
  { id: 'meesho', name: 'Meesho', icon: '🏷️', badge: 'Budget' },
] as const;

function getStoreLinks(query: string) {
  const cleanQ = query.trim();
  const encoded = encodeURIComponent(cleanQ);
  const slug = encodeURIComponent(
    cleanQ
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );

  return {
    myntra: `https://www.myntra.com/${slug}`,
    amazon: `https://www.amazon.in/s?k=${encoded}`,
    flipkart: `https://www.flipkart.com/search?q=${encoded}`,
    meesho: `https://www.meesho.com/search?q=${encoded}`,
    google: `https://www.google.com/search?tbm=shop&q=${encoded}`,
  };
}

export default function ShopScreen() {
  const { clothes, user, suggestions, setSuggestions } = useWardrobe();

  const [budgetFilter, setBudgetFilter] = useState<'All' | PriceTier>('All');
  const [selectedStore, setSelectedStore] = useState<StoreType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSuggestions = async (filter = budgetFilter) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res = await fetch('/api/shopping-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothes,
          userProfile: user,
          budgetFilter: filter,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate shopping suggestions');
      }

      const data = await res.json();
      if (Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // If no suggestions exist yet, generate initially on first mount
  useEffect(() => {
    if (suggestions.length === 0) {
      fetchSuggestions();
    }
  }, []);

  const filteredSuggestions = suggestions.filter((s) => {
    if (budgetFilter !== 'All' && s.price_tier !== budgetFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Smart Shopping
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Find wardrobe gaps & shop on Amazon, Flipkart, Meesho, Myntra
          </p>
        </div>

        <button
          onClick={() => fetchSuggestions(budgetFilter)}
          disabled={isLoading}
          className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* User Color Palette Banner */}
      {user.skin_tone && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 dark:from-neutral-800 dark:to-neutral-900 border border-amber-200/60 dark:border-neutral-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Personalized Palette ({user.undertone || 'Warm'} Undertone)
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Based on your photo
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(user.recommended_palette || ['Camel', 'Olive', 'Navy', 'Terracotta']).map(
              (c, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700"
                >
                  {c}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Store Quick Selector */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-rose-500" />
            <span>Select Shopping Platform:</span>
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
            {selectedStore === 'all'
              ? 'Multi-Store Options'
              : `Preferred: ${selectedStore.toUpperCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {STORES.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStore(st.id as StoreType)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                selectedStore === st.id
                  ? 'bg-rose-600 text-white shadow-xs scale-102'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <span>{st.icon}</span>
              <span>{st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget Filter Pills */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Budget:
        </span>
        {(['All', 'Budget', 'Mid', 'Luxury'] as const).map((tier) => (
          <button
            key={tier}
            onClick={() => setBudgetFilter(tier)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              budgetFilter === tier
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            {tier === 'All'
              ? 'All'
              : tier === 'Budget'
              ? 'Budget (<₹999)'
              : tier === 'Mid'
              ? 'Mid (₹1k-₹3k)'
              : 'Luxury (₹3k+)'}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-3xl bg-neutral-100 dark:bg-neutral-800 animate-pulse space-y-3"
            >
              <div className="w-full aspect-[16/9] rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-4 w-3/4 rounded-md bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-3 w-1/2 rounded-md bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && filteredSuggestions.length > 0 && (
        <div className="space-y-4">
          {filteredSuggestions.map((item) => {
            const matchedItems = (item.matching_item_ids || [])
              .map((id) => clothes.find((c) => c.id === id))
              .filter((c): c is NonNullable<typeof c> => Boolean(c));

            const storeUrls = getStoreLinks(
              item.search_query || `${item.recommended_color} ${item.title}`
            );

            // Determine default action link based on selected store
            const primaryStoreKey: keyof typeof storeUrls =
              selectedStore === 'all'
                ? 'myntra'
                : (selectedStore as keyof typeof storeUrls);
            const primaryUrl = storeUrls[primaryStoreKey] || storeUrls.myntra;
            const primaryStoreLabel =
              selectedStore === 'all'
                ? 'Buy on Myntra'
                : `Buy on ${selectedStore.charAt(0).toUpperCase() + selectedStore.slice(1)}`;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs hover:shadow-md transition-all flex flex-col space-y-3 p-3.5"
              >
                {/* Photo & Badge */}
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  <img
                    src={
                      item.image_url ||
                      'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                    {item.category}
                  </div>
                  <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-xs">
                    {item.price_tier} • {item.estimated_price}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                    Recommended Color: {item.recommended_color}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                {/* Why it suits user */}
                {item.suitability_reason && (
                  <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-700/60 text-[11px] text-neutral-600 dark:text-neutral-300">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      Why it suits you:{' '}
                    </span>
                    {item.suitability_reason}
                  </div>
                )}

                {/* Matching existing wardrobe clothes preview */}
                {matchedItems.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1.5">
                      Pairs with {matchedItems.length} items in your wardrobe:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {matchedItems.map((matched) => (
                        <div
                          key={matched.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-600 shrink-0"
                        >
                          <img
                            src={matched.image_url}
                            alt={matched.subcategory}
                            className="w-5 h-5 rounded-md object-cover"
                          />
                          <span className="text-[10px] font-medium text-neutral-800 dark:text-neutral-200">
                            {matched.subcategory}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Store Action Links Grid */}
                <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-700">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                    <span>Direct Store Searches:</span>
                    <span>Tap to view live products</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {/* Myntra */}
                    <a
                      href={storeUrls.myntra}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex flex-col items-center justify-center transition-all shadow-2xs"
                      title="Search on Myntra"
                    >
                      <span className="text-xs">👗</span>
                      <span>Myntra</span>
                    </a>

                    {/* Amazon */}
                    <a
                      href={storeUrls.amazon}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold flex flex-col items-center justify-center transition-all shadow-2xs"
                      title="Search on Amazon India"
                    >
                      <span className="text-xs">📦</span>
                      <span>Amazon</span>
                    </a>

                    {/* Flipkart */}
                    <a
                      href={storeUrls.flipkart}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold flex flex-col items-center justify-center transition-all shadow-2xs"
                      title="Search on Flipkart"
                    >
                      <span className="text-xs">⚡</span>
                      <span>Flipkart</span>
                    </a>

                    {/* Meesho */}
                    <a
                      href={storeUrls.meesho}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-1 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 dark:bg-fuchsia-950/40 dark:hover:bg-fuchsia-900/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 text-[11px] font-bold flex flex-col items-center justify-center transition-all shadow-2xs"
                      title="Search on Meesho"
                    >
                      <span className="text-xs">🏷️</span>
                      <span>Meesho</span>
                    </a>
                  </div>

                  {/* Primary Large Buy Button */}
                  <a
                    href={primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{primaryStoreLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredSuggestions.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
          <ShoppingBag className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            No suggestions found for this budget filter
          </p>
          <button
            onClick={() => setBudgetFilter('All')}
            className="mt-3 px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-xs font-medium"
          >
            Show All Budgets
          </button>
        </div>
      )}
    </div>
  );
}
