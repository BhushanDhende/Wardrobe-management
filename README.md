# WardrobeAI 👗✨
### Mobile-First AI Wardrobe Management, Virtual Try-On & Smart Shopping

WardrobeAI is an installable Progressive Web App (PWA) that transforms your phone into a high-fashion AI stylist, virtual fitting room, and intelligent capsule wardrobe manager powered exclusively by **Google Gemini API** (`gemini-3.8-flash` and `gemini-3.1-flash-image`).

---

## 📱 Core Features

### 1. Add Clothes by Photo
- **Camera or Gallery**: Snap clothes directly with your phone camera (`capture="environment"`) or upload from gallery.
- **Client-Side Compression**: Compresses photos on device (max ~1024px, JPEG 0.82) before upload for fast transfer.
- **Gemini Vision Extraction**: Automatically detects:
  - Category (`Tops`, `Bottoms`, `Dresses`, `Outerwear`, `Footwear`, `Accessories`, `Ethnic`)
  - Subcategory (e.g., *"Oxford Button-Down Shirt"*, *"Silk Embroidered Kurta Set"*)
  - Primary color, secondary accent, and precise hex code
  - Pattern (`Solid`, `Striped`, `Plaid`, `Floral`, `Graphic`, `Textured`, `Embroidered`)
  - Season (`Spring`, `Summer`, `Autumn`, `Winter`, `All-Season`)
  - Style (`Casual`, `Formal`, `Party`, `Ethnic`, `Streetwear`, `Minimalist`, `Sporty`)
  - Occasion tags and descriptive keywords
- **Editable before saving**: Modify any detected field, brand, tags, or notes before saving.

### 2. My Wardrobe
- **Grid View**: Clean 2-column mobile layout (3-4 on larger displays) with thumbnail previews.
- **Advanced Filtering**: Instant filter pills for categories, colors, seasons, occasions, styles.
- **Dynamic Search**: Live search across subcategories, categories, colors, brands, and tags.
- **Favorites**: One-tap heart toggle with optimistic UI.
- **Times Worn Counter**: Visual count badge with "+1 worn" quick action to track garment utilization.
- **Edit & Delete**: Full edit modal and permanent delete option.

### 3. AI Outfit Generator
- **Multi-Factor Input**: Choose Occasion (*Office*, *Casual*, *Date*, *Party*, *Wedding*, *Festive*, *Travel*, *Workout*), Weather (*Sunny & Warm*, *Hot & Humid*, *Cool & Breezy*, *Cold & Rainy*, *Freezing*), and Mood (*Confident*, *Effortless & Relaxed*, *Elegant & Chic*, *Bold & Vibrant*, *Cozy*).
- **Gemini Stylist Logic**: Feeds existing wardrobe items (JSON) + user preferences into Gemini. Guarantees outfits are composed **only** of clothes you actually own.
- **Visual Fashion Collage**: Dynamically stitches item photos into high-fashion collage spreads.
- **Color Harmony & Styling Notes**: Explains why the pieces work together and offers actionable styling tips.
- **Actions**:
  - *Save Outfit* to Lookbook
  - *Regenerate* for alternate permutations
  - *Mark as worn today* (increments wear count of each item and logs to calendar)
  - *Try on me* (launches Virtual Try-On)

### 4. Smart Shopping Suggestions
- **Wardrobe Gap Detection**: Gemini detects missing staples (e.g. *"Missing neutral leather loafers to bridge 5 smart-casual outfits"*).
- **Skin Tone Harmonization**: Color recommendations tailored to your detected skin tone and seasonal color palette.
- **Budget Filter**: Toggle between *All*, *Budget (<$50)*, *Mid ($50-$150)*, and *Luxury ($150+)*.
- **Buy Link**: Direct 1-tap link to Google Shopping searches with pre-filled targeted queries.

### 5. Outfit Calendar & Wear History
- **Plan Ahead**: Schedule outfits for upcoming dates.
- **Wear History**: Track what you wore on past days to prevent repeating looks too frequently.
- **Notes & Event Tagging**: Keep journal notes (e.g. *"Quarterly board presentation - felt sharp"*).

### 6. Login, Profile & Style Preferences
- **Profile Customization**: Gender expression, favorite color palette, preferred aesthetics, budget tier.
- **Dual-Storage Engine**: Seamlessly runs with live Supabase authentication & PostgreSQL database or offline private local storage mode.
- **Theme Mode**: Instant Light / Dark mode toggle.

### 7. Virtual Try-On (My Photo)
- **Profile Photo Model**: Upload full-body, front-facing photos in Profile → "My Photos" and choose a default.
- **Auto-Detection**: Gemini Vision scans your photo to detect skin tone, undertone (*Warm*, *Cool*, *Neutral*, *Olive*), and silhouette body type.
- **Try On Me**: Sends your photo and outfit items to Gemini with prompt:
  > *"Dress this person in these clothes. Keep the face, body, pose, skin tone and background unchanged. Make the clothes fit naturally."*
- **Side-by-Side & Interactive Slider**: Compare your original photo directly with the try-on result.
- **"Looks Good on Me?" AI Stylist Score**:
  - Rating out of 10
  - Fit & Silhouette analysis
  - Skin tone color harmony feedback
  - 3 actionable stylist tips
