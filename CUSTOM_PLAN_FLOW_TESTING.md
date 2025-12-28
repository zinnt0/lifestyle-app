# Custom Plan Flow Testing Guide

## Übersicht

Der CustomPlanFlowScreen ermöglicht es Nutzern, vollständig individuelle Trainingspläne zu erstellen durch einen geführten 5-Schritt-Prozess.

## Implementierte Features

### ✅ Step 1: Trainingstage auswählen
- **Feature**: Auswahl von 2-6 Trainingstagen pro Woche
- **UI**: Große tappbare Cards mit Checkmark bei Auswahl
- **Validierung**: Mindestens 1 Tag muss ausgewählt werden
- **Haptic Feedback**: Light Impact bei Selektion

### ✅ Step 2: Muskelgruppen auswählen
- **Feature**: Multi-Select von 6 Muskelgruppen (Brust, Rücken, Schultern, Arme, Beine, Rumpf)
- **UI**: 2-spaltige Grid mit Icons und Namen
- **Validierung**: Mindestens 1 Muskelgruppe erforderlich
- **Haptic Feedback**: Light Impact bei Toggle

### ✅ Step 3: Übungen auswählen pro Muskelgruppe
- **Feature**:
  - Schrittweise durch alle ausgewählten Muskelgruppen
  - Equipment Filter (Barbell, Dumbbell, Cable, Bodyweight)
  - Multi-Select von Übungen
  - Anzeige: Übungsname + Equipment
- **UI**:
  - Fortschrittsanzeige (z.B. "Muskelgruppe 2 von 4")
  - Scrollbare Liste mit Cards
  - Filter-Chips oben
  - Zähler unten: "X Übung(en) ausgewählt"
- **Validierung**: Mindestens 1 Übung pro Muskelgruppe
- **Datenladung**: Automatisches Laden von Übungen aus Supabase via `.contains("primary_muscles", [muscleGroup.name])`

### ✅ Step 4: Sets & Reps konfigurieren
- **Feature**:
  - Für jede ausgewählte Übung: Sets, Reps Min, Reps Max
  - Plus/Minus Buttons zum Anpassen
  - Standard-Werte: 3 Sets, 8-12 Reps
- **UI**:
  - Scrollbare Liste aller Übungen
  - Jede Card zeigt: Name, Muskelgruppe, 3 Number Inputs
- **Validierung**:
  - Sets: 1-10
  - Reps Min: >= 1, <= Reps Max
  - Reps Max: >= Reps Min, <= 50

### ✅ Step 5: Preview & Plan erstellen
- **Feature**:
  - Eingabefeld für Plan-Name
  - Übersicht: Trainingstage, Muskelgruppen, Übungen gesamt, Übungen pro Workout
  - Detaillierte Muskelgruppen-Liste mit Übungsanzahl
- **Plan Creation**:
  - Deaktiviert andere Pläne automatisch
  - Erstellt `training_plan` mit `plan_type: "custom"`
  - Intelligente Verteilung der Übungen auf Workouts:
    - **2-3 Tage**: Full Body Workouts (alle Muskelgruppen pro Tag)
    - **4-6 Tage**: Split Workouts (Muskelgruppen auf Tage verteilt)
  - Erstellt `plan_workouts` mit Namen und Focus
  - Erstellt `plan_exercises` mit konfigurierten Sets/Reps
- **Validierung**: Plan-Name erforderlich
- **Success Handling**: Alert + Navigation zurück zum Dashboard

## Intelligente Workout-Verteilung

### Full Body (2-3 Tage)
```typescript
Beispiel: 3 Tage, Muskelgruppen: Brust, Rücken, Beine
- Workout A: Brust-Übung 1, Rücken-Übung 1, Beine-Übung 1
- Workout B: Brust-Übung 2, Rücken-Übung 2, Beine-Übung 2
- Workout C: Brust-Übung 3, Rücken-Übung 3, Beine-Übung 3
```

### Split (4-6 Tage)
```typescript
Beispiel: 4 Tage, Muskelgruppen: Brust, Rücken, Schultern, Arme, Beine
- Tag 1 (Brust & Rücken): Alle Brust- und Rücken-Übungen
- Tag 2 (Schultern & Arme): Alle Schulter- und Arm-Übungen
- Tag 3 (Beine): Alle Bein-Übungen
- Tag 4 (Brust & Rücken): Falls noch Übungen übrig
```

## Testing Checklist

### ✅ Step 1 - Trainingstage
- [ ] Kann Tage 2-6 auswählen
- [ ] Checkmark erscheint bei Auswahl
- [ ] Selected State (blauer Rahmen + Hintergrund)
- [ ] "Weiter" Button disabled wenn nichts ausgewählt
- [ ] "Weiter" navigiert zu Step 2

### ✅ Step 2 - Muskelgruppen
- [ ] Alle 6 Muskelgruppen werden angezeigt
- [ ] Multi-Select funktioniert (mehrere auswählbar)
- [ ] Checkmark erscheint bei Auswahl
- [ ] "Weiter" Button disabled wenn nichts ausgewählt
- [ ] Alert erscheint wenn "Weiter" ohne Auswahl
- [ ] "Zurück" navigiert zu Step 1

