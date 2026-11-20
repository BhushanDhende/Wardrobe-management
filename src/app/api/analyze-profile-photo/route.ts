import { NextRequest, NextResponse } from 'next/server';
import { geminiClient, withGeminiRetry, isGeminiKeyConfigured } from '@/lib/gemini';
import { PhotoAnalysisResult } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg' } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 data is required' }, { status: 400 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const hasValidKey = isGeminiKeyConfigured();

    if (!hasValidKey) {
      const mockResult: PhotoAnalysisResult = {
        skin_tone: 'Medium Warm with golden undertones',
        undertone: 'Warm',
        body_type: 'Athletic / Balanced Silhouette',
        recommended_palette: [
          'Terracotta',
          'Warm Camel',
          'Rich Olive',
          'Navy Blue',
          'Cream / Ivory',
          'Mustard Gold',
        ],
        style_summary:
          'Your warm golden undertones glow in rich earth tones, warm neutrals, and jewel greens. Structured silhouettes and clean shoulder lines complement your balanced frame.',
      };
      return NextResponse.json(mockResult);
    }

    const prompt = `You are a world-class personal image consultant, color analysis specialist, and stylist.
Analyze this full-body portrait photo to help the user curate outfits and discover their best color palette.
Maintain an encouraging, inclusive, and professional tone.

Return a STRICT JSON object with:
- skin_tone: concise descriptive skin tone (e.g. "Fair with peach undertones", "Medium Olive", "Deep Warm Rich", "Tan Golden")
- undertone: one of ["Warm", "Cool", "Neutral", "Olive"]
- body_type: descriptive silhouette category (e.g. "Athletic / Balanced", "Rectangle / Slim", "Hourglass", "Inverted Triangle", "Soft A-line / Pear")
- recommended_palette: array of 6 specific flattering color names that enhance their undertones (e.g. ["Camel", "Forest Green", "Navy", "Terracotta", "Burgundy", "Warm Cream"])
- style_summary: a 2-sentence encouraging stylist summary highlighting silhouette strengths and flattering color harmonies.

Respond with ONLY valid raw JSON.`;

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
    console.error('Profile photo analysis error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze profile photo',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
