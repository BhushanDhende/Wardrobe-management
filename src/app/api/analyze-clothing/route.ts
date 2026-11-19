import { NextRequest, NextResponse } from 'next/server';
import { geminiClient, withGeminiRetry } from '@/lib/gemini';
import { ClothingAnalysisResult } from '@/lib/types';

export const maxDuration = 60; // 60 seconds max duration

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg' } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 data is required' }, { status: 400 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      // Mock fallback for quick offline dev test
      const mockResult: ClothingAnalysisResult = {
        category: 'Tops',
        subcategory: 'Casual Cotton Top',
        color: 'Navy Blue',
        secondary_color: 'White',
        color_hex: '#1E3A8A',
        pattern: 'Solid',
        season: 'All-Season',
        style: 'Casual',
        brand: 'Generic',
        occasions: ['Casual', 'Travel'],
        tags: ['cotton', 'comfortable', 'versatile'],
        notes: 'AI auto-detected item (Demo mode - set GEMINI_API_KEY for live Gemini Vision)',
      };
      return NextResponse.json(mockResult);
    }

    const prompt = `You are an expert fashion stylist and apparel classifier.
Analyze this photo of a clothing item or accessory in high detail.
Return a STRICT JSON object with the following fields:
- category: one of ["Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Accessories", "Ethnic"]
- subcategory: specific name of the garment (e.g. "Oversized Graphic Tee", "Tailored Pleated Chinos", "Leather Biker Jacket", "Oxford Shirt", "Ankle Boots", "Silk Saree", "Linen Kurta", "Denim Jacket")
- color: primary dominant color name (e.g. "Navy Blue", "Olive Green", "Charcoal Black", "Cream", "Burgundy")
- secondary_color: secondary or accent color if any, else null
- color_hex: representative hex code string (e.g. "#1E3A8A")
- pattern: pattern type (e.g. "Solid", "Striped", "Plaid / Tartan", "Floral", "Graphic / Print", "Polka Dot", "Textured", "Embroidered")
- season: best season, one of ["Spring", "Summer", "Autumn", "Winter", "All-Season"]
- style: aesthetic style, one of ["Casual", "Formal", "Party", "Ethnic", "Streetwear", "Minimalist", "Sporty"]
- brand: visible brand name or logo if identifiable, else null
- occasions: array of matching occasions from ["Office", "Party", "Date", "Wedding", "Casual", "Workout", "Travel", "Festive"]
- tags: array of 3-5 descriptive lowercase fashion keywords (e.g. ["cotton", "tailored", "breathable", "vintage"])
- notes: a 1-sentence styling tip or fabric description.

Respond with ONLY the raw JSON object, without backticks or markdown fences.`;

    const result = await withGeminiRetry(async () => {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '{}';
      return JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Clothing analysis error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze clothing item with Gemini Vision',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