- **Privacy First**: Explicit consent required before upload, encrypted private storage, and a permanent **"Delete My Photos"** button that purges photos and try-on history.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **PWA**: Installable web app with `manifest.json`, viewport optimization, and offline readiness.
- **Backend**: Next.js Server Route Handlers + Supabase (PostgreSQL with RLS, Auth, Storage).
- **AI**: Official Google Gen AI SDK (`@google/genai`) calling `gemini-3.8-flash` and `gemini-3.1-flash-image` strictly server-side.

---

## 🗄️ Database Schema (Supabase PostgreSQL)

See [`supabase/schema.sql`](file:///d:/Projects/wardrobe%20manegment/supabase/schema.sql) for the complete schema with Row-Level Security (RLS) policies.

```sql
-- 1. profiles: user style preferences, skin tone, body type
-- 2. profile_photos: user full-body photos, default flag
-- 3. clothes: image_url, category, color, pattern, season, style, brand, tags, wear_count
-- 4. outfits: item_ids, occasion, weather, mood, styling_notes, color_harmony
-- 5. outfit_calendar: outfit_id, scheduled_date, worn, notes
-- 6. tryon_results: user_photo_id, outfit_id, result_image_url, score, feedback
-- 7. shopping_suggestions: title, category, reason, budget, search_query, image_url
```

---

## 🤖 Gemini Prompts Used for Each AI Task

### 1. Clothes & Photo Analysis (`gemini-3.8-flash` - Vision)
```text
You are an expert fashion stylist and apparel classifier.
Analyze this photo of a clothing item or accessory in high detail.
Return a STRICT JSON object with:
- category: one of ["Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Accessories", "Ethnic"]
- subcategory: specific name of garment (e.g. "Oversized Graphic Tee", "Oxford Shirt", "Silk Saree")
- color: primary dominant color name
- secondary_color: secondary color or null
- color_hex: representative hex code string
- pattern: pattern type ("Solid", "Striped", "Plaid", "Floral", etc.)
- season: best season ("Spring", "Summer", "Autumn", "Winter", "All-Season")
- style: aesthetic style ("Casual", "Formal", "Party", "Ethnic", "Streetwear", "Minimalist", "Sporty")
- brand: visible brand name or null
- occasions: array of matching occasions
- tags: array of 3-5 descriptive keywords
- notes: 1-sentence styling tip or fabric description.
```

### 2. User Skin Tone & Body Type Detection (`gemini-3.8-flash` - Vision)
```text
You are a world-class personal image consultant, color analysis specialist, and stylist.
Analyze this full-body portrait photo to help the user curate outfits and discover their best color palette.
Return a STRICT JSON object with:
- skin_tone: concise descriptive skin tone (e.g. "Medium Olive", "Fair Warm")
- undertone: one of ["Warm", "Cool", "Neutral", "Olive"]
- body_type: descriptive silhouette category ("Athletic / Balanced", "Rectangle", "Hourglass")
- recommended_palette: array of 6 specific flattering color names
- style_summary: a 2-sentence encouraging stylist summary highlighting silhouette strengths and flattering color harmonies.
```

### 3. Outfit Generation (`gemini-3.8-flash` - Text)
```text
You are a celebrity fashion stylist and wardrobe architect.
Create 1 full, impeccably styled outfit for the user from their actual wardrobe items.
CONSTRAINTS:
1. You MUST ONLY select item IDs that exist in the PROVIDED WARDROBE CATALOG below.
2. Complete outfit: 1 Top + 1 Bottom + 1 Footwear (+ optional Outerwear/Accessory) OR 1 Dress/Ethnic + Footwear.
3. Factor in Occasion: "${occasion}", Weather: "${weather}", Desired Mood: "${mood}", and user skin tone palette.
4. Ensure high color harmony.
Return JSON with: title, item_ids, styling_notes, color_harmony.
```

### 4. Wardrobe Gap Shopping Suggestions (`gemini-3.8-flash` - Text)
```text
You are an elite personal shopper and capsule wardrobe strategist.
Analyze the user's existing wardrobe inventory and user style profile to discover EXACT WARDROBE GAPS (missing versatile essentials, missing footwear, or color imbalances).
For each recommended item return JSON with:
- title: specific item name
- category: garment category
- reason: why this item is missing
- matching_item_ids: IDs of clothes in their wardrobe it pairs with
- recommended_color: color tailored to their skin tone / undertone
- price_tier: "Budget", "Mid", or "Luxury"
- estimated_price: estimated price range
- search_query: Google Shopping search query string
- image_url: high-quality fashion image URL
- suitability_reason: why this color and cut suits their skin tone and body type.
```

### 5. Virtual Try-On (`gemini-3.1-flash-image` & `gemini-3.8-flash`)
```text
// Image Generation Prompt:
Dress this person in these clothes: ${clothingDescription}. Keep the face, body, pose, skin tone and background unchanged. Make the clothes fit naturally.

// Stylist Review Evaluation Prompt:
Analyze the visual aesthetic of this person wearing this outfit.
Return JSON with:
- score: float rating between 7.5 and 9.9
- fit_feedback: 2 concise sentences on silhouette and drape
- color_feedback: 2 concise sentences on skin tone and color match
- style_tips: 3 specific, actionable styling tips.
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))
- (Optional) A Supabase project ([Supabase](https://supabase.com/))

### 2. Environment Setup
Create a `.env.local` file in the project root:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Running Locally
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or desktop browser.

---

## 🔒 Privacy & Data Ownership
- Photos uploaded for Virtual Try-On are strictly processed for client fitting room features.
- Users can click **"Delete My Photos"** in the Privacy tab at any time to permanently wipe all stored photos and try-on history.
