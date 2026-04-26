-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Custom Types (Enhanced)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    CREATE TYPE public.platform_type AS ENUM ('github', 'leetcode', 'hackerrank', 'custom');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mood_type') THEN
    CREATE TYPE public.mood_type AS ENUM ('active', 'idle', 'neglected', 'excited');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_condition_type') THEN
    CREATE TYPE public.achievement_condition_type AS ENUM ('first', 'xp', 'streak', 'checkins', 'level', 'stat', 'multi_platform');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform public.platform_type NOT NULL,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  mood public.mood_type NOT NULL DEFAULT 'idle',
  last_checkin_at timestamptz,
  stats jsonb NOT NULL DEFAULT '{}', -- Platform-specific stats (commits, problems solved, etc.)
  streaks text[] NOT NULL DEFAULT '{}', -- Array of ISO date strings for streak tracking
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT pets_user_platform_unique UNIQUE (user_id, platform)
);

CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  platform public.platform_type NOT NULL, -- Denormalized for faster queries
  xp_awarded integer NOT NULL DEFAULT 10 CHECK (xp_awarded > 0),
  stats_snapshot jsonb NOT NULL DEFAULT '{}', -- External API response at check-in time
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id text NOT NULL UNIQUE, -- 'first', 'streak3', 'lvl5', etc.
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL, -- Emoji or icon identifier
  condition_type public.achievement_condition_type NOT NULL,
  threshold integer NOT NULL CHECK (threshold > 0),
  xp_reward integer NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT user_achievements_unique UNIQUE (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  enabled_platforms jsonb NOT NULL DEFAULT '{"github":true,"leetcode":true,"hackerrank":true,"custom":true}',
  usernames jsonb NOT NULL DEFAULT '{}', -- {"github": "octocat", "leetcode": "leetcoder"}
  theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes (Optimized)
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user_platform ON public.pets(user_id, platform); -- Composite for joins
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_pet_id ON public.checkins(pet_id);
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON public.checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user_pet_created_at ON public.checkins(user_id, pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- Platform-Specific XP Base Values (Constant lookup table)
CREATE TABLE IF NOT EXISTS public.platform_config (
  platform public.platform_type PRIMARY KEY,
  base_xp integer NOT NULL CHECK (base_xp > 0),
  level_exponent numeric NOT NULL DEFAULT 1.5
);

INSERT INTO public.platform_config (platform, base_xp, level_exponent) VALUES
  ('github', 100, 1.5),
  ('leetcode', 80, 1.5),
  ('hackerrank', 90, 1.5),
  ('custom', 60, 1.5)
ON CONFLICT (platform) DO NOTHING;

-- Functions

-- Auto-create user row when auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id) VALUES (NEW.id);
  INSERT INTO public.settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Prevent direct XP/level manipulation (only via check-ins)
CREATE OR REPLACE FUNCTION public.prevent_direct_xp_level_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.xp IS DISTINCT FROM OLD.xp OR NEW.level IS DISTINCT FROM OLD.level)
     AND COALESCE(current_setting('luni.allow_xp_update', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'Direct updates to xp/level are not allowed. Use check-ins.';
  END IF;
  RETURN NEW;
END;
$$;

-- Validate pet ownership before check-in
CREATE OR REPLACE FUNCTION public.checkins_before_insert_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.id = NEW.pet_id AND p.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Pet does not belong to user';
  END IF;
  
  -- Enforce 4-hour cooldown at function level (not constraint)
  IF EXISTS (
    SELECT 1 FROM public.checkins c
    WHERE c.user_id = NEW.user_id
      AND c.pet_id = NEW.pet_id
      AND c.created_at > NOW() - INTERVAL '4 hours'
  ) THEN
    RAISE EXCEPTION 'Check-in cooldown active. Try again later.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Calculate XP required for a given level (exponential curve)
CREATE OR REPLACE FUNCTION public.xp_for_level(p_platform public.platform_type, p_level integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base_xp integer;
  v_exponent numeric;
BEGIN
  SELECT base_xp, level_exponent INTO v_base_xp, v_exponent
  FROM public.platform_config
  WHERE platform = p_platform;
  
  RETURN FLOOR(v_base_xp * POWER(p_level, v_exponent));
END;
$$;

-- Calculate current level from total XP (inverse of xp_for_level)
CREATE OR REPLACE FUNCTION public.level_from_xp(p_platform public.platform_type, p_total_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_level integer := 1;
  v_cumulative_xp integer := 0;
BEGIN
  LOOP
    v_cumulative_xp := v_cumulative_xp + public.xp_for_level(p_platform, v_level);
    EXIT WHEN v_cumulative_xp > p_total_xp;
    v_level := v_level + 1;
  END LOOP;
  RETURN v_level;
END;
$$;

-- Calculate current streak for a pet
CREATE OR REPLACE FUNCTION public.calculate_streak(p_pet_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_streak integer := 0;
  v_current_date date := CURRENT_DATE;
  v_check_date date;
BEGIN
  FOR v_check_date IN
    SELECT DISTINCT DATE(created_at) AS check_date
    FROM public.checkins
    WHERE pet_id = p_pet_id
    ORDER BY check_date DESC
  LOOP
    IF v_check_date = v_current_date - v_streak THEN
      v_streak := v_streak + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$;

-- Apply XP and level-up logic after check-in
CREATE OR REPLACE FUNCTION public.apply_checkin_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp integer;
  v_new_level integer;
  v_platform public.platform_type;
BEGIN
  PERFORM set_config('luni.allow_xp_update', 'on', true);

  -- Get platform from pet
  SELECT platform INTO v_platform FROM public.pets WHERE id = NEW.pet_id;
  
  -- Calculate new XP and level
  SELECT xp + NEW.xp_awarded INTO v_new_xp FROM public.pets WHERE id = NEW.pet_id;
  v_new_level := public.level_from_xp(v_platform, v_new_xp);

  -- Update pet with new XP, level, and last check-in time
  UPDATE public.pets
  SET xp = v_new_xp,
      level = v_new_level,
      last_checkin_at = NEW.created_at,
      mood = CASE
        WHEN v_new_xp >= public.xp_for_level(v_platform, v_new_level + 1) * 0.8 THEN 'excited'::public.mood_type
        WHEN NOW() - COALESCE(last_checkin_at, NOW() - INTERVAL '1 day') < INTERVAL '6 hours' THEN 'active'::public.mood_type
        WHEN NOW() - COALESCE(last_checkin_at, NOW() - INTERVAL '1 day') < INTERVAL '24 hours' THEN 'idle'::public.mood_type
        ELSE 'neglected'::public.mood_type
      END
  WHERE id = NEW.pet_id AND user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Check and unlock achievements after check-in
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement RECORD;
  v_user_id uuid;
  v_total_checkins integer;
  v_max_streak integer;
  v_max_level integer;
  v_platforms_used integer;
BEGIN
  SELECT user_id INTO v_user_id FROM public.pets WHERE id = NEW.pet_id;
  
  -- Calculate achievement stats
  SELECT COUNT(*) INTO v_total_checkins FROM public.checkins WHERE user_id = v_user_id;
  SELECT MAX(public.calculate_streak(id)) INTO v_max_streak FROM public.pets WHERE user_id = v_user_id;
  SELECT MAX(level) INTO v_max_level FROM public.pets WHERE user_id = v_user_id;
  SELECT COUNT(DISTINCT platform) INTO v_platforms_used FROM public.checkins WHERE user_id = v_user_id;
  
  -- Check each achievement
  FOR v_achievement IN
    SELECT id, badge_id, condition_type, threshold
    FROM public.achievements
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.user_id = v_user_id AND ua.achievement_id = achievements.id
    )
  LOOP
    -- Unlock logic based on condition type
    IF (v_achievement.condition_type = 'first' AND v_total_checkins >= 1) OR
       (v_achievement.condition_type = 'checkins' AND v_total_checkins >= v_achievement.threshold) OR
       (v_achievement.condition_type = 'streak' AND v_max_streak >= v_achievement.threshold) OR
       (v_achievement.condition_type = 'level' AND v_max_level >= v_achievement.threshold) OR
       (v_achievement.condition_type = 'multi_platform' AND v_platforms_used >= v_achievement.threshold) THEN
      
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (v_user_id, v_achievement.id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Triggers

-- Auto-create user on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;
CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_pets_set_updated_at ON public.pets;
CREATE TRIGGER trg_pets_set_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_checkins_set_updated_at ON public.checkins;
CREATE TRIGGER trg_checkins_set_updated_at
  BEFORE UPDATE ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_achievements_set_updated_at ON public.achievements;
CREATE TRIGGER trg_achievements_set_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_achievements_set_updated_at ON public.user_achievements;
CREATE TRIGGER trg_user_achievements_set_updated_at
  BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_set_updated_at ON public.settings;
CREATE TRIGGER trg_settings_set_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- XP/Level protection
DROP TRIGGER IF EXISTS trg_pets_prevent_direct_xp_level_update ON public.pets;
CREATE TRIGGER trg_pets_prevent_direct_xp_level_update
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.prevent_direct_xp_level_update();

-- Check-in validation and XP application
DROP TRIGGER IF EXISTS trg_checkins_before_insert_validate ON public.checkins;
CREATE TRIGGER trg_checkins_before_insert_validate
  BEFORE INSERT ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION public.checkins_before_insert_validate();

DROP TRIGGER IF EXISTS trg_checkins_after_insert_apply_xp ON public.checkins;
CREATE TRIGGER trg_checkins_after_insert_apply_xp
  AFTER INSERT ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION public.apply_checkin_xp();

DROP TRIGGER IF EXISTS trg_checkins_after_insert_check_achievements ON public.checkins;
CREATE TRIGGER trg_checkins_after_insert_check_achievements
  AFTER INSERT ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Optimized with subquery caching)

-- Users
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own ON public.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Pets
DROP POLICY IF EXISTS pets_select_own ON public.pets;
CREATE POLICY pets_select_own ON public.pets FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS pets_insert_own ON public.pets;
CREATE POLICY pets_insert_own ON public.pets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS pets_update_own ON public.pets;
CREATE POLICY pets_update_own ON public.pets FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS pets_delete_own ON public.pets;
CREATE POLICY pets_delete_own ON public.pets FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Checkins
DROP POLICY IF EXISTS checkins_select_own ON public.checkins;
CREATE POLICY checkins_select_own ON public.checkins FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS checkins_insert_own ON public.checkins;
CREATE POLICY checkins_insert_own ON public.checkins FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS checkins_update_own ON public.checkins;
CREATE POLICY checkins_update_own ON public.checkins FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS checkins_delete_own ON public.checkins;
CREATE POLICY checkins_delete_own ON public.checkins FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Achievements (read-only for all authenticated users)
DROP POLICY IF EXISTS achievements_select_all_authenticated ON public.achievements;
CREATE POLICY achievements_select_all_authenticated ON public.achievements FOR SELECT TO authenticated USING (true);

-- User Achievements
DROP POLICY IF EXISTS user_achievements_select_own ON public.user_achievements;
CREATE POLICY user_achievements_select_own ON public.user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS user_achievements_insert_own ON public.user_achievements;
CREATE POLICY user_achievements_insert_own ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS user_achievements_update_own ON public.user_achievements;
CREATE POLICY user_achievements_update_own ON public.user_achievements FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS user_achievements_delete_own ON public.user_achievements;
CREATE POLICY user_achievements_delete_own ON public.user_achievements FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Settings
DROP POLICY IF EXISTS settings_select_own ON public.settings;
CREATE POLICY settings_select_own ON public.settings FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS settings_insert_own ON public.settings;
CREATE POLICY settings_insert_own ON public.settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS settings_update_own ON public.settings;
CREATE POLICY settings_update_own ON public.settings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS settings_delete_own ON public.settings;
CREATE POLICY settings_delete_own ON public.settings FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Platform Config (read-only for all authenticated users)
DROP POLICY IF EXISTS platform_config_select_all ON public.platform_config;
CREATE POLICY platform_config_select_all ON public.platform_config FOR SELECT TO authenticated USING (true);

-- Seed Achievements
INSERT INTO public.achievements (badge_id, name, description, icon, condition_type, threshold, xp_reward) VALUES
  ('first', 'First Light', 'First ever check-in', '🌟', 'first', 1, 50),
  ('streak3', 'On a Roll', '3-day streak on any platform', '🔥', 'streak', 3, 100),
  ('streak7', 'Week Warrior', '7-day streak achieved', '⚡', 'streak', 7, 250),
  ('streak30', 'Legendary', '30-day streak — incredible', '👑', 'streak', 30, 1000),
  ('lvl5', 'Rising Star', 'Reach level 5 on any pet', '🌙', 'level', 5, 200),
  ('lvl10', 'Luminary', 'Reach level 10 on any pet', '✨', 'level', 10, 500),
  ('allplat', 'Polyglot', 'Check in on all 4 platforms', '🌍', 'multi_platform', 4, 300),
  ('ci20', 'Dedicated', '20 total check-ins', '🏆', 'checkins', 20, 300)
ON CONFLICT (badge_id) DO NOTHING;