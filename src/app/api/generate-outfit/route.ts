import { NextRequest, NextResponse } from 'next/server';
import { geminiClient, withGeminiRetry } from '@/lib/gemini';
import { ClothingItem, OccasionType, WeatherType, MoodType, UserProfile } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clothes,
      occasion,
      weather,
      mood,
      userProfile,
      excludeOutfitIds = [],
    }: {
      clothes: ClothingItem[];
      occasion: OccasionType;
      weather: WeatherType;
      mood: MoodType;
      userProfile?: UserProfile;
      excludeOutfitIds?: string[];
    } = body;

    if (!clothes || !Array.isArray(clothes) || clothes.length === 0) {
      return NextResponse.json(
        { error: 'Wardrobe must have at least one item to generate an outfit' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Filter available items summary for the prompt
    const wardrobeCatalog = clothes.map((item) => ({
      id: item.id,
      category: item.category,
      subcategory: item.subcategory,
      color: item.color,
      pattern: item.pattern,
      style: item.style,
      season: item.season,
      brand: item.brand,
      wear_count: item.wear_count,
    }));

    if (!apiKey) {
      // Offline fallback: pick appropriate items algorithmically
      const tops = clothes.filter((c) => c.category === 'Tops');
      const bottoms = clothes.filter((c) => c.category === 'Bottoms');
      const footwear = clothes.filter((c) => c.category === 'Footwear');
      const outerwear = clothes.filter((c) => c.category === 'Outerwear');
      const dresses = clothes.filter((c) => c.category === 'Dresses' || c.category === 'Ethnic');

      const selectedIds: string[] = [];
      if (dresses.length > 0 && Math.random() > 0.6) {
        selectedIds.push(dresses[0].id);
      } else {
        if (tops.length > 0) selectedIds.push(tops[Math.floor(Math.random() * tops.length)].id);
        if (bottoms.length > 0) selectedIds.push(bottoms[Math.floor(Math.random() * bottoms.length)].id);
      }
      if (outerwear.length > 0 && (weather.includes('Cool') || weather.includes('Cold') || weather.includes('Freezing'))) {
        selectedIds.push(outerwear[0].id);
      }
      if (footwear.length > 0) {
        selectedIds.push(footwear[Math.floor(Math.random() * footwear.length)].id);
      }

      return NextResponse.json({
        title: `${mood} ${occasion} Ensemble`,
        occasion,
        weather,
        mood,
        item_ids: selectedIds,
        styling_notes: `A well-balanced outfit combining comfortable textures and tailored elements suited for ${weather.toLowerCase()} conditions during a ${occasion.toLowerCase()} event.`,
        color_harmony: 'Harmonious complementary palette balancing cool and warm tones seamlessly.',
      });
    }

    const prompt = `You are a celebrity fashion stylist and wardrobe architect.
Your task is to create 1 full, impeccably styled outfit for the user from their actual wardrobe items.

CONSTRAINTS & RULES:
1. You MUST ONLY select item IDs that exist in the PROVIDED WARDROBE CATALOG below. Never invent new item IDs.
2. A complete outfit must have:
   - Option A: 1 Top + 1 Bottom + 1 Footwear (+ optional Outerwear/Accessory if weather calls for it)
   - Option B: 1 Dress or 1 Ethnic full set + 1 Footwear (+ optional Outerwear/Accessory)
3. Factor in:
   - Occasion: "${occasion}"
   - Weather: "${weather}"
   - Desired Mood: "${mood}"
   - User Profile Preferences: Gender: ${userProfile?.gender || 'Unisex'}, Best Colors: ${
      userProfile?.recommended_palette?.join(', ') || 'Neutral classics'
    }, Skin Tone: ${userProfile?.skin_tone || 'Versatile'}
4. Color Matching: Ensure high color harmony (monochromatic, analogous, or balanced complementary contrast).

WARDROBE CATALOG (JSON):
${JSON.stringify(wardrobeCatalog, null, 2)}

Return a STRICT JSON object with:
- title: catchy editorial name for the outfit (e.g. "Effortless Minimalist Linen Look", "Sharp Executive Navy Ensemble")
- item_ids: array of string IDs selected from the catalog that make up the complete look
- styling_notes: 2-3 sentences of clear stylist advice on how to wear it (e.g. french tuck, sleeve cuff, collar position) and why this fits the occasion and mood
- color_harmony: 1-2 sentences explaining why these specific colors harmonize together and flatter the user

Respond ONLY with valid raw JSON.`;

    const result = await withGeminiRetry(async () => {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ text: prompt }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const text = response.text || '{}';
      return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Outfit generation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate outfit with Gemini',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
