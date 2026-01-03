# Nutrition Calculator Tests

Comprehensive test suite for the evidence-based nutrition calculation service.

## Test Coverage

### 1. BMR Calculations ✅
- Male user BMR calculation (Mifflin-St Jeor)
- Female user BMR calculation (Mifflin-St Jeor)
- Integer rounding validation

**Expected Values:**
- Male (70kg, 175cm, 30y): **1649 kcal** (±5 kcal tolerance)
- Female (60kg, 165cm, 25y): **1345 kcal** (±5 kcal tolerance)

### 2. TDEE Calculations ✅
- Sedentary lifestyle (PAL 1.2)
- Very active lifestyle (PAL 1.725)
- Integer rounding validation

**Expected Values:**
- BMR 1649 × PAL 1.2 = **1979 kcal**
- BMR 1649 × PAL 1.725 = **2844 kcal**

### 3. Goal Adjustments ✅
- **Strength**: +250 kcal surplus
- **Muscle Gain**: +400 kcal surplus
- **Weight Loss**: -500 kcal deficit (or max 25% of TDEE)
- **Endurance**: +100 kcal slight surplus
- **General Fitness**: Adaptive based on body fat percentage

### 4. Protein Calculations ✅
- Weight loss: **2.2 g/kg** (highest for muscle preservation)
- Muscle gain: **2.0 g/kg**
- Strength: **1.9 g/kg**
- Endurance: **1.5 g/kg** (lowest)
- General fitness: **1.7 g/kg**

### 5. Conflict Detection ✅
- Weight loss goal + higher target weight
- Muscle gain + lower target weight (→ body recomposition)
- Strength training + significant weight loss (>10kg)
- Proper recommendations for conflicts

### 6. Timeline Validation ✅
- Realistic timeline calculation (5kg loss = 10 weeks @ -0.5kg/week)
- Warning for aggressive goals (>1kg/week)
- Warning for past target dates
- Warning for very slow progress (<0.1kg/week)

### 7. Macro Distribution ✅
- Macros sum to target calories (±10 kcal tolerance)
- Fat is 25-30% of calories (target: 27%)
- Higher carbs for endurance athletes
- Integer values for all macro grams

### 8. Calculation Method Generation ✅
- Complete calculation method with all fields:
  - `bmrFormula`: "mifflin_st_jeor"
  - `bmrCalculation`: String with actual values
  - `palFactor` and `palDescription`
  - `goalAdjustment` with type, amount, reason
  - `proteinRationale`
  - `sources` with DOI links

### 9. Edge Cases ✅
- Very young user (18 years)
- Elderly user (80 years)
- Very low weight (45kg)
- Very high weight (150kg)
- Extreme PAL (1.9 - athlete training 2x/day)
- Missing optional fields

### 10. Integration Tests ✅
- Complete calculation flow
- Conflicting goals handling
- Consistency across multiple calculations
- Different results for different training goals

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- __tests__/nutrition-calculator.test.ts
```

### Run with coverage
```bash
npm run test:coverage
```

### Run in watch mode
```bash
npm run test:watch
```

## Test Structure

```
__tests__/
├── nutrition-calculator.test.ts  # Main calculator tests
└── README.md                      # This file
```

## Scientific References

All calculations are based on peer-reviewed research:

1. **BMR Formula**: Mifflin-St Jeor Equation
   - DOI: [10.1093/ajcn/51.2.241](https://doi.org/10.1093/ajcn/51.2.241)

2. **Deficit Limits**: Sports Medicine Review
   - DOI: [10.1111/sms.14075](https://doi.org/10.1111/sms.14075)

3. **Protein in Deficit**: Clinical Nutrition Review
   - DOI: [10.1097/MCO.0000000000000980](https://doi.org/10.1097/MCO.0000000000000980)

4. **Protein Requirements**: ISSN Position Stand
   - DOI: [10.1186/s12970-017-0177-8](https://doi.org/10.1186/s12970-017-0177-8)

5. **Macro Distribution**: ACSM Guidelines
   - DOI: [10.1249/MSS.0000000000000852](https://doi.org/10.1249/MSS.0000000000000852)

## Expected Test Output

```
PASS  __tests__/nutrition-calculator.test.ts
  NutritionCalculatorService
    BMR Calculations
      ✓ should calculate BMR correctly for male user
      ✓ should calculate BMR correctly for female user
      ✓ should round BMR to nearest integer
    TDEE Calculations
      ✓ should calculate TDEE with sedentary lifestyle correctly
      ✓ should calculate TDEE with very active lifestyle correctly
      ✓ should round TDEE to nearest integer
    Goal Adjustments
      ✓ should apply correct surplus for strength goal
      ✓ should apply correct surplus for muscle gain goal
      ✓ should apply correct deficit for weight loss goal
      ✓ should limit deficit to max 25% of TDEE for low TDEE users
      ✓ should apply maintenance for endurance with slight surplus
      ✓ should adapt general fitness goal based on body fat percentage
    Protein Calculations
      ✓ should calculate higher protein for weight loss than muscle gain
      ✓ should calculate protein in grams correctly
      ✓ should use lower protein for endurance athletes
    Conflict Detection
      ✓ should detect conflict: weight loss goal with higher target weight
      ✓ should detect conflict: muscle gain with lower target weight
      ✓ should adjust to body recomposition for muscle gain + weight loss conflict
      ✓ should detect conflict: strength training with significant weight loss
      ✓ should NOT detect conflict when goal and target align
    Target Weight Timeline Validation
      ✓ should calculate realistic timeline for 5kg loss
      ✓ should warn about too aggressive weight loss goal
      ✓ should warn if target date is in the past
      ✓ should warn about too slow progress for weight loss
      ✓ should calculate estimated target date correctly
    Macro Distribution Validation
      ✓ should ensure macros sum to total calories within tolerance
      ✓ should ensure fat is 25-30% of calories
      ✓ should calculate higher carbs for endurance athletes
      ✓ should return integer values for all macro grams
    Calculation Method Generation
      ✓ should generate complete calculation method with all fields
      ✓ should include actual values in BMR calculation string
      ✓ should include DOI links in sources
      ✓ should correctly identify goal adjustment type
    Edge Cases
      ✓ should handle very young user (18)
      ✓ should handle elderly user (80)
      ✓ should handle very low weight user (45kg)
      ✓ should handle very high weight user (150kg)
      ✓ should handle extremely high PAL (1.9)
      ✓ should handle missing optional fields gracefully
    Integration Tests
      ✓ should perform complete calculation flow without errors
      ✓ should handle conflicting goals and still produce valid output
      ✓ should maintain consistency across multiple calculations
      ✓ should produce different results for different training goals

Test Suites: 1 passed, 1 total
Tests:       44 passed, 44 total
Snapshots:   0 total
Time:        2.134s
```

## Coverage Goals

Target: **100% coverage** for calculator core logic

- ✅ All calculation methods
- ✅ All goal types
- ✅ All conflict scenarios
- ✅ All edge cases
- ✅ Integration flows

## Notes

- Tests use tolerance ranges (±5 kcal) for BMR/TDEE calculations due to rounding
- All macros must sum to target calories within ±10 kcal tolerance
- Fat percentage must be 25-30% of total calories
- Protein calculations are goal-specific and weight-based
- Conflict detection includes automatic adjustment suggestions