### ✅ Step 3 - Übungen
- [ ] Titel zeigt aktuelle Muskelgruppe (z.B. "Übungen für Brust")
- [ ] Untertitel zeigt Fortschritt (z.B. "Muskelgruppe 1 von 3")
- [ ] Equipment Filter-Chips funktionieren
- [ ] Übungen werden korrekt von Supabase geladen
- [ ] Übungsliste zeigt Name + Equipment
- [ ] Multi-Select funktioniert
- [ ] Zähler zeigt Anzahl ausgewählter Übungen
- [ ] "Weiter" navigiert zur nächsten Muskelgruppe ODER zu Step 4 (wenn letzte)
- [ ] Alert erscheint wenn "Weiter" ohne Auswahl
- [ ] "Zurück" navigiert zur vorherigen Muskelgruppe ODER zu Step 2

### ✅ Step 4 - Konfiguration
- [ ] Alle ausgewählten Übungen werden angezeigt
- [ ] Jede Card zeigt Übungsname + Muskelgruppe
- [ ] Sets: Plus/Minus funktioniert (1-10)
- [ ] Reps Min: Plus/Minus funktioniert, respektiert Reps Max
- [ ] Reps Max: Plus/Minus funktioniert, respektiert Reps Min
- [ ] Standardwerte: 3 Sets, 8 Reps Min, 12 Reps Max
- [ ] "Zurück" navigiert zu Step 3 (letzte Muskelgruppe)
- [ ] "Weiter" navigiert zu Step 5

### ✅ Step 5 - Preview & Erstellen
- [ ] Plan-Name Input funktioniert
- [ ] Übersicht zeigt korrekte Werte:
  - Trainingstage
  - Anzahl Muskelgruppen
  - Anzahl Übungen gesamt
  - Übungen pro Workout (berechnet)
- [ ] Muskelgruppen-Liste zeigt alle ausgewählten Gruppen mit Übungsanzahl
- [ ] "Plan erstellen" disabled wenn Name leer
- [ ] Alert erscheint wenn Name leer
- [ ] Plan wird erfolgreich erstellt in Supabase
- [ ] Andere Pläne werden deaktiviert
- [ ] Workouts werden intelligent verteilt
- [ ] Success Alert erscheint
- [ ] Navigation zurück zum Dashboard
- [ ] "Zurück" navigiert zu Step 4

## Progress Bar

- [ ] Zeigt korrekten Fortschritt:
  - Step 1: 20%
  - Step 2: 40%
  - Step 3: 60%
  - Step 4: 80%
  - Step 5: 100%
- [ ] Text zeigt "Schritt X von 5"

## Error Handling

- [ ] Loading State während Übungen geladen werden
- [ ] Error Alert wenn Übungen nicht geladen werden können
- [ ] Error Alert wenn Plan nicht erstellt werden kann
- [ ] Alle Supabase Errors werden geloggt

## Navigation

- [ ] "Abbrechen" in Step 1 navigiert zurück
- [ ] "Zurück" Buttons navigieren korrekt
- [ ] "Weiter" Buttons sind disabled wenn Validierung fehlschlägt
- [ ] Erfolgreiche Plan-Erstellung navigiert zum Dashboard

## Haptic Feedback

- [ ] Light Impact bei:
  - Tages-Auswahl
  - Muskelgruppen Toggle
  - Übungen Toggle
- [ ] Success Notification bei erfolgreicher Plan-Erstellung

## Supabase Queries

### Exercises laden:
```sql
SELECT * FROM exercises
WHERE primary_muscles @> ARRAY['Chest']
ORDER BY name_de
```

### Plan erstellen:
```sql
INSERT INTO training_plans (user_id, name, plan_type, days_per_week, status, start_date)
VALUES (?, ?, 'custom', ?, 'active', ?)
```

### Workouts erstellen:
```sql
INSERT INTO plan_workouts (plan_id, name, name_de, day_number, week_number, focus)
VALUES (?, ?, ?, ?, 1, ?)
```

### Exercises erstellen:
```sql
INSERT INTO plan_exercises (workout_id, exercise_id, exercise_order, sets, reps_min, reps_max, is_optional, can_substitute)
VALUES (?, ?, ?, ?, ?, ?, false, true)
```

## Bekannte Einschränkungen

1. **Equipment Filter**: Aktuell nur 4 Equipment-Typen (Barbell, Dumbbell, Cable, Bodyweight)
   - Erweiterbar durch Anpassung des Arrays in Line 416

2. **Workout-Verteilung**: Simple Logik
   - Bei ungleicher Verteilung könnte ein Workout leer bleiben
   - Verbesserung: Intelligentere Verteilung basierend auf Übungsanzahl

3. **Keine Workout-Namen-Eingabe**: Namen werden automatisch generiert
   - Full Body A, B, C oder Tag 1, 2, 3
   - Könnte durch Custom-Input erweitert werden

4. **Keine Übungs-Reihenfolge**: Übungen werden in der Reihenfolge eingefügt wie ausgewählt
   - Könnte durch Drag & Drop erweitert werden

## Mögliche Erweiterungen

1. **Übungs-Details-Modal**: Zeige Übungsbeschreibung, Video, Muskelgruppen
2. **Workout-Vorschau**: Zeige geplante Workouts vor Erstellung
3. **Template speichern**: Ermögliche Speichern als wiederverwendbares Template
4. **Drag & Drop**: Übungsreihenfolge anpassen
5. **Progression**: Automatische Progression (z.B. +2.5kg pro Woche)
6. **RPE Targets**: RPE für jede Übung konfigurieren
7. **Rest Times**: Pausenzeiten konfigurieren
8. **Equipment-Gruppen**: Mehr Equipment-Kategorien (Machines, Kettlebells, etc.)

---

**Erstellt**: 2025-12-28
**Status**: Implementiert ✅
**Datei**: `src/screens/Training/CustomPlanFlowScreen.tsx`
