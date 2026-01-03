# Test Quick Start Guide

## Installation

Install required testing dependencies:

```bash
npm install --save-dev jest @jest/globals ts-jest jest-expo @testing-library/react-native @testing-library/jest-native
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test suite
```bash
npm run test:nutrition
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

Coverage will be available in:
- Terminal output
- `coverage/index.html` (open in browser)

## Expected Output

```
PASS  __tests__/nutrition-calculator.test.ts
  NutritionCalculatorService
    BMR Calculations
      ✓ should calculate BMR correctly for male user (3 ms)
      ✓ should calculate BMR correctly for female user (1 ms)
      ✓ should round BMR to nearest integer (1 ms)
    TDEE Calculations
      ✓ should calculate TDEE with sedentary lifestyle correctly (1 ms)
      ✓ should calculate TDEE with very active lifestyle correctly (1 ms)
      ...

Test Suites: 1 passed, 1 total
Tests:       44 passed, 44 total
Snapshots:   0 total
Time:        2.134 s
Ran all test suites.
```

## Coverage Report

Target coverage: **100%** for calculator core logic

```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
nutrition-calculator   |     100 |      100 |     100 |     100 |
-----------------------|---------|----------|---------|---------|
```

## Test Structure

```
__tests__/
├── nutrition-calculator.test.ts    # 44 test cases
├── setup.ts                         # Jest configuration
├── README.md                        # Detailed documentation
└── QUICKSTART.md                    # This file
```

## Writing New Tests

### Example Test

```typescript
import { describe, it, expect } from '@jest/globals';
import { NutritionCalculatorService } from '../lib/services/nutrition-calculator.service';

describe('New Feature', () => {
  it('should do something', () => {
    const calculator = new NutritionCalculatorService();

    const profile = {
      gender: 'male',
      weight_kg: 75,
      height_cm: 180,
      age: 28,
      pal_factor: 1.55,
      training_goal: 'strength',
    };

    const result = calculator.calculate(profile);

    expect(result.bmr).toBeGreaterThan(0);
  });
});
```

### Using Test Utilities

```typescript
import { createMockProfile, expectWithinTolerance } from './setup';

it('should calculate correctly', () => {
  const profile = createMockProfile({ weight_kg: 70 });
  const result = calculator.calculate(profile);

  // Check within tolerance
  expectWithinTolerance(result.bmr, 1649, 5);
});
```

## Debugging Tests

### Run single test
```bash
npm test -- -t "should calculate BMR correctly for male user"
```

### Debug output
```typescript
it('should do something', () => {
  const result = calculator.calculate(profile);
  console.log('Result:', result); // Will show in test output
  expect(result.bmr).toBeGreaterThan(0);
});
```

### VS Code debugging
1. Set breakpoint in test file
2. Press F5 or use "Debug Jest Tests" launch configuration
3. Inspect variables in debug console

## Common Issues

### Issue: Tests fail with "Cannot find module"
**Solution**: Check `moduleNameMapper` in `jest.config.js`

### Issue: TypeScript errors in tests
**Solution**: Ensure `@types/jest` is installed and tsconfig includes test files

### Issue: Timeout errors
**Solution**: Increase timeout in individual tests:
```typescript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## Next Steps

1. ✅ Run tests: `npm test`
2. ✅ Check coverage: `npm run test:coverage`
3. ✅ Fix any failing tests
4. ✅ Add tests for new features
5. ✅ Maintain 100% coverage for core logic

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
- [Test Coverage Best Practices](https://jestjs.io/docs/configuration#coveragethreshold-object)
