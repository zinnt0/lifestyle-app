# Dashboard Components

## NutritionOverviewWidget

Ein umfassendes Dashboard-Widget für die Ernährungsübersicht.

### Features

#### 1. Header
- Titel: "Deine Ernährungsziele"
- Icon: 🎯

#### 2. Current Stats (Gradient Card)
- **Ziel-Kalorien**: Anzeige des täglichen Kalorienziels
- **Progress Bar**: Visueller Fortschritt (gegessen / Ziel)
- **Verbleibende Kalorien**: Dynamische Berechnung inkl. verbrannter Kalorien

#### 3. Macros Today
Drei Mini Progress Circles für:
- **Protein** (Grün)
- **Carbs** (Orange)
- **Fett** (Rot)

Jeweils mit:
- Prozentanzeige im Circle
- Gramm consumed / goal
- Prozentsatz in Text

#### 4. Weekly Progress
- **Gewichtsentwicklung**:
  - Startgewicht der Woche
  - Aktuelles Gewicht
  - Änderung (farblich kodiert)
- **Mini Line Chart**: Visualisierung der letzten 7 Tage
- **Status Badge**:
  - ✅ On Track
  - ⚠️ Zu schnell
  - 🐌 Zu langsam

#### 5. Quick Actions
Drei Action-Buttons:
- **Mahlzeit loggen** → Ruft `onQuickAddMeal()` auf
- **Gewicht tracken** → Ruft `onTrackWeight()` auf
- **Kalorien anpassen** → Ruft `onAdjustGoals()` auf

#### 6. Smart Notifications
Dynamische Alerts basierend auf:
- 🔄 Kalorienkalibrierung
- ⚠️ Zu wenig Protein
- 🎉 Wochenziel erreicht

### Datenquellen

Das Widget lädt Daten aus:
- `user_nutrition_goals` - Aktuelle Ernährungsziele
- `daily_nutrition_log` - Via `getDailySummary()` API
- `body_measurements` - Gewichtsentwicklung der letzten 7 Tage
- `water_intake` - Wasserzufuhr (in Summary integriert)

### Verwendung

```tsx
import { NutritionOverviewWidget } from '@/components/dashboard/NutritionOverviewWidget';

function DashboardScreen() {
  const { userId } = useAuth();

  return (
    <ScrollView>
      <NutritionOverviewWidget
        userId={userId}
        onQuickAddMeal={() => navigation.navigate('FoodSearch')}
        onTrackWeight={() => navigation.navigate('WeightTracker')}
        onAdjustGoals={() => navigation.navigate('NutritionGoals')}
      />
    </ScrollView>
  );
}
```

### Props

| Prop | Typ | Beschreibung |
|------|-----|--------------|
| `userId` | `string` | User ID für Datenabruf (required) |
| `onQuickAddMeal` | `() => void` | Callback für "Mahlzeit loggen" Button |
| `onTrackWeight` | `() => void` | Callback für "Gewicht tracken" Button |
| `onAdjustGoals` | `() => void` | Callback für "Kalorien anpassen" Button |

### Loading & Error States

#### Loading State
Zeigt einen Spinner mit Text "Lade Ernährungsdaten..."

#### Error State: No Goals
```
Icon: nutrition-outline
Text: "Noch keine Ernährungsziele gesetzt"
Button: "Jetzt einrichten" → onAdjustGoals()
```

#### Error State: Load Error
```
Icon: alert-circle-outline
Text: "Fehler beim Laden"
Button: "Erneut versuchen" → loadData()
```

### Responsive Layout

- **Mobile**: Komponenten stapeln vertikal
- **Desktop**: Grid-Layout möglich (mit flex-wrap)

### Real-Time Updates

Das Widget lädt Daten:
- Initial beim Mount via `useEffect`
- Kann manuell via `loadData()` aktualisiert werden
- Empfohlen: Pull-to-Refresh im Parent-Screen

### Styling

Nutzt das zentrale Theme-System:
- `COLORS` - Farbpalette
- `SPACING` - Abstände
- `BORDER_RADIUS` - Eckenradien
- `SHADOWS` - Schatten
- `TYPOGRAPHY` - Schriftgrößen und -gewichte

### Abhängigkeiten

```json
{
  "expo-linear-gradient": "^13.0.2",
  "react-native-svg": "^15.1.0",
  "@expo/vector-icons": "^14.0.0"
}
```

### Datenbankstruktur

#### user_nutrition_goals
```sql
- id (uuid)
- user_id (uuid)
- goal_type (text)
- target_calories (integer)
- target_protein (integer)
- target_carbs (integer)
- target_fat (integer)
- target_weight (decimal)
- current_weight (decimal)
- weekly_weight_change_goal (decimal)
- status (text) -- 'active', 'inactive'
```

#### body_measurements
```sql
- id (uuid)
- user_id (uuid)
- measurement_date (date)
- weight (decimal)
```

### Performance Optimierungen

- Verwendet `useCallback` für Data Loading
- Mini Components für Charts (reduziert Re-Renders)
- Conditional Rendering für optionale Sections
- Capped Percentages (max 100%) für Progress Circles

### Zukünftige Erweiterungen

- [ ] Swipe-to-Refresh innerhalb des Widgets
- [ ] Tap auf Chart für Detail-View
- [ ] Animation beim Laden der Progress Circles
- [ ] Konfigurierbarer Zeitraum (7/14/30 Tage)
- [ ] Export der Daten als PDF/CSV
