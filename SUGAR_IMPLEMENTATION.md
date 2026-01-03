# Sugar-Funktionalität Implementierung

## Zusammenfassung der Änderungen

### 1. Datenbank-Migration erforderlich

Die Datei `supabase/migrations/20250103_add_sugar_columns.sql` wurde erstellt und muss in die Datenbank eingespielt werden.

**Auszuführende SQL-Befehle:**

```sql
-- Add sugar column to user_food_diary table
ALTER TABLE user_food_diary
ADD COLUMN IF NOT EXISTS sugar numeric;

COMMENT ON COLUMN user_food_diary.sugar IS 'Sugar content in grams for this diary entry';

-- Add total_sugar column to daily_nutrition_summary table
ALTER TABLE daily_nutrition_summary
ADD COLUMN IF NOT EXISTS total_sugar numeric DEFAULT 0;

COMMENT ON COLUMN daily_nutrition_summary.total_sugar IS 'Total sugar consumed in grams for the day';
```

**So wird die Migration ausgeführt:**

1. Öffne das Supabase Dashboard
2. Gehe zu SQL Editor
3. Führe die obigen SQL-Befehle aus

**ODER:**

```bash
cd lifestyle-app
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 2. Code-Änderungen

#### NutritionDashboardScreen.tsx

- ✅ Sugar zu macros State hinzugefügt: `sugar: {consumed: 0, goal: 50}`
- ✅ Sugar wird aus `summary.micronutrients?.sugar` geladen
- ✅ Sugar Progress Bar mit orangener Farbe (#FF9F0A) hinzugefügt

#### FoodDetailScreen.tsx

- ✅ `calculatedSugar` Variable hinzugefügt für Portionsberechnung
- ✅ Sugar-Zeile in Nährwerttabelle eingefügt: " davon Zucker: X g"

#### add-food-diary Edge Function

- ✅ Sugar wird bei Portionsberechnung berücksichtigt
- ✅ Sugar wird in `user_food_diary` gespeichert

#### get-daily-summary Edge Function

- ✅ Liest bereits `total_sugar` aus `daily_nutrition_summary`
- ✅ Gibt Sugar in `micronutrients.sugar` zurück

### 3. Datenfluss

1. **Lebensmittel hinzufügen:**

   - User wählt Lebensmittel aus (FoodDetailScreen)
   - Sugar wird aus `food_items.sugar_per_100g` berechnet
   - Gespeichert in `user_food_diary.sugar`

2. **Dashboard anzeigen:**
   - getDailySummary Edge Function aggregiert `total_sugar` in `daily_nutrition_summary`
   - Dashboard lädt Sugar aus `summary.micronutrients?.sugar`
   - Zeigt Sugar Progress Bar an

### 4. Nächste Schritte

**WICHTIG:** Führe die Datenbankschritte aus, bevor du die App testest!

Nach der Migration sollten:

- ✅ Sugar-Werte in FoodDetailScreen angezeigt werden
- ✅ Sugar beim Speichern in user_food_diary geschrieben werden
- ✅ Sugar im Dashboard korrekt geladen und angezeigt werden

### 5. Trigger für daily_nutrition_summary Update

Um sicherzustellen, dass `total_sugar` automatisch aktualisiert wird, könnte ein Database Trigger hilfreich sein:

```sql
-- Optional: Trigger um daily_nutrition_summary automatisch zu aktualisieren
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_nutrition_summary (
        user_id,
        summary_date,
        total_calories,
        total_protein,
        total_carbs,
        total_fat,
        total_fiber,
        total_sugar
    )
    SELECT
        user_id,
        meal_date,
        COALESCE(SUM(calories), 0),
        COALESCE(SUM(protein), 0),
        COALESCE(SUM(carbs), 0),
        COALESCE(SUM(fat), 0),
        COALESCE(SUM(fiber), 0),
        COALESCE(SUM(sugar), 0)
    FROM user_food_diary
    WHERE user_id = NEW.user_id
    AND meal_date = NEW.meal_date
    GROUP BY user_id, meal_date
    ON CONFLICT (user_id, summary_date)
    DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein = EXCLUDED.total_protein,
        total_carbs = EXCLUDED.total_carbs,
        total_fat = EXCLUDED.total_fat,
        total_fiber = EXCLUDED.total_fiber,
        total_sugar = EXCLUDED.total_sugar,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger auf user_food_diary
DROP TRIGGER IF EXISTS trigger_update_daily_nutrition_summary ON user_food_diary;
CREATE TRIGGER trigger_update_daily_nutrition_summary
    AFTER INSERT OR UPDATE OR DELETE ON user_food_diary
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_nutrition_summary();
```
