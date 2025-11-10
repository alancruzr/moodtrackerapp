# Supabase Migrations

## Overview
This directory contains SQL migration scripts for the Anxiety & Panic Tracker app. These migrations add new tables for user progress tracking, gamification, and the improved breathing exercise system.

## Migration Files

### 01_create_new_tables.sql
Creates the following tables:
- `user_progress` - Tracks user's current phase, exercise, and program progress
- `breathing_records` - Stores breathing exercise sessions
- `user_xp` - Tracks user experience points and levels
- `user_badges` - Stores unlocked badges
- `user_streaks` - Tracks activity streaks

Also includes:
- Indexes for performance optimization
- Triggers for automatic timestamp updates
- Row Level Security (RLS) policies

### 02_data_migration.sql
Migrates existing user data:
- Initializes new tables for existing users
- Migrates `breathing_skills` data to `breathing_records` (if applicable)
- Calculates initial progress metrics
- Awards retroactive XP for existing activities
- Calculates current streaks

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the content of `01_create_new_tables.sql`
5. Click **Run**
6. Wait for completion (should see success message)
7. Repeat steps 3-6 for `02_data_migration.sql`

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Or run individual files
psql -h YOUR_DB_HOST -U postgres -d postgres -f 01_create_new_tables.sql
psql -h YOUR_DB_HOST -U postgres -d postgres -f 02_data_migration.sql
```

### Option 3: Direct PostgreSQL Connection
```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
\i 01_create_new_tables.sql
\i 02_data_migration.sql
```

## Verification

After running migrations, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_progress', 'breathing_records', 'user_xp', 'user_badges', 'user_streaks');

-- Check row counts
SELECT 'user_progress' as table_name, COUNT(*) as rows FROM user_progress
UNION ALL
SELECT 'breathing_records', COUNT(*) FROM breathing_records
UNION ALL
SELECT 'user_xp', COUNT(*) FROM user_xp
UNION ALL
SELECT 'user_badges', COUNT(*) FROM user_badges
UNION ALL
SELECT 'user_streaks', COUNT(*) FROM user_streaks;

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('user_progress', 'breathing_records', 'user_xp', 'user_badges', 'user_streaks');
```

## Rollback

If you need to rollback the migrations:

```sql
-- Drop tables (in reverse order due to dependencies)
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS user_streaks;
DROP TABLE IF EXISTS user_xp;
DROP TABLE IF EXISTS breathing_records;
DROP TABLE IF EXISTS user_progress;

-- Drop functions
DROP FUNCTION IF EXISTS update_last_activity();
DROP FUNCTION IF EXISTS update_user_xp_timestamp();
DROP FUNCTION IF EXISTS update_user_streaks_timestamp();
```

## Notes

- ⚠️ **Always backup your database before running migrations**
- 🔒 RLS policies are enabled by default for security
- 📊 Migration 02 awards retroactive XP based on existing activities
- 🔄 Triggers automatically update timestamps on row updates
- ✅ All foreign keys include `ON DELETE CASCADE` for data consistency

## Troubleshooting

### Error: "relation already exists"
- Tables may have been partially created. Run the rollback script first.

### Error: "permission denied"
- Ensure you're connected as a superuser (postgres role)
- Check that RLS policies aren't blocking operations

### Error: "foreign key constraint"
- Ensure `auth.users` table exists in your Supabase project
- Verify user IDs match between tables

## Support

For issues or questions:
1. Check Supabase dashboard logs
2. Verify database connection settings
3. Review error messages in SQL Editor
4. Consult Supabase documentation: https://supabase.com/docs
