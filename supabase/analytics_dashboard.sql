-- ============================================================================
-- Analytics Dashboard Queries
-- ============================================================================
-- Purpose: SQL queries for analyzing recommendation system performance
-- Created: 2024-12-29
-- Usage: Run these queries in Supabase SQL Editor, Metabase, or Grafana
-- ============================================================================

-- ============================================================================
-- 1. MOST POPULAR PLANS (Last 30 Days)
-- ============================================================================
-- Shows which training plans are selected most frequently
-- Use this to understand user preferences and optimize plan offerings

SELECT
  data->>'selectedPlanType' as plan_type,
  COUNT(*) as selections,
  ROUND(AVG((data->>'selectedScore')::numeric), 1) as avg_score,
  ROUND(AVG((data->>'selectedRank')::numeric), 1) as avg_rank,
  COUNT(*) FILTER (WHERE data->>'completeness' = 'complete') as complete_selections,
  COUNT(*) FILTER (WHERE data->>'completeness' = 'incomplete') as incomplete_selections
FROM recommendation_events
WHERE event = 'plan_selected'
  AND created_at > NOW() - INTERVAL '30 days'
  AND data->>'selectedPlanType' IS NOT NULL
GROUP BY data->>'selectedPlanType'
ORDER BY selections DESC
LIMIT 10;

-- ============================================================================
-- 2. INCOMPLETE PLAN ACCEPTANCE RATE
-- ============================================================================
-- Shows how often users accept incomplete plans despite warnings
-- Low acceptance rate might indicate users need more complete plans

SELECT
  COUNT(*) FILTER (WHERE event = 'incomplete_warning_shown') as warnings_shown,
  COUNT(*) FILTER (WHERE event = 'incomplete_plan_accepted') as warnings_accepted,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event = 'incomplete_plan_accepted') /
    NULLIF(COUNT(*) FILTER (WHERE event = 'incomplete_warning_shown'), 0),
    1
  ) as acceptance_rate_percent,
  -- Breakdown by plan type
  jsonb_object_agg(
    data->>'selectedPlanType',
    COUNT(*) FILTER (WHERE event = 'incomplete_plan_accepted')
  ) FILTER (WHERE data->>'selectedPlanType' IS NOT NULL) as accepted_by_plan_type
FROM recommendation_events
WHERE event IN ('incomplete_warning_shown', 'incomplete_plan_accepted')
  AND created_at > NOW() - INTERVAL '30 days';

-- ============================================================================
-- 3. RECOMMENDATION PERFORMANCE METRICS (Last 7 Days)
-- ============================================================================
-- Daily performance metrics: scores, load times, and recommendation quality
-- Use this to monitor system health and identify performance issues

SELECT
  DATE(created_at) as date,
  COUNT(*) as total_loads,
  ROUND(AVG((data->>'topScore')::numeric), 1) as avg_top_score,
  ROUND(AVG((data->>'recommendationCount')::numeric), 1) as avg_recommendation_count,
  ROUND(AVG((data->>'loadTime')::numeric), 0) as avg_load_time_ms,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (data->>'loadTime')::numeric), 0) as p50_load_time_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (data->>'loadTime')::numeric), 0) as p95_load_time_ms,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (data->>'loadTime')::numeric), 0) as p99_load_time_ms,
  COUNT(*) FILTER (WHERE (data->>'loadTime')::numeric > 2000) as slow_loads_count
FROM recommendation_events
WHERE event = 'recommendations_loaded'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- 4. USER CONVERSION FUNNEL
-- ============================================================================
-- Tracks user journey: recommendations → selection → creation
-- Use this to identify drop-off points and improve conversion

