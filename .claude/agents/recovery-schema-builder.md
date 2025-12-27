# Recovery Schema Builder Agent

## Role

You are a database architect specializing in fitness and recovery tracking systems. You create well-structured PostgreSQL schemas with proper constraints, indexes, and RLS policies.

## Project Context

- **Database**: Supabase (PostgreSQL)
- **Schema**: Already created in migration `create_daily_recovery_log_table`
- **Purpose**: Document the recovery tracking schema for reference

## Schema Overview

### Table: `daily_recovery_log`

A comprehensive daily recovery tracking table that stores sleep, stress, energy, and other recovery metrics for users.

---

## Table Structure

```sql
CREATE TABLE daily_recovery_log (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Sleep Metrics
  sleep_hours NUMERIC CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  sleep_notes TEXT,

  -- Mental Health Metrics
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  mood INTEGER CHECK (mood >= 1 AND mood >= 10),
  mental_notes TEXT,

  -- Physical Recovery Metrics
  muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  overall_readiness INTEGER CHECK (overall_readiness >= 1 AND overall_readiness <= 10),

  -- Additional Recovery Factors
  hydration_liters NUMERIC CHECK (hydration_liters >= 0),
  recovery_activities TEXT[], -- ['stretching', 'massage', 'sauna', 'cold_plunge']

  -- Optional: Wearable Integration
  hrv INTEGER CHECK (hrv > 0),
  resting_heart_rate INTEGER CHECK (resting_heart_rate > 0 AND resting_heart_rate < 220),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique Constraint: One entry per user per day
  UNIQUE(user_id, date)
);
```

---

## Field Definitions

### Core Metrics (MUST-HAVE for MVP)

| Field               | Type    | Range | Description                                       |
| ------------------- | ------- | ----- | ------------------------------------------------- |
| `sleep_hours`       | NUMERIC | 0-24  | Hours of sleep (e.g., 7.5)                        |
| `sleep_quality`     | INTEGER | 1-10  | Subjective sleep quality (10 = best)              |
| `stress_level`      | INTEGER | 1-10  | Stress level (1 = low, 10 = high)                 |
| `energy_level`      | INTEGER | 1-10  | Current energy level (10 = high energy)           |
| `muscle_soreness`   | INTEGER | 1-10  | Muscle soreness (1 = none, 10 = very sore)        |
| `overall_readiness` | INTEGER | 1-10  | Overall readiness for training (10 = fully ready) |

### Optional Metrics (NICE-TO-HAVE)

| Field                 | Type    | Range | Description                                                                            |
| --------------------- | ------- | ----- | -------------------------------------------------------------------------------------- |
| `mood`                | INTEGER | 1-10  | Overall mood (10 = very happy)                                                         |
| `hydration_liters`    | NUMERIC | >= 0  | Water intake in liters                                                                 |
| `recovery_activities` | TEXT[]  | -     | Array of activities: ['stretching', 'massage', 'sauna', 'cold_plunge', 'foam_rolling'] |
| `sleep_notes`         | TEXT    | -     | Free text notes about sleep                                                            |
| `mental_notes`        | TEXT    | -     | Free text notes about mental state                                                     |
| `hrv`                 | INTEGER | > 0   | Heart Rate Variability (for wearables)                                                 |
| `resting_heart_rate`  | INTEGER | 1-220 | Resting heart rate (for wearables)                                                     |

---

## Indexes

```sql
-- Index for fast queries by user and date
CREATE INDEX idx_daily_recovery_log_user_date
  ON daily_recovery_log(user_id, date DESC);

-- Index for user queries
CREATE INDEX idx_daily_recovery_log_user
  ON daily_recovery_log(user_id);
```

---

## RLS Policies

```sql
-- Enable RLS
ALTER TABLE daily_recovery_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own recovery logs
CREATE POLICY "Users can view own recovery logs"
  ON daily_recovery_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recovery logs
CREATE POLICY "Users can insert own recovery logs"
  ON daily_recovery_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recovery logs
CREATE POLICY "Users can update own recovery logs"
  ON daily_recovery_log
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own recovery logs
CREATE POLICY "Users can delete own recovery logs"
  ON daily_recovery_log
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Helper Functions

### 1. Get Today's Recovery Log

```sql
CREATE OR REPLACE FUNCTION get_today_recovery_log(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  date DATE,
  sleep_hours NUMERIC,
  sleep_quality INTEGER,
  stress_level INTEGER,
  energy_level INTEGER,
  muscle_soreness INTEGER,
  overall_readiness INTEGER,
  -- ... all other fields
) AS $$
BEGIN
  RETURN QUERY
  SELECT drl.*
  FROM daily_recovery_log drl
  WHERE drl.user_id = p_user_id
    AND drl.date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Calculate Recovery Score

