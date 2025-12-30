# How to Run Tests: Scoring-System

Schnellanleitung für alle Tests des Scoring-Systems.

---

## 🚀 Quick Start

### Alle Tests auf einmal ausführen

```bash
npm run test:all:scoring
```

Dies führt aus:
1. Unit Tests
2. Performance Tests
3. E2E Tests
4. Generiert Test Report

---

## 📋 Einzelne Test-Suites

### 1. Unit Tests

Testet alle Scoring-Funktionen einzeln (67 Tests).

```bash
npm run test:scoring
```

**Was wird getestet:**
- ✅ calculateExperienceMatch
- ✅ calculateFrequencyMatch
- ✅ calculateGoalMatch
- ✅ calculateVolumeMatch
- ✅ adjustScoreByMonths
- ✅ scorePlanTemplate
- ✅ getTopRecommendations
- ✅ Utility Functions

**Erwartete Dauer:** ~2 Sekunden
**Erwartetes Ergebnis:** 67/67 Tests bestanden

---

### 2. E2E Tests (Simplified)

Testet alle 4 Haupt-Szenarien mit Mock-Daten.

```bash
npx tsx scripts/e2e-scoring-test-simple.ts
```

**Was wird getestet:**
- ✅ Anfänger-User (Full Body 3x)
- ✅ Intermediär-User (Upper/Lower Hypertrophy)
- ✅ Advanced-User (5-Tage Strength)
- ✅ Edge-Case (2 Trainingstage)
- ✅ Performance Test (10 concurrent users)

**Erwartete Dauer:** ~1 Sekunde
**Erwartetes Ergebnis:** 4/4 Szenarien PASS, < 1ms avg load time

---

### 3. Performance Tests

Detaillierte Performance-Benchmarks.

```bash
npm run test:scoring:performance
```

**Was wird gemessen:**
- ✅ Single Template Scoring
- ✅ Volume Calculation
- ✅ Batch 10/50 Templates
- ✅ Memory Usage
- ✅ Cache Behavior

**Erwartete Dauer:** ~5 Sekunden
**Erwartetes Ergebnis:** < 1ms per operation

---

### 4. UI Component Tests

Testet React Native UI-Komponenten.

```bash
npm run test:components:scoring
```

**Was wird getestet:**
- ✅ ScoreBreakdownChart
- ✅ PlanRecommendationCard
- ✅ Animations
- ✅ Accessibility

**Erwartete Dauer:** ~3 Sekunden

---

## 🔍 Debugging Tests

### Test mit detailliertem Output

```bash
npm run test:scoring -- --verbose
```

### Einzelnen Test ausführen

```bash
npm run test:scoring -- --testNamePattern="calculateExperienceMatch"
```

### Test Coverage anzeigen

```bash
npm run test:coverage:scoring
```

Dies generiert einen HTML-Report in:
`coverage/lcov-report/index.html`

---

## 📊 Test Reports generieren

### Automatischer Report (empfohlen)

```bash
npm run test:report:scoring
```

Generiert:
- `/.claude/test-reports/scoring-system-e2e-test-report.md` (Detailliert)
- `/.claude/test-reports/SUMMARY.md` (Kurzfassung)
- `/.claude/test-reports/coverage/` (Code Coverage)

### Manueller Report

```bash
npx tsx scripts/e2e-scoring-test-simple.ts > test-output.log
```

---

## 🐛 Troubleshooting

### "Transform failed with 1 error"

**Problem:** tsx kann React Native nicht verarbeiten

**Lösung:** Verwende die "simple" Version:
```bash
npx tsx scripts/e2e-scoring-test-simple.ts
```

Statt:
```bash
npx tsx scripts/e2e-scoring-test.ts  # ❌ Funktioniert nicht mit RN
```

---

### "No tests found"

**Problem:** Test-Dateien wurden nicht erkannt

**Lösung:** Überprüfe, dass Dateien in `__tests__/` liegen:
```
src/utils/__tests__/planRecommendationScoring.test.ts  ✅
src/utils/planRecommendationScoring.test.ts            ❌
```

---

### "Snapshot test failed"

**Problem:** UI hat sich verändert

**Lösung:** Snapshots updaten:
```bash
npm run test:components:scoring -- -u
```

---

## 📦 Dependencies

Stelle sicher, dass folgende Pakete installiert sind:

```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "jest": "^29.0.0",
    "tsx": "^4.0.0"
  }
}
```

Install falls fehlend:
```bash
npm install --save-dev @testing-library/react-native jest tsx
```

---

## 🎯 Continuous Integration

### GitHub Actions Workflow

Erstelle `.github/workflows/test-scoring.yml`:

```yaml
name: Scoring System Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Unit Tests
        run: npm run test:scoring

      - name: Run E2E Tests
        run: npx tsx scripts/e2e-scoring-test-simple.ts

      - name: Upload Test Report
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: .claude/test-reports/
```

---

## 📈 Performance Benchmarking

### Baseline Performance etablieren

```bash
npm run test:scoring:performance -- --baseline
```

Speichert Baseline in `.claude/test-reports/performance-baseline.json`

### Regression Testing

```bash
npm run test:scoring:performance -- --compare
```

Vergleicht gegen Baseline und warnt bei > 10% Degradation.

---

## 🔄 Watch Mode (Development)

Automatisch Tests bei File-Changes ausführen:

```bash
npm run test:scoring:watch
```

**Nützlich während:**
- Bugfixing
- Feature-Development
- Refactoring

---

## 📚 Weitere Ressourcen

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [TypeScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 💬 Support

Bei Problemen:
1. Check [Troubleshooting](#-troubleshooting)
2. GitHub Issues: [Link to Issues]
3. Slack: #lifestyle-app-dev
4. Email: dev-team@lifestyle-app.com

---

**Last Updated:** 29. Dezember 2024
**Maintained by:** Dev Team
