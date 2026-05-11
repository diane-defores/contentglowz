-- Create table for storing podcast scripts
CREATE TABLE IF NOT EXISTS public.podcast_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  speaker_count INTEGER NOT NULL,
  script_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.podcast_scripts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert scripts (no auth required for this simple use case)
CREATE POLICY "Allow public insert on podcast_scripts" 
  ON public.podcast_scripts FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to select scripts by ID
CREATE POLICY "Allow public select on podcast_scripts" 
  ON public.podcast_scripts FOR SELECT 
  USING (true);
