'use client';

import React, { useState, useMemo } from 'react';
import { useWardrobe } from '@/lib/store';
import { ClothingItem, ClothingCategory, ClothingSeason, OccasionType } from '@/lib/types';
import ClothingCard from './ClothingCard';
import EditClothingModal from './EditClothingModal';
import {
  Search,
  SlidersHorizontal,
  Heart,
  Plus,
  Shirt,
  Sparkles,
  ArrowUpDown,
  X,
} from 'lucide-react';

const CATEGORIES: Array<'All' | ClothingCategory> = [
  'All',
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Footwear',
  'Accessories',
  'Ethnic',
];

const SEASONS: Array<'All' | ClothingSeason> = [
  'All',
  'Spring',
  'Summer',
  'Autumn',
  'Winter',
  'All-Season',
];

const OCCASIONS: Array<'All' | OccasionType> = [
  'All',
  'Office',
  'Party',
  'Date',
  'Wedding',
  'Casual',
  'Workout',
  'Travel',
  'Festive',
];

export default function WardrobeScreen() {
  const { clothes, setIsAddModalOpen } = useWardrobe();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ClothingCategory>('All');
  const [selectedSeason, setSelectedSeason] = useState<'All' | ClothingSeason>('All');
  const [selectedOccasion, setSelectedOccasion] = useState<'All' | OccasionType>('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'most_worn' | 'least_worn' | 'name'>('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  // Filter & Search Logic
  const filteredClothes = useMemo(() => {
    return clothes
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesSub = item.subcategory.toLowerCase().includes(q);
          const matchesCat = item.category.toLowerCase().includes(q);
          const matchesColor = item.color.toLowerCase().includes(q);
          const matchesBrand = item.brand?.toLowerCase().includes(q) || false;
          const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchesSub && !matchesCat && !matchesColor && !matchesBrand && !matchesTags) {
            return false;
          }
        }

        // Category
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // Season
        if (selectedSeason !== 'All' && item.season !== 'All-Season' && item.season !== selectedSeason) {
          return false;
        }

        // Occasion
        if (selectedOccasion !== 'All' && !item.occasions?.includes(selectedOccasion)) {
          return false;
        }

        // Favorites
        if (onlyFavorites && !item.is_favorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'most_worn') return b.wear_count - a.wear_count;
        if (sortBy === 'least_worn') return a.wear_count - b.wear_count;
        if (sortBy === 'name') return a.subcategory.localeCompare(b.subcategory);
        // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [clothes, searchQuery, selectedCategory, selectedSeason, selectedOccasion, onlyFavorites, sortBy]);

  const activeFiltersCount =
    (selectedSeason !== 'All' ? 1 : 0) +
    (selectedOccasion !== 'All' ? 1 : 0) +
    (onlyFavorites ? 1 : 0);

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Title Bar & Quick Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            My Wardrobe
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {clothes.length} items total • {clothes.filter((c) => c.is_favorite).length} favorites
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, color, brand, tags..."
          className="w-full pl-9 pr-9 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {/* Favorites Quick Filter */}
        <button
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            onlyFavorites
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800'
              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
          <span>Favorites</span>
        </button>

        {/* Filter Drawer Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              activeFiltersCount > 0
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pl-2.5 pr-6 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="most_worn">Most Worn</option>
              <option value="least_worn">Least Worn</option>
              <option value="name">Name</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isFilterOpen && (
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              Advanced Filters
            </span>
            <button
              onClick={() => {
                setSelectedSeason('All');
                setSelectedOccasion('All');
                setOnlyFavorites(false);
              }}
              className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline"
            >
              Reset all
            </button>
          </div>

          {/* Season Filter */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Season
            </label>
            <div className="flex flex-wrap gap-1">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSeason(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedSeason === s
                      ? 'bg-rose-600 text-white'
                      : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion Filter */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Occasion
            </label>
            <div className="flex flex-wrap gap-1">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ}
                  onClick={() => setSelectedOccasion(occ)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedOccasion === occ
                      ? 'bg-rose-600 text-white'
                      : 'bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clothes Grid View */}
      {filteredClothes.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredClothes.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onEdit={(target) => setEditingItem(target)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 px-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <Shirt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
            No clothing items found
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mb-4">
            Try adjusting your search filters or snap a photo of a new garment to add to your wardrobe.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clothes</span>
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <EditClothingModal
          item={editingItem}
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
