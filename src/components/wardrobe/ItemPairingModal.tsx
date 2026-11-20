'use client';

import React, { useState, useEffect } from 'react';
import { useWardrobe } from '@/lib/store';
import { ClothingItem, WardrobePairingMatch } from '@/lib/types';
import { evaluateColorSuitability } from '@/lib/colorScience';
import {
  X,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Layers,
  Check,
  Calendar,
  Eye,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Shirt,
} from 'lucide-react';
import confetti from 'canvas-confetti';

function getStoreLinks(query: string) {
  const cleanQ = query.trim();
  const encoded = encodeURIComponent(cleanQ);
  const slug = encodeURIComponent(
    cleanQ
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );

  return {
    myntra: `https://www.myntra.com/${slug}`,
    amazon: `https://www.amazon.in/s?k=${encoded}`,
    flipkart: `https://www.flipkart.com/search?q=${encoded}`,
    meesho: `https://www.meesho.com/search?q=${encoded}`,
  };
}

export default function ItemPairingModal() {
  const {
    selectedItemForPairing,
    setSelectedItemForPairing,
    clothes,
    user,
    userGeminiKey,
    saveOutfit,
    markOutfitWornToday,
    setSelectedOutfitForTryOn,
  } = useWardrobe();

  const [isLoading, setIsLoading] = useState(false);
  const [pairingData, setPairingData] = useState<WardrobePairingMatch | null>(null);
  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
  const [selectedShoe, setSelectedShoe] = useState<ClothingItem | null>(null);
  const [selectedOuter, setSelectedOuter] = useState<ClothingItem | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [wornToast, setWornToast] = useState(false);

  useEffect(() => {
    if (!selectedItemForPairing) {
      setPairingData(null);
      return;
    }

    const fetchPairing = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/item-pairing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userGeminiKey ? { 'x-gemini-key': userGeminiKey } : {}),
          },
          body: JSON.stringify({
            selectedItem: selectedItemForPairing,
            wardrobe: clothes,
            userProfile: user,
            apiKey: userGeminiKey,
          }),
        });

        if (res.ok) {
          const data: WardrobePairingMatch = await res.json();
          setPairingData(data);

          // Pre-select top, bottom, shoe based on category
          if (selectedItemForPairing.category === 'Bottoms') {
            setSelectedBottom(selectedItemForPairing);
            setSelectedTop(data.matching_items.tops[0] || null);
            setSelectedShoe(data.matching_items.shoes[0] || null);
            setSelectedOuter(data.matching_items.outerwear[0] || null);
          } else if (selectedItemForPairing.category === 'Tops') {
            setSelectedTop(selectedItemForPairing);
            setSelectedBottom(data.matching_items.bottoms[0] || null);
            setSelectedShoe(data.matching_items.shoes[0] || null);
            setSelectedOuter(data.matching_items.outerwear[0] || null);
          } else if (selectedItemForPairing.category === 'Footwear') {
            setSelectedShoe(selectedItemForPairing);
            setSelectedBottom(data.matching_items.bottoms[0] || null);
            setSelectedTop(data.matching_items.tops[0] || null);
            setSelectedOuter(data.matching_items.outerwear[0] || null);
          } else {
            setSelectedOuter(selectedItemForPairing);
            setSelectedTop(data.matching_items.tops[0] || null);
            setSelectedBottom(data.matching_items.bottoms[0] || null);
            setSelectedShoe(data.matching_items.shoes[0] || null);
          }
        }
      } catch (err) {
        console.error('Pairing fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPairing();
  }, [selectedItemForPairing, clothes, user, userGeminiKey]);

  if (!selectedItemForPairing) return null;

  const colorSuitability = evaluateColorSuitability(selectedItemForPairing, user);

  const activeComboItems = [selectedTop, selectedBottom, selectedShoe, selectedOuter].filter(
    (item): item is ClothingItem => Boolean(item)
  );

  const handleSaveAsOutfit = () => {
    if (activeComboItems.length < 2) return;
    saveOutfit({
      title: `${selectedItemForPairing.subcategory} Styled Ensemble`,
      occasion: selectedItemForPairing.occasions?.[0] || 'Casual',
      item_ids: activeComboItems.map((i) => i.id),
      styling_notes: pairingData?.styling_formula || 'Harmonious pairing curated by AI.',
      color_harmony: `${selectedItemForPairing.color} paired with complementary wardrobe basics.`,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
  };

  const handleMarkWornToday = () => {
    if (activeComboItems.length < 2) return;
    const newOutfit = saveOutfit({
      title: `${selectedItemForPairing.subcategory} Daily Look`,
      occasion: selectedItemForPairing.occasions?.[0] || 'Casual',
      item_ids: activeComboItems.map((i) => i.id),
      styling_notes: 'Worn today from Smart Match.',
    });
    markOutfitWornToday(newOutfit.id);
    setWornToast(true);
    setTimeout(() => setWornToast(false), 2200);
    confetti({ particleCount: 45, spread: 70, origin: { y: 0.7 } });
  };

  const handleTryOnCombo = () => {
    if (activeComboItems.length < 1) return;
    const tempOutfit = {
      id: `tryon_combo_${Date.now()}`,
      user_id: user.id,
      title: `${selectedItemForPairing.subcategory} Pairing`,
      occasion: selectedItemForPairing.occasions?.[0] || 'Casual',
      item_ids: activeComboItems.map((i) => i.id),
      styling_notes: pairingData?.styling_formula || '',
      created_at: new Date().toISOString(),
    };
    setSelectedOutfitForTryOn(tempOutfit);
    setSelectedItemForPairing(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="bg-white w-full max-w-lg max-h-[94vh] sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl border border-neutral-200 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 leading-tight">
                Wardrobe Pairing & Match
              </h2>
              <p className="text-[11px] text-neutral-500">
                What to wear with your {selectedItemForPairing.subcategory}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedItemForPairing(null)}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Selected Item Hero Card */}
          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-3">
            <img
              src={selectedItemForPairing.image_url}
              alt={selectedItemForPairing.subcategory}
              className="w-16 h-16 rounded-xl object-cover border border-neutral-200 shadow-2xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">
                  {selectedItemForPairing.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorSuitability.badgeBg}`}>
                  {colorSuitability.badge}
                </span>
              </div>
              <h3 className="text-xs font-bold text-neutral-900 truncate">
                {selectedItemForPairing.subcategory}
              </h3>
              <p className="text-[11px] text-neutral-500 truncate">
                Color: {selectedItemForPairing.color} • {selectedItemForPairing.style}
              </p>
            </div>
          </div>

          {/* Color Suitability Reason */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/60 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Color Analysis for Your Complexion ({user.undertone || 'Warm'} Undertone)</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              {colorSuitability.reason}
            </p>
          </div>

          {/* AI Styling Formula */}
          {pairingData?.styling_formula && (
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 text-xs text-indigo-950 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                AI Styling Formula
              </span>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                {pairingData.styling_formula}
              </p>
            </div>
          )}

          {isLoading && (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500 mx-auto" />
              <p className="text-xs font-semibold text-neutral-600">
                Finding best matches in your wardrobe...
              </p>
            </div>
          )}

          {/* 1. MATCHING PIECES IN YOUR WARDROBE */}
          {!isLoading && pairingData && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-rose-500" />
                <span>Pair With Clothes in Your Wardrobe:</span>
              </h3>

              {/* Matching Tops (if selected is not Top) */}
              {selectedItemForPairing.category !== 'Tops' && pairingData.matching_items.tops.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-neutral-700 block mb-1.5">
                    👕 Matching Shirts & T-Shirts:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {pairingData.matching_items.tops.map((top) => {
                      const isSelected = selectedTop?.id === top.id;
                      return (
                        <button
                          key={top.id}
                          type="button"
                          onClick={() => setSelectedTop(isSelected ? null : top)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-neutral-200 bg-white hover:bg-neutral-50'
                          }`}
                        >
                          <img
                            src={top.image_url}
                            alt={top.subcategory}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-neutral-900 truncate">
                              {top.subcategory}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate">{top.color}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matching Bottoms (if selected is not Bottoms) */}
              {selectedItemForPairing.category !== 'Bottoms' && pairingData.matching_items.bottoms.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-neutral-700 block mb-1.5">
                    👖 Matching Pants & Chinos:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {pairingData.matching_items.bottoms.map((bottom) => {
                      const isSelected = selectedBottom?.id === bottom.id;
                      return (
                        <button
                          key={bottom.id}
                          type="button"
                          onClick={() => setSelectedBottom(isSelected ? null : bottom)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-neutral-200 bg-white hover:bg-neutral-50'
                          }`}
                        >
                          <img
                            src={bottom.image_url}
                            alt={bottom.subcategory}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-neutral-900 truncate">
                              {bottom.subcategory}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate">{bottom.color}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matching Shoes (if selected is not Footwear) */}
              {selectedItemForPairing.category !== 'Footwear' && pairingData.matching_items.shoes.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-neutral-700 block mb-1.5">
                    👟 Matching Shoes:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {pairingData.matching_items.shoes.map((shoe) => {
                      const isSelected = selectedShoe?.id === shoe.id;
                      return (
                        <button
                          key={shoe.id}
                          type="button"
                          onClick={() => setSelectedShoe(isSelected ? null : shoe)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/60 shadow-xs'
                              : 'border-neutral-200 bg-white hover:bg-neutral-50'
                          }`}
                        >
                          <img
                            src={shoe.image_url}
                            alt={shoe.subcategory}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-neutral-900 truncate">
                              {shoe.subcategory}
                            </p>
                            <p className="text-[10px] text-neutral-500 truncate">{shoe.color}</p>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons for Assembled Combo */}
              <div className="p-3 rounded-2xl bg-neutral-100/70 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                  <span>Selected Outfit Combo ({activeComboItems.length} items):</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleMarkWornToday}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{wornToast ? 'Marked Worn!' : 'Wear Today'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsOutfit}
                    className="py-2 px-3 rounded-xl bg-white border border-neutral-300 text-neutral-800 text-xs font-semibold hover:bg-neutral-50 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{savedToast ? 'Saved!' : 'Save Look'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTryOnCombo}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Try On</span>
                  </button>
                </div>
              </div>

              {/* 2. WARDROBE GAPS - WHAT'S MISSING FOR THIS ITEM */}
              {pairingData.missing_gaps.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
                      <span>Wardrobe Gaps for these {selectedItemForPairing.subcategory}:</span>
                    </span>
                    <span className="text-[10px] text-rose-600 font-semibold">Missing Matches</span>
                  </div>

                  <div className="space-y-3">
                    {pairingData.missing_gaps.map((gap, idx) => {
                      const links = getStoreLinks(gap.search_query || `${gap.recommended_color} ${gap.title}`);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-2"
                        >
                          <div className="flex gap-2.5">
                            <img
                              src={gap.image_url}
                              alt={gap.title}
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-100"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-neutral-900 truncate">
                                  {gap.title}
                                </h4>
                                <span className="text-[10px] font-bold text-rose-600 shrink-0">
                                  {gap.estimated_price_inr}
                                </span>
                              </div>
                              <p className="text-[11px] text-rose-600 font-medium">
                                Rec: {gap.recommended_color}
                              </p>
                              <p className="text-[11px] text-neutral-600 line-clamp-2 mt-0.5 leading-relaxed">
                                {gap.reason}
                              </p>
                            </div>
                          </div>

                          {/* Direct Store Links */}
                          <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-neutral-100">
                            <a
                              href={links.myntra}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold text-center transition-colors"
                            >
                              👗 Myntra
                            </a>
                            <a
                              href={links.amazon}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold text-center transition-colors"
                            >
                              📦 Amazon
                            </a>
                            <a
                              href={links.flipkart}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold text-center transition-colors"
                            >
                              ⚡ Flipkart
                            </a>
                            <a
                              href={links.meesho}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1 px-1 rounded-lg bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 text-[10px] font-bold text-center transition-colors"
                            >
                              🏷️ Meesho
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
