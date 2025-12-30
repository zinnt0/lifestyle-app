# Test Plan: GuidedPlanFlowScreen mit Scoring-System

**Datum:** 2024-12-29
**Feature:** Recommendations-basierter Guided Plan Flow
**Status:** ✅ Implementiert

## Übersicht

Der GuidedPlanFlowScreen wurde erfolgreich vom Decision-Tree System auf das Scoring-System migriert.

**Alte Implementierung:**
- Binärer Entscheidungsbaum mit festen Pfaden
- Manuelle Fragenlogik
- Eine Empfehlung am Ende

**Neue Implementierung:**
- Scoring-basiertes Empfehlungssystem
- Top 3 Empfehlungen mit Match-Score
- Transparente Reasoning für jede Empfehlung
- Complete/Incomplete Status-Anzeige

## Test-Szenarien

### 1. Anfänger (Beginner) - 3 Tage/Woche

**User-Profil:**
```typescript
{
  fitness_level: 'beginner',
  training_experience_months: 6,
  available_training_days: 3,
  primary_goal: 'general_fitness'
}
```

**Erwartete Top-Empfehlungen:**
1. **Full Body 3x** (Score: ~95-100%)
   - ✅ Complete
   - Reasoning: "Perfekt für dein Trainingslevel", "Passt perfekt zu deinen 3 Trainingstagen"

2. **StrongLifts 5x5** (Score: ~85-95%)
   - ✅ Complete
   - Reasoning: "Gut geeignet für dein Level"

3. **Starting Strength** (Score: ~80-90%)
   - ✅ Complete
   - Für Kraft-fokussierte Anfänger

**Test-Aktionen:**
- [ ] Navigiere zum GuidedPlanFlowScreen
- [ ] Verifiziere: 3 Empfehlungen werden angezeigt
- [ ] Verifiziere: Alle sind als "Complete" markiert
- [ ] Verifiziere: Scores sind sortiert (höchste zuerst)
- [ ] Klicke "Plan erstellen" auf Top-Empfehlung
- [ ] Verifiziere: Plan wird erfolgreich erstellt
- [ ] Verifiziere: Navigation zu TrainingDashboard

---

### 2. Intermediär - 4 Tage/Woche - Kraft & Hypertrophie

**User-Profil:**
```typescript
{
  fitness_level: 'intermediate',
  training_experience_months: 18,
  available_training_days: 4,
  primary_goal: 'both' // strength + hypertrophy
}
```

**Erwartete Top-Empfehlungen:**
1. **PHUL** (Score: ~95-100%)
   - ✅ Complete
   - Reasoning: "Perfekt für dein Trainingsziel", "Passt perfekt zu deinen 4 Trainingstagen"

2. **Upper/Lower Hypertrophy** (Score: ~85-95%)
   - ✅ Complete
   - Gut für Hypertrophie-Fokus

3. **5/3/1 Intermediate** (Score: ~80-90%)
   - ✅ Complete
   - Gut für Kraft-Fokus

**Test-Aktionen:**
- [ ] Navigiere zum GuidedPlanFlowScreen
- [ ] Verifiziere: PHUL ist #1 Empfehlung
- [ ] Verifiziere: Match-Score > 90%
- [ ] Verifiziere: Badge zeigt "OPTIMAL" oder "GOOD"
- [ ] Verifiziere: Reasoning erklärt Passung
- [ ] Test Plan-Erstellung

---

### 3. Advanced - 6 Tage/Woche - Hypertrophie

**User-Profil:**
```typescript
{
  fitness_level: 'advanced',
  training_experience_months: 48,
  available_training_days: 6,
  primary_goal: 'hypertrophy'
}
```

**Erwartete Top-Empfehlungen:**
1. **PPL Advanced Periodized** (Score: ~90-100%)
   - ⚠️ Incomplete (in Entwicklung)
   - Reasoning: "Perfekt für dein Trainingslevel", "Ultimatives Hypertrophieprogramm"

2. **PPL 6x Intermediate** (Score: ~85-95%)
   - ✅ Complete
   - Reasoning: "Gut geeignet", "💡 Empfehlung: Erhöhe das Volumen um 20%"
   - **Volume Modification:** Sollte angezeigt werden!

3. Andere Advanced Programme (incomplete)