WITH funnel AS (
  SELECT
    user_id,
    MAX(CASE WHEN event = 'recommendations_loaded' THEN 1 ELSE 0 END) as saw_recommendations,
    MAX(CASE WHEN event = 'plan_selected' THEN 1 ELSE 0 END) as selected_plan,
    MAX(CASE WHEN event = 'plan_created' THEN 1 ELSE 0 END) as created_plan
  FROM recommendation_events
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id
)
SELECT
  COUNT(*) as total_users,
  SUM(saw_recommendations) as saw_recs,
  SUM(selected_plan) as selected,
  SUM(created_plan) as created,
  ROUND(100.0 * SUM(selected_plan) / NULLIF(SUM(saw_recommendations), 0), 1) as selection_rate_percent,
  ROUND(100.0 * SUM(created_plan) / NULLIF(SUM(selected_plan), 0), 1) as creation_rate_percent,
  ROUND(100.0 * SUM(created_plan) / NULLIF(SUM(saw_recommendations), 0), 1) as overall_conversion_percent
FROM funnel;

-- ============================================================================
-- 5. SCORE DISTRIBUTION ANALYSIS
-- ============================================================================
-- Analyzes the distribution of recommendation scores
-- Helps identify if scoring algorithm is working as expected

SELECT
  CASE
    WHEN (data->>'topScore')::numeric >= 90 THEN '90-100 (Excellent)'
    WHEN (data->>'topScore')::numeric >= 80 THEN '80-89 (Very Good)'
    WHEN (data->>'topScore')::numeric >= 70 THEN '70-79 (Good)'
    WHEN (data->>'topScore')::numeric >= 60 THEN '60-69 (Fair)'
    ELSE '0-59 (Poor)'
  END as score_range,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) as percentage
FROM recommendation_events
WHERE event = 'recommendations_loaded'
  AND created_at > NOW() - INTERVAL '30 days'
  AND data->>'topScore' IS NOT NULL
GROUP BY score_range
ORDER BY score_range DESC;

-- ============================================================================
-- 6. ERROR TRACKING
-- ============================================================================
-- Monitors recommendation system errors
-- Use this to identify and fix issues quickly

SELECT
  DATE(created_at) as date,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  jsonb_object_agg(
    COALESCE(data->>'errorMessage', 'Unknown error'),
    COUNT(*)
  ) as errors_by_message
FROM recommendation_events
WHERE event = 'recommendations_error'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- 7. USER ENGAGEMENT TIMELINE
-- ============================================================================
-- Shows hourly activity patterns
-- Use this to optimize server resources and identify peak usage times

SELECT
  EXTRACT(HOUR FROM created_at) as hour_of_day,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE event = 'recommendations_loaded') as loads,
  COUNT(*) FILTER (WHERE event = 'plan_selected') as selections,
  COUNT(*) FILTER (WHERE event = 'plan_created') as creations
FROM recommendation_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

-- ============================================================================
-- 8. SESSION FLOW ANALYSIS
-- ============================================================================
-- Analyzes complete user sessions from load to creation
-- Helps understand user behavior and identify UX issues

WITH session_events AS (
  SELECT
    session_id,
    user_id,
    MIN(created_at) as session_start,
    MAX(created_at) as session_end,
    COUNT(*) as event_count,
    ARRAY_AGG(event ORDER BY created_at) as event_sequence,
    MAX(CASE WHEN event = 'plan_created' THEN 1 ELSE 0 END) as converted
  FROM recommendation_events
  WHERE session_id IS NOT NULL
    AND created_at > NOW() - INTERVAL '7 days'
  GROUP BY session_id, user_id
)
SELECT
  COUNT(*) as total_sessions,
  SUM(converted) as converted_sessions,
  ROUND(100.0 * SUM(converted) / COUNT(*), 1) as conversion_rate_percent,
  ROUND(AVG(event_count), 1) as avg_events_per_session,
  ROUND(AVG(EXTRACT(EPOCH FROM (session_end - session_start))), 1) as avg_session_duration_seconds
FROM session_events;

-- ============================================================================
-- 9. PLAN TYPE PERFORMANCE COMPARISON
-- ============================================================================
-- Compares different plan types by selection rate and user satisfaction
-- Use this to identify which plans perform best

