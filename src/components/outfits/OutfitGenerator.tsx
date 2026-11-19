'use client';

import React, { useState } from 'react';
import { useWardrobe } from '@/lib/store';
import { OccasionType, WeatherType, MoodType, Outfit } from '@/lib/types';
import OutfitCollage from './OutfitCollage';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  BookmarkPlus,
  Check,
  AlertCircle,
  Sun,
  CloudRain,
  Smile,
  Briefcase,
  GlassWater,
  Heart,
  Plane,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const OCCASIONS: Array<{ id: OccasionType; label: string; icon: string }> = [
  { id: 'Office', label: 'Office', icon: '💼' },
  { id: 'Casual', label: 'Casual', icon: '☕' },
  { id: 'Date', label: 'Date Night', icon: '🍷' },
  { id: 'Party', label: 'Party', icon: '🎉' },
  { id: 'Wedding', label: 'Wedding', icon: '💍' },
  { id: 'Festive', label: 'Festive', icon: '✨' },
  { id: 'Travel', label: 'Travel', icon: '✈️' },
  { id: 'Workout', label: 'Workout', icon: '👟' },
];

const WEATHERS: WeatherType[] = [
  'Sunny & Warm',
  'Hot & Humid',
  'Cool & Breezy',
  'Cold & Rainy',
  'Freezing',
];

const MOODS: MoodType[] = [
  'Confident',
  'Effortless & Relaxed',
  'Elegant & Chic',
  'Bold & Vibrant',
  'Cozy',
];

export default function OutfitGenerator() {
  const {
    clothes,
    user,
    saveOutfit,
    markOutfitWornToday,
    setSelectedOutfitForTryOn,
  } = useWardrobe();

  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>('Office');
  const [selectedWeather, setSelectedWeather] = useState<WeatherType>('Cool & Breezy');
  const [selectedMood, setSelectedMood] = useState<MoodType>('Confident');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<{
    title: string;
    occasion: OccasionType;
    weather: WeatherType;
    mood: MoodType;
    item_ids: string[];
    styling_notes: string;
    color_harmony: string;
  } | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (clothes.length === 0) {
      setErrorMsg('Please add at least a few clothing items to your wardrobe first.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg(null);
      setIsSaved(false);

      const res = await fetch('/api/generate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothes,
          occasion: selectedOccasion,
          weather: selectedWeather,
          mood: selectedMood,
          userProfile: user,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate outfit');
      }

      const data = await res.json();
      setGeneratedOutfit({
        ...data,
        occasion: selectedOccasion,
        weather: selectedWeather,
        mood: selectedMood,
      });

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate outfit with Gemini');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedOutfit) return;
    saveOutfit(generatedOutfit);
    setIsSaved(true);
  };

  const handleMarkWorn = () => {
    if (!generatedOutfit) return;
    const saved = saveOutfit(generatedOutfit);
    markOutfitWornToday(saved.id);
    setIsSaved(true);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.8 },
    });
  };

  const generatedItems = generatedOutfit
    ? generatedOutfit.item_ids
        .map((id) => clothes.find((c) => c.id === id))
        .filter(Boolean) as any[]
    : [];

  return (
    <div className="space-y-4">
      {/* Parameters Selector Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              AI Outfit Architect
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Curates cohesive looks tailored to weather, occasion, and your skin tone
            </p>
          </div>
        </div>

        {/* 1. Occasion Picker */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
            1. Select Occasion
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {OCCASIONS.map((occ) => {
              const isSelected = selectedOccasion === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => setSelectedOccasion(occ.id)}
                  className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs scale-102 font-semibold'
                      : 'bg-neutral-100 dark:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span className="text-base mb-0.5">{occ.icon}</span>
                  <span className="text-[10px] leading-tight truncate w-full px-1">
                    {occ.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Weather & Mood */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
              2. Weather
            </label>
            <select
              value={selectedWeather}
              onChange={(e) => setSelectedWeather(e.target.value as WeatherType)}
              className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500"
            >
              {WEATHERS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
              3. Desired Mood
            </label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value as MoodType)}
              className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500"
            >
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerate}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-60"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gemini AI is matching colors & styling...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Outfit</span>
            </>
          )}
        </button>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Generated Result Display */}
      {generatedOutfit && (
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-4 border border-rose-200 dark:border-rose-900/60 shadow-md space-y-3.5 animate-in fade-in duration-300">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                AI Suggested Outfit
              </span>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                {generatedOutfit.title}
              </h3>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              title="Regenerate another combination"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Collage */}
          <OutfitCollage items={generatedItems} title={generatedOutfit.title} />

          {/* Stylist Advice */}
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
            <p className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <span>Why this works:</span>
            </p>
            <p className="text-[11px] leading-relaxed">{generatedOutfit.styling_notes}</p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 italic pt-1 border-t border-neutral-200/60 dark:border-neutral-800">
              Color harmony: {generatedOutfit.color_harmony}
            </p>
          </div>

          {/* Action Buttons: Save, Regenerate, Mark as worn today, Try on me */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Try On Me */}
            <button
              onClick={() => {
                const tempOutfit: Outfit = {
                  id: `temp_${Date.now()}`,
                  user_id: user.id,
                  ...generatedOutfit,
                  created_at: new Date().toISOString(),
                };
                setSelectedOutfitForTryOn(tempOutfit);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all col-span-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Virtual Try-On (Try on me)</span>
            </button>

            {/* Save Outfit */}
            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                  : 'bg-white dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 text-neutral-800 dark:text-white hover:bg-neutral-50'
              }`}
            >
              {isSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              <span>{isSaved ? 'Saved in Lookbook' : 'Save Outfit'}</span>
            </button>

            {/* Mark as worn today */}
            <button
              onClick={handleMarkWorn}
              className="py-2.5 px-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Mark as worn today</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
