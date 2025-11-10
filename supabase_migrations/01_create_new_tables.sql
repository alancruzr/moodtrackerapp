-- ========================================
-- MIGRATION 01: Create New Tables
-- Created: 2025-11-10
-- Description: Adds user_progress, breathing_records, user_xp, user_badges, user_streaks
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLE: user_progress
-- Description: Tracks user's current phase, exercise, and program progress
-- ========================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Estado del programa
  current_phase INT DEFAULT 1 CHECK (current_phase >= 0 AND current_phase <= 9),
  current_exercise INT DEFAULT 1,
  guided_mode BOOLEAN DEFAULT TRUE,

  -- Contadores
  days_monitoring INT DEFAULT 0,
  days_breathing_practice INT DEFAULT 0,
  breathing_sessions_today INT DEFAULT 0,

  -- Completion tracking
  completed_exercises JSONB DEFAULT '[]'::jsonb,
  phase_completion JSONB DEFAULT '{}'::jsonb,

  -- Stats
  total_sessions INT DEFAULT 0,
  total_xp INT DEFAULT 0,
  current_level INT DEFAULT 1,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Trigger to update last_activity and updated_at
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_activity
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_last_activity();

-- ========================================
-- TABLE: breathing_records
-- Description: Stores breathing exercise sessions
-- ========================================
CREATE TABLE IF NOT EXISTS breathing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Modo y patrón
  mode TEXT NOT NULL CHECK (mode IN ('therapeutic', 'resonance')),
  pattern JSONB NOT NULL,
  -- Format: { inhale: 3000, hold1: 0, exhale: 3000, hold2: 0, targetBPM: 10 }

  -- Métricas
  duration_seconds INT NOT NULL,
  total_cycles INT NOT NULL,
  avg_breaths_per_minute DECIMAL(4,1) NOT NULL,

  -- Calificaciones (0-10)
  concentration_rating INT CHECK (concentration_rating >= 0 AND concentration_rating <= 10),
  success_rating INT CHECK (success_rating >= 0 AND success_rating <= 10),

  -- Estado
  completed BOOLEAN DEFAULT FALSE,
  practice_number INT DEFAULT 1 CHECK (practice_number >= 1 AND practice_number <= 2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_breathing_user_date ON breathing_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_breathing_completed ON breathing_records(user_id, completed);

-- ========================================
-- TABLE: user_xp
-- Description: Tracks user experience points and level
-- ========================================
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- XP y Level
  total_xp INT DEFAULT 0 CHECK (total_xp >= 0),
  current_level INT DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 10),
  xp_to_next_level INT DEFAULT 100,

  -- Historial de XP (array de objetos)
  xp_history JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ date, amount, reason, exercise_id }]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_xp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_xp
BEFORE UPDATE ON user_xp
FOR EACH ROW
EXECUTE FUNCTION update_user_xp_timestamp();

-- ========================================
-- TABLE: user_badges
-- Description: Stores unlocked badges for users
-- ========================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  description TEXT,

  -- Timestamps
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique badge per user
  UNIQUE(user_id, badge_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id, unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_badge_id ON user_badges(badge_id);

-- ========================================
-- TABLE: user_streaks
-- Description: Tracks user activity streaks
-- ========================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Streak tracking
  current_streak INT DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INT DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,

  -- Contadores específicos
  monitoring_streak INT DEFAULT 0 CHECK (monitoring_streak >= 0),
  breathing_streak INT DEFAULT 0 CHECK (breathing_streak >= 0),
  exposure_streak INT DEFAULT 0 CHECK (exposure_streak >= 0),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_streaks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_streaks
BEFORE UPDATE ON user_streaks
FOR EACH ROW
EXECUTE FUNCTION update_user_streaks_timestamp();

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE breathing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- user_progress policies
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- breathing_records policies
CREATE POLICY "Users can view their own breathing records"
  ON breathing_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own breathing records"
  ON breathing_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own breathing records"
  ON breathing_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own breathing records"
  ON breathing_records FOR DELETE
  USING (auth.uid() = user_id);

-- user_xp policies
CREATE POLICY "Users can view their own xp"
  ON user_xp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xp"
  ON user_xp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own xp"
  ON user_xp FOR UPDATE
  USING (auth.uid() = user_id);

-- user_badges policies
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_streaks policies
CREATE POLICY "Users can view their own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