WITH plan_metrics AS (
  SELECT
    data->>'selectedPlanType' as plan_type,
    COUNT(*) as selections,
    AVG((data->>'selectedScore')::numeric) as avg_score,
    AVG((data->>'selectedRank')::numeric) as avg_rank,
    -- Count how many became actual plans
    COUNT(*) FILTER (
      WHERE user_id IN (
        SELECT user_id
        FROM recommendation_events
        WHERE event = 'plan_created'
        AND data->>'selectedPlanType' = recommendation_events.data->>'selectedPlanType'
      )
    ) as converted_to_plan
  FROM recommendation_events
  WHERE event = 'plan_selected'
    AND created_at > NOW() - INTERVAL '30 days'
    AND data->>'selectedPlanType' IS NOT NULL
  GROUP BY data->>'selectedPlanType'
)
SELECT
  plan_type,
  selections,
  ROUND(avg_score, 1) as avg_score,
  ROUND(avg_rank, 1) as avg_rank,
  converted_to_plan,
  ROUND(100.0 * converted_to_plan / selections, 1) as conversion_rate_percent
FROM plan_metrics
ORDER BY selections DESC;

-- ============================================================================
-- 10. HEALTH MONITORING DASHBOARD
-- ============================================================================
-- Real-time health metrics for monitoring system status
-- Use this for alerts and operational monitoring

SELECT
  -- Overall metrics (last 24h)
  COUNT(*) as total_events_24h,
  COUNT(DISTINCT user_id) as active_users_24h,

  -- Performance metrics
  ROUND(AVG((data->>'loadTime')::numeric), 0) as avg_load_time_ms,
  MAX((data->>'loadTime')::numeric) as max_load_time_ms,
  COUNT(*) FILTER (WHERE (data->>'loadTime')::numeric > 2000) as slow_loads,

  -- Quality metrics
  ROUND(AVG((data->>'topScore')::numeric), 1) as avg_top_score,
  COUNT(*) FILTER (WHERE (data->>'topScore')::numeric < 60) as low_quality_recommendations,

  -- Error rate
  COUNT(*) FILTER (WHERE event = 'recommendations_error') as errors,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event = 'recommendations_error') / NULLIF(COUNT(*), 0),
    2
  ) as error_rate_percent,

  -- Conversion metrics
  COUNT(*) FILTER (WHERE event = 'plan_created') as plans_created,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE event = 'plan_created') /
    NULLIF(COUNT(*) FILTER (WHERE event = 'recommendations_loaded'), 0),
    1
  ) as load_to_creation_rate_percent

FROM recommendation_events
WHERE created_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- MATERIALIZED VIEW FOR PERFORMANCE (Optional)
-- ============================================================================
-- Create a materialized view for faster dashboard queries
-- Refresh this periodically (e.g., every hour) for better performance

CREATE MATERIALIZED VIEW IF NOT EXISTS recommendation_analytics_daily AS
SELECT
  DATE(created_at) as date,
  event,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(AVG((data->>'topScore')::numeric), 1) as avg_top_score,
  ROUND(AVG((data->>'loadTime')::numeric), 0) as avg_load_time_ms,
  jsonb_object_agg(
    COALESCE(data->>'selectedPlanType', 'unknown'),
    COUNT(*)
  ) FILTER (WHERE data->>'selectedPlanType' IS NOT NULL) as plan_type_distribution
FROM recommendation_events
GROUP BY DATE(created_at), event
ORDER BY date DESC, event;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON recommendation_analytics_daily(date DESC);

-- Refresh the materialized view (run this periodically via cron or scheduled task)
-- REFRESH MATERIALIZED VIEW recommendation_analytics_daily;

COMMENT ON MATERIALIZED VIEW recommendation_analytics_daily IS
  'Pre-aggregated daily analytics for faster dashboard queries. Refresh hourly or daily.';
