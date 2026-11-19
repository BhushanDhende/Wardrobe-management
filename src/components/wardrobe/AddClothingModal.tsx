'use client';

import React, { useState, useRef } from 'react';
import { useWardrobe } from '@/lib/store';
import {
  ClothingCategory,
  ClothingSeason,
  ClothingStyle,
  OccasionType,
  ClothingAnalysisResult,
} from '@/lib/types';
import { compressImage } from '@/lib/imageCompressor';
import {
  X,
  Camera,
  UploadCloud,
  Sparkles,
  Loader2,
  Check,
  Tag,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES: ClothingCategory[] = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Footwear',
  'Accessories',
  'Ethnic',
];

const SEASONS: ClothingSeason[] = ['Spring', 'Summer', 'Autumn', 'Winter', 'All-Season'];

const STYLES: ClothingStyle[] = [
  'Casual',
  'Formal',
  'Party',
  'Ethnic',
  'Streetwear',
  'Minimalist',
  'Sporty',
];

const OCCASIONS: OccasionType[] = [
  'Office',
  'Party',
  'Date',
  'Wedding',
  'Casual',
  'Workout',
  'Travel',
  'Festive',
];

export default function AddClothingModal() {
  const { isAddModalOpen, setIsAddModalOpen, addClothingItem } = useWardrobe();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<ClothingCategory>('Tops');
  const [subcategory, setSubcategory] = useState('');
  const [color, setColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [colorHex, setColorHex] = useState('#1E3A8A');
  const [pattern, setPattern] = useState('Solid');
  const [season, setSeason] = useState<ClothingSeason>('All-Season');
  const [style, setStyle] = useState<ClothingStyle>('Casual');
  const [brand, setBrand] = useState('');
  const [selectedOccasions, setSelectedOccasions] = useState<OccasionType[]>(['Casual']);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  if (!isAddModalOpen) return null;

  const resetForm = () => {
    setImagePreview(null);
    setImageBase64(null);
    setIsAnalyzing(false);
    setIsSaving(false);
    setErrorMsg(null);
    setCategory('Tops');
    setSubcategory('');
    setColor('');
    setSecondaryColor('');
    setColorHex('#1E3A8A');
    setPattern('Solid');
    setSeason('All-Season');
    setStyle('Casual');
    setBrand('');
    setSelectedOccasions(['Casual']);
    setTags([]);
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    setIsAddModalOpen(false);
  };

  const processSelectedImage = async (file: File) => {
    try {
      setErrorMsg(null);
      setIsAnalyzing(true);

      // 1. Client-side compression (max 1024px)
      const compressed = await compressImage(file, 1024, 0.82);
      setImagePreview(compressed.dataUrl);
      setImageBase64(compressed.base64Data);

      // 2. Call Gemini Vision API
      const res = await fetch('/api/analyze-clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.base64Data,
          mimeType: compressed.mimeType,
        }),
      });

      if (!res.ok) {
        throw new Error('AI analysis service error');
      }

      const analysis: ClothingAnalysisResult = await res.json();

      // Pre-fill fields from AI detection
      if (analysis.category) setCategory(analysis.category);
      if (analysis.subcategory) setSubcategory(analysis.subcategory);
      if (analysis.color) setColor(analysis.color);
      if (analysis.secondary_color) setSecondaryColor(analysis.secondary_color);
      if (analysis.color_hex) setColorHex(analysis.color_hex);
      if (analysis.pattern) setPattern(analysis.pattern);
      if (analysis.season) setSeason(analysis.season);
      if (analysis.style) setStyle(analysis.style);
      if (analysis.brand) setBrand(analysis.brand);
      if (Array.isArray(analysis.occasions) && analysis.occasions.length > 0) {
        setSelectedOccasions(analysis.occasions);
      }
      if (Array.isArray(analysis.tags)) {
        setTags(analysis.tags);
      }
      if (analysis.notes) setNotes(analysis.notes);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not auto-detect clothing details. You can enter them manually below.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedImage(file);
    }
  };

  const toggleOccasion = (occ: OccasionType) => {
    setSelectedOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!imagePreview) {
      setErrorMsg('Please upload or snap a photo of your clothing item.');
      return;
    }
    if (!subcategory.trim()) {
      setErrorMsg('Please give your clothing item a name or subcategory.');
      return;
    }

    try {
      setIsSaving(true);
      await addClothingItem({
        image_url: imagePreview,
        category,
        subcategory: subcategory.trim(),
        color: color.trim() || 'Multi-color',
        secondary_color: secondaryColor.trim() || undefined,
        color_hex: colorHex,
        pattern,
        season,
        style,
        brand: brand.trim() || undefined,
        occasions: selectedOccasions.length > 0 ? selectedOccasions : ['Casual'],
        tags,
        is_favorite: false,
        notes: notes.trim() || undefined,
      });

      handleClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md max-h-[92vh] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Add Clothing Item
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* Photo Capture / Upload Area */}
          {!imagePreview ? (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 text-center hover:border-rose-500 dark:hover:border-rose-400 transition-all bg-neutral-50 dark:bg-neutral-800/50">
                <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                  Upload or Snap Photo
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  Gemini AI auto-detects category, color, pattern, style, and season
                </p>

                <div className="flex gap-2 justify-center">
                  {/* Camera Snap */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>

                  {/* Gallery Upload */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-xs font-semibold active:scale-95 transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Gallery</span>
                  </button>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-square max-h-56 mx-auto bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Uploaded item"
                className="w-full h-full object-cover"
              />

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-400 mb-2" />
                  <p className="text-xs font-semibold">Gemini Vision is analyzing garment...</p>
                  <p className="text-[10px] text-neutral-300 mt-1">
                    Detecting category, color palette, style, and fabric
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageBase64(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Change photo"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2 border border-amber-200 dark:border-amber-900">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Fields (Editable after auto-detection) */}
          <div className="space-y-3 pt-1">
            {/* Subcategory / Title */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Item Name / Subcategory *
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Classic White Oxford Shirt"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      category === cat
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Color & Pattern */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Navy Blue"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Pattern
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g. Solid, Striped"
                  className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Season & Style */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Season
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value as ClothingSeason)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as ClothingStyle)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {STYLES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Brand (Optional)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Zara, Uniqlo, Levi's"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Occasions Multi-select */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Occasions (Select matching)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((occ) => {
                  const isSelected = selectedOccasions.includes(occ);
                  return (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => toggleOccasion(occ)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {occ}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Tags
              </label>
              <div className="flex gap-1.5 mb-1.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag & press enter"
                  className="flex-1 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px]"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Stylist Notes / Fit
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Slim fit, tuck in with brown leather belt"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!imagePreview || isAnalyzing || isSaving}
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save to Wardrobe</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
