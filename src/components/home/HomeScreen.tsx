'use client';

import React from 'react';
import { useWardrobe } from '@/lib/store';
import OutfitCard from '../outfits/OutfitCard';
import OutfitCalendarView from '../calendar/OutfitCalendarView';
import {
  Sparkles,
  Shirt,
  Heart,
  TrendingUp,
  Plus,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function HomeScreen() {
  const {
    user,
    clothes,
    outfits,
    profilePhotos,
    setActiveTab,
    setIsAddModalOpen,
    setSelectedOutfitForTryOn,
  } = useWardrobe();

  const favoriteCount = clothes.filter((c) => c.is_favorite).length;
  const totalWorn = clothes.reduce((sum, c) => sum + c.wear_count, 0);

  // Today's featured outfit (either first saved outfit or a placeholder prompt)
  const featuredOutfit = outfits[0];

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white shadow-xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-semibold backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>AI Fashion Concierge</span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            Hello, {user.name.split(' ')[0]}
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed max-w-xs">
            {user.skin_tone
              ? `Curated for your ${user.skin_tone} palette & ${user.preferred_styles[0] || 'modern'} style.`
              : 'Upload a photo to unlock automated skin tone & body type styling.'}
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('outfits')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Today's Look</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Clothes</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-6 -bottom-8 w-36 h-36 bg-gradient-to-tr from-rose-500/30 to-indigo-500/30 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Wardrobe Quick Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveTab('wardrobe')}
          className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-left transition-all hover:border-neutral-400"
        >
          <Shirt className="w-4 h-4 text-rose-500 mb-1" />
          <div className="text-base font-bold text-neutral-900 dark:text-white">
            {clothes.length}
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
            Clothes in Closet
          </div>
        </button>

        <button
          onClick={() => setActiveTab('wardrobe')}
          className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-left transition-all hover:border-neutral-400"
        >
          <Heart className="w-4 h-4 text-rose-500 mb-1" />
          <div className="text-base font-bold text-neutral-900 dark:text-white">
            {favoriteCount}
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
            Favorites
          </div>
        </button>

        <div className="p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-left">
          <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
          <div className="text-base font-bold text-neutral-900 dark:text-white">
            {totalWorn}x
          </div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
            Total Times Worn
          </div>
        </div>
      </div>

      {/* Virtual Try-On Highlight CTA */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-50 via-white to-indigo-50 dark:from-neutral-800 dark:via-neutral-800/80 dark:to-neutral-900 border border-rose-200/70 dark:border-neutral-700 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Virtual Try-On
              </h3>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                AI fitting room keeping your pose & skin tone unchanged
              </p>
            </div>
          </div>
        </div>

        {profilePhotos.length === 0 ? (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Upload your full-body photo in Profile to unlock live try-ons!
            </p>
            <button
              onClick={() => setActiveTab('profile')}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shrink-0"
            >
              Upload Photo
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Your model photo is ready. Tap any outfit to try it on yourself!
            </p>
            {featuredOutfit && (
              <button
                onClick={() => setSelectedOutfitForTryOn(featuredOutfit)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0"
              >
                Try on Look #1
              </button>
            )}
          </div>
        )}
      </div>

      {/* Featured Outfit of the Day */}
      {featuredOutfit && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Today's Recommended Outfit
            </h3>
            <button
              onClick={() => setActiveTab('outfits')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <OutfitCard outfit={featuredOutfit} />
        </div>
      )}

      {/* Outfit Calendar & History */}
      <OutfitCalendarView />
    </div>
  );
}
