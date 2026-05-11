-- IP Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.ip_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  prompt_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Login Tracking Table
CREATE TABLE IF NOT EXISTS public.user_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vercel_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  first_login_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  total_prompts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Generation History
CREATE TABLE IF NOT EXISTS public.prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  vercel_user_id TEXT,
  prompt TEXT NOT NULL,
  model_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  total_cost DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ip_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ip_usage (allow all reads, service role can write)
CREATE POLICY "Allow public read access to ip_usage"
  ON public.ip_usage FOR SELECT
  USING (true);

CREATE POLICY "Allow service role to manage ip_usage"
  ON public.ip_usage FOR ALL
  USING (true);

-- RLS Policies for user_logins (allow all reads, service role can write)
CREATE POLICY "Allow public read access to user_logins"
  ON public.user_logins FOR SELECT
  USING (true);

CREATE POLICY "Allow service role to manage user_logins"
  ON public.user_logins FOR ALL
  USING (true);

-- RLS Policies for prompt_history (allow all reads, service role can write)
CREATE POLICY "Allow public read access to prompt_history"
  ON public.prompt_history FOR SELECT
  USING (true);

CREATE POLICY "Allow service role to manage prompt_history"
  ON public.prompt_history FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ip_usage_ip_address ON public.ip_usage(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_logins_vercel_user_id ON public.user_logins(vercel_user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON public.prompt_history(created_at DESC);
