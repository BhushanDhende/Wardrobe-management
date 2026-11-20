'use client';

import React from 'react';
import { useWardrobe } from '@/lib/store';
import { Sparkles, Plus } from 'lucide-react';

export default function TopHeader() {
  const { setIsAddModalOpen } = useWardrobe();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-colors">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-rose-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-600 bg-clip-text text-transparent">
              WardrobeAI
            </h1>
            <p className="text-[10px] text-neutral-500 font-medium leading-none">
              Smart Wardrobe & Virtual Try-On
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-neutral-900 text-white shadow-sm active:scale-95 transition-all hover:bg-neutral-800"
            title="Add clothing item"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </header>
  );
}
