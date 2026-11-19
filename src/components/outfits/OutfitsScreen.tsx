'use client';

import React, { useState } from 'react';
import { useWardrobe } from '@/lib/store';
import { Outfit } from '@/lib/types';
import OutfitGenerator from './OutfitGenerator';
import OutfitCard from './OutfitCard';
import { Sparkles, Bookmark, Calendar, Plus, X } from 'lucide-react';

export default function OutfitsScreen() {
  const { outfits, scheduleOutfit } = useWardrobe();
  const [subTab, setSubTab] = useState<'generator' | 'lookbook'>('generator');
  const [schedulingOutfit, setSchedulingOutfit] = useState<Outfit | null>(null);
  const [scheduleDate, setScheduleDate] = useState('2026-11-20');
  const [scheduleNotes, setScheduleNotes] = useState('');

  React.useEffect(() => {
    setScheduleDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  }, []);

  const handleConfirmSchedule = () => {
    if (!schedulingOutfit) return;
    scheduleOutfit(schedulingOutfit.id, scheduleDate, scheduleNotes);
    setSchedulingOutfit(null);
    setScheduleNotes('');
  };

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Sub Tabs Toggle */}
      <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80">
        <button
          onClick={() => setSubTab('generator')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'generator'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>AI Generator</span>
        </button>

        <button
          onClick={() => setSubTab('lookbook')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'lookbook'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
          <span>Lookbook ({outfits.length})</span>
        </button>
      </div>

      {subTab === 'generator' ? (
        <OutfitGenerator />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Saved Outfits ({outfits.length})
            </h2>
            <button
              onClick={() => setSubTab('generator')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate new</span>
            </button>
          </div>

          {outfits.length > 0 ? (
            <div className="space-y-4">
              {outfits.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  onSchedule={(target) => setSchedulingOutfit(target)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                Lookbook is empty
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mb-4">
                Use the AI Outfit Architect to generate personalized combinations and save your favorites here.
              </p>
              <button
                onClick={() => setSubTab('generator')}
                className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold"
              >
                Go to AI Generator
              </button>
            </div>
          )}
        </div>
      )}

      {/* Schedule on Calendar Modal */}
      {schedulingOutfit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Schedule Outfit
                </h3>
              </div>
              <button
                onClick={() => setSchedulingOutfit(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              "{schedulingOutfit.title}"
            </p>

            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Event / Notes (Optional)
              </label>
              <input
                type="text"
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                placeholder="e.g. Client presentation, dinner with friends"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSchedulingOutfit(null)}
                className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
