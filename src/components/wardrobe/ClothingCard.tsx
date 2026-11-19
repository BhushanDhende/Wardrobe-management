'use client';

import React from 'react';
import { ClothingItem } from '@/lib/types';
import { useWardrobe } from '@/lib/store';
import { Heart, Plus, Edit2 } from 'lucide-react';

interface ClothingCardProps {
  item: ClothingItem;
  onEdit: (item: ClothingItem) => void;
}

export default function ClothingCard({ item, onEdit }: ClothingCardProps) {
  const { toggleFavorite, incrementWearCount } = useWardrobe();

  return (
    <div className="group bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs hover:shadow-md transition-all flex flex-col">
      {/* Image container */}
      <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
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
          onClick={() => onEdit(item)}
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
      </div>

      {/* Info Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">
              {item.category}
            </span>
            {item.color_hex && (
              <span
                className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-600"
                style={{ backgroundColor: item.color_hex }}
                title={item.color}
              />
            )}
          </div>

          <h3 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-1">
            {item.subcategory}
          </h3>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            {item.color} • {item.style}
          </p>
        </div>

        {item.brand && (
          <span className="mt-2 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
            {item.brand}
          </span>
        )}
      </div>
    </div>
  );
}
