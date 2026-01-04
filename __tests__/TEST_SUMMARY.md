# Nutrition Calculator Test Suite - Summary

## 📊 Test Coverage Overview

**Total Test Cases: 44**
**Target Coverage: 100%** for calculator core logic

## ✅ Test Categories

### 1. BMR Calculations (3 tests)
- ✅ Male user BMR calculation (Mifflin-St Jeor)
- ✅ Female user BMR calculation (Mifflin-St Jeor)
- ✅ Integer rounding validation

**Validation:**
- Male (70kg, 175cm, 30y): `1649 kcal` (±5 kcal)
- Female (60kg, 165cm, 25y): `1345 kcal` (±5 kcal)

### 2. TDEE Calculations (3 tests)
- ✅ Sedentary lifestyle (PAL 1.2)
- ✅ Very active lifestyle (PAL 1.725)
- ✅ Integer rounding validation

**Validation:**
- BMR 1649 × PAL 1.2 = `1979 kcal`
- BMR 1649 × PAL 1.725 = `2844 kcal`

### 3. Goal Adjustments (6 tests)
- ✅ Strength goal: +250 kcal surplus
- ✅ Muscle gain goal: +400 kcal surplus
- ✅ Weight loss goal: -500 kcal deficit
- ✅ Max 25% deficit for low TDEE users
- ✅ Endurance goal: +100 kcal slight surplus
- ✅ General fitness adaptive adjustment

**Validation:**
| Goal | Adjustment | Weekly Change |
|------|-----------|---------------|
| Strength | +250 kcal | +0.1 kg |
| Muscle Gain | +400 kcal | +0.35 kg |
| Weight Loss | -500 kcal | -0.5 kg |
| Endurance | +100 kcal | 0 kg |
| General Fitness | 0 or -300 kcal | 0 or -0.2 kg |

### 4. Protein Calculations (3 tests)
- ✅ Weight loss > Muscle gain protein
- ✅ Protein in grams calculation
- ✅ Lower protein for endurance

**Protein Targets:**
| Goal | Protein (g/kg) |
|------|---------------|
| Weight Loss | 2.2 |
| Muscle Gain | 2.0 |
| Strength | 1.9 |
| General Fitness | 1.7 |
| Endurance | 1.5 |

### 5. Conflict Detection (5 tests)
- ✅ Weight loss + higher target weight
- ✅ Muscle gain + lower target weight
- ✅ Body recomposition adjustment
- ✅ Strength + significant weight loss
- ✅ No conflict when aligned

**Conflict Scenarios:**
1. **Muscle Gain + Weight Loss**
   - Adjusts to: -200 kcal deficit, 2.2 g/kg protein
   - Strategy: Body recomposition

2. **Weight Loss + Gain Target**
   - Flags: Goal/target mismatch
   - Recommendation: Adjust goal or target

3. **Strength + Large Loss**
   - Adjusts to: -300 kcal (moderate)
   - Warning: Kraft preservation

### 6. Timeline Validation (5 tests)
- ✅ Realistic timeline (5kg = 10 weeks)
- ✅ Too aggressive warning (>1 kg/week)
- ✅ Past date warning
- ✅ Too slow warning (<0.1 kg/week)
- ✅ Estimated date calculation

**Timeline Rules:**
- **Healthy rate**: 0.5 kg/week
- **Maximum**: 1.0 kg/week
- **Minimum**: 0.1 kg/week (for motivation)

### 7. Macro Distribution (4 tests)
- ✅ Macros sum to target calories (±10 kcal)
- ✅ Fat is 25-30% of calories
- ✅ Higher carbs for endurance
- ✅ Integer values for grams

**Macro Rules:**
- **Protein**: Goal-specific (1.5-2.2 g/kg)
- **Fat**: 27% of calories (25-30% range)
- **Carbs**: Remaining calories
- **Endurance exception**: 55% carbs

### 8. Calculation Method (4 tests)
- ✅ Complete method generation
- ✅ Actual values in BMR string
- ✅ DOI links in sources
- ✅ Goal adjustment type identification

**Calculation Method Fields:**
```typescript
{
  bmrFormula: 'mifflin_st_jeor',
  bmrCalculation: '(10 × 70kg) + (6.25 × 175cm) - (5 × 30) + 5 = 1.649 kcal',
  palFactor: 1.55,
  palDescription: 'Moderat aktiv (3-5 Tage Sport/Woche)',
  goalAdjustment: {
    type: 'deficit' | 'surplus' | 'maintenance',
    amount: -500,
    reason: 'Moderates Defizit für nachhaltigen Fettabbau...'
  },
  proteinRationale: '2.2 g/kg - Erhöht für Muskelerhalt...',
  sources: {
    formula: 'https://doi.org/10.1093/ajcn/51.2.241',
    goalRecommendation: 'https://doi.org/10.1111/sms.14075',
    proteinRecommendation: 'https://doi.org/10.1097/MCO.0000000000000980'
  }
}
```

