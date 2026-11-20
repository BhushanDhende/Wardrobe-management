import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClientWithKey, withGeminiRetry } from '@/lib/gemini';
import { ClothingItem, UserProfile, WardrobePairingMatch } from '@/lib/types';
import { evaluateColorSuitability } from '@/lib/colorScience';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      selectedItem,
      wardrobe = [],
      userProfile,
      apiKey: clientKey,
    }: {
      selectedItem: ClothingItem;
      wardrobe: ClothingItem[];
      userProfile?: UserProfile;
      apiKey?: string;
    } = body;

    if (!selectedItem) {
      return NextResponse.json({ error: 'Selected item is required' }, { status: 400 });
    }

    const customKey = req.headers.get('x-gemini-key') || clientKey;
    const { client, hasValidKey } = getGeminiClientWithKey(customKey);

    // 1. Evaluate personal color suitability of the selected item
    const colorEval = evaluateColorSuitability(selectedItem, userProfile);

    // 2. Filter wardrobe by category (excluding the selected item itself)
    const otherClothes = wardrobe.filter((c) => c.id !== selectedItem.id);
    const tops = otherClothes.filter((c) => c.category === 'Tops');
    const bottoms = otherClothes.filter((c) => c.category === 'Bottoms');
    const shoes = otherClothes.filter((c) => c.category === 'Footwear');
    const outerwear = otherClothes.filter((c) => c.category === 'Outerwear');

    // 3. Fallback pairing logic based on classic color harmony & style rules
    const category = selectedItem.category;
    let matchingTops: ClothingItem[] = [];
    let matchingBottoms: ClothingItem[] = [];
    let matchingShoes: ClothingItem[] = [];
    let matchingOuterwear: ClothingItem[] = [];
    let stylingFormula = '';
    let missingGaps: WardrobePairingMatch['missing_gaps'] = [];

    const isBottoms = category === 'Bottoms';
    const isTops = category === 'Tops';
    const isShoes = category === 'Footwear';

    if (isBottoms) {
      // Find matching tops: prefer contrasting colors (e.g., if bottom is light beige, pair with dark navy or crisp white/blue)
      matchingTops = tops.slice(0, 3);
      matchingShoes = shoes.slice(0, 2);
      matchingOuterwear = outerwear.slice(0, 2);

      const topName = matchingTops[0]?.subcategory || 'Oxford Shirt';
      const shoeName = matchingShoes[0]?.subcategory || 'Leather Loafers';
      stylingFormula = `Pair these ${selectedItem.subcategory} with your ${topName} and anchor the outfit with your ${shoeName}. This balances silhouette proportions and creates clean visual contrast.`;

      missingGaps = [
        {
          title: 'Textured Knit Polo T-shirt',
          category: 'Tops',
          reason: `You have these versatile ${selectedItem.subcategory}, but lack an elevated collared knit polo to complete smart-casual and date looks.`,
          recommended_color: 'Navy Blue or Forest Green',
          estimated_price_inr: '₹799 - ₹1,499',
          search_query: `textured knit polo shirt collar ${selectedItem.color} chinos matching`,
          image_url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Dark Brown Penny Loafers',
          category: 'Footwear',
          reason: `A refined slip-on leather loafer bridges the gap between sneakers and dress boots when wearing these ${selectedItem.subcategory}.`,
          recommended_color: 'Espresso Brown',
          estimated_price_inr: '₹1,499 - ₹2,999',
          search_query: 'dark brown leather penny loafers formal casual',
          image_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80',
        },
      ];
    } else if (isTops) {
      matchingBottoms = bottoms.slice(0, 3);
      matchingShoes = shoes.slice(0, 2);
      matchingOuterwear = outerwear.slice(0, 2);

      const bottomName = matchingBottoms[0]?.subcategory || 'Trousers';
      const shoeName = matchingShoes[0]?.subcategory || 'Sneakers';
      stylingFormula = `Wear this ${selectedItem.subcategory} over your ${bottomName}. Finish with your ${shoeName} for a relaxed yet intentional aesthetic.`;

      missingGaps = [
        {
          title: 'Tailored Linen Pleated Trousers',
          category: 'Bottoms',
          reason: `To elevate this ${selectedItem.subcategory} for warm-weather and evening dinners, add lightweight tailored linen trousers.`,
          recommended_color: 'Earthy Olive or Warm Taupe',
          estimated_price_inr: '₹1,299 - ₹2,499',
          search_query: `mens linen pleated trousers tailored relaxed fit`,
          image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
        },
      ];
    } else if (isShoes) {
      matchingBottoms = bottoms.slice(0, 2);
      matchingTops = tops.slice(0, 2);
      matchingOuterwear = outerwear.slice(0, 1);

      const bottomName = matchingBottoms[0]?.subcategory || 'Pants';
      stylingFormula = `Anchor these ${selectedItem.subcategory} with your ${bottomName}. Ensure hem break sits cleanly on the shoe collar.`;

      missingGaps = [
        {
          title: 'Structured Casual Overshirt',
          category: 'Outerwear',
          reason: `Frames the outfit and mirrors the texture of your ${selectedItem.subcategory}.`,
          recommended_color: 'Washed Indigo or Khaki',
          estimated_price_inr: '₹1,499 - ₹2,799',
          search_query: 'structured cotton overshirt jacket casual',
          image_url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
        },
      ];
    } else {
      matchingTops = tops.slice(0, 2);
      matchingBottoms = bottoms.slice(0, 2);
      matchingShoes = shoes.slice(0, 1);
      stylingFormula = `Layer this ${selectedItem.subcategory} over your wardrobe basics to elevate depth and structure.`;
    }

    // 4. If Gemini API key is valid, run deep AI pairing analysis
    if (hasValidKey) {
      try {
        const wardrobeSummary = otherClothes.map((c) => ({
          id: c.id,
          category: c.category,
          subcategory: c.subcategory,
          color: c.color,
          style: c.style,
          brand: c.brand,
        }));

        const prompt = `You are a high-end personal wardrobe architect.
The user clicked on a specific wardrobe item:
- Item: "${selectedItem.subcategory}" (${selectedItem.category})
- Color: ${selectedItem.color}
- Style: ${selectedItem.style}

USER STYLE PROFILE:
- Gender: ${userProfile?.gender || 'Unisex'}
- Complexion / Skin Tone: ${userProfile?.skin_tone || 'Medium Warm'} (${userProfile?.undertone || 'Warm'} undertone)
- Best Colors: ${userProfile?.best_colors?.map((c) => c.name).join(', ') || 'Camel, Olive, Navy, Terracotta'}
- Body Shape: ${userProfile?.body_type || 'Athletic'}

EXISTING WARDROBE ITEMS (JSON):
${JSON.stringify(wardrobeSummary, null, 2)}

TASK:
1. Select which exact items from the user's existing wardrobe pair BEST with this item:
   - matching_top_ids: array of IDs of matching Tops from their wardrobe
   - matching_bottom_ids: array of IDs of matching Bottoms from their wardrobe
   - matching_shoe_ids: array of IDs of matching Footwear from their wardrobe
   - matching_outerwear_ids: array of IDs of matching Outerwear from their wardrobe
2. styling_formula: 2 sentences explaining the exact styling formula (e.g., "Pair these pants with this shirt tucked in and these shoes to achieve...").
3. missing_gaps: Identify 1-2 distinct wardrobe items that the user DOES NOT HAVE in their closet that would look AMAZING with this item (e.g. if they have good pants, what missing shirt or shoes should they buy?).
   For each gap:
   - title: item name to purchase
   - category: category
   - reason: concise explanation of why this missing piece completes the look
   - recommended_color: color suited to their skin tone
   - estimated_price_inr: price range in INR with ₹ (e.g. "₹999 - ₹1,899")
   - search_query: search query keywords for fashion platforms (Myntra, Amazon, Flipkart, Meesho)

Return a STRICT JSON object with matching_top_ids, matching_bottom_ids, matching_shoe_ids, matching_outerwear_ids, styling_formula, and missing_gaps.
Respond ONLY with valid raw JSON.`;

        const aiResult = await withGeminiRetry(async () => {
          const response = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [{ text: prompt }],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

          const text = response.text || '{}';
          return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
        });

        if (Array.isArray(aiResult.matching_top_ids) && aiResult.matching_top_ids.length > 0) {
          const matched = aiResult.matching_top_ids
            .map((id: string) => wardrobe.find((c) => c.id === id))
            .filter((c: any): c is ClothingItem => Boolean(c));
          if (matched.length > 0) matchingTops = matched;
        }

        if (Array.isArray(aiResult.matching_bottom_ids) && aiResult.matching_bottom_ids.length > 0) {
          const matched = aiResult.matching_bottom_ids
            .map((id: string) => wardrobe.find((c) => c.id === id))
            .filter((c: any): c is ClothingItem => Boolean(c));
          if (matched.length > 0) matchingBottoms = matched;
        }

        if (Array.isArray(aiResult.matching_shoe_ids) && aiResult.matching_shoe_ids.length > 0) {
          const matched = aiResult.matching_shoe_ids
            .map((id: string) => wardrobe.find((c) => c.id === id))
            .filter((c: any): c is ClothingItem => Boolean(c));
          if (matched.length > 0) matchingShoes = matched;
        }

        if (Array.isArray(aiResult.matching_outerwear_ids) && aiResult.matching_outerwear_ids.length > 0) {
          const matched = aiResult.matching_outerwear_ids
            .map((id: string) => wardrobe.find((c) => c.id === id))
            .filter((c: any): c is ClothingItem => Boolean(c));
          if (matched.length > 0) matchingOuterwear = matched;
        }

        if (aiResult.styling_formula) {
          stylingFormula = aiResult.styling_formula;
        }

        if (Array.isArray(aiResult.missing_gaps) && aiResult.missing_gaps.length > 0) {
          missingGaps = aiResult.missing_gaps.map((gap: any) => ({
            ...gap,
            image_url: gap.image_url || 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
          }));
        }
      } catch (geminiError) {
        console.warn('Gemini item pairing analysis failed, using rule-based pairing:', geminiError);
      }
    }

    const payload: WardrobePairingMatch = {
      selected_item: selectedItem,
      color_suitability: {
        status: colorEval.status,
        label: colorEval.badge,
        reason: colorEval.reason,
      },
      matching_items: {
        tops: matchingTops,
        bottoms: matchingBottoms,
        shoes: matchingShoes,
        outerwear: matchingOuterwear,
      },
      styling_formula: stylingFormula,
      missing_gaps: missingGaps,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Item pairing API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze item pairing',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
