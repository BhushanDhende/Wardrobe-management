export type ClothingCategory =
  | 'Tops'
  | 'Bottoms'
  | 'Dresses'
  | 'Outerwear'
  | 'Footwear'
  | 'Accessories'
  | 'Ethnic';

export type ClothingSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'All-Season';

export type ClothingStyle =
  | 'Casual'
  | 'Formal'
  | 'Party'
  | 'Ethnic'
  | 'Streetwear'
  | 'Minimalist'
  | 'Sporty';

export type OccasionType =
  | 'Office'
  | 'Party'
  | 'Date'
  | 'Wedding'
  | 'Casual'
  | 'Workout'
  | 'Travel'
  | 'Festive';

export type WeatherType =
  | 'Sunny & Warm'
  | 'Hot & Humid'
  | 'Cool & Breezy'
  | 'Cold & Rainy'
  | 'Freezing';

export type MoodType =
  | 'Confident'
  | 'Effortless & Relaxed'
  | 'Elegant & Chic'
  | 'Bold & Vibrant'
  | 'Cozy';

export type PriceTier = 'Budget' | 'Mid' | 'Luxury';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: 'Men' | 'Women' | 'Unisex';
  favorite_colors: string[];
  preferred_styles: ClothingStyle[];
  budget_tier: PriceTier;
  skin_tone?: string;
  undertone?: 'Warm' | 'Cool' | 'Neutral' | 'Olive';
  body_type?: string;
  recommended_palette?: string[];
  photo_consent: boolean;
  created_at: string;
}

export interface ProfilePhoto {
  id: string;
  user_id: string;
  image_url: string;
  is_default: boolean;
  skin_tone_detected?: string;
  body_type_detected?: string;
  created_at: string;
}

export interface ClothingItem {
  id: string;
  user_id: string;
  image_url: string;
  category: ClothingCategory;
  subcategory: string;
  color: string;
  secondary_color?: string;
  color_hex?: string;
  pattern: string;
  season: ClothingSeason;
  style: ClothingStyle;
  brand?: string;
  occasions: OccasionType[];
  tags: string[];
  wear_count: number;
  is_favorite: boolean;
  notes?: string;
  created_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  title: string;
  occasion: OccasionType;
  weather?: WeatherType;
  mood?: MoodType;
  item_ids: string[];
  styling_notes: string;
  color_harmony: string;
  created_at: string;
}

export interface OutfitSchedule {
  id: string;
  user_id: string;
  outfit_id: string;
  scheduled_date: string; // YYYY-MM-DD
  worn: boolean;
  notes?: string;
  created_at: string;
}

export interface TryOnResult {
  id: string;
  user_id: string;
  user_photo_id: string;
  outfit_id: string;
  result_image_url: string;
  score: number; // 1 - 10
  fit_feedback: string;
  color_feedback: string;
  style_tips: string[];
  created_at: string;
}

export interface ShoppingSuggestion {
  id: string;
  user_id: string;
  title: string;
  category: ClothingCategory;
  reason: string;
  matching_item_ids: string[];
  recommended_color: string;
  price_tier: PriceTier;
  estimated_price: string;
  search_query: string;
  image_url: string;
  suitability_reason: string;
}

export interface ClothingAnalysisResult {
  category: ClothingCategory;
  subcategory: string;
  color: string;
  secondary_color?: string;
  color_hex?: string;
  pattern: string;
  season: ClothingSeason;
  style: ClothingStyle;
  brand?: string;
  occasions: OccasionType[];
  tags: string[];
  notes?: string;
}

export interface PhotoAnalysisResult {
  skin_tone: string;
  undertone: 'Warm' | 'Cool' | 'Neutral' | 'Olive';
  body_type: string;
  recommended_palette: string[];
  style_summary: string;
}
