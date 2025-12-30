import { supabase } from '@/lib/supabase';
import { PlanRecommendation } from '@/types/recommendation';

/**
 * Recommendation Analytics Events
 */
export type RecommendationEventType =
  | 'recommendations_loaded'
  | 'plan_selected'
  | 'plan_created'
  | 'incomplete_warning_shown'
  | 'incomplete_plan_accepted'
  | 'recommendations_error';

export interface RecommendationEventData {
  topScore?: number;
  selectedPlanType?: string;
  selectedScore?: number;
  selectedRank?: number;
  completeness?: string;
  loadTime?: number;
  allScores?: number[];
  errorMessage?: string;
  recommendationCount?: number;
}

export interface RecommendationEvent {
  userId: string;
  timestamp: Date;
  event: RecommendationEventType;
  data: RecommendationEventData;
  sessionId?: string;
}

/**
 * Configuration for analytics
 */
interface AnalyticsConfig {
  enabled: boolean;
  samplingRate: number; // 0.0 - 1.0 (1.0 = 100% of events)
  persistToDatabase: boolean;
  logToConsole: boolean;
  enableHealthChecks: boolean;
}

/**
 * RecommendationAnalytics
 *
 * Tracks user interactions with the recommendation system
 * and provides insights into system performance and user behavior.
 */
class RecommendationAnalytics {
  private config: AnalyticsConfig = {
    enabled: true,
    samplingRate: 1.0, // Track all events in development
    persistToDatabase: true,
    logToConsole: __DEV__,
    enableHealthChecks: true,
  };

  private sessionId: string | null = null;

