'use client';

import React from 'react';
import { WardrobeProvider, useWardrobe } from '@/lib/store';
import TopHeader from '@/components/navigation/TopHeader';
import BottomNav from '@/components/navigation/BottomNav';
import HomeScreen from '@/components/home/HomeScreen';
import WardrobeScreen from '@/components/wardrobe/WardrobeScreen';
import OutfitsScreen from '@/components/outfits/OutfitsScreen';
import ShopScreen from '@/components/shop/ShopScreen';
import ProfileScreen from '@/components/profile/ProfileScreen';
import AddClothingModal from '@/components/wardrobe/AddClothingModal';
import VirtualTryOnModal from '@/components/tryon/VirtualTryOnModal';
import ItemPairingModal from '@/components/wardrobe/ItemPairingModal';

function MainApp() {
  const { activeTab, selectedOutfitForTryOn, setSelectedOutfitForTryOn } = useWardrobe();

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 antialiased flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Mobile container centered on larger screens */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-white flex flex-col relative shadow-2xl">
        {/* Sticky Header */}
        <TopHeader />

        {/* Tab Viewport */}
        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'wardrobe' && <WardrobeScreen />}
          {activeTab === 'outfits' && <OutfitsScreen />}
          {activeTab === 'shop' && <ShopScreen />}
          {activeTab === 'profile' && <ProfileScreen />}
        </main>

        {/* Floating Add Item Modal */}
        <AddClothingModal />

        {/* Item Pairing & Wardrobe Gap Modal */}
        <ItemPairingModal />

        {/* Virtual Try-On Modal */}
        {selectedOutfitForTryOn && (
          <VirtualTryOnModal
            outfit={selectedOutfitForTryOn}
            onClose={() => setSelectedOutfitForTryOn(null)}
          />
        )}

        {/* Fixed Thumb-Friendly Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <WardrobeProvider>
      <MainApp />
    </WardrobeProvider>
  );
}
