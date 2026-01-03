/**
 * Nutrition FAQ Component
 *
 * Interactive FAQ with:
 * - Accordion for questions
 * - Search functionality
 * - Feedback buttons ("War das hilfreich?")
 * - Category filtering
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../ui/theme';

interface FAQItem {
  id: string;
  category: 'basics' | 'goals' | 'macros' | 'progress' | 'advanced';
  question: string;
  answer: string;
  helpful?: number; // Track helpfulness count
  notHelpful?: number;
}

interface NutritionFAQProps {
  onFeedback?: (questionId: string, helpful: boolean) => void;
}

const FAQ_DATA: FAQItem[] = [
  // BASICS
  {
    id: 'bmr-tdee',
    category: 'basics',
    question: 'Was ist der Unterschied zwischen BMR und TDEE?',
    answer:
      'BMR (Basal Metabolic Rate) ist dein Grundumsatz - die Energie, die dein Körper im absoluten Ruhezustand verbraucht. TDEE (Total Daily Energy Expenditure) ist dein Gesamtumsatz - BMR plus alle Aktivitäten (Sport, Alltag, Verdauung). Beispiel: BMR 1.650 kcal, TDEE bei moderater Aktivität 2.560 kcal.',
  },
  {
    id: 'pal-choose',
    category: 'basics',
    question: 'Wie wähle ich den richtigen PAL-Faktor?',
    answer:
      'Häufigster Fehler: Überschätzung! Zähle nur strukturiertes Training:\n\n• Sedentär (1.2): Bürojob, kein Sport\n• Leicht aktiv (1.375): 1-3x/Woche Sport\n• Moderat aktiv (1.55): 3-5x/Woche Sport\n• Sehr aktiv (1.725): 6-7x/Woche intensives Training\n\nTipp: Im Zweifel die niedrigere Stufe wählen!',
  },
  {
    id: 'calibration',
    category: 'basics',
    question: 'Was ist TDEE-Kalibrierung?',
    answer:
      'Nach 4 Wochen nutzt die App deine echten Daten (gegessene Kalorien + Gewichtsänderung), um deinen tatsächlichen TDEE zu berechnen. Formeln sind nur Schätzungen - die Kalibrierung macht sie präzise! Beispiel: Formel sagt 2.500 kcal, Kalibrierung zeigt 2.750 kcal → dein Stoffwechsel ist schneller!',
  },

  // GOALS
  {
    id: 'best-goal',
    category: 'goals',
    question: 'Welches Trainingsziel soll ich wählen?',
    answer:
      'Wähle nach Priorität:\n\n• Weight Loss: Du willst Fett verlieren (>20% KFA)\n• Muscle Gain: Du bist schlank und willst Masse aufbauen\n• Strength: Du willst maximale Kraft (Powerlifting)\n• Endurance: Marathon, Triathlon, viel Cardio\n• General Fitness: Ausgeglichen, kein spezifisches Ziel',
  },
  {
    id: 'deficit-size',
    category: 'goals',
    question: 'Kann ich auch weniger als 500 kcal Defizit machen?',
    answer:
      'Ja! 300 kcal Defizit ist oft besser:\n\n✅ Weniger Hunger\n✅ Bessere Performance\n✅ Geringeres Muskelverlust-Risiko\n✅ Nachhaltiger\n\n⏱️ Dafür langsamer (0.3 kg/Woche statt 0.5 kg)\n\nWenn du Zeit hast: kleineres Defizit ist klüger!',
  },
  {
    id: 'goal-conflict',
    category: 'goals',
    question: 'Was bedeutet "Goal-Konflikt"?',
    answer:
      'Wenn dein Ziel und Zielgewicht nicht zusammenpassen:\n\n• Muscle Gain + niedrigeres Zielgewicht = unmöglich\n• Weight Loss + höheres Zielgewicht = widersprüchlich\n\nLösung: Die App schlägt Body Recomposition vor (moderates Defizit, sehr hohes Protein) - funktioniert bei Anfängern gut!',
  },

  // MACROS
  {
    id: 'high-protein',
    category: 'macros',
    question: 'Warum ist mein Protein so hoch bei Gewichtsverlust?',
    answer:
      'Im Defizit steigt der Protein-Bedarf auf 2.2 g/kg weil:\n\n1. Muskelerhalt: Körper nutzt sonst Muskelprotein als Energie\n2. Studien zeigen 25-50% weniger Muskelverlust mit hohem Protein\n3. Sättigung: Protein macht am längsten satt\n4. Thermischer Effekt: 20-30% der Kalorien für Verdauung\n\nQuelle: DOI 10.1097/MCO.0000000000000980',
  },
  {
    id: 'exact-macros',
    category: 'macros',
    question: 'Muss ich exakt die Makros treffen?',
    answer:
      'Nein! Prioritäten:\n\n1. Gesamtkalorien (±50 kcal)\n2. Protein (±10g) - WICHTIGSTE!\n3. Fett (±15g)\n4. Carbs - sehr flexibel\n\nBeispiel "gut genug":\nZiel: 165g Protein, 66g Fett, 239g Carbs\nIst: 160g Protein, 75g Fett, 220g Carbs\n→ Perfekt! ✅',
  },
  {
    id: 'carbs-fats',
    category: 'macros',
    question: 'Kann ich Carbs und Fett tauschen?',
    answer:
      'Teilweise! Aber beachte:\n\n✅ Fett min. 0.6 g/kg (Hormone!)\n✅ Carbs min. 100g (Gehirn, Training)\n\nFlexibel:\n• Mehr Carbs, weniger Fett → bessere Performance\n• Mehr Fett, weniger Carbs → bessere Sättigung\n\nProtein ist NICHT flexibel - immer erreichen!',
  },

  // PROGRESS
  {
    id: 'weight-fluctuation',
    category: 'progress',
    question: 'Warum schwankt mein Gewicht täglich so stark?',
    answer:
      '1-3 kg Schwankung sind normal!\n\nGründe:\n• Wasser: Salz bindet 100-200ml pro 1g\n• Glykogen: 1g bindet 3-4g Wasser\n• Darminhalt: 0.5-2 kg\n• Training: Entzündung → Wasser\n• Zyklus (Frauen): +1-3 kg vor Periode\n\nLösung: Schau auf 4-Wochen-Trend, nicht Tageswerte!',
  },
  {
    id: 'plateau',
    category: 'progress',
    question: 'Was tun bei Gewichts-Plateau?',
    answer:
      'Kein Fortschritt über 3-4 Wochen?\n\n1. Tracking prüfen (2 Wochen)\n   → Alles wiegen, auch Öle/Saucen\n\n2. Defizit anpassen\n   → Weitere -200 kcal\n\n3. Diet Break (wenn 2. nicht hilft)\n   → 2 Wochen Maintenance\n   → Stoffwechsel erholt sich\n   → Dann zurück zum Defizit',
  },
  {
    id: 'too-fast',
    category: 'progress',
    question: 'Ich verliere zu schnell - ist das schlimm?',
    answer:
      '>1 kg/Woche über 3+ Wochen ist zu schnell!\n\nGefahren:\n❌ 25-50% des Verlusts ist Muskel\n❌ Extreme Müdigkeit\n❌ Hormon-Probleme\n❌ Jo-Jo-Effekt\n\nSofort anpassen:\n+300-500 kcal erhöhen\nZiel-Rate: 0.5-0.7 kg/Woche\n→ Gesünder & mehr Muskelerhalt!',
  },
  {
    id: 'timeline',
    category: 'progress',
    question: 'Was wenn ich mein Zielgewicht nicht in der Zeit erreiche?',
    answer:
      'Völlig normal! Gründe:\n\n• Wasserschwankungen (1-3 kg)\n• Nicht-lineare Abnahme (Whoosh-Effekt)\n• Stoffwechsel-Anpassung\n\nLösung:\n✅ Schau 4-Wochen-Trend, nicht Wochen\n✅ Nutze Fotos, Umfang, Klamotten\n✅ Bei echtem Plateau: App kalibriert neu',
  },

  // ADVANCED
  {
    id: 'cardio-weight-loss',
    category: 'advanced',
    question: 'Hilft Cardio beim Abnehmen?',
    answer:
      'Ja, aber weniger als gedacht!\n\n30 min Laufen = ~300 kcal\n1 Donut = 300 kcal\n→ "You can\'t outrun a bad diet"\n\nBesser:\n1. Krafttraining (Muskelerhalt)\n2. 10.000 Schritte/Tag (NEAT)\n3. Cardio optional (wenn Spaß macht)\n\nErnährung ist 70-80% des Erfolgs!',
  },
  {
    id: 'cheat-days',
    category: 'advanced',
    question: 'Kann ich Cheat Days haben?',
    answer:
      'Refeed Days > unkontrollierte Cheat Days!\n\nRefeed (1x/Woche):\n• Kalorien auf Maintenance (+500 kcal)\n• Fokus auf Carbs\n• Protein bleibt hoch\n• Bewusste Wahl (kein Binge)\n\nVorteile:\n✅ Psychologische Pause\n✅ Hormon-Boost\n✅ Stoffwechsel-Signal\n✅ Wochenziel bleibt intakt',
  },
  {
    id: 'recomposition',
    category: 'advanced',
    question: 'Was ist Body Recomposition?',
    answer:
      'Gleichzeitig Fett verlieren + Muskeln aufbauen!\n\nFunktioniert bei:\n✅ Anfängern (Newbie Gains)\n✅ Übergewichtigen (>25% KFA)\n✅ Nach Trainingspause\n\nWie:\n• Moderates Defizit (-200 kcal)\n• Sehr hohes Protein (2.2 g/kg)\n• Krafttraining 3-4x/Woche\n• Geduld (langsamer als Bulk/Cut)!',
  },
  {
    id: 'rest-day-calories',
    category: 'advanced',
    question: 'Muss ich an Ruhetagen weniger essen?',
    answer:
      'Zwei Ansätze:\n\n1. Gleiche Kalorien täglich (einfacher)\n   → Jeden Tag 2.400 kcal\n\n2. Kalorienzyklus (fortgeschritten)\n   → Training: 2.600 kcal (mehr Carbs)\n   → Ruhe: 2.000 kcal (weniger Carbs)\n\nWichtig: Wochendurchschnitt zählt!\nBeide Ansätze funktionieren.',
  },
  {
    id: 'reverse-diet',
    category: 'advanced',
    question: 'Was ist Reverse Dieting?',
    answer:
      'Schrittweise Kalorienerhöhung nach Diät!\n\nWarum:\n• Verhindert schnelle Gewichtszunahme\n• Findet echten Maintenance\n• Stabilisiert Stoffwechsel\n\nWie:\n+100-200 kcal pro Woche erhöhen\nbis Gewicht stabil bleibt\n\nBeispiel:\nWoche 1: 1.800 kcal (Diät-Ende)\nWoche 5: 2.600 kcal (Maintenance gefunden)',
  },
];

const CATEGORIES = {
  all: 'Alle Fragen',
  basics: 'Grundlagen',
  goals: 'Trainingsziele',
  macros: 'Makronährstoffe',
  progress: 'Fortschritt',
  advanced: 'Fortgeschritten',
};

export function NutritionFAQ({ onFeedback }: NutritionFAQProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'basics' | 'goals' | 'macros' | 'progress' | 'advanced'
  >('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  // Filter FAQ items
  const filteredFAQ = useMemo(() => {
    let items = FAQ_DATA;

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      );
    }

    return items;
  }, [searchQuery, selectedCategory]);

  // Toggle item expansion
  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Handle feedback
  const handleFeedback = (questionId: string, helpful: boolean) => {
    if (feedbackGiven.has(questionId)) {
      Alert.alert(
        'Bereits bewertet',
        'Du hast diese Frage bereits bewertet. Danke für dein Feedback!'
      );
      return;
    }

    // Mark as feedback given
    const newFeedbackGiven = new Set(feedbackGiven);
    newFeedbackGiven.add(questionId);
    setFeedbackGiven(newFeedbackGiven);

    // Call parent callback
    if (onFeedback) {
      onFeedback(questionId, helpful);
    }

    // Show thank you message
    Alert.alert(
      'Danke!',
      helpful
        ? 'Schön, dass wir helfen konnten! 🎉'
        : 'Danke für dein Feedback. Wir arbeiten daran, unsere FAQs zu verbessern!'
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={COLORS.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Suche nach Fragen..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(
          (category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                ]}
              >
                {CATEGORIES[category]}
              </Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* FAQ List */}
      <ScrollView
        style={styles.faqList}
        contentContainerStyle={styles.faqListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredFAQ.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={64}
              color={COLORS.textTertiary}
            />
            <Text style={styles.emptyStateTitle}>Keine Ergebnisse</Text>
            <Text style={styles.emptyStateText}>
              Versuche eine andere Suche oder wähle eine andere Kategorie
            </Text>
          </View>
        ) : (
          filteredFAQ.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const hasFeedback = feedbackGiven.has(item.id);

            return (
              <View key={item.id} style={styles.faqItem}>
                {/* Question */}
                <TouchableOpacity
                  style={styles.questionContainer}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.questionContent}>
                    <Text style={styles.questionText}>{item.question}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>

                {/* Answer (Expanded) */}
                {isExpanded && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{item.answer}</Text>

                    {/* Feedback Buttons */}
                    <View style={styles.feedbackContainer}>
                      <Text style={styles.feedbackLabel}>
                        War das hilfreich?
                      </Text>
                      <View style={styles.feedbackButtons}>
                        <TouchableOpacity
                          style={[
                            styles.feedbackButton,
                            hasFeedback && styles.feedbackButtonDisabled,
                          ]}
                          onPress={() => handleFeedback(item.id, true)}
                          disabled={hasFeedback}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="thumbs-up"
                            size={20}
                            color={
                              hasFeedback ? COLORS.textTertiary : COLORS.success
                            }
                          />
                          <Text
                            style={[
                              styles.feedbackButtonText,
                              hasFeedback && styles.feedbackButtonTextDisabled,
                            ]}
                          >
                            Ja
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.feedbackButton,
                            hasFeedback && styles.feedbackButtonDisabled,
                          ]}
                          onPress={() => handleFeedback(item.id, false)}
                          disabled={hasFeedback}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="thumbs-down"
                            size={20}
                            color={
                              hasFeedback ? COLORS.textTertiary : COLORS.error
                            }
                          />
                          <Text
                            style={[
                              styles.feedbackButtonText,
                              hasFeedback && styles.feedbackButtonTextDisabled,
                            ]}
                          >
                            Nein
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Bottom Spacing */}
        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  clearButton: {
    padding: SPACING.xs,
  },

  // Categories
  categoryScroll: {
    flexGrow: 0,
    marginBottom: SPACING.md,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },

  // FAQ List
  faqList: {
    flex: 1,
  },
  faqListContent: {
    paddingHorizontal: SPACING.lg,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },

  // Question
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  questionContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  questionText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    lineHeight: 22,
  },

  // Answer
  answerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  answerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },

  // Feedback
  feedbackContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  feedbackLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    gap: SPACING.xs,
  },
  feedbackButtonDisabled: {
    opacity: 0.5,
  },
  feedbackButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  feedbackButtonTextDisabled: {
    color: COLORS.textTertiary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
