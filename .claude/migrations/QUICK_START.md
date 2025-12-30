# Scoring System Migrations - Quick Start Guide

**TL;DR:** 3 SQL-Dateien in Supabase ausführen, TypeScript Types sind bereits aktualisiert.

---

## 🚀 5-Minuten Setup

### Schritt 1: Backup erstellen (MANDATORY!)

```bash
# In Supabase Dashboard: Settings → Database → Backups
# Oder via CLI:
supabase db dump > backup_$(date +%Y%m%d).sql
```

### Schritt 2: Migrations ausführen

**In Supabase SQL Editor:**

1. **Schema Migration** (5-10 Sekunden)
   ```
   Öffne: add_scoring_fields_to_plan_templates.sql
   → Copy & Paste in SQL Editor
   → RUN
   ✅ Erwarte: "Migration completed successfully!"
   ```

2. **Data Population** (10-20 Sekunden)
   ```
   Öffne: populate_scoring_fields.sql
   → Copy & Paste in SQL Editor
   → RUN
   ✅ Erwarte: Summary mit 7 complete, 11 incomplete templates
   ```

3. **Verification** (2-3 Sekunden)
   ```
   Öffne: verification_queries.sql
   → Führe Query 1 aus (Overview)
   → Führe Query 2 aus (Statistics)
   ✅ Erwarte: 7 templates mit Scoring-Daten
   ```

### Schritt 3: Performance-Test (Optional)

```
Öffne: performance_test_queries.sql
→ Führe TEST 1-4 aus
→ Vergleiche Execution Time
✅ Erwarte: ~80-90% schneller
```

---

## 📁 Dateien Übersicht

| Datei                                      | Zweck                           | Reihenfolge |
| ------------------------------------------ | ------------------------------- | ----------- |
| `add_scoring_fields_to_plan_templates.sql` | Schema-Änderungen + Indexes     | **1**       |
| `populate_scoring_fields.sql`              | Daten berechnen & befüllen      | **2**       |
| `verification_queries.sql`                 | Daten verifizieren              | **3**       |
| `performance_test_queries.sql`             | Performance testen (optional)   | 4           |
| `README.md`                                | Vollständige Dokumentation      | -           |
| `QUICK_START.md`                           | Diese Datei                     | -           |

---

## ✅ Success Checklist

Nach der Migration solltest du sehen:

- [x] **7 complete templates** mit allen Scoring-Feldern
  ```sql
  SELECT COUNT(*) FROM plan_templates WHERE completion_status = 'complete';
  -- Expected: 7
  ```

- [x] **Keine NULL-Werte** bei complete templates
  ```sql
  SELECT COUNT(*) FROM plan_templates
  WHERE completion_status = 'complete'
    AND (estimated_sets_per_week IS NULL OR exercises_per_workout IS NULL);
  -- Expected: 0
  ```

- [x] **8 neue Indexes** erstellt
  ```sql
  SELECT COUNT(*) FROM pg_indexes
  WHERE tablename = 'plan_templates' AND indexname LIKE 'idx_%';
  -- Expected: >= 8
  ```

- [x] **TypeScript kompiliert** ohne Fehler
  ```bash
  cd /Users/tristanzinn/Desktop/App-Entwicklung/lifestyle-app
  npm run type-check
  # Expected: No errors
  ```

---

## 🎯 Erwartete Daten

Nach der Migration sollten diese Templates **vollständig** sein:

| Template                | Level        | Days | Sets/Week | Exercises/Workout |
| ----------------------- | ------------ | ---- | --------- | ----------------- |
| Starting Strength       | beginner     | 3    | ~12       | ~2.7              |
| StrongLifts 5x5         | beginner     | 3    | ~15       | ~2.0              |
| Full Body 3x            | beginner     | 3    | ~18       | ~6.0              |
| PHUL                    | intermediate | 4    | ~22       | ~6.3              |
| Upper/Lower Hypertrophy | intermediate | 4    | ~25       | ~7.3              |
| 5/3/1 Intermediate      | intermediate | 4    | ~20       | ~5.3              |
| PPL 6x Intermediate     | intermediate | 6    | ~24       | ~5.3              |

*(Exakte Werte können leicht abweichen)*

---

## 🚨 Häufige Probleme

### Problem 1: "column already exists"

**Ursache:** Migration wurde bereits ausgeführt

**Lösung:**
```sql
-- Check ob Spalte existiert
SELECT column_name FROM information_schema.columns
WHERE table_name = 'plan_templates' AND column_name = 'estimated_sets_per_week';

-- Falls JA → Skip Migration 1, führe nur Migration 2 aus
```

### Problem 2: Alle Werte sind NULL

**Ursache:** Migration 2 wurde nicht ausgeführt

**Lösung:**
```sql
-- Führe populate_scoring_fields.sql erneut aus
```

### Problem 3: Performance nicht verbessert

**Ursache:** Indexes werden nicht genutzt

**Lösung:**
```sql
-- Re-analyze table
ANALYZE plan_templates;

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE tablename = 'plan_templates';
```

---

## 🔄 Rollback (Notfall)

Falls etwas schief geht:

```sql
-- OPTION 1: Restore from Backup (empfohlen)
-- In Supabase Dashboard → Restore

-- OPTION 2: Manual Rollback
-- Setze Felder auf NULL
UPDATE plan_templates SET
  estimated_sets_per_week = NULL,
  exercises_per_workout = NULL,
  completion_status = NULL,
  scoring_metadata = NULL;

-- Entferne Spalten (nur wenn nötig)
ALTER TABLE plan_templates
DROP COLUMN estimated_sets_per_week,
DROP COLUMN exercises_per_workout,
DROP COLUMN completion_status,
DROP COLUMN scoring_metadata;
```

---

## 🎓 Nächste Schritte

Nach erfolgreicher Migration:

1. **Frontend Integration**
   - TypeScript Types sind bereits aktualisiert
   - Update `trainingService.ts` SELECT queries
   - Nutze `estimated_sets_per_week` im Scoring

2. **Scoring System implementieren**
   - Siehe: `trainingsplan-entscheidungsbaum-optimierung.md`
   - Implementiere Likelihood-Scoring Funktionen
   - Teste mit verschiedenen User-Profilen

3. **Monitoring**
   - Prüfe Query-Performance regelmäßig
   - Update Scoring-Felder wenn neue Übungen hinzugefügt werden

---

## 📞 Support

**Probleme?** Siehe:
- [README.md](./README.md) - Vollständige Dokumentation
- [verification_queries.sql](./verification_queries.sql) - Debugging Queries
- [Rollback-Strategie](./README.md#rollback-strategie)

---

**Status:** ✅ Production Ready
**Risk Level:** LOW (additive changes only)
**Rollback:** Supported
