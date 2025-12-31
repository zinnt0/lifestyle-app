# Integration Guide: PlanRecommendationCard in GuidedPlanFlow

## Schritt-für-Schritt Integration

### 1. Imports hinzufügen

```tsx
// In GuidedPlanFlowScreen.tsx
import { PlanRecommendationList } from '@/components/training/PlanRecommendationCard';
import { getTopRecommendations } from '@/utils/planRecommendationScoring';
import type { PlanRecommendation } from '@/utils/planRecommendationScoring';
```

### 2. State erweitern

```tsx
const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
```

### 3. Recommendation-Loading Funktion

```tsx
const loadRecommendations = async () => {
  setIsLoadingRecommendations(true);

  try {
    // Get user profile from current state
    const userProfile = {
      fitness_level: fitnessLevel,
      training_experience_months: experienceMonths,
      available_training_days: trainingDays,
      primary_goal: primaryGoal,
    };

    // Get all plan templates from Supabase
    const templates = await trainingService.getPlanTemplates();

    // Calculate top recommendations (3-5 plans)
    const recs = getTopRecommendations(userProfile, templates, 3);

    setRecommendations(recs);
  } catch (error) {
    console.error('Failed to load recommendations:', error);
    // Show error toast
  } finally {
    setIsLoadingRecommendations(false);
  }
};
```

### 4. Recommendations laden wenn Profil komplett

```tsx
useEffect(() => {
  // Lade Recommendations wenn alle Profil-Daten vorhanden sind
  if (
    fitnessLevel &&
    experienceMonths !== null &&
    trainingDays !== null &&
    primaryGoal
  ) {
    loadRecommendations();
  }
}, [fitnessLevel, experienceMonths, trainingDays, primaryGoal]);
```

### 5. Plan-Selection Handler

```tsx
const handleSelectPlan = async (recommendation: PlanRecommendation) => {
  try {
    setIsCreatingPlan(true);

    // Create plan from selected template
    const plan = await trainingService.createPlanFromTemplate(
      recommendation.template.id,
      {
        // Optional: Custom settings
        startDate: new Date(),
        customName: recommendation.template.name_de,
      }
    );

    // Log analytics event
    analytics.track('plan_created_from_recommendation', {
      template_id: recommendation.template.id,
      template_name: recommendation.template.name,
      recommendation_score: recommendation.totalScore,
      recommendation_type: recommendation.recommendation,
      user_fitness_level: fitnessLevel,
      user_goal: primaryGoal,
    });

    // Navigate to training dashboard
    router.push('/training');

    // Show success toast
    Toast.show({
      type: 'success',
      text1: 'Plan erstellt!',
      text2: `${recommendation.template.name_de} wurde zu deinem Training hinzugefügt`,
    });

  } catch (error) {
    console.error('Failed to create plan:', error);
    Toast.show({
      type: 'error',
      text1: 'Fehler',
      text2: 'Plan konnte nicht erstellt werden',
    });
  } finally {
    setIsCreatingPlan(false);
  }
};
```

### 6. UI Integration - Ersetze alte Liste

**Vorher:**
```tsx
{/* OLD: Simple text list */}
<View>
  {recommendations.map((rec) => (
    <TouchableOpacity key={rec.template.id} onPress={() => selectPlan(rec)}>
      <Text>{rec.template.name} - {rec.totalScore}</Text>
    </TouchableOpacity>
  ))}
</View>
```

**Nachher:**
```tsx
{/* NEW: Professional recommendation cards */}
{isLoadingRecommendations ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={styles.loadingText}>
      Analysiere dein Profil und finde die besten Pläne...
    </Text>
  </View>
) : (
  <PlanRecommendationList
    recommendations={recommendations}
    onSelectPlan={handleSelectPlan}
  />
)}
```

### 7. Styles hinzufügen

```tsx
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
```

## Komplettes Beispiel

