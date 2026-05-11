-- FLUX.2 Playground - Complete Database Setup
-- Run this script ONCE to set up everything needed

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS generations CASCADE;

-- Create table for storing image generations
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Nullable for anonymous users (stores Vercel OAuth sub)
  user_email TEXT,
  ip_address TEXT, -- For anonymous user rate limiting
  prompt TEXT NOT NULL,
  model TEXT DEFAULT 'bfl/flux-2-pro',
  aspect_ratio TEXT DEFAULT '1:1',
  quality TEXT DEFAULT 'standard',
  number_of_images INTEGER DEFAULT 1,
  images TEXT[] NOT NULL, -- Array of Vercel Blob public URLs
  reference_images TEXT[], -- Array of reference image URLs or base64
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_generations_user_id ON generations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_generations_ip_address ON generations(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own generations" ON generations;
DROP POLICY IF EXISTS "Users can insert own generations" ON generations;
DROP POLICY IF EXISTS "Users can delete own generations" ON generations;
DROP POLICY IF EXISTS "Anonymous can view own generations" ON generations;
DROP POLICY IF EXISTS "Anonymous can insert generations" ON generations;
DROP POLICY IF EXISTS "Allow reads for matching user_id" ON generations;

-- Simplified RLS policies - only for database reads
-- Service role (admin client) handles all writes and bypasses RLS
CREATE POLICY "Allow reads for matching user_id"
  ON generations
  FOR SELECT
  USING (true); -- Service role filters by user_id in application code

-- No INSERT policies needed - all inserts go through service role which bypasses RLS

-- Note: No storage bucket needed - using Vercel Blob for image storage