  /**
   * Initialize analytics session
   */
  initSession(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update analytics configuration
   */
  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Track when recommendations are loaded
   */
  trackRecommendationsLoaded(
    userId: string,
    recommendations: PlanRecommendation[],
    loadTime: number
  ): void {
    const event: RecommendationEvent = {
      userId,
      timestamp: new Date(),
      event: 'recommendations_loaded',
      data: {
        topScore: recommendations[0]?.totalScore,
        allScores: recommendations.map(r => r.totalScore),
        loadTime,
        recommendationCount: recommendations.length,
      },
      sessionId: this.sessionId || undefined,
    };

    this.logEvent(event);

    // Health checks
    if (this.config.enableHealthChecks) {
      this.checkHealthMetrics(recommendations, loadTime);
    }
  }

  /**
   * Track when user selects a plan
   */
  trackPlanSelected(
    userId: string,
    recommendation: PlanRecommendation,
    rank: number
  ): void {
    const event: RecommendationEvent = {
      userId,
      timestamp: new Date(),
      event: 'plan_selected',
      data: {
        selectedPlanType: recommendation.template.plan_type,
        selectedScore: recommendation.totalScore,
        selectedRank: rank,
        completeness: recommendation.completeness,
      },
      sessionId: this.sessionId || undefined,
    };

    this.logEvent(event);
  }

  /**
   * Track when a plan is created from a recommendation
   */
  trackPlanCreated(
    userId: string,
    planType: string,
    score: number,
    completeness: string
  ): void {
    const event: RecommendationEvent = {
      userId,
      timestamp: new Date(),
      event: 'plan_created',
      data: {
        selectedPlanType: planType,
        selectedScore: score,
        completeness,
      },
      sessionId: this.sessionId || undefined,
    };

    this.logEvent(event);
  }

  /**
   * Track incomplete plan warnings
   */
  trackIncompleteWarning(
    userId: string,
    planType: string,
    accepted: boolean
  ): void {
    const event: RecommendationEvent = {
      userId,
      timestamp: new Date(),
      event: accepted ? 'incomplete_plan_accepted' : 'incomplete_warning_shown',
      data: {
        selectedPlanType: planType,
      },
      sessionId: this.sessionId || undefined,
    };

    this.logEvent(event);
  }

  /**
   * Track recommendation errors
   */
  trackError(userId: string, errorMessage: string): void {
    const event: RecommendationEvent = {
      userId,
      timestamp: new Date(),
      event: 'recommendations_error',
      data: {
        errorMessage,
      },
      sessionId: this.sessionId || undefined,
    };

    this.logEvent(event);
  }

  /**
   * Log event to console and/or database
   */
  private async logEvent(event: RecommendationEvent): Promise<void> {
    if (!this.config.enabled) return;

    // Sampling: Only track X% of events
    if (Math.random() > this.config.samplingRate) return;

    // Console logging
    if (this.config.logToConsole) {
      console.log(
        `[Analytics] ${event.event}`,
        {
          user: event.userId,
          session: event.sessionId,
          ...event.data,
        }
      );
    }

    // Persist to database
    if (this.config.persistToDatabase) {
      try {
        await this.persistEvent(event);
      } catch (error) {
        // Don't let analytics errors crash the app
        console.error('[Analytics] Failed to persist event:', error);
      }
    }
  }

  /**
   * Persist event to Supabase
   */
  private async persistEvent(event: RecommendationEvent): Promise<void> {
    const { error } = await supabase
      .from('recommendation_events')
      .insert({
        user_id: event.userId,
        event: event.event,
        data: event.data,
        session_id: event.sessionId,
        created_at: event.timestamp.toISOString(),
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Health checks and alerts
   */
  private checkHealthMetrics(
    recommendations: PlanRecommendation[],
    loadTime: number
  ): void {
    // Alert if top score is very low
    const topScore = recommendations[0]?.totalScore || 0;
    if (topScore < 60) {
      console.warn('⚠️ Low recommendation quality!', {
        topScore,
        planType: recommendations[0]?.template.plan_type,
        message: 'Top recommendation has score below 60',
      });
    }

    // Alert if all recommendations are incomplete
    if (recommendations.length > 0 &&
        recommendations.every(r => r.completeness === 'incomplete')) {
      console.warn('⚠️ All recommendations are incomplete!', {
        count: recommendations.length,
        message: 'User may not have enough profile data',
      });
    }

    // Alert if no recommendations found
    if (recommendations.length === 0) {
      console.warn('⚠️ No recommendations available!', {
        message: 'No matching training plans found',
      });
    }

    // Alert if performance is slow (> 2 seconds)
    if (loadTime > 2000) {
      console.warn('⚠️ Slow recommendation loading!', {
        loadTime: `${loadTime}ms`,
        message: 'Recommendation loading took more than 2 seconds',
      });
    }

    // Alert if huge performance gap between scores
    if (recommendations.length >= 2) {
      const scoreGap = recommendations[0].totalScore - recommendations[1].totalScore;
      if (scoreGap > 30) {
        console.info('ℹ️ Large score gap detected', {
          gap: scoreGap,
          top: recommendations[0].totalScore,
          second: recommendations[1].totalScore,
          message: 'First recommendation significantly better than alternatives',
        });
      }
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(startDate: Date, endDate: Date): Promise<AnalyticsReport> {
    const { data: events, error } = await supabase
      .from('recommendation_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      throw error;
    }

    if (!events || events.length === 0) {
      return {
        period: { startDate, endDate },
        totalEvents: 0,
        metrics: {},
      };
    }

    // Calculate metrics
    const loadEvents = events.filter(e => e.event === 'recommendations_loaded');
    const selectEvents = events.filter(e => e.event === 'plan_selected');
    const createEvents = events.filter(e => e.event === 'plan_created');
    const incompleteWarnings = events.filter(e => e.event === 'incomplete_warning_shown');
    const incompleteAccepted = events.filter(e => e.event === 'incomplete_plan_accepted');

    // Most popular plans
    const planSelections = selectEvents.reduce((acc, event) => {
      const planType = event.data.selectedPlanType || 'unknown';
      acc[planType] = (acc[planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Average scores
    const avgTopScore = loadEvents.length > 0
      ? loadEvents.reduce((sum, e) => sum + (e.data.topScore || 0), 0) / loadEvents.length
      : 0;

    const avgLoadTime = loadEvents.length > 0
      ? loadEvents.reduce((sum, e) => sum + (e.data.loadTime || 0), 0) / loadEvents.length
      : 0;

    // Incomplete plan acceptance rate
    const incompleteAcceptanceRate = incompleteWarnings.length > 0
      ? (incompleteAccepted.length / incompleteWarnings.length) * 100
      : 0;

    // Conversion rates
    const uniqueUsers = new Set(events.map(e => e.user_id)).size;
    const selectionRate = loadEvents.length > 0
      ? (selectEvents.length / loadEvents.length) * 100
      : 0;
    const creationRate = selectEvents.length > 0
      ? (createEvents.length / selectEvents.length) * 100
      : 0;

    return {
      period: { startDate, endDate },
      totalEvents: events.length,
      uniqueUsers,
      metrics: {
        recommendations: {
          total: loadEvents.length,
          avgTopScore: Math.round(avgTopScore * 10) / 10,
          avgLoadTime: Math.round(avgLoadTime),
        },
        selections: {
          total: selectEvents.length,
          byPlanType: planSelections,
          selectionRate: Math.round(selectionRate * 10) / 10,
        },
        creations: {
          total: createEvents.length,
          creationRate: Math.round(creationRate * 10) / 10,
        },
        incompleteWarnings: {
          shown: incompleteWarnings.length,
          accepted: incompleteAccepted.length,
          acceptanceRate: Math.round(incompleteAcceptanceRate * 10) / 10,
        },
      },
    };
  }
}

/**
 * Analytics Report Interface
 */
export interface AnalyticsReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalEvents: number;
  uniqueUsers?: number;
  metrics: {
    recommendations?: {
      total: number;
      avgTopScore: number;
      avgLoadTime: number;
    };
    selections?: {
      total: number;
      byPlanType: Record<string, number>;
      selectionRate: number;
    };
    creations?: {
      total: number;
      creationRate: number;
    };
    incompleteWarnings?: {
      shown: number;
      accepted: number;
      acceptanceRate: number;
    };
  };
}

// Singleton instance
export const recommendationAnalytics = new RecommendationAnalytics();