**Test-Aktionen:**
- [ ] Navigiere zum GuidedPlanFlowScreen
- [ ] Verifiziere: Incomplete-Warning wird für #1 angezeigt
- [ ] Klicke auf incomplete Plan
- [ ] Verifiziere: Alert "noch in Entwicklung" erscheint
- [ ] Wähle "Trotzdem erstellen"
- [ ] Verifiziere: Plan wird trotzdem erstellt
- [ ] **Wichtig:** Teste Volume Modification Hint für PPL 6x Intermediate

---

### 4. Anfänger - 2 Tage/Woche

**User-Profil:**
```typescript
{
  fitness_level: 'beginner',
  training_experience_months: 2,
  available_training_days: 2,
  primary_goal: 'strength'
}
```

**Erwartete Top-Empfehlungen:**
1. **Minimal Upper/Lower** (Score: ~90-100%)
   - Status: Check ob complete/incomplete
   - Reasoning: "Passt perfekt zu deinen 2 Trainingstagen"

2. Möglicherweise 3-Tage Programme mit niedrigerem Score

**Test-Aktionen:**
- [ ] Navigiere zum GuidedPlanFlowScreen
- [ ] Verifiziere: Empfehlungen für 2 Tage werden bevorzugt
- [ ] Verifiziere: Frequency Score ist hoch für 2-Tage Programme

---

### 5. Edge Case: Keine passenden Templates

**User-Profil:**
```typescript
{
  fitness_level: 'beginner',
  training_experience_months: 1,
  available_training_days: 1, // Unrealistisch
  primary_goal: 'general_fitness'
}
```

**Erwartetes Verhalten:**
- Sollte trotzdem Top 3 Empfehlungen zeigen (beste verfügbare)
- Oder: Alert "Keine Empfehlungen gefunden"

**Test-Aktionen:**
- [ ] Teste mit unrealistischen Profil-Werten
- [ ] Verifiziere: Graceful handling
- [ ] Verifiziere: Keine App-Crashes

---

## Performance Tests

### Loading Time Benchmark

**Ziel:** Recommendations sollten in <1s laden

**Test-Prozedur:**
1. Öffne Chrome DevTools / React Native Debugger
2. Navigiere zum GuidedPlanFlowScreen
3. Messe Zeit von Mount bis setState(recommendations)

**Erwartete Performance:**
- ✅ < 500ms: Excellent
- ✅ 500ms - 1s: Good
- ⚠️ 1s - 2s: Acceptable
- ❌ > 2s: Needs optimization

**Test-Logs:**
```typescript
// In useEffect loadRecommendations:
const startTime = performance.now();
const recs = await trainingService.getRecommendations(user.id, 3);
const endTime = performance.now();
console.log(`[PERF] Recommendations loaded in ${endTime - startTime}ms`);
```

**Erwartete Ausgabe:**
```
[PERF] Recommendations loaded in 234ms
```

---

## UI/UX Tests

### Visual Regression

**Komponenten zu testen:**

