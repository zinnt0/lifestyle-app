/**
 * Nutrition OCR Service
 *
 * Provides on-device text recognition for nutrition labels using ML Kit.
 * Parses recognized text to extract nutritional values (calories, protein, carbs, fat, etc.)
 *
 * Note: This service requires a Development Build (not available in Expo Go).
 */

// Dynamic import for ML Kit (only works in Development Builds)
let TextRecognition: any;
let TextRecognitionScript: any;

try {
  const mlkit = require('@react-native-ml-kit/text-recognition');
  TextRecognition = mlkit.default;
  TextRecognitionScript = mlkit.TextRecognitionScript;
} catch (e) {
  console.log('ML Kit Text Recognition not available (Expo Go mode)');
}

/**
 * Extracted nutrition values from OCR
 */
export interface ExtractedNutritionValues {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  fiber?: number;
  servingSize?: number;
  /** Raw recognized text for debugging */
  rawText?: string;
  /** Confidence indicator */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Patterns for matching nutrition values in German/English labels
 * Each pattern includes variations and the associated field
 *
 * NOTE: German nutrition labels often use tabular format without colons.
 * Common formats:
 * - "Brennwert 1850 kJ / 440 kcal"
 * - "Fett 21 g" or "Fett 21g"
 * - "davon Zucker 23 g"
 * - OCR may insert extra spaces or newlines
 */
const NUTRITION_PATTERNS: Array<{
  field: keyof Omit<ExtractedNutritionValues, 'rawText' | 'confidence'>;
  patterns: RegExp[];
}> = [
  {
    field: 'calories',
    patterns: [
      // Match after kJ value: "1850 kJ / 440 kcal" or "1850kJ/440kcal" (most specific, check first)
      /kj\s*[\/|]\s*(\d+(?:[.,]\d+)?)\s*kcal/i,
      // German: Brennwert, Energie with flexible spacing
      /(?:brennwert|energie|energy)[:\s]+.*?(\d+(?:[.,]\d+)?)\s*kcal/i,
      // Match "440 kcal" or "440kcal" anywhere in text
      /(\d+(?:[.,]\d+)?)\s*kcal/i,
      // Kalorien label
      /kalorien[:\s]+(\d+(?:[.,]\d+)?)/i,
      /calories?[:\s]+(\d+(?:[.,]\d+)?)/i,
    ],
  },
  {
    field: 'protein',
    patterns: [
      // German: Eiweiß, Eiweiss with word boundary
      /\b(?:eiwei(?:ss|ß))\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /\b(?:eiwei(?:ss|ß))[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
      // English: Protein
      /\bprotein\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /\bprotein[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
      // With < or > symbols
      /\b(?:eiwei(?:ss|ß)|protein)\s*[<>]?\s*(\d+(?:[.,]\d+)?)\s*g/i,
    ],
  },
  {
    field: 'carbs',
    patterns: [
      // German: Kohlenhydrate with word boundary
      /\bkohlenhydrate?\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /\bkohlenhydrate?[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
      // English: Carbohydrates, Carbs
      /\bcarbohydrates?\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /\bcarbs?[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
      // With < or > symbols
      /\b(?:kohlenhydrate?|carbohydrates?)\s*[<>]?\s*(\d+(?:[.,]\d+)?)\s*g/i,
    ],
  },
  {
    field: 'fat',
    patterns: [
      // German: Fett - use word boundary to avoid matching "gesättigte Fettsäuren"
      // But exclude "fettsäuren" by checking what follows
      /\bfett\s+(\d+(?:[.,]\d+)?)\s*g(?!esättigte|säuren)/i,
      /\bfett[:\s]+(\d+(?:[.,]\d+)?)\s*g?(?!esättigte|säuren)/i,
      // English: Fat, Total fat
      /\b(?:total\s+)?fat\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /\b(?:total\s+)?fat[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
    ],
  },
  {
    field: 'sugar',
    patterns: [
      // German: "davon Zucker" (most common in German labels)
      /davon\s+zucker\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /davon\s+zucker[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
      // Just "Zucker" with word boundary
      /\bzucker\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /\bzucker[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
      // English: "of which sugars"
      /(?:of\s+which\s+)?sugars?\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /(?:of\s+which\s+)?sugars?[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
    ],
  },
  {
    field: 'fiber',
    patterns: [
      // German: Ballaststoffe with word boundary
      /\bballaststoffe?\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /\bballaststoffe?[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
      // English: Fiber, Fibre
      /\b(?:dietary\s+)?fibre?\s+(\d+(?:[.,]\d+)?)\s*g/i,
      /\b(?:dietary\s+)?fibre?[:\s]+(\d+(?:[.,]\d+)?)\s*g?/i,
    ],
  },
  {
    field: 'servingSize',
    patterns: [
      // German: Portionsgröße, pro X g
      /(?:portions?(?:gr[oö](?:ss|ß)e)?)[:\s]+(\d+(?:[.,]\d+)?)\s*g/i,
      /pro\s+(\d+(?:[.,]\d+)?)\s*g/i,
      // English: Serving size
      /serving(?:\s+size)?[:\s]+(\d+(?:[.,]\d+)?)\s*g/i,
      /(\d+(?:[.,]\d+)?)\s*g\s+(?:portion|serving)/i,
    ],
  },
];

/**
 * Check if ML Kit is available (Development Build only)
 */
export function isOCRAvailable(): boolean {
  return TextRecognition !== undefined;
}

/**
 * Parse a numeric value from a string, handling German notation
 * German uses: 1.234,56 (dot for thousands, comma for decimal)
 * English uses: 1,234.56 (comma for thousands, dot for decimal)
 */
function parseNumericValue(value: string): number {
  let normalized = value.trim();

  // Check if this looks like German format (has comma as decimal separator)
  // German: "1.234,5" or "1,5"
  // English: "1,234.5" or "1.5"
  if (normalized.includes(',')) {
    // If there's both dot and comma, determine format by position
    if (normalized.includes('.')) {
      const dotPos = normalized.lastIndexOf('.');
      const commaPos = normalized.lastIndexOf(',');

      if (commaPos > dotPos) {
        // German format: 1.234,56 - dot is thousands separator, comma is decimal
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } else {
        // English format: 1,234.56 - comma is thousands separator, dot is decimal
        normalized = normalized.replace(/,/g, '');
      }
    } else {
      // Only comma, no dot - assume German decimal: "1,5" -> "1.5"
      normalized = normalized.replace(',', '.');
    }
  }

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Extract nutrition values from recognized text
 */
function extractNutritionFromText(text: string): ExtractedNutritionValues {
  const result: ExtractedNutritionValues = {
    rawText: text,
    confidence: 'low',
  };

  // Normalize text: lowercase, normalize whitespace, but keep some structure
  // Replace multiple spaces/tabs with single space, but keep newlines as spaces
  const normalizedText = text
    .toLowerCase()
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  console.log('[NutritionOCR] Normalized text for parsing:', normalizedText.substring(0, 500));

  let matchCount = 0;

  for (const { field, patterns } of NUTRITION_PATTERNS) {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        const value = parseNumericValue(match[1]);

        // Sanity checks for reasonable values (per 100g)
        // Calories: max ~900 kcal/100g (pure fat is ~900, oils ~884)
        // But allow up to 950 for safety margin
        if (field === 'calories' && (value < 0 || value > 950)) continue;
        // Macros: max 100g per 100g serving (can't have more than 100%)
        if (field !== 'calories' && field !== 'servingSize' && (value < 0 || value > 100)) continue;
        // Serving size: typically 1-500g for most products
        if (field === 'servingSize' && (value < 1 || value > 1000)) continue;

        // Only set if not already set (first match wins)
        if (result[field] === undefined) {
          result[field] = value;
          matchCount++;
          break;
        }
      }
    }
  }

  // Determine confidence based on how many fields were extracted
  if (matchCount >= 4) {
    result.confidence = 'high';
  } else if (matchCount >= 2) {
    result.confidence = 'medium';
  } else {
    result.confidence = 'low';
  }

  return result;
}

/**
 * Perform OCR on an image and extract nutrition values
 *
 * @param imageUri - Local URI of the image to process
 * @returns Extracted nutrition values
 * @throws Error if OCR is not available or processing fails
 */
export async function recognizeNutritionLabel(
  imageUri: string
): Promise<ExtractedNutritionValues> {
  if (!isOCRAvailable()) {
    throw new Error(
      'OCR ist nur im Development Build verfügbar. ' +
      'Bitte verwende die manuelle Eingabe in Expo Go.'
    );
  }

  try {
    console.log('[NutritionOCR] Starting text recognition...');

    // Perform text recognition using Latin script (covers German and English)
    const result = await TextRecognition.recognize(
      imageUri,
      TextRecognitionScript?.LATIN || 0 // 0 is LATIN in older versions
    );

    if (!result || !result.text) {
      console.log('[NutritionOCR] No text recognized');
      return {
        confidence: 'low',
        rawText: '',
      };
    }

    console.log('[NutritionOCR] Recognized text:', result.text.substring(0, 200) + '...');

    // Extract nutrition values from the recognized text
    const extractedValues = extractNutritionFromText(result.text);

    console.log('[NutritionOCR] Extracted values:', {
      calories: extractedValues.calories,
      protein: extractedValues.protein,
      carbs: extractedValues.carbs,
      fat: extractedValues.fat,
      confidence: extractedValues.confidence,
    });

    return extractedValues;
  } catch (error) {
    console.error('[NutritionOCR] Recognition error:', error);
    throw new Error(
      'Fehler bei der Texterkennung. Bitte versuche es erneut oder gib die Werte manuell ein.'
    );
  }
}

/**
 * Format extracted values for display to user
 */
export function formatExtractionSummary(values: ExtractedNutritionValues): string {
  const parts: string[] = [];

  if (values.calories !== undefined) parts.push(`Kalorien: ${values.calories} kcal`);
  if (values.protein !== undefined) parts.push(`Eiweiß: ${values.protein}g`);
  if (values.carbs !== undefined) parts.push(`Kohlenhydrate: ${values.carbs}g`);
  if (values.fat !== undefined) parts.push(`Fett: ${values.fat}g`);
  if (values.sugar !== undefined) parts.push(`Zucker: ${values.sugar}g`);
  if (values.fiber !== undefined) parts.push(`Ballaststoffe: ${values.fiber}g`);

  if (parts.length === 0) {
    return 'Keine Nährwerte erkannt';
  }

  return parts.join('\n');
}
