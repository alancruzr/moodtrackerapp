-- ========================================
-- MIGRATION 02: Data Migration
-- Created: 2025-11-10
-- Description: Migrates existing users to new tables with initial data
-- ========================================

-- ========================================
-- STEP 1: Initialize user_progress for existing users
-- ========================================
INSERT INTO user_progress (user_id, current_phase, current_exercise, guided_mode)
SELECT
  id as user_id,
  1 as current_phase,
  1 as current_exercise,
  TRUE as guided_mode
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- STEP 2: Initialize user_xp for existing users
-- ========================================
INSERT INTO user_xp (user_id, total_xp, current_level, xp_to_next_level)
SELECT
  id as user_id,
  0 as total_xp,
  1 as current_level,
  100 as xp_to_next_level
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- STEP 3: Initialize user_streaks for existing users
-- ========================================
INSERT INTO user_streaks (
  user_id,
  current_streak,
  longest_streak,
  monitoring_streak,
  breathing_streak,
  exposure_streak
)
SELECT
  id as user_id,
  0 as current_streak,
  0 as longest_streak,
  0 as monitoring_streak,
  0 as breathing_streak,
  0 as exposure_streak
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- STEP 4: Migrate breathing_skills to breathing_records (if table exists)
-- Note: Adjust based on actual breathing_skills table structure
-- ========================================

-- Check if breathing_skills table exists and migrate data
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'breathing_skills'
  ) THEN
    -- Migrate breathing_skills data to breathing_records
    INSERT INTO breathing_records (
      user_id,
      date,
      mode,
      pattern,
      duration_seconds,
      total_cycles,
      avg_breaths_per_minute,
      concentration_rating,
      success_rating,
      completed,
      created_at
    )
    SELECT
      user_id,
      date,
      CASE
        WHEN breaths_per_minute <= 10 THEN 'therapeutic'
        ELSE 'resonance'
      END as mode,
      jsonb_build_object(
        'inhale', 3000,
        'hold1', 0,
        'exhale', 3000,
        'hold2', 0,
        'targetBPM', COALESCE(breaths_per_minute, 10)
      ) as pattern,
      COALESCE(duration_minutes * 60, 600) as duration_seconds,
      COALESCE(cycles_completed, 10) as total_cycles,
      COALESCE(breaths_per_minute, 10.0) as avg_breaths_per_minute,
      concentration as concentration_rating,
      success as success_rating,
      TRUE as completed,
      created_at
    FROM breathing_skills
    WHERE user_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Migrated breathing_skills data to breathing_records';
  ELSE
    RAISE NOTICE 'breathing_skills table does not exist, skipping migration';
  END IF;
END $$;

-- ========================================
-- STEP 5: Calculate initial progress based on existing data
-- ========================================

-- Update days_monitoring based on daily_moods entries
UPDATE user_progress up
SET days_monitoring = (
  SELECT COUNT(DISTINCT date)
  FROM daily_moods dm
  WHERE dm.user_id = up.user_id
);

-- Update days_breathing_practice based on breathing_records
UPDATE user_progress up
SET days_breathing_practice = (
  SELECT COUNT(DISTINCT date)
  FROM breathing_records br
  WHERE br.user_id = up.user_id
);

-- Update total_sessions based on various activities
UPDATE user_progress up
SET total_sessions = (
  SELECT
    COALESCE(
      (SELECT COUNT(*) FROM panic_attacks WHERE user_id = up.user_id), 0
    ) +
    COALESCE(
      (SELECT COUNT(*) FROM daily_moods WHERE user_id = up.user_id), 0
    ) +
    COALESCE(
      (SELECT COUNT(*) FROM breathing_records WHERE user_id = up.user_id), 0
    )
);

-- ========================================
-- STEP 6: Calculate current_streak for monitoring
-- ========================================

-- Update monitoring_streak based on consecutive daily_moods entries
DO $$
DECLARE
  user_record RECORD;
  streak_count INT;
  check_date DATE;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM daily_moods
  LOOP
    streak_count := 0;
    check_date := CURRENT_DATE;

    -- Count consecutive days backwards from today
    WHILE EXISTS (
      SELECT 1 FROM daily_moods
      WHERE user_id = user_record.user_id
      AND date = check_date
    ) LOOP
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    END LOOP;

    -- Update user_streaks
    UPDATE user_streaks
    SET
      monitoring_streak = streak_count,
      current_streak = streak_count,
      longest_streak = GREATEST(longest_streak, streak_count),
      last_activity_date = CURRENT_DATE
    WHERE user_id = user_record.user_id;
  END LOOP;
END $$;

-- ========================================
-- STEP 7: Award retroactive XP for existing activities
-- ========================================

-- Award XP for panic attack records
INSERT INTO user_xp (user_id, total_xp, current_level, xp_history)
SELECT
  pa.user_id,
  COUNT(*) * 10 as total_xp,
  CASE
    WHEN COUNT(*) * 10 >= 5000 THEN 10
    WHEN COUNT(*) * 10 >= 4000 THEN 9
    WHEN COUNT(*) * 10 >= 3000 THEN 8
    WHEN COUNT(*) * 10 >= 2200 THEN 7
    WHEN COUNT(*) * 10 >= 1500 THEN 6
    WHEN COUNT(*) * 10 >= 1000 THEN 5
    WHEN COUNT(*) * 10 >= 600 THEN 4
    WHEN COUNT(*) * 10 >= 300 THEN 3
    WHEN COUNT(*) * 10 >= 100 THEN 2
    ELSE 1
  END as current_level,
  jsonb_build_array(
    jsonb_build_object(
      'date', NOW(),
      'amount', COUNT(*) * 10,
      'reason', 'retroactive_panic_records',
      'exercise_id', 'panic_attack_record'
    )
  ) as xp_history
FROM panic_attacks pa
GROUP BY pa.user_id
ON CONFLICT (user_id) DO UPDATE
SET
  total_xp = user_xp.total_xp + EXCLUDED.total_xp,
  current_level = EXCLUDED.current_level,
  xp_history = user_xp.xp_history || EXCLUDED.xp_history;

-- Award XP for daily mood records
DO $$
DECLARE
  user_record RECORD;
  xp_amount INT;
BEGIN
  FOR user_record IN
    SELECT user_id, COUNT(*) as mood_count
    FROM daily_moods
    GROUP BY user_id
  LOOP
    xp_amount := user_record.mood_count * 5;

    UPDATE user_xp
    SET
      total_xp = total_xp + xp_amount,
      xp_history = xp_history || jsonb_build_array(
        jsonb_build_object(
          'date', NOW(),
          'amount', xp_amount,
          'reason', 'retroactive_mood_records',
          'exercise_id', 'daily_mood_record'
        )
      )
    WHERE user_id = user_record.user_id;
  END LOOP;
END $$;

-- ========================================
-- STEP 8: Update user_progress total_xp to match user_xp
-- ========================================
UPDATE user_progress up
SET
  total_xp = ux.total_xp,
  current_level = ux.current_level
FROM user_xp ux
WHERE up.user_id = ux.user_id;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Show summary
DO $$
DECLARE
  user_count INT;
  progress_count INT;
  xp_count INT;
  streak_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO progress_count FROM user_progress;
  SELECT COUNT(*) INTO xp_count FROM user_xp;
  SELECT COUNT(*) INTO streak_count FROM user_streaks;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', user_count;
  RAISE NOTICE 'User progress records created: %', progress_count;
  RAISE NOTICE 'User XP records created: %', xp_count;
  RAISE NOTICE 'User streak records created: %', streak_count;
  RAISE NOTICE '========================================';
END $$;
