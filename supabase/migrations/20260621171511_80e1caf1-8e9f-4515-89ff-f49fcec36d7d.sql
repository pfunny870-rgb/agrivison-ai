ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dietary_preferences text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_intents text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS default_intent text,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;