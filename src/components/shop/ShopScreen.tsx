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
} from 'lucide-react';

export default function ShopScreen() {
  const { clothes, user, suggestions, setSuggestions } = useWardrobe();

  const [budgetFilter, setBudgetFilter] = useState<'All' | PriceTier>('All');
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
            AI wardrobe gap analysis & color-matched recommendations
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
              ? 'Budget (<$50)'
              : tier === 'Mid'
              ? 'Mid ($50-$150)'
              : 'Luxury ($150+)'}
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
            // Find existing wardrobe matching items
            const matchedItems = (item.matching_item_ids || [])
              .map((id) => clothes.find((c) => c.id === id))
              .filter((c): c is NonNullable<typeof c> => Boolean(c));

            const shoppingUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(
              item.search_query || `${item.recommended_color} ${item.title}`
            )}`;

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

                {/* Buy Button */}
                <a
                  href={shoppingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Search & Buy Online</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
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
