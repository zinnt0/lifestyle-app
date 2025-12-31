/**
 * Tests for RecommendationAnalytics
 *
 * This test suite validates the analytics tracking system
 */

import { recommendationAnalytics } from '../recommendationAnalytics';
import { PlanRecommendation } from '@/types/recommendation';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('RecommendationAnalytics', () => {
  const mockUserId = 'test-user-123';

  const mockRecommendations: PlanRecommendation[] = [
    {
      template: {
        id: 'template-1',
        name: 'Muscle Building',
        plan_type: 'muscle_building',
        name_de: 'Muskelaufbau',
      },
      totalScore: 85,
      completeness: 'complete',
      breakdown: {
        goalAlignment: { score: 90, weight: 0.4, weighted: 36 },
        experienceMatch: { score: 80, weight: 0.25, weighted: 20 },
        equipmentAvailability: { score: 85, weight: 0.2, weighted: 17 },
        timeCommitment: { score: 80, weight: 0.15, weighted: 12 },
      },
      reasoning: ['Perfect for muscle building goals'],
    } as PlanRecommendation,
    {
      template: {
        id: 'template-2',
        name: 'Weight Loss',
        plan_type: 'weight_loss',
        name_de: 'Gewichtsverlust',
      },
      totalScore: 72,
      completeness: 'complete',
      breakdown: {
        goalAlignment: { score: 75, weight: 0.4, weighted: 30 },
        experienceMatch: { score: 70, weight: 0.25, weighted: 17.5 },
        equipmentAvailability: { score: 70, weight: 0.2, weighted: 14 },
        timeCommitment: { score: 70, weight: 0.15, weighted: 10.5 },
      },
      reasoning: ['Good for weight loss'],
    } as PlanRecommendation,
  ];

  beforeEach(() => {
    // Reset analytics configuration
    recommendationAnalytics.configure({
      enabled: true,
      samplingRate: 1.0,
      persistToDatabase: false, // Don't persist in tests
      logToConsole: false, // Don't log in tests
      enableHealthChecks: false, // Disable health checks in tests
    });

    // Clear console spies
    jest.clearAllMocks();
  });

  describe('Session Management', () => {
    test('should initialize session with unique ID', () => {
      recommendationAnalytics.initSession();
      // Session ID is internal, but we can verify it doesn't throw
      expect(() => recommendationAnalytics.initSession()).not.toThrow();
    });
  });

  describe('Event Tracking', () => {
    test('should track recommendations loaded', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      recommendationAnalytics.configure({ logToConsole: true });
      recommendationAnalytics.trackRecommendationsLoaded(
        mockUserId,
        mockRecommendations,
        150
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.stringContaining('recommendations_loaded'),
        expect.objectContaining({
          user: mockUserId,
          topScore: 85,
          loadTime: 150,
          recommendationCount: 2,
        })
      );

      consoleSpy.mockRestore();
    });

    test('should track plan selected with correct rank', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      recommendationAnalytics.configure({ logToConsole: true });
      recommendationAnalytics.trackPlanSelected(
        mockUserId,
        mockRecommendations[0],
        1
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.stringContaining('plan_selected'),
        expect.objectContaining({
          user: mockUserId,
          selectedPlanType: 'muscle_building',
          selectedScore: 85,
          selectedRank: 1,
        })
      );

      consoleSpy.mockRestore();
    });

    test('should track plan creation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      recommendationAnalytics.configure({ logToConsole: true });
      recommendationAnalytics.trackPlanCreated(
        mockUserId,
        'muscle_building',
        85,
        'complete'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.stringContaining('plan_created'),
        expect.objectContaining({
          user: mockUserId,
          selectedPlanType: 'muscle_building',
          selectedScore: 85,
          completeness: 'complete',
        })
      );

      consoleSpy.mockRestore();
    });

    test('should track incomplete warnings', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      recommendationAnalytics.configure({ logToConsole: true });

      // Track warning shown
      recommendationAnalytics.trackIncompleteWarning(
        mockUserId,
        'muscle_building',
        false
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.stringContaining('incomplete_warning_shown'),
        expect.objectContaining({
          selectedPlanType: 'muscle_building',
        })
      );

      // Track warning accepted
      recommendationAnalytics.trackIncompleteWarning(
        mockUserId,
        'muscle_building',
        true
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.stringContaining('incomplete_plan_accepted'),
        expect.objectContaining({
          selectedPlanType: 'muscle_building',
        })
      );

      consoleSpy.mockRestore();
    });

    test('should track errors', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      recommendationAnalytics.configure({ logToConsole: true });
      recommendationAnalytics.trackError(mockUserId, 'Network error');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.stringContaining('recommendations_error'),
        expect.objectContaining({
          errorMessage: 'Network error',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    test('should respect enabled flag', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      recommendationAnalytics.configure({
        enabled: false,
        logToConsole: true,
      });

      recommendationAnalytics.trackPlanCreated(
        mockUserId,
        'muscle_building',
        85,
        'complete'
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('should respect sampling rate', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Set sampling to 0% (no events should be logged)
      recommendationAnalytics.configure({
        enabled: true,
        samplingRate: 0,
        logToConsole: true,
      });

      recommendationAnalytics.trackPlanCreated(
        mockUserId,
        'muscle_building',
        85,
        'complete'
      );

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Health Checks', () => {
    test('should warn on low recommendation quality', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      recommendationAnalytics.configure({
        enableHealthChecks: true,
        logToConsole: false,
      });

      const lowQualityRecs: PlanRecommendation[] = [
        {
          ...mockRecommendations[0],
          totalScore: 45, // Below 60
        },
      ];

      recommendationAnalytics.trackRecommendationsLoaded(
        mockUserId,
        lowQualityRecs,
        100
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Low recommendation quality'),
        expect.objectContaining({
          topScore: 45,
        })
      );

      warnSpy.mockRestore();
    });

    test('should warn on all incomplete recommendations', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      recommendationAnalytics.configure({
        enableHealthChecks: true,
        logToConsole: false,
      });

      const incompleteRecs: PlanRecommendation[] = mockRecommendations.map(
        rec => ({
          ...rec,
          completeness: 'incomplete' as const,
        })
      );

      recommendationAnalytics.trackRecommendationsLoaded(
        mockUserId,
        incompleteRecs,
        100
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('All recommendations are incomplete'),
        expect.any(Object)
      );

      warnSpy.mockRestore();
    });

    test('should warn on slow load times', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      recommendationAnalytics.configure({
        enableHealthChecks: true,
        logToConsole: false,
      });

      recommendationAnalytics.trackRecommendationsLoaded(
        mockUserId,
        mockRecommendations,
        2500 // > 2000ms
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow recommendation loading'),
        expect.objectContaining({
          loadTime: '2500ms',
        })
      );

      warnSpy.mockRestore();
    });

    test('should warn on no recommendations', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      recommendationAnalytics.configure({
        enableHealthChecks: true,
        logToConsole: false,
      });

      recommendationAnalytics.trackRecommendationsLoaded(mockUserId, [], 100);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No recommendations available'),
        expect.any(Object)
      );

      warnSpy.mockRestore();
    });
  });
});
