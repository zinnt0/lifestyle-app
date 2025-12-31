-- Migration: Create recommendation_events table for analytics
-- Created: 2024-12-29
-- Purpose: Track user interactions with the recommendation system for analytics and monitoring

-- Create recommendation_events table
CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN (
    'recommendations_loaded',
    'plan_selected',
    'plan_created',
    'incomplete_warning_shown',
    'incomplete_plan_accepted',
    'recommendations_error'
  )),
  data JSONB NOT NULL DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_recommendation_events_user_id ON recommendation_events(user_id);
CREATE INDEX idx_recommendation_events_event ON recommendation_events(event);
CREATE INDEX idx_recommendation_events_created_at ON recommendation_events(created_at DESC);
CREATE INDEX idx_recommendation_events_session_id ON recommendation_events(session_id) WHERE session_id IS NOT NULL;

-- Composite index for dashboard queries (user + event + time)
CREATE INDEX idx_recommendation_events_user_event_time ON recommendation_events(user_id, event, created_at DESC);

-- GIN index for JSONB data queries
CREATE INDEX idx_recommendation_events_data ON recommendation_events USING GIN(data);

-- Add comments for documentation
COMMENT ON TABLE recommendation_events IS 'Stores analytics events for the recommendation system';
COMMENT ON COLUMN recommendation_events.event IS 'Type of analytics event (recommendations_loaded, plan_selected, etc.)';
COMMENT ON COLUMN recommendation_events.data IS 'Event-specific data stored as JSON (scores, plan types, load times, etc.)';
COMMENT ON COLUMN recommendation_events.session_id IS 'Optional session identifier to track user flows';

-- RLS Policies
ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own events
CREATE POLICY "Users can insert their own events"
  ON recommendation_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own events
CREATE POLICY "Users can view their own events"
  ON recommendation_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admin/Service role can view all events (for analytics dashboard)
CREATE POLICY "Service role can view all events"
  ON recommendation_events
  FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role' OR auth.jwt()->>'role' = 'admin');

-- Create a view for easy analytics queries
CREATE OR REPLACE VIEW recommendation_analytics_summary AS
SELECT
  event,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  DATE_TRUNC('day', created_at) as event_date
FROM recommendation_events
GROUP BY event, DATE_TRUNC('day', created_at)
ORDER BY event_date DESC, event;

COMMENT ON VIEW recommendation_analytics_summary IS 'Summary view for quick analytics dashboard queries';

-- Grant access to the view
GRANT SELECT ON recommendation_analytics_summary TO authenticated;