1. **Recommendation Card**
   - [ ] Rank Badge (#1, #2, #3) korrekt positioniert
   - [ ] Recommendation Badge (OPTIMAL, GOOD) korrekt gefärbt
   - [ ] Score Display (Match: XX%) lesbar
   - [ ] Complete/Incomplete Status deutlich sichtbar
   - [ ] Reasoning Box übersichtlich formatiert

2. **Loading State**
   - [ ] Spinner zentriert
   - [ ] Text "Suche die besten Pläne..." angezeigt
   - [ ] Kein Flackern beim Laden

3. **Empty State**
   - [ ] Falls keine Recommendations: Klare Fehlermeldung

4. **Responsive Design**
   - [ ] Scrolling funktioniert smooth
   - [ ] Cards passen auf verschiedene Screen-Größen
   - [ ] Text ist lesbar (nicht zu klein)

---

## Integration Tests

### Plan Creation Flow

**End-to-End Test:**
1. User öffnet App
2. Navigiert zu "Neuen Plan erstellen"
3. GuidedPlanFlowScreen lädt Recommendations
4. User sieht Top 3 Empfehlungen
5. User klickt "Plan erstellen" auf #1
6. Plan wird in DB erstellt
7. User wird zu TrainingDashboard navigiert
8. Neuer Plan ist aktiv

**Test-Checkpoints:**
- [ ] Keine Fehler in Console
- [ ] Plan existiert in `training_plans` Tabelle
- [ ] Plan hat `status = 'active'`
- [ ] Plan-Workouts wurden korrekt kopiert
- [ ] Plan-Exercises wurden korrekt kopiert

---

## Regression Tests

### Verifiziere alte Features noch funktionieren

**Kritische Flows:**
1. [ ] TrainingDashboard zeigt aktiven Plan
2. [ ] Workout Session kann gestartet werden
3. [ ] Plan kann gewechselt werden
4. [ ] Plan kann gelöscht werden

---

## Error Handling Tests

### Netzwerk-Fehler

**Szenario 1: Offline beim Laden**
```typescript
// Simulate offline
await supabase.auth.signOut();
// Navigate to GuidedPlanFlowScreen
```

**Erwartetes Verhalten:**
- Alert: "Nicht angemeldet"
- Navigation zurück

**Test:**
- [ ] Keine unhandled exceptions
- [ ] User bekommt klare Fehlermeldung

---

**Szenario 2: Supabase Query Failed**
```typescript
// Mock supabase error
jest.spyOn(supabase, 'from').mockReturnValue({
  select: () => ({ error: new Error('Connection failed') })
});
```

**Erwartetes Verhalten:**
- Alert: "Empfehlungen konnten nicht geladen werden"
- Navigation zurück

**Test:**
- [ ] Error wird geloggt
- [ ] User bekommt Retry-Option

---

## Acceptance Criteria

### ✅ Definition of Done

- [x] GuidedPlanFlowScreen nutzt `trainingService.getRecommendations()`
- [x] Top 3 Empfehlungen werden angezeigt
- [x] Jede Empfehlung zeigt:
  - [x] Rank (#1, #2, #3)
  - [x] Name & Beschreibung
  - [x] Match-Score (0-100%)
  - [x] Complete/Incomplete Status
  - [x] Reasoning (Warum dieser Plan?)
  - [x] Plan-Details (Tage, Ziel, Level)
- [x] Plan-Erstellung funktioniert
- [x] Incomplete Plans zeigen Warning
- [x] Loading States korrekt implementiert
- [x] Error Handling vollständig
- [ ] Performance < 1s
- [ ] Alle Tests bestanden

---

## Nächste Schritte

Nach erfolgreichem Testing:

1. **Phase 2:** Schöne Komponente integrieren
   - Ersetze temporäre Liste-UI durch RecommendationCard Komponente
   - Animationen hinzufügen
   - Swipe-to-dismiss für Empfehlungen

2. **Phase 3:** Erweiterte Features
   - Filter/Sort Optionen
   - "Mehr Empfehlungen laden" Button
   - Vergleichs-Ansicht (Side-by-Side)
   - Favoriten-System

3. **Phase 4:** Analytics
   - Track welche Empfehlungen am häufigsten gewählt werden
   - A/B Testing für Scoring-Weights
   - User-Feedback sammeln

---

## Migration Notes

**Breaking Changes:**
- Alte Decision-Tree Logik komplett entfernt
- Keine Fragen mehr (direkt zu Empfehlungen)
- State-Management vereinfacht

**Backwards Compatibility:**
- Bestehende Pläne nicht betroffen
- Nur Plan-Erstellung Flow ändert sich
- Alle anderen Screens unverändert

**Rollback Plan:**
Falls kritische Bugs auftreten:
```bash
git revert <commit-hash>
# Oder: Feature Flag in .env
ENABLE_SCORING_RECOMMENDATIONS=false
```

---

## Fazit

Der refactored GuidedPlanFlowScreen nutzt jetzt das wissenschaftlich fundierte Scoring-System für bessere, transparentere Empfehlungen. Users sehen nicht nur **eine** Option, sondern die **Top 3** mit klarer Begründung.

**Vorteile:**
✅ Wissenschaftlich fundiert (Evidence-based)
✅ Transparent (User versteht Warum)
✅ Flexibel (Top 3 vs. 1)
✅ Wartbar (Scoring-Logik zentral)
✅ Erweiterbar (Neue Faktoren einfach hinzufügen)

**Bekannte Limitierungen:**
⚠️ Performance hängt von Template-Anzahl ab
⚠️ Viele incomplete Templates (noch in Entwicklung)
⚠️ Volume-Score aktuell nur Schätzung (braucht workout count)
