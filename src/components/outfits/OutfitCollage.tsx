'use client';

import React from 'react';
import { ClothingItem } from '@/lib/types';

interface OutfitCollageProps {
  items: ClothingItem[];
  title?: string;
  className?: string;
}

export default function OutfitCollage({ items, title, className = '' }: OutfitCollageProps) {
  if (!items || items.length === 0) {
    return (
      <div className="w-full aspect-[4/3] rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">
        No outfit items to display
      </div>
    );
  }

  // Sort items in logical fashion sequence: Outerwear -> Tops/Dresses -> Bottoms -> Footwear -> Accessories
  const sortOrder: Record<string, number> = {
    Outerwear: 1,
    Dresses: 2,
    Ethnic: 2,
    Tops: 3,
    Bottoms: 4,
    Footwear: 5,
    Accessories: 6,
  };

  const sortedItems = [...items].sort((a, b) => {
    const orderA = sortOrder[a.category] || 99;
    const orderB = sortOrder[b.category] || 99;
    return orderA - orderB;
  });

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs ${className}`}
    >
      {/* Dynamic Grid Layout according to count */}
      {sortedItems.length === 1 && (
        <div className="relative aspect-square w-full">
          <img
            src={sortedItems[0].image_url}
            alt={sortedItems[0].subcategory}
            className="w-full h-full object-cover"
          />
          <CollageBadge item={sortedItems[0]} />
        </div>
      )}

      {sortedItems.length === 2 && (
        <div className="grid grid-cols-2 gap-1 aspect-[4/3] p-1 bg-white dark:bg-neutral-900">
          {sortedItems.map((item) => (
            <div key={item.id} className="relative rounded-xl overflow-hidden h-full">
              <img
                src={item.image_url}
                alt={item.subcategory}
                className="w-full h-full object-cover"
              />
              <CollageBadge item={item} />
            </div>
          ))}
        </div>
      )}

      {sortedItems.length === 3 && (
        <div className="grid grid-cols-3 gap-1 aspect-[16/10] p-1 bg-white dark:bg-neutral-900">
          {/* Main primary item taking 2 columns or left split */}
          <div className="col-span-2 relative rounded-xl overflow-hidden h-full">
            <img
              src={sortedItems[0].image_url}
              alt={sortedItems[0].subcategory}
              className="w-full h-full object-cover"
            />
            <CollageBadge item={sortedItems[0]} />
          </div>
          <div className="col-span-1 grid grid-rows-2 gap-1 h-full">
            {sortedItems.slice(1).map((item) => (
              <div key={item.id} className="relative rounded-xl overflow-hidden h-full">
                <img
                  src={item.image_url}
                  alt={item.subcategory}
                  className="w-full h-full object-cover"
                />
                <CollageBadge item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedItems.length >= 4 && (
        <div className="grid grid-cols-2 gap-1.5 aspect-square p-1.5 bg-white dark:bg-neutral-900">
          {sortedItems.slice(0, 4).map((item) => (
            <div key={item.id} className="relative rounded-xl overflow-hidden h-full bg-neutral-100 dark:bg-neutral-800">
              <img
                src={item.image_url}
                alt={item.subcategory}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <CollageBadge item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CollageBadge({ item }: { item: ClothingItem }) {
  return (
    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
      <div className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] font-semibold truncate max-w-[85%]">
        {item.category}: {item.subcategory}
      </div>
      {item.color_hex && (
        <span
          className="w-2.5 h-2.5 rounded-full border border-white shadow-xs shrink-0"
          style={{ backgroundColor: item.color_hex }}
        />
      )}
    </div>
  );
}
