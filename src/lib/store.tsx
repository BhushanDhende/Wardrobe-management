'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  ClothingItem,
  UserProfile,
  ProfilePhoto,
  Outfit,
  OutfitSchedule,
  TryOnResult,
  ShoppingSuggestion,
  PhotoAnalysisResult,
} from './types';
import {
  INITIAL_USER,
  INITIAL_PHOTOS,
  INITIAL_CLOTHES,
  INITIAL_OUTFITS,
  INITIAL_SCHEDULES,
} from './mockData';

interface WardrobeContextType {
  user: UserProfile;
  profilePhotos: ProfilePhoto[];
  defaultPhoto?: ProfilePhoto;
  clothes: ClothingItem[];
  outfits: Outfit[];
  schedules: OutfitSchedule[];
  tryonResults: TryOnResult[];
  suggestions: ShoppingSuggestion[];
  activeTab: 'home' | 'wardrobe' | 'outfits' | 'shop' | 'profile';
  setActiveTab: (tab: 'home' | 'wardrobe' | 'outfits' | 'shop' | 'profile') => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  selectedOutfitForTryOn: Outfit | null;
  setSelectedOutfitForTryOn: (outfit: Outfit | null) => void;
  
  // Actions
  addClothingItem: (item: Omit<ClothingItem, 'id' | 'created_at' | 'wear_count' | 'user_id'>) => Promise<ClothingItem>;
  updateClothingItem: (item: ClothingItem) => void;
  deleteClothingItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  incrementWearCount: (id: string) => void;
  saveOutfit: (outfit: Omit<Outfit, 'id' | 'created_at' | 'user_id'>) => Outfit;
  deleteOutfit: (id: string) => void;
  markOutfitWornToday: (outfitId: string, notes?: string) => void;
  scheduleOutfit: (outfitId: string, date: string, notes?: string) => void;
  deleteSchedule: (scheduleId: string) => void;
  toggleScheduleWorn: (scheduleId: string) => void;
  addProfilePhoto: (imageUrl: string, analysis?: PhotoAnalysisResult) => Promise<ProfilePhoto>;
  setDefaultPhoto: (photoId: string) => void;
  deleteProfilePhoto: (photoId: string) => void;
  deleteAllUserPhotos: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  saveTryOnResult: (result: Omit<TryOnResult, 'id' | 'created_at' | 'user_id'>) => TryOnResult;
  deleteTryOnResult: (id: string) => void;
  setSuggestions: (suggestions: ShoppingSuggestion[]) => void;
  resetToDemo: () => void;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

const STORAGE_KEY = 'wardrobe_ai_store_v1';

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhoto[]>(INITIAL_PHOTOS);
  const [clothes, setClothes] = useState<ClothingItem[]>(INITIAL_CLOTHES);
  const [outfits, setOutfits] = useState<Outfit[]>(INITIAL_OUTFITS);
  const [schedules, setSchedules] = useState<OutfitSchedule[]>(INITIAL_SCHEDULES);
  const [tryonResults, setTryonResults] = useState<TryOnResult[]>([]);
  const [suggestions, setSuggestions] = useState<ShoppingSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'wardrobe' | 'outfits' | 'shop' | 'profile'>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOutfitForTryOn, setSelectedOutfitForTryOn] = useState<Outfit | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    try {
      // Force remove any leftover dark mode class to ensure clean day mode
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark');
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.profilePhotos) setProfilePhotos(parsed.profilePhotos);
        if (parsed.clothes) setClothes(parsed.clothes);
        if (parsed.outfits) setOutfits(parsed.outfits);
        if (parsed.schedules) setSchedules(parsed.schedules);
        if (parsed.tryonResults) setTryonResults(parsed.tryonResults);
        if (parsed.suggestions) setSuggestions(parsed.suggestions);
      }
    } catch (e) {
      console.error('Failed to load wardrobe data from storage:', e);
    }
    setMounted(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      const dataToSave = {
        user,
        profilePhotos,
        clothes,
        outfits,
        schedules,
        tryonResults,
        suggestions,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save wardrobe data to storage:', e);
    }
  }, [mounted, user, profilePhotos, clothes, outfits, schedules, tryonResults, suggestions]);

  const defaultPhoto = profilePhotos.find((p) => p.is_default) || profilePhotos[0];

  const addClothingItem = async (
    itemData: Omit<ClothingItem, 'id' | 'created_at' | 'wear_count' | 'user_id'>
  ): Promise<ClothingItem> => {
    const newItem: ClothingItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      wear_count: 0,
      created_at: new Date().toISOString(),
    };
    setClothes((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateClothingItem = (updated: ClothingItem) => {
    setClothes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const deleteClothingItem = (id: string) => {
    setClothes((prev) => prev.filter((item) => item.id !== id));
    // Also remove item from existing outfits
    setOutfits((prev) =>
      prev.map((outfit) => ({
        ...outfit,
        item_ids: outfit.item_ids.filter((itemId) => itemId !== id),
      }))
    );
  };

  const toggleFavorite = (id: string) => {
    setClothes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_favorite: !item.is_favorite } : item))
    );
  };

  const incrementWearCount = (id: string) => {
    setClothes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, wear_count: item.wear_count + 1 } : item))
    );
  };

  const saveOutfit = (outfitData: Omit<Outfit, 'id' | 'created_at' | 'user_id'>): Outfit => {
    const newOutfit: Outfit = {
      ...outfitData,
      id: `outfit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    setOutfits((prev) => [newOutfit, ...prev]);
    return newOutfit;
  };

  const deleteOutfit = (id: string) => {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    setSchedules((prev) => prev.filter((s) => s.outfit_id !== id));
  };

  const markOutfitWornToday = (outfitId: string, notes?: string) => {
    const targetOutfit = outfits.find((o) => o.id === outfitId);
    if (!targetOutfit) return;

    // Increment wear count of all items in outfit
    targetOutfit.item_ids.forEach((itemId) => {
      incrementWearCount(itemId);
    });

    // Add to schedule history
    const today = new Date().toISOString().split('T')[0];
    const newSchedule: OutfitSchedule = {
      id: `sched_${Date.now()}`,
      user_id: user.id,
      outfit_id: outfitId,
      scheduled_date: today,
      worn: true,
      notes: notes || `Worn on ${today}`,
      created_at: new Date().toISOString(),
    };
    setSchedules((prev) => [newSchedule, ...prev]);
  };

  const scheduleOutfit = (outfitId: string, date: string, notes?: string) => {
    const newSchedule: OutfitSchedule = {
      id: `sched_${Date.now()}`,
      user_id: user.id,
      outfit_id: outfitId,
      scheduled_date: date,
      worn: false,
      notes: notes || '',
      created_at: new Date().toISOString(),
    };
    setSchedules((prev) => [newSchedule, ...prev]);
  };

  const deleteSchedule = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  };

  const toggleScheduleWorn = (scheduleId: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === scheduleId) {
          const nextWorn = !s.worn;
          if (nextWorn) {
            // Also increment wear count for items in that outfit
            const outfit = outfits.find((o) => o.id === s.outfit_id);
            if (outfit) {
              outfit.item_ids.forEach((id) => incrementWearCount(id));
            }
          }
          return { ...s, worn: nextWorn };
        }
        return s;
      })
    );
  };

  const addProfilePhoto = async (
    imageUrl: string,
    analysis?: PhotoAnalysisResult
  ): Promise<ProfilePhoto> => {
    const isFirst = profilePhotos.length === 0;
    const newPhoto: ProfilePhoto = {
      id: `photo_${Date.now()}`,
      user_id: user.id,
      image_url: imageUrl,
      is_default: isFirst,
      skin_tone_detected: analysis ? `${analysis.skin_tone} (${analysis.undertone} undertone)` : undefined,
      body_type_detected: analysis ? analysis.body_type : undefined,
      created_at: new Date().toISOString(),
    };

    setProfilePhotos((prev) => [...prev, newPhoto]);

    // If analysis was returned, update user style profile
    if (analysis) {
      setUser((prev) => ({
        ...prev,
        skin_tone: analysis.skin_tone,
        undertone: analysis.undertone,
        body_type: analysis.body_type,
        recommended_palette: analysis.recommended_palette,
      }));
    }

    return newPhoto;
  };

  const setDefaultPhoto = (photoId: string) => {
    setProfilePhotos((prev) =>
      prev.map((p) => ({
        ...p,
        is_default: p.id === photoId,
      }))
    );
  };

  const deleteProfilePhoto = (photoId: string) => {
    setProfilePhotos((prev) => {
      const remaining = prev.filter((p) => p.id !== photoId);
      // If deleted was default, make first remaining default
      if (remaining.length > 0 && !remaining.some((p) => p.is_default)) {
        remaining[0].is_default = true;
      }
      return remaining;
    });
  };

  // Permanently delete all photos (Privacy requirement)
  const deleteAllUserPhotos = () => {
    setProfilePhotos([]);
    setTryonResults([]);
    setUser((prev) => ({
      ...prev,
      skin_tone: undefined,
      undertone: undefined,
      body_type: undefined,
      recommended_palette: [],
    }));
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const saveTryOnResult = (
    resultData: Omit<TryOnResult, 'id' | 'created_at' | 'user_id'>
  ): TryOnResult => {
    const newResult: TryOnResult = {
      ...resultData,
      id: `tryon_${Date.now()}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    setTryonResults((prev) => [newResult, ...prev]);
    return newResult;
  };

  const deleteTryOnResult = (id: string) => {
    setTryonResults((prev) => prev.filter((r) => r.id !== id));
  };

  const resetToDemo = () => {
    setUser(INITIAL_USER);
    setProfilePhotos(INITIAL_PHOTOS);
    setClothes(INITIAL_CLOTHES);
    setOutfits(INITIAL_OUTFITS);
    setSchedules(INITIAL_SCHEDULES);
    setTryonResults([]);
    setSuggestions([]);
  };

  return (
    <WardrobeContext.Provider
      value={{
        user,
        profilePhotos,
        defaultPhoto,
        clothes,
        outfits,
        schedules,
        tryonResults,
        suggestions,
        activeTab,
        setActiveTab,
        isAddModalOpen,
        setIsAddModalOpen,
        selectedOutfitForTryOn,
        setSelectedOutfitForTryOn,
        addClothingItem,
        updateClothingItem,
        deleteClothingItem,
        toggleFavorite,
        incrementWearCount,
        saveOutfit,
        deleteOutfit,
        markOutfitWornToday,
        scheduleOutfit,
        deleteSchedule,
        toggleScheduleWorn,
        addProfilePhoto,
        setDefaultPhoto,
        deleteProfilePhoto,
        deleteAllUserPhotos,
        updateProfile,
        saveTryOnResult,
        deleteTryOnResult,
        setSuggestions,
        resetToDemo,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
}
