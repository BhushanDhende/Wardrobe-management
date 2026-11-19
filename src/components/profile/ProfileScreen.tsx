'use client';

import React, { useState, useRef } from 'react';
import { useWardrobe } from '@/lib/store';
import { ClothingStyle, PriceTier, PhotoAnalysisResult } from '@/lib/types';
import { compressImage } from '@/lib/imageCompressor';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  User,
  Camera,
  UploadCloud,
  Check,
  ShieldCheck,
  Trash2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Palette,
  Sliders,
  DollarSign,
  Sun,
  Moon,
  Database,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const STYLES: ClothingStyle[] = [
  'Casual',
  'Formal',
  'Party',
  'Ethnic',
  'Streetwear',
  'Minimalist',
  'Sporty',
];

const POPULAR_COLORS = [
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Warm Beige', hex: '#D2B48C' },
  { name: 'Emerald Green', hex: '#065F46' },
  { name: 'Charcoal Black', hex: '#1F2937' },
  { name: 'Terracotta', hex: '#C2410C' },
  { name: 'Burgundy', hex: '#831843' },
  { name: 'Olive Green', hex: '#3F6212' },
  { name: 'Cream / White', hex: '#F9FAFB' },
];

export default function ProfileScreen() {
  const {
    user,
    updateProfile,
    profilePhotos,
    defaultPhoto,
    addProfilePhoto,
    setDefaultPhoto,
    deleteProfilePhoto,
    deleteAllUserPhotos,
    darkMode,
    toggleDarkMode,
    resetToDemo,
  } = useWardrobe();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'preferences' | 'photos' | 'privacy'>('preferences');
  const [name, setName] = useState(user.name);
  const [gender, setGender] = useState(user.gender);
  const [budgetTier, setBudgetTier] = useState<PriceTier>(user.budget_tier);
  const [selectedStyles, setSelectedStyles] = useState<ClothingStyle[]>(user.preferred_styles);
  const [favoriteColors, setFavoriteColors] = useState<string[]>(user.favorite_colors);

  // Photo Upload & Consent State
  const [consentGiven, setConsentGiven] = useState(user.photo_consent);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedPreferencesToast, setSavedPreferencesToast] = useState(false);

  const toggleStyle = (style: ClothingStyle) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const toggleColor = (colorName: string) => {
    setFavoriteColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const handleSavePreferences = () => {
    updateProfile({
      name: name.trim() || user.name,
      gender,
      budget_tier: budgetTier,
      preferred_styles: selectedStyles,
      favorite_colors: favoriteColors,
      photo_consent: consentGiven,
    });
    setSavedPreferencesToast(true);
    setTimeout(() => setSavedPreferencesToast(false), 2000);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!consentGiven) {
      setPhotoError('Please accept the privacy consent checkbox before uploading photos.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoError(null);

      // 1. Compress image to max 1024px
      const compressed = await compressImage(file, 1024, 0.85);

      // 2. Call Gemini Vision to analyze skin tone & body type
      let analysisResult: PhotoAnalysisResult | undefined;
      try {
        const res = await fetch('/api/analyze-profile-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: compressed.base64Data,
            mimeType: compressed.mimeType,
          }),
        });
        if (res.ok) {
          analysisResult = await res.json();
        }
      } catch (err) {
        console.warn('Profile photo analysis error:', err);
      }

      // 3. Save photo
      await addProfilePhoto(compressed.dataUrl, analysisResult);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      console.error(err);
      setPhotoError('Failed to upload photo. Please try a different image.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteAllPhotos = () => {
    deleteAllUserPhotos();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="pb-24 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* User Header Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-base border border-neutral-200 dark:border-neutral-700">
            {defaultPhoto ? (
              <img src={defaultPhoto.image_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">{user.name}</h2>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{user.email}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {isSupabaseConfigured ? 'Supabase Synced' : 'Private Local Storage Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Dark Mode Button */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
          title="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80">
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'preferences'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500'
          }`}
        >
          Preferences
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'photos'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500'
          }`}
        >
          My Photos ({profilePhotos.length})
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500'
          }`}
        >
          Privacy
        </button>
      </div>

      {/* 1. Style Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs"
            />
          </div>

          {/* Gender Expression */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Gender Expression
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Men', 'Women', 'Unisex'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    gender === g
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Budget Tier */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Shopping Budget Preference
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Budget', 'Mid', 'Luxury'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudgetTier(b)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    budgetTier === b
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {b === 'Budget' ? '$ Budget' : b === 'Mid' ? '$$ Mid-range' : '$$$ Luxury'}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Styles */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Preferred Styles (Select multiple)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((st) => {
                const isSelected = selectedStyles.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleStyle(st)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorite Colors */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Favorite Colors
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {POPULAR_COLORS.map((col) => {
                const isSelected = favoriteColors.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => toggleColor(col.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 shrink-0"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="truncate">{col.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-rose-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSavePreferences}
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-neutral-900 text-xs font-bold transition-all"
          >
            {savedPreferencesToast ? 'Preferences Saved!' : 'Save Style Preferences'}
          </button>
        </div>
      )}

      {/* 2. My Photos Tab (For Virtual Try-On) */}
      {activeTab === 'photos' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Virtual Try-On Photos
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Upload full-body, front-facing photos. Gemini uses your photo to fit clothes and detect your skin tone and body type.
            </p>
          </div>

          {/* Privacy Consent Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              I consent to WardrobeAI analyzing my photo for virtual try-on, body type, and skin tone analysis. Photos are stored securely in my private profile and can be permanently deleted at any time.
            </span>
          </label>

          {photoError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{photoError}</span>
            </div>
          )}

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isUploadingPhoto || !consentGiven}
              onClick={() => cameraInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </button>

            <button
              type="button"
              disabled={isUploadingPhoto || !consentGiven}
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Gallery</span>
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
              }}
            />
          </div>

          {isUploadingPhoto && (
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-center space-y-1.5">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Compressing photo & analyzing skin tone with Gemini...
              </p>
            </div>
          )}

          {/* Photo Gallery Grid */}
          {profilePhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {profilePhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative rounded-2xl overflow-hidden aspect-[3/4] border-2 bg-neutral-100 dark:bg-neutral-800 flex flex-col justify-between ${
                    photo.is_default ? 'border-rose-500 shadow-md' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <img src={photo.image_url} alt="Profile photo" className="w-full h-full object-cover" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    {photo.is_default ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold shadow-xs">
                        Default Model
                      </span>
                    ) : (
                      <button
                        onClick={() => setDefaultPhoto(photo.id)}
                        className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-semibold hover:bg-black/80"
                      >
                        Set Default
                      </button>
                    )}

                    <button
                      onClick={() => deleteProfilePhoto(photo.id)}
                      className="p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {photo.skin_tone_detected && (
                    <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[9px]">
                      <span className="block font-semibold truncate">
                        {photo.skin_tone_detected}
                      </span>
                      {photo.body_type_detected && (
                        <span className="text-neutral-300 block truncate">
                          {photo.body_type_detected}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700">
              <Camera className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                No full-body photos yet
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Upload one above to activate AI virtual try-on
              </p>
            </div>
          )}

          {/* Detected Profile Attributes Card */}
          {user.skin_tone && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 dark:from-neutral-900 dark:to-neutral-950 border border-amber-200 dark:border-neutral-700 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Detected Profile Analysis</span>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300">
                <strong>Skin Tone:</strong> {user.skin_tone} ({user.undertone} undertone)
              </p>
              {user.body_type && (
                <p className="text-neutral-700 dark:text-neutral-300">
                  <strong>Body Type:</strong> {user.body_type}
                </p>
              )}
              {user.recommended_palette && (
                <p className="text-neutral-700 dark:text-neutral-300">
                  <strong>Colors that suit you:</strong> {user.recommended_palette.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Privacy & Permanent Delete Tab */}
      {activeTab === 'privacy' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Data Privacy & Security
            </h3>
          </div>

          <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            <p>
              • <strong>Your photos are 100% private:</strong> Photos you upload for Virtual Try-On are processed securely and never made public or used for training models without explicit consent.
            </p>
            <p>
              • <strong>Client-side Compression:</strong> Photos are downscaled to 1024px before transmission, preventing large payloads.
            </p>
            <p>
              • <strong>Row-Level Security (RLS):</strong> When connected to Supabase, all database tables enforce user-specific RLS policies so only you can read or edit your clothes.
            </p>
          </div>

          {/* Permanent Delete Action */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700/80 space-y-2">
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
              Permanent Photo Removal
            </h4>
            <p className="text-[11px] text-neutral-500">
              Permanently delete all full-body photos and virtual try-on history from the database and storage.
            </p>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Photos Permanently</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-center space-y-2">
                <p className="text-xs font-bold text-red-700 dark:text-red-300">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllPhotos}
                    className="flex-1 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold"
                  >
                    Yes, Delete All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Data */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700/80">
            <button
              type="button"
              onClick={() => {
                resetToDemo();
                alert('Reset wardrobe to rich sample demo items!');
              }}
              className="w-full py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-200"
            >
              Reset to Sample Demo Wardrobe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
