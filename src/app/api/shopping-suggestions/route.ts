import { NextRequest, NextResponse } from 'next/server';
import { geminiClient, withGeminiRetry } from '@/lib/gemini';
import { ClothingItem, UserProfile, ShoppingSuggestion } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clothes,
      userProfile,
      budgetFilter = 'All',
    }: {
      clothes: ClothingItem[];
      userProfile?: UserProfile;
      budgetFilter?: string;
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const wardrobeSummary = (clothes || []).map((c) => ({
      id: c.id,
      category: c.category,
      subcategory: c.subcategory,
      color: c.color,
      style: c.style,
      season: c.season,
      brand: c.brand,
    }));

    if (!apiKey) {
      // Offline fallback suggestions
      const fallbackSuggestions: ShoppingSuggestion[] = [
        {
          id: 'sugg_01',
          user_id: userProfile?.id || 'usr_demo',
          title: 'Camel Wool Overcoat',
          category: 'Outerwear',
          reason: 'Your wardrobe has excellent casual layers, but is missing an elevated long neutral coat to complete formal and date night outfits.',
          matching_item_ids: wardrobeSummary.slice(0, 3).map((w) => w.id),
          recommended_color: 'Camel / Warm Tan',
          price_tier: 'Mid',
          estimated_price: '$120 - $180',
          search_query: 'mens camel wool overcoat tailored',
          image_url: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80',
          suitability_reason: 'Warm camel tones accentuate your golden skin undertones and pair effortlessly with navy, beige, and denim.',
        },
        {
          id: 'sugg_02',
          user_id: userProfile?.id || 'usr_demo',
          title: 'Dark Brown Penny Loafers',
          category: 'Footwear',
          reason: 'You currently have white sneakers and boots, but lack a refined slip-on leather loafer for smart-casual office and summer evenings.',
          matching_item_ids: wardrobeSummary.slice(1, 4).map((w) => w.id),
          recommended_color: 'Espresso Brown',
          price_tier: 'Mid',
          estimated_price: '$95 - $140',
          search_query: 'leather penny loafers dark brown',
          image_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80',
          suitability_reason: 'Deep brown leather adds rich warmth that grounds beige chinos and dark indigo jeans.',
        },
        {
          id: 'sugg_03',
          user_id: userProfile?.id || 'usr_demo',
          title: 'Textured Knit Polo',
          category: 'Tops',
          reason: 'Bridges the gap between casual t-shirts and formal button-downs, unlocking 6+ new smart-casual outfit permutations.',
          matching_item_ids: wardrobeSummary.slice(0, 2).map((w) => w.id),
          recommended_color: 'Forest Green or Ecru',
          price_tier: 'Budget',
          estimated_price: '$35 - $55',
          search_query: 'textured knit polo shirt vintage collar',
          image_url: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80',
          suitability_reason: 'The textured collar frames the face naturally, adding dimension without feeling stiff.',
        },
      ];
      return NextResponse.json({ suggestions: fallbackSuggestions });
    }

    const prompt = `You are an elite personal shopper and capsule wardrobe strategist.
Analyze the user's existing wardrobe inventory and user style profile to discover EXACT WARDROBE GAPS (missing versatile essentials, missing footwear, missing layer pieces, or color imbalances).

USER PROFILE:
- Gender: ${userProfile?.gender || 'Unisex'}
- Preferred Styles: ${userProfile?.preferred_styles?.join(', ') || 'Casual, Minimalist'}
- Skin Tone: ${userProfile?.skin_tone || 'Warm Medium'}
- Undertone: ${userProfile?.undertone || 'Warm'}
- Best Palette: ${userProfile?.recommended_palette?.join(', ') || 'Earth tones, Navy, Warm Neutrals'}
- Budget Preference: ${budgetFilter !== 'All' ? budgetFilter : userProfile?.budget_tier || 'Mid'}

CURRENT WARDROBE ITEMS (JSON):
${JSON.stringify(wardrobeSummary, null, 2)}

TASK:
Identify 3-4 distinct wardrobe gaps. For each recommended item:
1. title: specific name of the item to purchase (e.g. "Espresso Leather Penny Loafers", "Merino Wool Crewneck Sweater", "Structured Beige Linen Blazer")
2. category: one of ["Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Accessories", "Ethnic"]
3. reason: 1-2 concise sentences explaining why this exact item is missing from their current wardrobe
4. matching_item_ids: array of IDs of existing clothes in their wardrobe that this new purchase would pair with
5. recommended_color: specific flattering color recommendation matching their skin tone / undertone
6. price_tier: "Budget", "Mid", or "Luxury"
7. estimated_price: estimated price range string (e.g. "$40 - $70", "$90 - $150")
8. search_query: Google Shopping search query string (e.g. "mens brown leather penny loafers classic")
9. image_url: an appropriate high quality fashion Unsplash URL for this type of clothing (use standard fashion photo URLs)
10. suitability_reason: 1 sentence explaining why this color and cut suits their skin tone and body type

Return a STRICT JSON array of objects with the fields above.
Respond ONLY with valid raw JSON.`;

    const result = await withGeminiRetry(async () => {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ text: prompt }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text || '[]';
      const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      const list = Array.isArray(parsed) ? parsed : parsed.suggestions || [];

      // Ensure IDs and structure
      return list.map((item: any, idx: number) => ({
        ...item,
        id: `sugg_ai_${Date.now()}_${idx}`,
        user_id: userProfile?.id || 'usr_demo',
      }));
    });

    return NextResponse.json({ suggestions: result });
  } catch (error: any) {
    console.error('Shopping suggestions error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate shopping suggestions with Gemini',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