```tsx
// src/screens/Training/GuidedPlanFlowScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { PlanRecommendationList } from '@/components/training/PlanRecommendationCard';
import { getTopRecommendations } from '@/utils/planRecommendationScoring';
import type { PlanRecommendation } from '@/utils/planRecommendationScoring';
import { trainingService } from '@/services/training.service';
import { theme } from '@/constants/theme';

export default function GuidedPlanFlowScreen() {
  // Existing state
  const [fitnessLevel, setFitnessLevel] = useState<string>('');
  const [experienceMonths, setExperienceMonths] = useState<number | null>(null);
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState<string>('');

  // New state for recommendations
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  // Load recommendations when profile is complete
  useEffect(() => {
    if (fitnessLevel && experienceMonths !== null && trainingDays !== null && primaryGoal) {
      loadRecommendations();
    }
  }, [fitnessLevel, experienceMonths, trainingDays, primaryGoal]);

  const loadRecommendations = async () => {
    setIsLoadingRecommendations(true);

    try {
      const userProfile = {
        fitness_level: fitnessLevel as 'beginner' | 'intermediate' | 'advanced',
        training_experience_months: experienceMonths!,
        available_training_days: trainingDays!,
        primary_goal: primaryGoal as 'strength' | 'hypertrophy' | 'both' | 'general_fitness',
      };

      const templates = await trainingService.getPlanTemplates();
      const recs = getTopRecommendations(userProfile, templates, 3);

      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleSelectPlan = async (recommendation: PlanRecommendation) => {
    setIsCreatingPlan(true);

    try {
      await trainingService.createPlanFromTemplate(recommendation.template.id);
      router.push('/training');
    } catch (error) {
      console.error('Failed to create plan:', error);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Your existing questionnaire steps... */}

      {/* Recommendations section */}
      {isLoadingRecommendations ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            Analysiere dein Profil und finde die besten Pläne...
          </Text>
        </View>
      ) : (
        <PlanRecommendationList
          recommendations={recommendations}
          onSelectPlan={handleSelectPlan}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});
```

## Testing Checklist

- [ ] Recommendations werden korrekt geladen
- [ ] Loading-State wird angezeigt
- [ ] Alle 3 Recommendations werden dargestellt
- [ ] Scores sind korrekt berechnet
- [ ] Badge-Farben passen zum Score
- [ ] "Plan erstellen" Button funktioniert
- [ ] Navigation zur Training-Dashboard funktioniert
- [ ] Error-Handling bei fehlgeschlagenen Requests
- [ ] Performance ist gut (keine Lags beim Scrollen)
- [ ] Funktioniert auf verschiedenen Bildschirmgrößen

## Analytics Events

```tsx
// Track recommendation view
analytics.track('recommendations_viewed', {
  count: recommendations.length,
  top_score: recommendations[0]?.totalScore,
  user_fitness_level: fitnessLevel,
});

// Track plan selection
analytics.track('plan_selected_from_recommendations', {
  template_id: recommendation.template.id,
  score: recommendation.totalScore,
  rank: index + 1,
});

// Track plan creation success
analytics.track('plan_created', {
  source: 'guided_flow',
  template_id: plan.template_id,
});
```

## Error Handling

```tsx
// Handle API errors
try {
  const templates = await trainingService.getPlanTemplates();
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Show retry button
  } else if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
  } else {
    // Show generic error
  }
}
```

## Performance Optimierungen

1. **Lazy Loading**: Lade Templates nur wenn nötig
2. **Caching**: Cache Templates in AsyncStorage
3. **Debouncing**: Verzögere Recommendation-Berechnung bei schnellen Profil-Änderungen
4. **Memoization**: Nutze `useMemo` für teure Berechnungen

```tsx
const memoizedRecommendations = useMemo(
  () => getTopRecommendations(userProfile, templates, 3),
  [userProfile, templates]
);
```

## Nächste Schritte

1. Integration in GuidedPlanFlowScreen durchführen
2. Testing mit echten Daten
3. User-Feedback sammeln
4. Analytics implementieren
5. A/B Testing für Recommendation-Algorithmus