### 9. Edge Cases (6 tests)
- ✅ Very young user (18 years)
- ✅ Elderly user (80 years)
- ✅ Very low weight (45 kg)
- ✅ Very high weight (150 kg)
- ✅ Extreme PAL (1.9)
- ✅ Missing optional fields

**Edge Case Validation:**
| Case | Validation |
|------|-----------|
| Age 18 | Valid BMR, TDEE, targets |
| Age 80 | Valid BMR, TDEE, targets |
| 45 kg | Min 1200 kcal target |
| 150 kg | Standard -500 deficit |
| PAL 1.9 | TDEE = BMR × 1.85-1.95 |
| Missing fields | Graceful handling |

### 10. Integration Tests (4 tests)
- ✅ Complete calculation flow
- ✅ Conflicting goals handling
- ✅ Consistency across calculations
- ✅ Different results for goals

**Integration Validation:**
- All fields populated
- Conflicts handled gracefully
- Deterministic results
- Goal-specific variations

## 🎯 Scientific Foundation

All calculations are based on peer-reviewed research:

1. **Mifflin-St Jeor Equation** (BMR)
   - DOI: [10.1093/ajcn/51.2.241](https://doi.org/10.1093/ajcn/51.2.241)
   - Most accurate for modern populations

2. **Sports Medicine Review** (Deficit Limits)
   - DOI: [10.1111/sms.14075](https://doi.org/10.1111/sms.14075)
   - Max deficit recommendations

3. **Clinical Nutrition Review** (Protein in Deficit)
   - DOI: [10.1097/MCO.0000000000000980](https://doi.org/10.1097/MCO.0000000000000980)
   - High protein for muscle preservation

4. **ISSN Position Stand** (Protein Requirements)
   - DOI: [10.1186/s12970-017-0177-8](https://doi.org/10.1186/s12970-017-0177-8)
   - Sport-specific protein targets

5. **ACSM Guidelines** (Macro Distribution)
   - DOI: [10.1249/MSS.0000000000000852](https://doi.org/10.1249/MSS.0000000000000852)
   - Macronutrient recommendations

## 📈 Coverage Metrics

### Target Coverage
```
File: nutrition-calculator.service.ts
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%
```

### Tested Functions
- ✅ `calculate()` - Main orchestration
- ✅ `calculateBMR()` - Mifflin-St Jeor
- ✅ `calculateTDEE()` - PAL application
- ✅ `getGoalSettings()` - Goal-specific adjustments
- ✅ `detectConflicts()` - Conflict analysis
- ✅ `calculateProgression()` - Timeline validation
- ✅ `calculateMacros()` - Macro distribution
- ✅ `generateCalculationMethod()` - Transparency
- ✅ `generateRecommendations()` - Personalization

## 🚀 Running Tests

### Quick Test
```bash
npm run test:nutrition
```

### Full Suite
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## 📝 Test Output Example

```
PASS  __tests__/nutrition-calculator.test.ts (2.134 s)
  NutritionCalculatorService
    BMR Calculations
      ✓ should calculate BMR correctly for male user (3 ms)
      ✓ should calculate BMR correctly for female user (1 ms)
      ✓ should round BMR to nearest integer (1 ms)
    TDEE Calculations
      ✓ should calculate TDEE with sedentary lifestyle correctly (1 ms)
      ✓ should calculate TDEE with very active lifestyle correctly (1 ms)
      ✓ should round TDEE to nearest integer (1 ms)
    [... 38 more tests ...]

Test Suites: 1 passed, 1 total
Tests:       44 passed, 44 total
Snapshots:   0 total
Time:        2.134 s
Ran all test suites matching /__tests__\/nutrition-calculator.test.ts/i.

---------------------|---------|----------|---------|---------|
File                 | % Stmts | % Branch | % Funcs | % Lines |
---------------------|---------|----------|---------|---------|
All files            |     100 |      100 |     100 |     100 |
 nutrition-calculator|     100 |      100 |     100 |     100 |
---------------------|---------|----------|---------|---------|
```

## ✨ Key Features

1. **Comprehensive Coverage**: All code paths tested
2. **Scientific Accuracy**: Validates against published research
3. **Edge Case Handling**: Tests extreme scenarios
4. **Integration Testing**: Full workflow validation
5. **Conflict Detection**: Validates goal/target mismatches
6. **Timeline Validation**: Ensures realistic expectations
7. **Macro Accuracy**: Verifies calorie/macro alignment

## 📚 Documentation

- [README.md](./README.md) - Detailed test documentation
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [TEST_SUMMARY.md](./TEST_SUMMARY.md) - This file

## 🎉 Summary

✅ **44 test cases** covering all core functionality
✅ **100% code coverage** target for calculator
✅ **Evidence-based validation** with DOI references
✅ **Edge case handling** for robustness
✅ **Integration tests** for full workflow
✅ **CI/CD ready** with coverage reporting
