-- 1. Ensure the table exists with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  api_key TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  has_completed_onboarding BOOLEAN DEFAULT false,
  access_status TEXT DEFAULT 'approved', -- Grant access immediately after signup
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS (safe if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create a helper to generate sk_live keys
CREATE OR REPLACE FUNCTION generate_api_key() 
RETURNS TEXT AS $$
BEGIN
  RETURN 'sk_live_' || encode(gen_random_bytes(24), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger function (This replaces/creates the one on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, api_key, access_status)
  VALUES (
    new.id, 
    new.email, 
    generate_api_key(),
    'approved'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Re-bind the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Re-create Policies safely by dropping them first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. Ensure everyone existing also has an API Key
UPDATE public.profiles SET api_key = generate_api_key() WHERE api_key IS NULL;