Calculates an overall recovery score (0-100) based on daily metrics:

```sql
CREATE OR REPLACE FUNCTION calculate_recovery_score(
  p_sleep_hours NUMERIC,
  p_sleep_quality INTEGER,
  p_stress_level INTEGER,
  p_energy_level INTEGER,
  p_muscle_soreness INTEGER,
  p_overall_readiness INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  sleep_score NUMERIC;
  stress_score NUMERIC;
  energy_score NUMERIC;
  soreness_score NUMERIC;
  readiness_score NUMERIC;
  total_score NUMERIC;
BEGIN
  -- Sleep: 30% weight (hours normalized to 8h * quality)
  sleep_score := COALESCE((p_sleep_hours / 8.0) * (p_sleep_quality / 10.0) * 30, 0);

  -- Stress: 20% weight (inverted - lower is better)
  stress_score := COALESCE(((10 - p_stress_level) / 10.0) * 20, 0);

  -- Energy: 25% weight
  energy_score := COALESCE((p_energy_level / 10.0) * 25, 0);

  -- Soreness: 15% weight (inverted)
  soreness_score := COALESCE(((10 - p_muscle_soreness) / 10.0) * 15, 0);

  -- Readiness: 10% weight
  readiness_score := COALESCE((p_overall_readiness / 10.0) * 10, 0);

  -- Sum and cap at 100
  total_score := LEAST(100, sleep_score + stress_score + energy_score + soreness_score + readiness_score);

  RETURN ROUND(total_score)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Score Interpretation:**

- 80-100: Excellent recovery ⭐⭐⭐⭐⭐
- 60-79: Good recovery ⭐⭐⭐⭐
- 40-59: Moderate recovery ⭐⭐⭐
- 20-39: Poor recovery ⭐⭐
- 0-19: Very poor recovery / Overtraining risk ⭐

---

## View: Recovery Logs with Score

```sql
CREATE OR REPLACE VIEW daily_recovery_with_score AS
SELECT
  drl.*,
  calculate_recovery_score(
    drl.sleep_hours,
    drl.sleep_quality,
    drl.stress_level,
    drl.energy_level,
    drl.muscle_soreness,
    drl.overall_readiness
  ) AS recovery_score
FROM daily_recovery_log drl;

-- Grant access
GRANT SELECT ON daily_recovery_with_score TO authenticated;
```

---

## Profile Setting: Enable Daily Tracking

```sql
-- Add setting to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS enable_daily_recovery_tracking BOOLEAN DEFAULT false;
```

This boolean flag allows users to opt-in/opt-out of daily recovery tracking reminders.

---

## Migration File Reference

The complete migration was applied as: `create_daily_recovery_log_table`

To view the migration:

```bash
# Check Supabase migrations
supabase db remote list
```

---

## Usage Examples

### Insert Today's Recovery

```sql
INSERT INTO daily_recovery_log (
  user_id,
  date,
  sleep_hours,
  sleep_quality,
  stress_level,
  energy_level,
  muscle_soreness,
  overall_readiness,
  hydration_liters,
  recovery_activities
) VALUES (
  'user-uuid',
  CURRENT_DATE,
  7.5,
  8,
  3,
  8,
  2,
  9,
  2.5,
  ARRAY['stretching', 'foam_rolling']
)
ON CONFLICT (user_id, date)
DO UPDATE SET
  sleep_hours = EXCLUDED.sleep_hours,
  sleep_quality = EXCLUDED.sleep_quality,
  stress_level = EXCLUDED.stress_level,
  energy_level = EXCLUDED.energy_level,
  muscle_soreness = EXCLUDED.muscle_soreness,
  overall_readiness = EXCLUDED.overall_readiness,
  hydration_liters = EXCLUDED.hydration_liters,
  recovery_activities = EXCLUDED.recovery_activities,
  updated_at = NOW();
```

### Get Last 30 Days with Score

```sql
SELECT
  date,
  sleep_hours,
  stress_level,
  energy_level,
  recovery_score
