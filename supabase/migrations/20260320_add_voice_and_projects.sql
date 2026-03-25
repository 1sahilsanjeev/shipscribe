-- Migration: Add Voice Personas and Projects
-- Date: 2026-03-20

CREATE TABLE IF NOT EXISTS voice_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  x_username TEXT NOT NULL,
  x_url TEXT,
  type TEXT DEFAULT 'own',
  -- 'own' = user's own account
  -- 'creator' = someone else's style
  description TEXT,
  status TEXT DEFAULT 'pending',
  -- pending | scraping | training | ready | failed
  tweet_count INTEGER DEFAULT 0,
  fingerprint JSONB,
  -- stores tone, hooks, style, vocabulary
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  -- active | building | launched | paused | archived
  url TEXT,
  github_url TEXT,
  tech_stack TEXT[],
  -- array of tech: ['React', 'Node.js', 'Supabase']
  started_at DATE,
  launched_at DATE,
  target_audience TEXT,
  problem_solved TEXT,
  current_focus TEXT,
  -- what you're working on right now
  metrics JSONB,
  -- { mrr: 0, users: 0, commits: 0 }
  color TEXT DEFAULT '#1A3FE0',
  -- project card accent color
  emoji TEXT DEFAULT '🚀',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Row Level Security (RLS) policies should be added here
-- But as per user request, we enable them and add policies.

ALTER TABLE voice_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- If policies already exist, this might fail or need to be handled. 
-- For a fresh migration, these are fine.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'voice_personas' AND policyname = 'own personas'
    ) THEN
        CREATE POLICY "own personas" ON voice_personas 
          FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' AND policyname = 'own projects'
    ) THEN
        CREATE POLICY "own projects" ON projects 
          FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
