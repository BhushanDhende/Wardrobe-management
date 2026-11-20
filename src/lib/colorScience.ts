import { UserProfile, ClothingItem } from './types';

export interface ColorSuitabilityResult {
  status: 'flattering' | 'avoid' | 'neutral';
  badge: string;
  badgeBg: string;
  badgeText: string;
  reason: string;
}

/**
 * Determine if an item's color is flattering, neutral, or should be avoided based on user profile.
 */
export function evaluateColorSuitability(
  item: Pick<ClothingItem, 'color' | 'color_hex' | 'subcategory'>,
  user?: UserProfile
): ColorSuitabilityResult {
  if (!user || (!user.skin_tone && !user.undertone)) {
    return {
      status: 'neutral',
      badge: 'Versatile',
      badgeBg: 'bg-neutral-100 dark:bg-neutral-800',
      badgeText: 'text-neutral-700 dark:text-neutral-300',
      reason: 'General versatile color that pairs well across multiple styles.',
    };
  }

  const itemName = (item.subcategory || '').toLowerCase();
  const colorName = (item.color || '').toLowerCase();
  const hex = (item.color_hex || '').toLowerCase();

  // 1. Check against user's specific avoid_colors
  if (user.avoid_colors && user.avoid_colors.length > 0) {
    for (const avoid of user.avoid_colors) {
      const aName = avoid.name.toLowerCase();
      if (
        colorName.includes(aName) ||
        aName.includes(colorName) ||
        (hex && avoid.hex.toLowerCase() === hex)
      ) {
        return {
          status: 'avoid',
          badge: '⚠️ Washes You Out',
          badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
          badgeText: 'text-amber-800',
          reason: avoid.reason || `May clash with your ${user.undertone || 'skin'} undertones and dull your complexion.`,
        };
      }
    }
  }

  // 2. Check against user's specific best_colors
  if (user.best_colors && user.best_colors.length > 0) {
    for (const best of user.best_colors) {
      const bName = best.name.toLowerCase();
      if (
        colorName.includes(bName) ||
        bName.includes(colorName) ||
        (hex && best.hex.toLowerCase() === hex)
      ) {
        return {
          status: 'flattering',
          badge: '✨ Looks Great on You',
          badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
          badgeText: 'text-emerald-800',
          reason: best.reason || `Directly illuminates your ${user.undertone || 'golden'} undertone and enhances face contrast.`,
        };
      }
    }
  }

  // 3. Fallback based on undertone rules
  const undertone = user.undertone || 'Warm';
  const warmFlattering = ['navy', 'blue', 'beige', 'camel', 'brown', 'terracotta', 'olive', 'green', 'cream', 'ivory', 'mustard', 'rust'];
  const coolFlattering = ['navy', 'black', 'white', 'grey', 'emerald', 'sapphire', 'burgundy', 'rose', 'lavender', 'charcoal'];
  const warmAvoid = ['ash grey', 'pale yellow', 'neon lime', 'cold magenta', 'pastel grey'];
  const coolAvoid = ['mustard', 'orange', 'warm camel', 'rusty brown'];

  if (undertone === 'Warm') {
    if (warmAvoid.some((c) => colorName.includes(c))) {
      return {
        status: 'avoid',
        badge: '⚠️ Washes You Out',
        badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
        badgeText: 'text-amber-800',
        reason: `Cold or pale tones can make warm ${user.complexion || 'complexions'} appear fatigued.`,
      };
    }
    if (warmFlattering.some((c) => colorName.includes(c))) {
      return {
        status: 'flattering',
        badge: '✨ Flattering Match',
        badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        badgeText: 'text-emerald-800',
        reason: `Earthy and warm tones harmonize with your warm golden undertones naturally.`,
      };
    }
  } else if (undertone === 'Cool') {
    if (coolAvoid.some((c) => colorName.includes(c))) {
      return {
        status: 'avoid',
        badge: '⚠️ Washes You Out',
        badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
        badgeText: 'text-amber-800',
        reason: `Earthy yellow/orange tones can clash with cool rosy or blue undertones.`,
      };
    }
    if (coolFlattering.some((c) => colorName.includes(c))) {
      return {
        status: 'flattering',
        badge: '✨ Flattering Match',
        badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        badgeText: 'text-emerald-800',
        reason: `Crisp cool tones frame your face and create vibrant contrast.`,
      };
    }
  }

  // Universal neutrals (Navy, White, Black, Dark Denim)
  if (['navy', 'white', 'denim', 'black'].some((c) => colorName.includes(c))) {
    return {
      status: 'flattering',
      badge: '✨ Universal Anchor',
      badgeBg: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
      badgeText: 'text-indigo-800',
      reason: 'Versatile foundation color that flatters all skin tones.',
    };
  }

  return {
    status: 'neutral',
    badge: 'Neutral Staple',
    badgeBg: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
    badgeText: 'text-neutral-700',
    reason: 'Reliable wardrobe staple that blends cleanly into multiple outfits.',
  };
}
