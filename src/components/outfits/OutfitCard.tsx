'use client';

import React from 'react';
import { Outfit } from '@/lib/types';
import { useWardrobe } from '@/lib/store';
import OutfitCollage from './OutfitCollage';
import { Sparkles, Calendar, Check, Trash2, Tag, Shirt } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OutfitCardProps {
  outfit: Outfit;
  onSchedule?: (outfit: Outfit) => void;
}

export default function OutfitCard({ outfit, onSchedule }: OutfitCardProps) {
  const {
    clothes,
    deleteOutfit,
    markOutfitWornToday,
    setSelectedOutfitForTryOn,
  } = useWardrobe();

  // Look up actual clothing items by IDs
  const outfitItems = outfit.item_ids
    .map((id) => clothes.find((c) => c.id === id))
    .filter(Boolean) as any[];

  const handleWornToday = () => {
    markOutfitWornToday(outfit.id);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f43f5e', '#3b82f6', '#10b981'],
    });
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs hover:shadow-md transition-all flex flex-col space-y-3 p-3.5">
      {/* Header with Title & Occasion badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 mb-1">
            {outfit.occasion}
          </span>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
            {outfit.title}
          </h3>
          {(outfit.weather || outfit.mood) && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {outfit.weather} {outfit.mood ? `• ${outfit.mood}` : ''}
            </p>
          )}
        </div>

        <button
          onClick={() => deleteOutfit(outfit.id)}
          className="text-neutral-400 hover:text-red-500 p-1 rounded-full transition-colors"
          title="Delete outfit"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Outfit Visual Collage */}
      <OutfitCollage items={outfitItems} title={outfit.title} />

      {/* Styling Notes */}
      {outfit.styling_notes && (
        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <p className="font-semibold text-neutral-900 dark:text-white mb-0.5">Stylist Advice:</p>
          <p>{outfit.styling_notes}</p>
        </div>
      )}

      {/* Color harmony note */}
      {outfit.color_harmony && (
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 italic px-1">
          🎨 {outfit.color_harmony}
        </p>
      )}

      {/* Action Buttons */}
      <div className="pt-1 grid grid-cols-3 gap-1.5 border-t border-neutral-100 dark:border-neutral-700/60">
        {/* Try On Me */}
        <button
          onClick={() => setSelectedOutfitForTryOn(outfit)}
          className="py-2 px-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all col-span-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try on me</span>
        </button>

        {/* Mark Worn Today */}
        <button
          onClick={handleWornToday}
          className="py-2 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-[11px] font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all col-span-1"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Worn today</span>
        </button>

        {/* Schedule */}
        <button
          onClick={() => onSchedule?.(outfit)}
          className="py-2 px-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-[11px] font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all col-span-1"
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Plan date</span>
        </button>
      </div>
    </div>
  );
}
