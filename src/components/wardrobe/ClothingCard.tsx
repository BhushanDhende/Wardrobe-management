'use client';

import React from 'react';
import { ClothingItem } from '@/lib/types';
import { useWardrobe } from '@/lib/store';
import { evaluateColorSuitability } from '@/lib/colorScience';
import { Heart, Plus, Edit2, Sparkles } from 'lucide-react';

interface ClothingCardProps {
  item: ClothingItem;
  onEdit: (item: ClothingItem) => void;
}

export default function ClothingCard({ item, onEdit }: ClothingCardProps) {
  const { toggleFavorite, incrementWearCount, setSelectedItemForPairing, user } = useWardrobe();

  const colorEval = evaluateColorSuitability(item, user);

  return (
    <div
      onClick={() => setSelectedItemForPairing(item)}
      className="group bg-white rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer active:scale-98"
    >
      {/* Image container */}
      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
        <img
          src={item.image_url}
          alt={item.subcategory}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
            item.is_favorite
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-black/30 text-white hover:bg-black/50'
          }`}
          title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${item.is_favorite ? 'fill-current' : ''}`} />
        </button>

        {/* Edit Button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          title="Edit item"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Wear count pill */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium">
          <span>Worn {item.wear_count}x</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              incrementWearCount(item.id);
            }}
            className="w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white"
            title="Mark worn today (+1)"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Smart Pair Badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[9px] font-bold text-neutral-800 flex items-center gap-0.5 shadow-2xs">
          <Sparkles className="w-2.5 h-2.5 text-rose-500" />
          <span>Match</span>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">
              {item.category}
            </span>
            {item.color_hex && (
              <span
                className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                style={{ backgroundColor: item.color_hex }}
                title={item.color}
              />
            )}
          </div>

          <h3 className="text-xs font-semibold text-neutral-900 line-clamp-1">
            {item.subcategory}
          </h3>

          <p className="text-[11px] text-neutral-500 truncate">
            {item.color} • {item.style}
          </p>

          {/* Color Suitability tag */}
          <div className="mt-1.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${colorEval.badgeBg}`}>
              {colorEval.badge}
            </span>
          </div>
        </div>

        {item.brand && (
          <span className="mt-2 text-[10px] text-neutral-400 font-medium truncate">
            {item.brand}
          </span>
        )}
      </div>
    </div>
  );
}
