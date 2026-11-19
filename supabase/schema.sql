-- ==============================================================================
-- WARDROBEAI SUPABASE POSTGRESQL SCHEMA
-- Complete Data Model with Row Level Security (RLS) & Storage Policies
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS / PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  gender text default 'Unisex' check (gender in ('Men', 'Women', 'Unisex')),
  favorite_colors text[] default array[]::text[],
  preferred_styles text[] default array['Casual', 'Minimalist']::text[],
  budget_tier text default 'Mid' check (budget_tier in ('Budget', 'Mid', 'Luxury')),
  skin_tone text,
  undertone text check (undertone in ('Warm', 'Cool', 'Neutral', 'Olive')),
  body_type text,
  recommended_palette text[] default array[]::text[],
  photo_consent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. PROFILE PHOTOS TABLE (For Virtual Try-On)
create table if not exists public.profile_photos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text not null,
  is_default boolean default false,
  skin_tone_detected text,
  body_type_detected text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profile_photos enable row level security;

create policy "Users can view their own profile photos"
  on public.profile_photos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile photos"
  on public.profile_photos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile photos"
  on public.profile_photos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own profile photos"
  on public.profile_photos for delete
  using (auth.uid() = user_id);

-- 3. CLOTHES TABLE
create table if not exists public.clothes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text not null,
  category text not null check (category in ('Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories', 'Ethnic')),
  subcategory text not null,
  color text not null,
  secondary_color text,
  color_hex text,
  pattern text default 'Solid',
  season text default 'All-Season' check (season in ('Spring', 'Summer', 'Autumn', 'Winter', 'All-Season')),
  style text default 'Casual' check (style in ('Casual', 'Formal', 'Party', 'Ethnic', 'Streetwear', 'Minimalist', 'Sporty')),
  brand text,
  occasions text[] default array['Casual']::text[],
  tags text[] default array[]::text[],
  wear_count integer default 0 not null,
  is_favorite boolean default false not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_clothes_user_id on public.clothes(user_id);
create index if not exists idx_clothes_category on public.clothes(category);

alter table public.clothes enable row level security;

create policy "Users can view their own clothes"
  on public.clothes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own clothes"
  on public.clothes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clothes"
  on public.clothes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own clothes"
  on public.clothes for delete
  using (auth.uid() = user_id);

-- 4. OUTFITS TABLE
create table if not exists public.outfits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  occasion text not null,
  weather text,
  mood text,
  item_ids uuid[] not null,
  styling_notes text,
  color_harmony text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_outfits_user_id on public.outfits(user_id);

alter table public.outfits enable row level security;

create policy "Users can view their own outfits"
  on public.outfits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outfits"
  on public.outfits for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own outfits"
  on public.outfits for delete
  using (auth.uid() = user_id);

-- 5. OUTFIT CALENDAR / WEAR HISTORY TABLE
create table if not exists public.outfit_calendar (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  outfit_id uuid references public.outfits(id) on delete cascade not null,
  scheduled_date date not null,
  worn boolean default false not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_calendar_user_date on public.outfit_calendar(user_id, scheduled_date);

alter table public.outfit_calendar enable row level security;

create policy "Users can view their own calendar"
  on public.outfit_calendar for select
  using (auth.uid() = user_id);

create policy "Users can insert their own calendar entries"
  on public.outfit_calendar for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calendar entries"
  on public.outfit_calendar for update
  using (auth.uid() = user_id);

create policy "Users can delete their own calendar entries"
  on public.outfit_calendar for delete
  using (auth.uid() = user_id);

-- 6. VIRTUAL TRY-ON RESULTS TABLE
create table if not exists public.tryon_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_photo_id uuid references public.profile_photos(id) on delete cascade not null,
  outfit_id uuid references public.outfits(id) on delete cascade not null,
  result_image_url text not null,
  score numeric(3, 1) default 9.0,
  fit_feedback text,
  color_feedback text,
  style_tips text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_tryon_user_id on public.tryon_results(user_id);

alter table public.tryon_results enable row level security;

create policy "Users can view their own tryon results"
  on public.tryon_results for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tryon results"
  on public.tryon_results for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own tryon results"
  on public.tryon_results for delete
  using (auth.uid() = user_id);

-- 7. SMART SHOPPING SUGGESTIONS TABLE
create table if not exists public.shopping_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  category text not null,
  reason text not null,
  matching_item_ids uuid[] default array[]::uuid[],
  recommended_color text not null,
  price_tier text default 'Mid' check (price_tier in ('Budget', 'Mid', 'Luxury')),
  estimated_price text,
  search_query text not null,
  image_url text,
  suitability_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.shopping_suggestions enable row level security;

create policy "Users can manage their shopping suggestions"
  on public.shopping_suggestions for all
  using (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (Supabase Storage)
-- ==============================================================================
-- Run in Supabase SQL editor:
-- insert into storage.buckets (id, name, public) values ('clothes-images', 'clothes-images', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', false) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('tryon-results', 'tryon-results', false) on conflict do nothing;
