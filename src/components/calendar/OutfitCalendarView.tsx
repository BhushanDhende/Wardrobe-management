'use client';

import React, { useState } from 'react';
import { useWardrobe } from '@/lib/store';
import { Outfit, OutfitSchedule } from '@/lib/types';
import OutfitCollage from '../outfits/OutfitCollage';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OutfitCalendarView() {
  const {
    outfits,
    clothes,
    schedules,
    scheduleOutfit,
    deleteSchedule,
    toggleScheduleWorn,
    setSelectedOutfitForTryOn,
  } = useWardrobe();

  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-19');
  const [todayStr, setTodayStr] = useState<string>('2026-11-19');
  const [days, setDays] = useState<string[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>(
    outfits[0]?.id || ''
  );
  const [notes, setNotes] = useState('');

  // Generate 14-day rolling window on client mount
  React.useEffect(() => {
    const today = new Date();
    const tStr = today.toISOString().split('T')[0];
    setSelectedDate(tStr);
    setTodayStr(tStr);

    const generatedDays = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 4 + i);
      return d.toISOString().split('T')[0];
    });
    setDays(generatedDays);
    setMounted(true);
  }, []);

  const schedulesForSelectedDay = schedules.filter(
    (s) => s.scheduled_date === selectedDate
  );

  const pastWornHistory = schedules
    .filter((s) => s.worn)
    .sort(
      (a, b) =>
        new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
    );

  const handleAddSchedule = () => {
    if (!selectedOutfitId) return;
    scheduleOutfit(selectedOutfitId, selectedDate, notes);
    setIsScheduleModalOpen(false);
    setNotes('');
  };

  const handleToggleWorn = (scheduleId: string) => {
    toggleScheduleWorn(scheduleId);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
    });
  };

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs space-y-4 animate-pulse">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-md w-1/3" />
        <div className="h-14 bg-neutral-200 dark:bg-neutral-700 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Outfit Calendar & Wear History
            </h3>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Plan daily looks & track wear cycles
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-white text-xs font-semibold flex items-center gap-1 hover:bg-neutral-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Plan</span>
        </button>
      </div>

      {/* Date Selector Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2">
        {days.map((dateStr) => {
          const dateObj = new Date(dateStr + 'T00:00:00');
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = dateObj.getDate();

          const hasWorn = schedules.some((s) => s.scheduled_date === dateStr && s.worn);
          const hasScheduled = schedules.some(
            (s) => s.scheduled_date === dateStr && !s.worn
          );

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center justify-center min-w-[50px] py-2.5 px-2 rounded-2xl border transition-all shrink-0 ${
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs scale-102'
                  : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
              }`}
            >
              <span className="text-[9px] font-semibold uppercase">{dayName}</span>
              <span className="text-sm font-bold mt-0.5">{dayNum}</span>

              {/* Status Dot */}
              <div className="flex gap-1 mt-1">
                {hasWorn && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Worn" />
                )}
                {hasScheduled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Scheduled" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day's Outfits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-900 dark:text-white">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </span>
          {schedulesForSelectedDay.length > 0 && (
            <span className="text-[10px] text-neutral-500">
              {schedulesForSelectedDay.length} planned
            </span>
          )}
        </div>

        {schedulesForSelectedDay.length > 0 ? (
          <div className="space-y-3">
            {schedulesForSelectedDay.map((sched) => {
              const outfit = outfits.find((o) => o.id === sched.outfit_id);
              if (!outfit) return null;

              const outfitItems = outfit.item_ids
                .map((id) => clothes.find((c) => c.id === id))
                .filter(Boolean) as any[];

              return (
                <div
                  key={sched.id}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700 space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        {outfit.occasion}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white mt-1">
                        {outfit.title}
                      </h4>
                      {sched.notes && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {sched.notes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => deleteSchedule(sched.id)}
                      className="text-neutral-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Collage */}
                  <OutfitCollage items={outfitItems} />

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleToggleWorn(sched.id)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        sched.worn
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{sched.worn ? 'Worn' : 'Mark as Worn'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedOutfitForTryOn(outfit)}
                      className="py-1.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Try on</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-dashed border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              No outfit planned for this date
            </p>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold"
            >
              + Plan an Outfit
            </button>
          </div>
        )}
      </div>

      {/* Plan Outfit Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Plan Outfit for {selectedDate}
            </h3>

            {outfits.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Select Outfit
                  </label>
                  <select
                    value={selectedOutfitId}
                    onChange={(e) => setSelectedOutfitId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs"
                  >
                    {outfits.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title} ({o.occasion})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Notes / Event
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Dinner with clients"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSchedule}
                    className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                You have no saved outfits yet. Generate an outfit in the Outfits tab first!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