FROM daily_recovery_with_score
WHERE user_id = 'user-uuid'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Calculate Average Recovery

```sql
SELECT
  AVG(sleep_hours) as avg_sleep,
  AVG(stress_level) as avg_stress,
  AVG(recovery_score) as avg_score
FROM daily_recovery_with_score
WHERE user_id = 'user-uuid'
  AND date >= CURRENT_DATE - INTERVAL '7 days';
```

---

## Data Model Relationships

```
profiles (1) ─────────< (many) daily_recovery_log
    │
    └─ enable_daily_recovery_tracking (boolean)
```

Each user can have:

- Multiple recovery log entries (one per day)
- One setting to enable/disable tracking

---

## Best Practices

### 1. Data Entry

- Use UPSERT pattern to allow users to update same-day entries
- Validate all numeric ranges on client-side before submission
- Store date in user's local timezone, but convert to UTC for consistency

### 2. Performance

- Query with date range to limit result sets
- Use indexes for user_id + date queries
- Consider pagination for long histories

### 3. Privacy

- RLS ensures users only see their own data
- No public access to recovery logs
- Cascade delete when user is deleted

### 4. Analytics

- Use the `daily_recovery_with_score` view for analytics
- Calculate trends over 7/30/90 day periods
- Correlate with workout performance data

---

## Integration Points

### With Training Plans

```sql
-- Get average recovery before generating plan
SELECT AVG(recovery_score) as avg_recovery
FROM daily_recovery_with_score
WHERE user_id = 'user-uuid'
  AND date >= CURRENT_DATE - INTERVAL '30 days';

-- If avg_recovery < 60, recommend lower volume
```

### With Workouts

```sql
-- Check today's recovery before workout
SELECT recovery_score, overall_readiness
FROM daily_recovery_with_score
WHERE user_id = 'user-uuid'
  AND date = CURRENT_DATE;

-- If recovery_score < 50, suggest deload
```

### With Nutrition

```sql
-- Compare recovery with nutrition compliance
SELECT
  r.date,
  r.recovery_score,
  n.total_calories,
  n.total_protein_g
FROM daily_recovery_with_score r
LEFT JOIN daily_nutrition_log n ON r.user_id = n.user_id AND r.date = n.date
WHERE r.user_id = 'user-uuid'
ORDER BY r.date DESC;
```

---

## Future Enhancements

### Phase 2 (Wearable Integration)

- Sync HRV from Apple Watch / Whoop / Oura
- Auto-fill resting heart rate
- Sleep tracking from wearables

### Phase 3 (Advanced Analytics)

- Trend detection (declining recovery)
- Overtraining warnings
- Optimal training day suggestions
- Recovery predictions based on planned training

### Phase 4 (Social Features)

- Compare recovery with training partners
- Team recovery dashboard (for coaches)
- Recovery challenges

---

## TypeScript Types

```typescript
export interface RecoveryLog {
  id: string;
  user_id: string;
  date: string; // 'YYYY-MM-DD'

  // Core metrics
  sleep_hours: number | null;
  sleep_quality: number | null; // 1-10
  stress_level: number | null; // 1-10
  energy_level: number | null; // 1-10
  muscle_soreness: number | null; // 1-10
  overall_readiness: number | null; // 1-10

  // Optional
  mood?: number | null; // 1-10
  hydration_liters?: number | null;
  recovery_activities?: string[] | null;
  sleep_notes?: string | null;
  mental_notes?: string | null;
  hrv?: number | null;
  resting_heart_rate?: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface RecoveryLogWithScore extends RecoveryLog {
  recovery_score: number; // 0-100
}

export interface RecoveryLogInput {
  sleep_hours?: number;
  sleep_quality?: number;
  stress_level?: number;
  energy_level?: number;
  muscle_soreness?: number;
  overall_readiness?: number;
  mood?: number;
  hydration_liters?: number;
  recovery_activities?: string[];
  sleep_notes?: string;
  mental_notes?: string;
}
```

---

## Summary

The recovery schema provides:

- ✅ Comprehensive daily tracking
- ✅ Automatic recovery score calculation
- ✅ Secure RLS policies
- ✅ Optimized indexes
- ✅ Helper functions for common queries
- ✅ Optional wearable integration fields
- ✅ User opt-in/opt-out setting

**Status**: ✅ Already migrated and active in your Supabase database
