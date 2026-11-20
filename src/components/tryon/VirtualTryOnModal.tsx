'use client';

import React, { useState } from 'react';
import { useWardrobe } from '@/lib/store';
import { Outfit } from '@/lib/types';
import {
  X,
  Sparkles,
  Loader2,
  Share2,
  Bookmark,
  RefreshCw,
  Sliders,
  Check,
  AlertTriangle,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VirtualTryOnModalProps {
  outfit: Outfit;
  onClose: () => void;
}

export default function VirtualTryOnModal({ outfit, onClose }: VirtualTryOnModalProps) {
  const {
    clothes,
    user,
    defaultPhoto,
    profilePhotos,
    saveTryOnResult,
    setActiveTab,
    userGeminiKey,
  } = useWardrobe();

  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(
    defaultPhoto?.id || (profilePhotos[0]?.id ?? '')
  );
  const [isRunning, setIsRunning] = useState(false);
  const [tryonResult, setTryonResult] = useState<{
    resultImageUrl: string;
    score: number;
    fitFeedback: string;
    colorFeedback: string;
    styleTips: string[];
    isAiGenerated?: boolean;
    hasGeminiKey?: boolean;
    modelUsed?: string;
  } | null>(null);

  const [activeViewMode, setActiveViewMode] = useState<'side_by_side' | 'slider'>('side_by_side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSaved, setIsSaved] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentPhoto = profilePhotos.find((p) => p.id === selectedPhotoId) || defaultPhoto;

  const outfitItems = outfit.item_ids
    .map((id) => clothes.find((c) => c.id === id))
    .filter(Boolean) as any[];

  const runTryOn = async () => {
    if (!currentPhoto) {
      setErrorMessage('Please upload a full-body photo first in your Profile.');
      return;
    }

    try {
      setIsRunning(true);
      setErrorMessage(null);
      setIsSaved(false);

      const res = await fetch('/api/virtual-tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userGeminiKey ? { 'x-gemini-key': userGeminiKey } : {}),
        },
        body: JSON.stringify({
          userPhotoBase64: currentPhoto.image_url,
          itemPhotos: outfitItems.map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            category: item.category,
            subcategory: item.subcategory,
            color: item.color,
          })),
          outfitTitle: outfit.title,
          userProfile: user,
          occasion: outfit.occasion,
          apiKey: userGeminiKey,
        }),
      });

      if (!res.ok) {
        throw new Error('Virtual try-on processing failed');
      }

      const data = await res.json();
      setTryonResult(data);

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Virtual try-on failed. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveResult = () => {
    if (!tryonResult || !currentPhoto) return;
    saveTryOnResult({
      user_photo_id: currentPhoto.id,
      outfit_id: outfit.id,
      result_image_url: tryonResult.resultImageUrl,
      score: tryonResult.score,
      fit_feedback: tryonResult.fitFeedback,
      color_feedback: tryonResult.colorFeedback,
      style_tips: tryonResult.styleTips,
    });
    setIsSaved(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Virtual Try-On: ${outfit.title}`,
          text: `Check out my AI Virtual Try-On for "${outfit.title}" on WardrobeAI! AI Stylist Score: ${tryonResult?.score}/10`,
          url: window.location.href,
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg max-h-[94vh] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Virtual Try-On
              </h2>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[240px]">
                {outfit.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* If No Photo Uploaded Yet */}
          {!currentPhoto ? (
            <div className="p-6 text-center space-y-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-300 dark:border-neutral-700">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Upload a Photo of Yourself First
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                Go to Profile → "My Photos" to upload a full-body, front-facing photo so Gemini can dress you in this outfit.
              </p>
              <button
                onClick={() => {
                  onClose();
                  setActiveTab('profile');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Go to Profile Photos</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : !tryonResult ? (
            /* Ready to Run State */
            <div className="space-y-4">
              {/* Photo & Outfit Preview */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-[3/4] relative bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={currentPhoto.image_url}
                    alt="Your Photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                    Your Photo (Default)
                  </div>
                </div>

                <div className="rounded-2xl p-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                      Outfit to try on
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1 mb-2">
                      {outfit.title}
                    </h4>

                    {/* Miniature item list */}
                    <div className="space-y-1.5">
                      {outfitItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <img
                            src={item.image_url}
                            alt={item.subcategory}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {item.subcategory}
                            </p>
                            <p className="text-[9px] text-neutral-400">{item.color}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                    Private & encrypted
                  </div>
                </div>
              </div>

              {/* Photo Angle Selector if multiple available */}
              {profilePhotos.length > 1 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-700">
                      Choose Model Angle:
                    </label>
                    <span className="text-[10px] text-neutral-400">
                      {user.face_shape} Face • {user.body_type}
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {profilePhotos.map((p) => {
                      const isSelected = (currentPhoto?.id || selectedPhotoId) === p.id;
                      const label = p.angle_type ? `${p.angle_type.toUpperCase()}` : 'ANGLE';
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPhotoId(p.id)}
                          className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                            isSelected
                              ? 'border-rose-600 scale-102 shadow-xs'
                              : 'border-neutral-200 opacity-70'
                          }`}
                        >
                          <img src={p.image_url} alt="Photo option" className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 inset-x-1 py-0.5 rounded bg-black/70 text-white text-[8px] font-bold text-center uppercase truncate">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                disabled={isRunning}
                onClick={runTryOn}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-60"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is fitting clothes to your photo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Try On Me Now</span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Try-On Result Presentation */
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* View Mode Toggle: Side-by-Side vs Slider */}
              <div className="flex justify-center">
                <div className="inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold">
                  <button
                    onClick={() => setActiveViewMode('side_by_side')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeViewMode === 'side_by_side'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setActiveViewMode('slider')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeViewMode === 'slider'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    Interactive Slider
                  </button>
                </div>
              </div>

              {/* Side-by-Side View */}
              {activeViewMode === 'side_by_side' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-[3/4] relative bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={currentPhoto.image_url}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                      Original Photo
                    </span>
                  </div>

                  <div className="rounded-2xl overflow-hidden border-2 border-rose-500 aspect-[3/4] relative bg-neutral-100 dark:bg-neutral-800 shadow-md">
                    <img
                      src={tryonResult.resultImageUrl}
                      alt="Virtual Try-On"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-xs">
                      ✨ Try-On Result
                    </span>
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-semibold backdrop-blur-xs">
                      {tryonResult.isAiGenerated ? 'Gemini AI' : 'AI Stylist'}
                    </span>
                  </div>
                </div>
              )}

              {/* Interactive Slider View */}
              {activeViewMode === 'slider' && (
                <div className="relative aspect-[3/4] max-h-80 mx-auto rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 select-none">
                  {/* Result image on bottom */}
                  <img
                    src={tryonResult.resultImageUrl}
                    alt="Result"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Original image clipped on top */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={currentPhoto.image_url}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-cover max-w-none"
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Slider divider line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-neutral-700 text-xs font-bold">
                      ↔
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                  />
                </div>
              )}

              {/* "Looks Good On Me?" AI Stylist Score & Feedback Card */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-indigo-50 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900 border border-rose-200 dark:border-neutral-700 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                      Looks Good On Me?
                    </h3>
                  </div>

                  {/* Circular Score Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-xs">
                    <span>{tryonResult.score.toFixed(1)}</span>
                    <span className="text-[10px] font-normal opacity-80">/ 10</span>
                  </div>
                </div>

                {/* Feedback Points */}
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-700/60 border border-neutral-100 dark:border-neutral-700">
                    <span className="font-bold text-neutral-900 dark:text-white block mb-0.5">
                      👗 Fit & Silhouette:
                    </span>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {tryonResult.fitFeedback}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-700/60 border border-neutral-100 dark:border-neutral-700">
                    <span className="font-bold text-neutral-900 dark:text-white block mb-0.5">
                      🎨 Skin Tone Match:
                    </span>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {tryonResult.colorFeedback}
                    </p>
                  </div>

                  {tryonResult.styleTips?.length > 0 && (
                    <div className="p-2 rounded-xl bg-white/80 dark:bg-neutral-700/60 border border-neutral-100 dark:border-neutral-700">
                      <span className="font-bold text-neutral-900 dark:text-white block mb-0.5">
                        💡 Stylist Tips:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                        {tryonResult.styleTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Gemini Key Status Notice if key not yet added */}
              {!tryonResult.hasGeminiKey && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px]">Preview Model Active</p>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      To generate live AI try-on transformations directly on your custom photos with Google Gemini, add your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code> into <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">.env.local</code>.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons: Save, Share, Regenerate, Try Another Outfit */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Save to Lookbook */}
                <button
                  type="button"
                  onClick={handleSaveResult}
                  disabled={isSaved}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                    isSaved
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white'
                  }`}
                >
                  {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  <span>{isSaved ? 'Saved to Lookbook' : 'Save Result'}</span>
                </button>

                {/* Share */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{sharedToast ? 'Link Copied!' : 'Share'}</span>
                </button>

                {/* Regenerate */}
                <button
                  type="button"
                  onClick={runTryOn}
                  disabled={isRunning}
                  className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                {/* Try Another Outfit */}
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>Pick Another Outfit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
