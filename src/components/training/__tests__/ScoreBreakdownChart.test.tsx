/**
 * Score Breakdown Chart Tests
 *
 * Test cases:
 * - Very high scores (95-100)
 * - Medium scores (70-85)
 * - Low scores (50-70)
 * - Mixed scores (100/80/60/70)
 * - Animation behavior
 * - Accessibility
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ScoreBreakdownChart } from '../ScoreBreakdownChart';
import type { ScoreBreakdown } from '@/utils/planRecommendationScoring';

describe('ScoreBreakdownChart', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const highScores: ScoreBreakdown = {
    experienceScore: 98,
    frequencyScore: 95,
    goalScore: 100,
    volumeScore: 97,
  };

  const mediumScores: ScoreBreakdown = {
    experienceScore: 75,
    frequencyScore: 80,
    goalScore: 72,
    volumeScore: 78,
  };

  const lowScores: ScoreBreakdown = {
    experienceScore: 55,
    frequencyScore: 60,
    goalScore: 52,
    volumeScore: 58,
  };

  const mixedScores: ScoreBreakdown = {
    experienceScore: 100,
    frequencyScore: 80,
    goalScore: 60,
    volumeScore: 70,
  };

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  it('renders correctly when collapsed', () => {
    const { getByText, queryByText } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={false} />
    );

    expect(getByText('Score-Details')).toBeTruthy();
    expect(getByText(/Ø.*%/)).toBeTruthy(); // Average score
    expect(getByText('▶')).toBeTruthy(); // Collapsed icon

    // Bars should not be visible when collapsed
    expect(queryByText('Level')).toBeFalsy();
  });

  it('renders correctly when expanded', () => {
    const { getByText } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={true} />
    );

    expect(getByText('Score-Details')).toBeTruthy();
    expect(getByText('▼')).toBeTruthy(); // Expanded icon
    expect(getByText('Level')).toBeTruthy();
    expect(getByText('Frequenz')).toBeTruthy();
    expect(getByText('Ziel')).toBeTruthy();
    expect(getByText('Volumen')).toBeTruthy();
  });

  // ============================================================================
  // Score Display Tests
  // ============================================================================

  it('displays very high scores correctly', () => {
    const { getByText } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={true} />
    );

    expect(getByText('98%')).toBeTruthy();
    expect(getByText('95%')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
    expect(getByText('97%')).toBeTruthy();

    // Average should be ~97.5%
    expect(getByText(/Ø 98%/)).toBeTruthy();
  });

  it('displays medium scores correctly', () => {
    const { getByText } = render(
      <ScoreBreakdownChart breakdown={mediumScores} initialExpanded={true} />
    );

    expect(getByText('75%')).toBeTruthy();
    expect(getByText('80%')).toBeTruthy();
    expect(getByText('72%')).toBeTruthy();
    expect(getByText('78%')).toBeTruthy();

    // Average should be ~76%
    expect(getByText(/Ø 76%/)).toBeTruthy();
  });

  it('displays low scores correctly', () => {
    const { getByText } = render(
      <ScoreBreakdownChart breakdown={lowScores} initialExpanded={true} />
    );

    expect(getByText('55%')).toBeTruthy();
    expect(getByText('60%')).toBeTruthy();
    expect(getByText('52%')).toBeTruthy();
    expect(getByText('58%')).toBeTruthy();

    // Average should be ~56%
    expect(getByText(/Ø 56%/)).toBeTruthy();
  });

  it('displays mixed scores correctly', () => {
    const { getByText } = render(
      <ScoreBreakdownChart breakdown={mixedScores} initialExpanded={true} />
    );

    expect(getByText('100%')).toBeTruthy();
    expect(getByText('80%')).toBeTruthy();
    expect(getByText('60%')).toBeTruthy();
    expect(getByText('70%')).toBeTruthy();

    // Average should be 77.5%
    expect(getByText(/Ø 78%/)).toBeTruthy();
  });

  // ============================================================================
  // Interaction Tests
  // ============================================================================

  it('toggles expanded state when header is pressed', async () => {
    const { getByText, queryByText } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={false} />
    );

    // Initially collapsed
    expect(queryByText('Level')).toBeFalsy();
    expect(getByText('▶')).toBeTruthy();

    // Press header to expand
    fireEvent.press(getByText('Score-Details'));

    await waitFor(() => {
      expect(getByText('▼')).toBeTruthy();
      expect(getByText('Level')).toBeTruthy();
    });
  });

  it('opens info modal when info button is pressed', async () => {
    const { getAllByLabelText, getByText } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={true} />
    );

    // Find and press the first info button (Level)
    const infoButtons = getAllByLabelText(/Info zu/);
    fireEvent.press(infoButtons[0]);

    await waitFor(() => {
      expect(getByText('Level-Score')).toBeTruthy();
      expect(getByText('Was bedeutet das?')).toBeTruthy();
      expect(getByText('Berechnung')).toBeTruthy();
    });
  });

  it('closes info modal when close button is pressed', async () => {
    const { getAllByLabelText, getByText, queryByText } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={true} />
    );

    // Open modal
    const infoButtons = getAllByLabelText(/Info zu/);
    fireEvent.press(infoButtons[0]);

    await waitFor(() => {
      expect(getByText('Level-Score')).toBeTruthy();
    });

    // Close modal
    fireEvent.press(getByText('Verstanden'));

    await waitFor(() => {
      expect(queryByText('Level-Score')).toBeFalsy();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  it('has proper accessibility labels for each score', () => {
    const { getByLabelText } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={true} />
    );

    expect(getByLabelText('Level: 98 Prozent')).toBeTruthy();
    expect(getByLabelText('Frequenz: 95 Prozent')).toBeTruthy();
    expect(getByLabelText('Ziel: 100 Prozent')).toBeTruthy();
    expect(getByLabelText('Volumen: 97 Prozent')).toBeTruthy();
  });

  it('has accessibility hints for interactive elements', () => {
    const { getAllByA11yHint } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={true} />
    );

    const interactiveElements = getAllByA11yHint('Tippe für mehr Informationen');
    expect(interactiveElements).toHaveLength(4); // 4 score rows
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  it('handles zero scores correctly', () => {
    const zeroScores: ScoreBreakdown = {
      experienceScore: 0,
      frequencyScore: 0,
      goalScore: 0,
      volumeScore: 0,
    };

    const { getByText } = render(
      <ScoreBreakdownChart breakdown={zeroScores} initialExpanded={true} />
    );

    expect(getByText('0%')).toBeTruthy();
    expect(getByText(/Ø 0%/)).toBeTruthy();
  });

  it('handles 100% scores correctly', () => {
    const perfectScores: ScoreBreakdown = {
      experienceScore: 100,
      frequencyScore: 100,
      goalScore: 100,
      volumeScore: 100,
    };

    const { getAllByText, getByText } = render(
      <ScoreBreakdownChart breakdown={perfectScores} initialExpanded={true} />
    );

    const percentages = getAllByText('100%');
    expect(percentages).toHaveLength(4); // All 4 scores
    expect(getByText(/Ø 100%/)).toBeTruthy();
  });

  it('handles decimal scores by rounding', () => {
    const decimalScores: ScoreBreakdown = {
      experienceScore: 75.7,
      frequencyScore: 82.3,
      goalScore: 68.9,
      volumeScore: 91.2,
    };

    const { getByText } = render(
      <ScoreBreakdownChart breakdown={decimalScores} initialExpanded={true} />
    );

    // Should round to nearest integer
    expect(getByText('76%')).toBeTruthy();
    expect(getByText('82%')).toBeTruthy();
    expect(getByText('69%')).toBeTruthy();
    expect(getByText('91%')).toBeTruthy();
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  it('does not re-animate when toggling collapsed/expanded', async () => {
    const { getByText, rerender } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={true} />
    );

    expect(getByText('98%')).toBeTruthy();

    // Collapse
    fireEvent.press(getByText('Score-Details'));

    // Expand again
    fireEvent.press(getByText('Score-Details'));

    await waitFor(() => {
      expect(getByText('98%')).toBeTruthy();
    });

    // Scores should remain the same
    expect(getByText('98%')).toBeTruthy();
  });

  it('animates when breakdown changes', () => {
    const { rerender, getByText } = render(
      <ScoreBreakdownChart breakdown={highScores} initialExpanded={true} />
    );

    expect(getByText('98%')).toBeTruthy();

    // Change scores
    rerender(<ScoreBreakdownChart breakdown={mediumScores} initialExpanded={true} />);

    // Should show new scores
    expect(getByText('75%')).toBeTruthy();
  });
});
