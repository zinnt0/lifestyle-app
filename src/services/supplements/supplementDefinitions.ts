/**
 * Supplement Definitions Database
 *
 * Based on supplements/Supplement-Empfehlungslogik.md
 * Each supplement has defined conditions, weights, and recommendations
 */

import {
  SupplementDefinition,
  TargetArea,
  SubstanceClass,
  IndicationBasis,
} from './types';

/**
 * Helper function to create a supplement definition
 */
const createSupplement = (
  id: string,
  name: string,
  targetAreas: TargetArea[],
  substanceClass: SubstanceClass,
  indicationBasis: IndicationBasis,
  config: Partial<SupplementDefinition>
): SupplementDefinition => ({
  id,
  name,
  targetAreas,
  substanceClass,
  indicationBasis,
  positiveConditions: [],
  negativeConditions: [],
  additionalQueries: [],
  notes: [],
  contraindications: [],
  ...config,
});

// ============================================================================
// SUPPLEMENT DEFINITIONS
// ============================================================================

export const SUPPLEMENT_DEFINITIONS: SupplementDefinition[] = [
  // -------------------------------------------------------------------------
  // KREATIN VARIANTS
  // -------------------------------------------------------------------------
  createSupplement(
    'kreatin-monohydrat',
    'Kreatin-Monohydrat',
    ['Leistung_Kraft', 'Muskelaufbau_Protein'],
    'Kreatin',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Kraft- oder Muskelaufbau-Ziel',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 4,
          description: 'High Intensity Training',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 3,
          weight: 4,
          description: 'Mindestens 3 Trainingstage pro Woche',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Reines Ausdauerziel ohne Kraftanteil',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'ernaehrungsweise', weight: 5, description: 'Ernaehrungsweise (Kreatin hauptsaechlich in Fleisch/Fisch)' },
        { key: 'lebensmittel_fleisch_fisch', weight: 5, description: 'Konsum von rotem Fleisch und Fisch' },
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen und -intensitaet' },
        { key: 'medizinische_bedingungen_niere', weight: 5, description: 'Nierengesundheit' },
      ],
      notes: ['Bestbelegte Kreatinform mit staerkster Evidenz'],
      contraindications: [],
    }
  ),

  createSupplement(
    'kreatin-hcl',
    'Kreatin-HCl',
    ['Leistung_Kraft', 'Muskelaufbau_Protein'],
    'Kreatin',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Kraft- oder Muskelaufbau-Ziel',
          isPositive: true,
        },
        {
          field: 'supplementProfile.gi_issues',
          operator: 'not_empty',
          value: null,
          weight: 4,
          description: 'GI-Beschwerden (bessere Vertraeglichkeit als Monohydrat)',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'supplementProfile.gi_issues',
          operator: 'eq',
          value: [],
          weight: 3,
          description: 'Keine GI-Beschwerden - Monohydrat bevorzugen',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'gi_beschwerden', weight: 4, description: 'Magen-Darm-Beschwerden' },
        { key: 'medizinische_bedingungen_niere', weight: 5, description: 'Nierengesundheit' },
      ],
      notes: ['Fokus auf Vertraeglichkeit, nicht auf Mehrwirkung', 'Alternative bei Unvertraeglichkeit von Monohydrat'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // PROTEIN SUPPLEMENTS
  // -------------------------------------------------------------------------
  createSupplement(
    'whey-protein',
    'Whey-Protein',
    ['Muskelaufbau_Protein'],
    'Protein',
    'Kombi',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Muskelaufbau-Ziel',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 3,
          weight: 4,
          description: 'Regelmaessiges Training (>= 3 Tage)',
          isPositive: true,
        },
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'weight_loss',
          weight: 5,
          description: 'Abnehmen (Proteinerhalt im Defizit)',
          isPositive: true,
        },
        {
          field: 'nutritionGoals.calorie_status',
          operator: 'eq',
          value: 'deficit',
          weight: 4,
          description: 'Kaloriendefizit - Protein wichtig fuer Muskelerhalt',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'intolerances',
          operator: 'contains',
          value: 'laktose',
          weight: 5,
          description: 'Laktose-Unvertraeglichkeit',
          isPositive: false,
        },
        {
          field: 'intolerances',
          operator: 'contains',
          value: 'milch',
          weight: 5,
          description: 'Milch-Unvertraeglichkeit',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'proteinaufnahme', weight: 5, description: 'Aktuelle Proteinzufuhr' },
        { key: 'lebensmittel_milchprodukte', weight: 5, description: 'Konsum von Milchprodukten' },
        { key: 'kalorienstatus', weight: 4, description: 'Kaloriendefizit/-ueberschuss' },
      ],
      notes: ['Alternative: EAA oder pflanzliches Protein bei Milchunvertraeglichkeit'],
      contraindications: ['laktose', 'milch', 'casein'],
    }
  ),

  createSupplement(
    'casein',
    'Casein',
    ['Muskelaufbau_Protein'],
    'Protein',
    'Kombi',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Muskelaufbau-Ziel',
          isPositive: true,
        },
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 7,
          weight: 4,
          description: 'Weniger als 7 Stunden Schlaf (langsame Proteinfreisetzung fuer Nacht)',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'intolerances',
          operator: 'contains',
          value: 'milch',
          weight: 5,
          description: 'Milch/Casein-Unvertraeglichkeit',
          isPositive: false,
        },
        {
          field: 'intolerances',
          operator: 'contains',
          value: 'casein',
          weight: 5,
          description: 'Casein-Unvertraeglichkeit',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'proteinaufnahme', weight: 5, description: 'Aktuelle Proteinzufuhr' },
        { key: 'lebensmittel_milchprodukte', weight: 5, description: 'Konsum von Milchprodukten' },
      ],
      notes: ['Ideal vor dem Schlafen fuer langanhaltende Aminosaeureversorgung'],
      contraindications: ['milch', 'casein', 'laktose'],
    }
  ),

  createSupplement(
    'eaa',
    'EAA (Essentielle Aminosaeuren)',
    ['Muskelaufbau_Protein'],
    'Protein',
    'Kombi',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Muskelaufbau-Ziel',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsfrequenz',
          isPositive: true,
        },
        {
          field: 'nutritionGoals.calorie_status',
          operator: 'eq',
          value: 'deficit',
          weight: 4,
          description: 'Kaloriendefizit - Lueckenlose Aminosaeureversorgung',
          isPositive: true,
        },
      ],
      negativeConditions: [],
      additionalQueries: [
        { key: 'proteinaufnahme', weight: 5, description: 'Aktuelle Proteinzufuhr' },
        { key: 'kalorienstatus', weight: 4, description: 'Kaloriendefizit/-ueberschuss' },
      ],
      notes: ['Sinnvoll bei geringer Nahrungsaufnahme oder engen Kalorienzielen', 'Laktosefrei'],
      contraindications: [],
    }
  ),

  createSupplement(
    'bcaa',
    'BCAA',
    ['Muskelaufbau_Protein'],
    'Protein',
    'Kombi',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Muskelaufbau-Ziel',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsfrequenz',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'nutritionAverages.protein_consumed',
          operator: 'gte',
          value: 1.6, // g/kg - checked against weight
          weight: 3,
          description: 'Bereits ausreichende Proteinzufuhr - oft redundant',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'proteinaufnahme', weight: 5, description: 'Aktuelle Proteinzufuhr' },
        { key: 'kalorienstatus', weight: 4, description: 'Kaloriendefizit/-ueberschuss' },
      ],
      notes: ['In vielen Faellen redundant gegenueber vollstaendigem Protein (Whey/EAA)'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // PERFORMANCE - STRENGTH
  // -------------------------------------------------------------------------
  createSupplement(
    'citrullin-malat',
    'Citrullin-Malat',
    ['Leistung_Kraft', 'Leistung_Ausdauer'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy', 'endurance'],
          weight: 5,
          description: 'Kraft-, Muskelaufbau- oder Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 4,
          description: 'High Intensity Training',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 2,
          weight: 4,
          description: 'Mindestens 2 Cardio-Einheiten pro Woche',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'low_impact',
          weight: 4,
          description: 'Low Impact Training',
          isPositive: false,
        },
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 4,
          description: 'Geringe Trainingsfrequenz (1-2 Tage)',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen und -intensitaet' },
        { key: 'medizinische_bedingungen_blutdruck', weight: 5, description: 'Blutdruck' },
      ],
      notes: ['Bessere NO-Vorlaeufer-Option als Arginin', 'Foerdert Durchblutung und Pump'],
      contraindications: [],
    }
  ),

  createSupplement(
    'arginin',
    'Arginin',
    ['Leistung_Kraft', 'Leistung_Ausdauer'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy', 'endurance'],
          weight: 5,
          description: 'Kraft-, Muskelaufbau- oder Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 2,
          weight: 4,
          description: 'Cardio-Einheiten >= 2 oder High Intensity Training',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'low_impact',
          weight: 4,
          description: 'Low Impact + geringe Trainingsfrequenz',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
        { key: 'medizinische_bedingungen_blutdruck', weight: 5, description: 'Blutdruck, Herz' },
      ],
      notes: ['Ergogene Effekte inkonsistent; ggf. weniger priorisiert als Citrullin'],
      contraindications: [],
    }
  ),

  createSupplement(
    'betaine',
    'Betain',
    ['Leistung_Kraft'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Kraft-/Muskelaufbau-Ziel',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 3,
          weight: 4,
          description: 'Mindestens 3 Trainingstage',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 4,
          description: 'Sehr niedrige Trainingsfrequenz',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
      ],
      notes: ['Evidenz moderat; sinnvoll als Leistungs-Add-on'],
      contraindications: [],
    }
  ),

  createSupplement(
    'agmatin',
    'Agmatin',
    ['Leistung_Kraft'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Kraft-/Muskelaufbau-Ziel',
          isPositive: true,
        },
        {
          field: 'profile.fitness_level',
          operator: 'in',
          value: ['intermediate', 'advanced'],
          weight: 3,
          description: 'Fortgeschritten/Profi',
          isPositive: true,
        },
        {
          field: 'profile.training_experience_months',
          operator: 'gte',
          value: 12,
          weight: 3,
          description: 'Mindestens 12 Monate Trainingserfahrung',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 4,
          description: 'High Intensity Training',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Ausdauerziel',
          isPositive: false,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'low_impact',
          weight: 5,
          description: 'Low Impact Training',
          isPositive: false,
        },
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 7,
          weight: 4,
          description: 'Weniger als 7 Stunden Schlaf (Stimulanz-aehnliche Effekte)',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
        { key: 'koffeinkonsum', weight: 4, description: 'Koffeinkonsum' },
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
      ],
      notes: ['Evidenz im Sportkontext begrenzt; Empfehlung nur als optionales Add-on'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // PERFORMANCE - ENDURANCE
  // -------------------------------------------------------------------------
  createSupplement(
    'beta-alanin',
    'Beta-Alanin',
    ['Leistung_Ausdauer'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 5,
          description: 'High Intensity (Intervall, HIIT)',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 2,
          weight: 4,
          description: 'Mindestens 2 Cardio-Einheiten',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 3,
          weight: 4,
          description: 'Mindestens 3 Trainingstage',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'low_impact',
          weight: 4,
          description: 'Low Impact + geringe Trainingsfrequenz',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
      ],
      notes: ['Wirkt v.a. bei Belastungen im 1-4 Minuten Bereich', 'Kann Kribbeln verursachen (harmlos)'],
      contraindications: [],
    }
  ),

  createSupplement(
    'koffein',
    'Koffein',
    ['Leistung_Kraft', 'Leistung_Ausdauer', 'Fokus_Kognition'],
    'Sonstiges',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy', 'endurance'],
          weight: 5,
          description: 'Kraft-, Muskelaufbau- oder Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 4,
          description: 'High Intensity Training',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 3,
          weight: 4,
          description: 'Mindestens 3 Trainingstage',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 7,
          weight: 4,
          description: 'Weniger als 7 Stunden Schlaf',
          isPositive: false,
        },
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 7,
          weight: 4,
          description: 'Hohes Stresslevel (>= 7)',
          isPositive: false,
        },
        {
          field: 'dailyAverages.stress_level',
          operator: 'gte',
          value: 7,
          weight: 4,
          description: 'Hohes aktuelles Stresslevel',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'koffeinkonsum', weight: 4, description: 'Aktueller Koffeinkonsum' },
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
        { key: 'medizinische_bedingungen_blutdruck', weight: 5, description: 'Blutdruck, Herz' },
      ],
      notes: ['Einsatz zeitlich steuern (spaet am Tag vermeiden)', 'Toleranzentwicklung beachten'],
      contraindications: [],
    }
  ),

  createSupplement(
    'taurin',
    'Taurin',
    ['Leistung_Ausdauer'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 5,
          description: 'High Intensity Training',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 2,
          weight: 4,
          description: 'Mindestens 2 Cardio-Einheiten',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'low_impact',
          weight: 4,
          description: 'Low Impact + geringe Trainingslast',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
      ],
      notes: ['Potenziell fuer Ermuedungsreduktion'],
      contraindications: [],
    }
  ),

  createSupplement(
    'l-carnitin',
    'L-Carnitin',
    ['Leistung_Ausdauer'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 3,
          weight: 5,
          description: 'Mindestens 3 Cardio-Einheiten',
          isPositive: true,
        },
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'weight_loss',
          weight: 5,
          description: 'Abnehmen (als optionales Add-on)',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Primaeres Ziel Kraft/Muskelaufbau',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
        { key: 'kalorienstatus', weight: 4, description: 'Kaloriendefizit/-ueberschuss' },
      ],
      notes: ['Evidenz gemischt; nicht erste Prioritaet'],
      contraindications: [],
    }
  ),

  createSupplement(
    'nitrat-rote-bete',
    'Nitrat/Rote-Bete-Saft',
    ['Leistung_Ausdauer'],
    'Pflanzenextrakt',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 2,
          weight: 4,
          description: 'Mindestens 2 Cardio-Einheiten',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Reines Kraftziel ohne Ausdaueranteil',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
        { key: 'medizinische_bedingungen_blutdruck', weight: 5, description: 'Blutdruck' },
      ],
      notes: ['Nutzen haeufiger bei Ausdauerleistungen', 'Natuerliche Nitratquelle'],
      contraindications: [],
    }
  ),

  createSupplement(
    'natriumbicarbonat',
    'Natriumbicarbonat',
    ['Leistung_Ausdauer'],
    'Elektrolyt_Buffer_Osmolyte',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 4,
          description: 'High Intensity Training',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 2,
          weight: 4,
          description: 'Mindestens 2 Cardio-Einheiten',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'low_impact',
          weight: 4,
          description: 'Low Impact + geringe Intensitaet',
          isPositive: false,
        },
        {
          field: 'supplementProfile.gi_issues',
          operator: 'not_empty',
          value: null,
          weight: 4,
          description: 'GI-Beschwerden - kann Magen belasten',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'gi_beschwerden', weight: 4, description: 'Magen-Darm-Beschwerden' },
        { key: 'medizinische_bedingungen_blutdruck', weight: 5, description: 'Blutdruck' },
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
      ],
      notes: ['Potenziell Magen-Darm-Belastung', 'Fuer kurze, intensive Belastungen'],
      contraindications: [],
    }
  ),

  createSupplement(
    'cordyceps',
    'Cordyceps',
    ['Leistung_Ausdauer'],
    'Pilz',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 2,
          weight: 5,
          description: 'Mindestens 2 Cardio-Einheiten',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 3,
          weight: 4,
          description: 'Mindestens 3 Trainingstage',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy'],
          weight: 5,
          description: 'Reiner Kraftfokus ohne Ausdaueranteil',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
        { key: 'medizinische_bedingungen_herz', weight: 5, description: 'Herz/Kreislauf' },
      ],
      notes: ['Evidenz heterogen; eher optionales Add-on', 'Traditioneller Vitalpilz'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // HYDRATION & ELEKTROLYTES
  // -------------------------------------------------------------------------
  createSupplement(
    'elektrolyte',
    'Elektrolyte',
    ['Hydration_Elektrolyte', 'Leistung_Ausdauer'],
    'Elektrolyt_Buffer_Osmolyte',
    'Kombi',
    {
      positiveConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsfrequenz (>= 4 Tage)',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 2,
          weight: 4,
          description: 'Mindestens 2 Cardio-Einheiten',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 4,
          description: 'High Intensity Training',
          isPositive: true,
        },
        {
          field: 'supplementProfile.heavy_sweating',
          operator: 'eq',
          value: true,
          weight: 5,
          description: 'Starkes Schwitzen',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 3,
          description: 'Niedrige Trainingslast',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schweissrate', weight: 4, description: 'Schweissrate' },
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
        { key: 'medizinische_bedingungen_blutdruck', weight: 5, description: 'Blutdruck' },
      ],
      notes: ['Besonders relevant bei starkem Schwitzen', 'Natrium, Kalium, Magnesium'],
      contraindications: [],
    }
  ),

  createSupplement(
    'glycerol',
    'Glycerol',
    ['Hydration_Elektrolyte', 'Leistung_Ausdauer'],
    'Elektrolyt_Buffer_Osmolyte',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 3,
          weight: 5,
          description: 'Mindestens 3 Cardio-Einheiten',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsfrequenz',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 3,
          description: 'Geringe Trainingslast',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schweissrate', weight: 4, description: 'Schweissrate' },
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
        { key: 'medizinische_bedingungen_niere', weight: 5, description: 'Niere/Herz' },
      ],
      notes: ['Dient Hyperhydrierung; relevanter bei langen Einheiten'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // SLEEP & STRESS
  // -------------------------------------------------------------------------
  createSupplement(
    'ashwagandha',
    'Ashwagandha',
    ['Schlaf_Stress'],
    'Pflanzenextrakt',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 7,
          weight: 4,
          description: 'Hohes Stresslevel (>= 7)',
          isPositive: true,
        },
        {
          field: 'dailyAverages.stress_level',
          operator: 'gte',
          value: 7,
          weight: 4,
          description: 'Durchschnittlich hohes Stresslevel',
          isPositive: true,
        },
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 7,
          weight: 4,
          description: 'Weniger als 7 Stunden Schlaf',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsbelastung',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.stress_level',
          operator: 'lt',
          value: 5,
          weight: 4,
          description: 'Niedriges Stresslevel - Nutzen begrenzt',
          isPositive: false,
        },
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'gte',
          value: 8,
          weight: 3,
          description: 'Ausreichend Schlaf',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
        { key: 'medizinische_bedingungen_leber', weight: 5, description: 'Leber, Schilddruese' },
        { key: 'menstruation_schwangerschaft', weight: 5, description: 'Schwangerschaft/Stillzeit' },
      ],
      notes: ['Botanikal; bei Unsicherheiten medizinisch abklaeren', 'Adaptogen'],
      contraindications: [],
    }
  ),

  createSupplement(
    'l-theanin',
    'L-Theanin',
    ['Schlaf_Stress', 'Fokus_Kognition'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Erhoehtes Stresslevel (>= 6)',
          isPositive: true,
        },
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 7,
          weight: 4,
          description: 'Weniger als 7 Stunden Schlaf',
          isPositive: true,
        },
        {
          field: 'nutritionAverages.caffeine_mg',
          operator: 'gte',
          value: 200,
          weight: 3,
          description: 'Hoher Koffeinkonsum - L-Theanin als Ausgleich',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.stress_level',
          operator: 'lt',
          value: 4,
          weight: 4,
          description: 'Niedriges Stresslevel',
          isPositive: false,
        },
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'gte',
          value: 8,
          weight: 3,
          description: 'Guter Schlaf',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
        { key: 'koffeinkonsum', weight: 4, description: 'Koffeinkonsum' },
      ],
      notes: ['Geeignet bei Unruhe/Anspannung', 'Gut kombinierbar mit Koffein'],
      contraindications: [],
    }
  ),

  createSupplement(
    'magnesium',
    'Magnesium',
    ['Basis_Mikros', 'Schlaf_Stress'],
    'Mineral_Spurenelement',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 7,
          weight: 4,
          description: 'Weniger als 7 Stunden Schlaf',
          isPositive: true,
        },
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 7,
          weight: 4,
          description: 'Hohes Stresslevel',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsfrequenz',
          isPositive: true,
        },
        {
          field: 'supplementProfile.heavy_sweating',
          operator: 'eq',
          value: true,
          weight: 4,
          description: 'Starkes Schwitzen (Magnesiumverlust)',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.stress_level',
          operator: 'lt',
          value: 4,
          weight: 3,
          description: 'Keine Hinweise auf Erholungsprobleme',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'lebensmittel_nuesse_vollkorn', weight: 5, description: 'Konsum von Nuessen, Vollkorn, Gemuese' },
        { key: 'medizinische_bedingungen_niere', weight: 5, description: 'Nierengesundheit' },
      ],
      notes: ['Relevanz hoeher bei hoher Belastung und Krampfneigung', 'Abends einnehmen fuer besseren Schlaf'],
      contraindications: [],
    }
  ),

  createSupplement(
    'melatonin',
    'Melatonin',
    ['Schlaf_Stress'],
    'Hormon_Signalstoff',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 6,
          weight: 4,
          description: 'Weniger als 6 Stunden Schlaf',
          isPositive: true,
        },
        {
          field: 'dailyAverages.sleep_quality',
          operator: 'lt',
          value: 5,
          weight: 4,
          description: 'Schlechte Schlafqualitaet',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'gte',
          value: 7,
          weight: 4,
          description: 'Ausreichender Schlaf',
          isPositive: false,
        },
        {
          field: 'dailyAverages.sleep_quality',
          operator: 'gte',
          value: 7,
          weight: 3,
          description: 'Gute Schlafqualitaet',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Art der Schlafprobleme' },
        { key: 'menstruation_schwangerschaft', weight: 5, description: 'Schwangerschaft/Stillzeit' },
      ],
      notes: ['Kurzfristig fuer Schlafanpassung, nicht als Dauerloesung', 'Niedrig dosieren (0.5-1mg)'],
      contraindications: [],
    }
  ),

  createSupplement(
    'zma',
    'ZMA (Zink-Magnesium-B6)',
    ['Basis_Mikros', 'Schlaf_Stress'],
    'Mineral_Spurenelement',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 7,
          weight: 4,
          description: 'Weniger als 7 Stunden Schlaf',
          isPositive: true,
        },
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Erhoehtes Stresslevel',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsfrequenz',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'gte',
          value: 8,
          weight: 4,
          description: 'Keine Schlaf-/Stressprobleme',
          isPositive: false,
        },
        {
          field: 'profile.stress_level',
          operator: 'lt',
          value: 4,
          weight: 3,
          description: 'Niedriges Stresslevel',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
        { key: 'lebensmittel_zink_magnesium', weight: 5, description: 'Zink/Magnesium-Quellen' },
      ],
      notes: ['Kombi aus Zink/Magnesium/B6; Mangelabklaerung sinnvoll', 'Abends auf leeren Magen'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // COGNITION & FOCUS
  // -------------------------------------------------------------------------
  createSupplement(
    'acetyl-l-carnitin',
    'Acetyl-L-Carnitin',
    ['Fokus_Kognition'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Hohe mentale Belastung/Stress',
          isPositive: true,
        },
        {
          field: 'dailyAverages.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Anhaltend hohes Stresslevel',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.stress_level',
          operator: 'lt',
          value: 4,
          weight: 3,
          description: 'Kein kognitiver Fokus erforderlich',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
      ],
      notes: ['Evidenz fuer kognitive Effekte gemischt'],
      contraindications: [],
    }
  ),

  createSupplement(
    'lions-mane',
    'Lion\'s Mane (Hericium)',
    ['Fokus_Kognition'],
    'Pilz',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Hohe mentale Belastung/Stress',
          isPositive: true,
        },
        {
          field: 'dailyAverages.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Anhaltend hohes Stresslevel',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.stress_level',
          operator: 'lt',
          value: 4,
          weight: 4,
          description: 'Keine mentale Belastung/kein Fokus auf kognitive Ziele',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
      ],
      notes: ['Evidenz fuer kognitive Effekte gemischt', 'Nervenwachstumsfaktor-Unterstuetzung'],
      contraindications: [],
    }
  ),

  createSupplement(
    'safrannarben-extrakt',
    'Safrannarben-Extrakt',
    ['Schlaf_Stress', 'Fokus_Kognition'],
    'Pflanzenextrakt',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Stresslevel >= 6 oder Mood-Fokus',
          isPositive: true,
        },
        {
          field: 'dailyAverages.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Anhaltendes Stresslevel',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.stress_level',
          operator: 'lt',
          value: 4,
          weight: 4,
          description: 'Keine Stress-/Mood-Probleme',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
      ],
      notes: ['Evidenz fuer Stimmung/Wellbeing; keine klare Sport-Performance-Wirkung'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // REGENERATION & INFLAMMATION
  // -------------------------------------------------------------------------
  createSupplement(
    'omega-3',
    'Omega-3 (EPA/DHA)',
    ['Gesundheit_Immunsystem', 'Regeneration_Entzuendung'],
    'Fettsaeuren_Oel',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 3,
          description: 'Hohe Trainingslast',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 4,
          description: 'High Intensity (Entzuendungs-/Regenerationsthema)',
          isPositive: true,
        },
        {
          field: 'supplementProfile.lab_values.crp',
          operator: 'gt',
          value: 3,
          weight: 5,
          description: 'Erhoehter CRP-Wert (Entzuendungsmarker)',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 3,
          description: 'Niedrige Trainingslast',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'lebensmittel_fisch', weight: 5, description: 'Fischkonsum' },
        { key: 'medizinische_bedingungen_gerinnung', weight: 5, description: 'Blutgerinnung' },
      ],
      notes: ['Ernaehrungsdaten (Fischkonsum) wichtig', 'EPA/DHA-Verhaeltnis beachten'],
      contraindications: [],
    }
  ),

  createSupplement(
    'curcuma',
    'Curcuma (Curcumin)',
    ['Regeneration_Entzuendung'],
    'Pflanzenextrakt',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.age',
          operator: 'gte',
          value: 35,
          weight: 4,
          description: 'Alter >= 35',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsbelastung mit Regenerationsfokus',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 3,
          description: 'Niedrige Trainingslast ohne Regenerationsbedarf',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'medizinische_bedingungen_gallenblase', weight: 5, description: 'Gallenblase, Leber' },
        { key: 'kalorienstatus', weight: 4, description: 'Kaloriendefizit/-ueberschuss' },
      ],
      notes: ['Qualitaet stark variabel; Bioverfuegbarkeit/Enhancer (Piperin) beachten'],
      contraindications: [],
    }
  ),

  createSupplement(
    'glutamin',
    'Glutamin',
    ['Regeneration_Entzuendung', 'Verdauung_Darm'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 5,
          weight: 4,
          description: 'Sehr hohe Trainingsbelastung (>= 5 Tage)',
          isPositive: true,
        },
        {
          field: 'supplementProfile.gi_issues',
          operator: 'not_empty',
          value: null,
          weight: 4,
          description: 'GI-Beschwerden (Darmgesundheit)',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 3,
          weight: 3,
          description: 'Moderate Trainingslast',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
      ],
      notes: ['Evidenz fuer Leistung begrenzt', 'Potenziell hilfreich fuer Darmgesundheit'],
      contraindications: [],
    }
  ),

  createSupplement(
    'nac',
    'N-Acetyl-L-Cystein (NAC)',
    ['Gesundheit_Immunsystem'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingsbelastung mit Regenerationsfokus',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 3,
          description: 'Niedrige Trainingslast ohne Regenerationsbedarf',
          isPositive: false,
        },
      ],
      additionalQueries: [],
      notes: ['Evidenz fuer Performance uneinheitlich; Dosierung beachten', 'Glutathion-Vorstufe'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // JOINTS & CONNECTIVE TISSUE
  // -------------------------------------------------------------------------
  createSupplement(
    'kollagen',
    'Kollagen',
    ['Gelenke_Bindegewebe_Haut'],
    'Protein',
    'Kombi',
    {
      positiveConditions: [
        {
          field: 'profile.age',
          operator: 'gte',
          value: 35,
          weight: 4,
          description: 'Alter >= 35 (Kollagenproduktion sinkt)',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 3,
          description: 'High Impact Training',
          isPositive: true,
        },
        {
          field: 'supplementProfile.joint_issues',
          operator: 'not_empty',
          value: null,
          weight: 5,
          description: 'Gelenkbeschwerden vorhanden',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 3,
          description: 'Hohe Trainingslast',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 3,
          description: 'Niedrige Trainingslast',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'gelenkbeschwerden', weight: 4, description: 'Verletzungen/Gelenkbeschwerden' },
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
        { key: 'proteinaufnahme', weight: 5, description: 'Proteinaufnahme' },
      ],
      notes: ['Besonders fuer Sehnen/Gelenkbelastung relevant', 'Mit Vitamin C einnehmen'],
      contraindications: [],
    }
  ),

  createSupplement(
    'hyaluron',
    'Hyaluronsaeure',
    ['Gelenke_Bindegewebe_Haut'],
    'Sonstiges',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.age',
          operator: 'gte',
          value: 35,
          weight: 4,
          description: 'Alter >= 35',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 3,
          description: 'High Impact Training',
          isPositive: true,
        },
        {
          field: 'supplementProfile.joint_issues',
          operator: 'not_empty',
          value: null,
          weight: 4,
          description: 'Gelenkbeschwerden vorhanden',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'low_impact',
          weight: 4,
          description: 'Niedrige Trainingslast ohne Gelenkbelastung',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'gelenkbeschwerden', weight: 4, description: 'Verletzungen/Gelenkbeschwerden' },
        { key: 'trainingsvolumen', weight: 4, description: 'Trainingsvolumen' },
      ],
      notes: ['Nutzen eher fuer Haut/Gelenke, nicht primaer leistungssteigernd'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // MUSCLE PRESERVATION
  // -------------------------------------------------------------------------
  createSupplement(
    'hmb',
    'HMB (Beta-Hydroxy-Beta-Methylbutyrat)',
    ['Muskelaufbau_Protein'],
    'Aminosaeure_Derivat',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.fitness_level',
          operator: 'eq',
          value: 'beginner',
          weight: 3,
          description: 'Anfaenger',
          isPositive: true,
        },
        {
          field: 'profile.training_experience_months',
          operator: 'lt',
          value: 6,
          weight: 3,
          description: 'Weniger als 6 Monate Trainingserfahrung',
          isPositive: true,
        },
        {
          field: 'profile.age',
          operator: 'gte',
          value: 50,
          weight: 4,
          description: 'Alter >= 50 (Muskelerhalt)',
          isPositive: true,
        },
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'weight_loss',
          weight: 5,
          description: 'Abnehmen mit Muskelmasseerhaltung',
          isPositive: true,
        },
        {
          field: 'nutritionGoals.calorie_status',
          operator: 'eq',
          value: 'deficit',
          weight: 5,
          description: 'Kaloriendefizit',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.fitness_level',
          operator: 'in',
          value: ['intermediate', 'advanced'],
          weight: 3,
          description: 'Fortgeschritten/Profi ohne speziellen Bedarf',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'kalorienstatus', weight: 4, description: 'Kaloriendefizit/-ueberschuss' },
        { key: 'proteinaufnahme', weight: 5, description: 'Proteinaufnahme' },
      ],
      notes: ['Nutzen hoeher bei Trainingsneulingen oder aelteren Personen'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // VITAMINS & MINERALS
  // -------------------------------------------------------------------------
  createSupplement(
    'vitamin-d',
    'Vitamin D',
    ['Basis_Mikros', 'Gesundheit_Immunsystem'],
    'Vitamin',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'profile.age',
          operator: 'gte',
          value: 50,
          weight: 4,
          description: 'Alter >= 50',
          isPositive: true,
        },
        {
          field: 'supplementProfile.sun_exposure_hours',
          operator: 'lt',
          value: 5,
          weight: 4,
          description: 'Weniger als 5 Stunden Sonnenexposition pro Woche',
          isPositive: true,
        },
        {
          field: 'supplementProfile.lab_values.vitamin_d',
          operator: 'lt',
          value: 30,
          weight: 5,
          description: 'Vitamin D-Spiegel unter 30 ng/mL',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'supplementProfile.sun_exposure_hours',
          operator: 'gte',
          value: 15,
          weight: 3,
          description: 'Ausreichende Sonnenexposition',
          isPositive: false,
        },
        {
          field: 'supplementProfile.lab_values.vitamin_d',
          operator: 'gte',
          value: 50,
          weight: 4,
          description: 'Vitamin D-Spiegel im optimalen Bereich',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'sonnenexposition', weight: 4, description: 'Sonnenexposition' },
        { key: 'laborwerte_vitamin_d', weight: 5, description: 'Vitamin D-Laborwert' },
        { key: 'medizinische_bedingungen_knochen', weight: 5, description: 'Knochengesundheit' },
      ],
      notes: ['Bedarf i.d.R. nur bei niedrigen Spiegeln', 'Mit Vitamin K2 kombinieren'],
      contraindications: [],
    }
  ),

  createSupplement(
    'vitamin-k2',
    'Vitamin K2',
    ['Basis_Mikros', 'Gelenke_Bindegewebe_Haut'],
    'Vitamin',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'profile.age',
          operator: 'gte',
          value: 50,
          weight: 4,
          description: 'Alter >= 50',
          isPositive: true,
        },
        {
          field: 'supplementProfile.lab_values.vitamin_d',
          operator: 'lt',
          value: 30,
          weight: 3,
          description: 'Vitamin D wird supplementiert (K2 als Synergie)',
          isPositive: true,
        },
      ],
      negativeConditions: [],
      additionalQueries: [
        { key: 'lebensmittel_gruenes_gemuese', weight: 5, description: 'Gruenes Blattgemuese' },
        { key: 'medizinische_bedingungen_gerinnung', weight: 5, description: 'Blutgerinnung (Antikoagulanzien)' },
      ],
      notes: ['Ernaehrung/Labor sinnvoll', 'Mit Vitamin D kombinieren fuer Knochengesundheit'],
      contraindications: [],
    }
  ),

  createSupplement(
    'vitamin-c',
    'Vitamin C',
    ['Basis_Mikros', 'Gesundheit_Immunsystem'],
    'Vitamin',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 3,
          description: 'Hohe Trainingslast + Erholungsthema',
          isPositive: true,
        },
        {
          field: 'nutritionGoals.calorie_status',
          operator: 'eq',
          value: 'deficit',
          weight: 4,
          description: 'Kaloriendefizit (Mikronährstoffbedarf)',
          isPositive: true,
        },
      ],
      negativeConditions: [],
      additionalQueries: [
        { key: 'lebensmittel_obst_gemuese', weight: 5, description: 'Obst/Gemuese-Konsum' },
        { key: 'kalorienstatus', weight: 4, description: 'Kaloriendefizit/-ueberschuss' },
      ],
      notes: ['Nutzen als Antioxidans, aber nicht primaer leistungssteigernd'],
      contraindications: [],
    }
  ),

  createSupplement(
    'eisen',
    'Eisen',
    ['Basis_Mikros'],
    'Mineral_Spurenelement',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'profile.gender',
          operator: 'eq',
          value: 'female',
          weight: 5,
          description: 'Weiblich (hoehere Eisenverluste)',
          isPositive: true,
        },
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'endurance',
          weight: 5,
          description: 'Ausdauerziel',
          isPositive: true,
        },
        {
          field: 'profile.cardio_per_week',
          operator: 'gte',
          value: 3,
          weight: 4,
          description: 'Mindestens 3 Cardio-Einheiten',
          isPositive: true,
        },
        {
          field: 'supplementProfile.lab_values.hemoglobin',
          operator: 'lt',
          value: 12,
          weight: 5,
          description: 'Niedriger Haemoglobin-Wert (< 12 g/dL)',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.gender',
          operator: 'eq',
          value: 'male',
          weight: 4,
          description: 'Maennlich ohne Mangelhinweise',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'menstruation_schwangerschaft', weight: 5, description: 'Menstruation/Schwangerschaft/Stillzeit' },
        { key: 'lebensmittel_rotes_fleisch', weight: 5, description: 'Rotes Fleisch-Konsum' },
        { key: 'laborwerte_haemoglobin', weight: 5, description: 'Haemoglobin, MCV' },
      ],
      notes: ['Eisenzufuhr sollte idealerweise laborbasiert geprueft werden', 'Nicht auf Verdacht supplementieren'],
      contraindications: [],
    }
  ),

  createSupplement(
    'zink',
    'Zink',
    ['Basis_Mikros', 'Gesundheit_Immunsystem'],
    'Mineral_Spurenelement',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'supplementProfile.heavy_sweating',
          operator: 'eq',
          value: true,
          weight: 4,
          description: 'Starkes Schwitzen (Zinkverlust)',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 5,
          weight: 3,
          description: 'Sehr hohe Trainingsfrequenz',
          isPositive: true,
        },
      ],
      negativeConditions: [],
      additionalQueries: [
        { key: 'lebensmittel_fleisch_meeresfruechte', weight: 5, description: 'Fleisch, Meeresfruechte' },
      ],
      notes: ['Besonders bei hoher Schweissrate relevant', 'Nicht ueberdosieren'],
      contraindications: [],
    }
  ),

  createSupplement(
    'calcium',
    'Calcium',
    ['Basis_Mikros', 'Gelenke_Bindegewebe_Haut'],
    'Mineral_Spurenelement',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'profile.age',
          operator: 'gte',
          value: 50,
          weight: 4,
          description: 'Alter >= 50 (Knochengesundheit)',
          isPositive: true,
        },
        {
          field: 'profile.gender',
          operator: 'eq',
          value: 'female',
          weight: 5,
          description: 'Weiblich + Abnehmen (Knochenbelastung bei Defizit)',
          isPositive: true,
        },
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'weight_loss',
          weight: 4,
          description: 'Abnehmen (Knochenbelastung steigt bei Energiedefizit)',
          isPositive: true,
        },
        {
          field: 'profile.load_preference',
          operator: 'eq',
          value: 'high_intensity',
          weight: 3,
          description: 'High Impact Training',
          isPositive: true,
        },
      ],
      negativeConditions: [],
      additionalQueries: [
        { key: 'lebensmittel_milchprodukte', weight: 5, description: 'Milchprodukte' },
        { key: 'menstruation_schwangerschaft', weight: 5, description: 'Schwangerschaft/Stillzeit' },
        { key: 'medizinische_bedingungen_knochen', weight: 5, description: 'Knochen, Niere' },
      ],
      notes: ['Sinnvoll nur bei vermuteter Unterversorgung', 'Mit Vitamin D einnehmen'],
      contraindications: ['laktose'],
    }
  ),

  createSupplement(
    'multivitamin',
    'Multivitamin',
    ['Basis_Mikros'],
    'Vitamin',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'weight_loss',
          weight: 5,
          description: 'Abnehmen (Kaloriendefizit = Naehrstoffluecken)',
          isPositive: true,
        },
        {
          field: 'nutritionGoals.calorie_status',
          operator: 'eq',
          value: 'deficit',
          weight: 5,
          description: 'Kaloriendefizit',
          isPositive: true,
        },
        {
          field: 'profile.pal_factor',
          operator: 'gte',
          value: 1.6,
          weight: 4,
          description: 'Hohe koerperliche Aktivitaet',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 3,
          description: 'Hohe Trainingslast + unklare Ernaehrung',
          isPositive: true,
        },
      ],
      negativeConditions: [],
      additionalQueries: [
        { key: 'lebensmittel_frequenz', weight: 5, description: 'Allgemeine Ernaehrungsgewohnheiten' },
        { key: 'kalorienstatus', weight: 4, description: 'Kaloriendefizit/-ueberschuss' },
      ],
      notes: ['Ersatz fuer ausgewogene Ernaehrung nicht moeglich', 'Im Defizit als Absicherung sinnvoll'],
      contraindications: [],
    }
  ),

  createSupplement(
    'vitamin-b12',
    'Vitamin B12',
    ['Basis_Mikros'],
    'Vitamin',
    'Ernaehrung_Labor',
    {
      positiveConditions: [
        {
          field: 'profile.age',
          operator: 'gte',
          value: 50,
          weight: 4,
          description: 'Alter >= 50 (Resorption nimmt ab)',
          isPositive: true,
        },
      ],
      negativeConditions: [],
      additionalQueries: [
        { key: 'ernaehrungsweise', weight: 5, description: 'Ernaehrungsweise (vegetarisch/vegan)' },
        { key: 'lebensmittel_tierische_produkte', weight: 5, description: 'Tierische Produkte' },
        { key: 'laborwerte_haemoglobin', weight: 5, description: 'Haemoglobin, MCV' },
      ],
      notes: ['Labor/Ernaehrung notwendig', 'Essentiell bei veganer Ernaehrung'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // GUT HEALTH
  // -------------------------------------------------------------------------
  createSupplement(
    'probiotika',
    'Probiotika',
    ['Verdauung_Darm', 'Gesundheit_Immunsystem'],
    'Probiotikum',
    'Kombi',
    {
      positiveConditions: [
        {
          field: 'supplementProfile.gi_issues',
          operator: 'not_empty',
          value: null,
          weight: 5,
          description: 'GI-Beschwerden vorhanden',
          isPositive: true,
        },
        {
          field: 'intolerances',
          operator: 'not_empty',
          value: null,
          weight: 5,
          description: 'Nahrungsunvertraeglichkeiten',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'supplementProfile.gi_issues',
          operator: 'eq',
          value: [],
          weight: 3,
          description: 'Keine GI-Beschwerden erfasst',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'gi_beschwerden', weight: 4, description: 'Spezifische GI-Beschwerden' },
      ],
      notes: ['Wirksamkeit strainspezifisch; Profil ohne GI-Daten limitiert'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // IMMUNE SYSTEM & HEALTH MUSHROOMS
  // -------------------------------------------------------------------------
  createSupplement(
    'coenzym-q10',
    'Coenzym Q10',
    ['Gesundheit_Immunsystem'],
    'Sonstiges',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 3,
          description: 'Hohe Trainingslast + Erschoepfung/Regenerationsfokus',
          isPositive: true,
        },
        {
          field: 'dailyAverages.energy_level',
          operator: 'lt',
          value: 5,
          weight: 4,
          description: 'Niedrige Energie',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'dailyAverages.energy_level',
          operator: 'gte',
          value: 7,
          weight: 3,
          description: 'Keine Erschoepfung/Regenerationsprobleme',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'medizinische_bedingungen_herz', weight: 5, description: 'Herz/Kreislauf' },
      ],
      notes: ['Evidenz fuer Fatigue-Reduktion vorhanden, Performance-Effekte uneinheitlich'],
      contraindications: [],
    }
  ),

  createSupplement(
    'reishi',
    'Reishi (Ganoderma lucidum)',
    ['Gesundheit_Immunsystem'],
    'Pilz',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 7,
          weight: 4,
          description: 'Hoher Stress + Erschoepfung',
          isPositive: true,
        },
        {
          field: 'dailyAverages.sleep_hours',
          operator: 'lt',
          value: 7,
          weight: 4,
          description: 'Weniger als 7 Stunden Schlaf',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'dailyAverages.energy_level',
          operator: 'gte',
          value: 7,
          weight: 3,
          description: 'Keine Erschoepfung/Regenerationsprobleme',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
      ],
      notes: ['Evidenz fuer Sportperformance begrenzt', 'Immunmodulierend'],
      contraindications: [],
    }
  ),

  createSupplement(
    'chaga',
    'Chaga (Inonotus obliquus)',
    ['Gesundheit_Immunsystem'],
    'Pilz',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'general_fitness',
          weight: 5,
          description: 'Allgemeine Fitness mit Antioxidansfokus',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'in',
          value: ['strength', 'hypertrophy', 'endurance'],
          weight: 3,
          description: 'Reiner Performance-Fokus ohne Gesundheitsziel',
          isPositive: false,
        },
      ],
      additionalQueries: [],
      notes: ['Evidenz fuer Leistungssteigerung beim Menschen sehr begrenzt'],
      contraindications: [],
    }
  ),

  createSupplement(
    'opc-traubenkernextrakt',
    'OPC (Traubenkernextrakt)',
    ['Gesundheit_Immunsystem', 'Regeneration_Entzuendung'],
    'Pflanzenextrakt',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'general_fitness',
          weight: 5,
          description: 'Allgemeine Fitness + hohe Trainingslast',
          isPositive: true,
        },
        {
          field: 'profile.available_training_days',
          operator: 'gte',
          value: 4,
          weight: 4,
          description: 'Hohe Trainingslast',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 3,
          description: 'Niedrige Trainingslast',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'medizinische_bedingungen_blutdruck', weight: 5, description: 'Blutdruck, Gerinnung' },
      ],
      notes: ['Evidenz fuer Health-Claims begrenzt; optionales Add-on', 'Antioxidativ'],
      contraindications: [],
    }
  ),

  createSupplement(
    'schwarzkummeloel',
    'Schwarzkuemmeloel',
    ['Gesundheit_Immunsystem', 'Regeneration_Entzuendung'],
    'Fettsaeuren_Oel',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'general_fitness',
          weight: 5,
          description: 'Allgemeine Fitness',
          isPositive: true,
        },
        {
          field: 'profile.primary_goal',
          operator: 'eq',
          value: 'weight_loss',
          weight: 5,
          description: 'Abnehmen (optional)',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'profile.available_training_days',
          operator: 'lte',
          value: 2,
          weight: 3,
          description: 'Niedrige Trainingslast ohne Gesundheitsfokus',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'medizinische_bedingungen_blutdruck', weight: 5, description: 'Blutdruck, Blutzucker' },
      ],
      notes: ['Evidenz heterogen; optionales Add-on'],
      contraindications: [],
    }
  ),

  createSupplement(
    'shilajit',
    'Shilajit',
    ['Leistung_Kraft', 'Gesundheit_Immunsystem'],
    'Pflanzenextrakt',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.stress_level',
          operator: 'gte',
          value: 6,
          weight: 4,
          description: 'Hoher Stress + subjektive Erschoepfung',
          isPositive: true,
        },
        {
          field: 'dailyAverages.energy_level',
          operator: 'lt',
          value: 5,
          weight: 4,
          description: 'Niedrige Energie',
          isPositive: true,
        },
      ],
      negativeConditions: [
        {
          field: 'dailyAverages.energy_level',
          operator: 'gte',
          value: 7,
          weight: 3,
          description: 'Keine Erschoepfung',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'schlafprobleme', weight: 4, description: 'Schlafprobleme' },
        { key: 'laborwerte_testosteron', weight: 4, description: 'Testosteron' },
      ],
      notes: ['Evidenz begrenzt; Qualitaetssicherung wichtig'],
      contraindications: [],
    }
  ),

  // -------------------------------------------------------------------------
  // WOMEN'S HEALTH
  // -------------------------------------------------------------------------
  createSupplement(
    'moenchspfeffer-extrakt',
    'Moenchspfeffer-Extrakt (Vitex)',
    ['Hormon_Zyklus'],
    'Pflanzenextrakt',
    'Profil',
    {
      positiveConditions: [
        {
          field: 'profile.gender',
          operator: 'eq',
          value: 'female',
          weight: 5,
          description: 'Weiblich',
          isPositive: true,
        },
        // Note: PMS-specific conditions would need additional data
      ],
      negativeConditions: [
        {
          field: 'profile.gender',
          operator: 'neq',
          value: 'female',
          weight: 5,
          description: 'Nicht weiblich - nicht relevant',
          isPositive: false,
        },
      ],
      additionalQueries: [
        { key: 'menstruation_schwangerschaft', weight: 5, description: 'Menstruation/Schwangerschaft/Stillzeit' },
        { key: 'laborwerte_oestradiol', weight: 4, description: 'Oestradiol' },
      ],
      notes: ['Pflanzlicher Extrakt; moegliche Wechselwirkungen mit hormonellen Therapien'],
      contraindications: [],
    }
  ),
];

/**
 * Get supplement by ID
 */
export const getSupplementById = (id: string): SupplementDefinition | undefined => {
  return SUPPLEMENT_DEFINITIONS.find((s) => s.id === id);
};

/**
 * Get supplements by target area
 */
export const getSupplementsByTargetArea = (targetArea: TargetArea): SupplementDefinition[] => {
  return SUPPLEMENT_DEFINITIONS.filter((s) => s.targetAreas.includes(targetArea));
};

/**
 * Get supplements by substance class
 */
export const getSupplementsBySubstanceClass = (substanceClass: SubstanceClass): SupplementDefinition[] => {
  return SUPPLEMENT_DEFINITIONS.filter((s) => s.substanceClass === substanceClass);
};

/**
 * Get supplements by indication basis
 */
export const getSupplementsByIndicationBasis = (basis: IndicationBasis): SupplementDefinition[] => {
  return SUPPLEMENT_DEFINITIONS.filter((s) => s.indicationBasis === basis);
};
