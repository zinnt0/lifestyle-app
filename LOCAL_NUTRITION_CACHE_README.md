# Local Nutrition Cache System

Lokales SQLite-basiertes Caching-System für Kaloriendaten des Users (letzte 30 Tage).

## Features

✅ **Offline-First Architecture**
- Lokale SQLite-Datenbank für schnellen Zugriff
- Automatische Synchronisation mit Supabase
- Funktioniert komplett offline nach initialem Sync

✅ **30-Tage Rolling Cache**
- Speichert automatisch die letzten 30 Tage
- Automatisches Cleanup alter Daten
- Optimiert für schnelle Ladezeiten

✅ **Intelligente Synchronisation**
- Cooldown-Period verhindert zu häufige Syncs (5 Min)
- Auto-Sync beim App-Start
- Background-Sync in konfigurierbaren Intervallen
- Force-Sync Option für manuelles Update

✅ **React Hooks für einfache Integration**
- `useLocalNutrition` für einzelne Tage
- `useLastNDaysNutrition` für Zeiträume
- Automatisches Loading & Error Handling

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│              (useLocalNutrition Hook)                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              NutritionSyncService                        │
│         (Orchestriert Sync & Fallback-Logik)            │
└─────────────────────────────────────────────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────┐          ┌──────────────────────────┐
│ LocalNutritionCache│         │    Supabase              │
│   (SQLite DB)     │          │ daily_nutrition_summary  │
│                   │          │                          │
│ ⚡ <10ms         │          │ 🌐 50-200ms              │
│ 📱 Offline       │          │ 🔄 Source of Truth       │
│ 🗄️ Last 30 days │          │ 📊 All History           │
└──────────────────┘          └──────────────────────────┘
```

## Installation

### 1. Dependencies

Die Dependencies sind bereits installiert:
- `expo-sqlite` (v16.0.10) - SQLite-Datenbank
- Supabase Client

### 2. Datenbank-Schema

Die Tabelle wird automatisch beim ersten `initialize()` erstellt:

```sql
CREATE TABLE IF NOT EXISTS daily_nutrition_cache (
  date TEXT PRIMARY KEY,                  -- YYYY-MM-DD
  calorie_goal INTEGER NOT NULL,
  calories_consumed INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  net_calories INTEGER NOT NULL DEFAULT 0,
  protein_consumed REAL NOT NULL DEFAULT 0,
  protein_goal REAL NOT NULL DEFAULT 0,
  carbs_consumed REAL NOT NULL DEFAULT 0,
  carbs_goal REAL NOT NULL DEFAULT 0,
  fat_consumed REAL NOT NULL DEFAULT 0,
  fat_goal REAL NOT NULL DEFAULT 0,
  fiber_consumed REAL NOT NULL DEFAULT 0,
  sugar_consumed REAL NOT NULL DEFAULT 0,
  sodium_consumed REAL NOT NULL DEFAULT 0,
  water_consumed_ml INTEGER NOT NULL DEFAULT 0,
  water_goal_ml INTEGER NOT NULL DEFAULT 2000,
  last_synced TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nutrition_date ON daily_nutrition_cache(date DESC);
CREATE INDEX idx_nutrition_last_synced ON daily_nutrition_cache(last_synced DESC);
```

### 3. App Initialisierung

Die Initialisierung erfolgt automatisch beim Start des FoodService:

**In [App.tsx](App.tsx) oder Root Component:**

```typescript
import { useEffect } from 'react';
import { foodService } from './src/services/FoodService';

export default function App() {
  useEffect(() => {
    // Initialize food service (initialisiert auch nutrition cache)
    foodService.initialize()
      .then(() => console.log('Services initialized'))
      .catch((error) => console.error('Initialization failed:', error));
  }, []);

  return (
    // Your app components
  );
}
```

## Verwendung

### Variante 1: React Hook (Empfohlen)

#### Einzelner Tag

```typescript
import { useLocalNutrition } from '@/hooks/useLocalNutrition';

function TodayNutritionScreen() {
  const today = new Date().toISOString().split('T')[0];

  const {
    data,
    loading,
    error,
    refreshData,
    syncNow,
    isSyncing,
    minutesSinceLastSync
  } = useLocalNutrition(today, {
    autoSync: true,      // Auto-sync on mount
    syncInterval: 10,    // Auto-sync every 10 minutes
    daysToSync: 30       // Sync last 30 days
  });

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  if (!data) return <Text>No data for today</Text>;

  return (
    <View>
      <Text>Kalorien: {data.calories_consumed} / {data.calorie_goal}</Text>
      <Text>Verbrannt: {data.calories_burned} kcal</Text>
      <Text>Netto: {data.net_calories} kcal</Text>

      <Text>Protein: {data.protein_consumed}g / {data.protein_goal}g</Text>
      <Text>Carbs: {data.carbs_consumed}g / {data.carbs_goal}g</Text>
      <Text>Fat: {data.fat_consumed}g / {data.fat_goal}g</Text>

      <Button onPress={refreshData} disabled={loading}>
        Aktualisieren
      </Button>

      <Button onPress={() => syncNow(true)} disabled={isSyncing}>
        Force Sync
      </Button>

      <Text>Last Sync: {minutesSinceLastSync} min ago</Text>
    </View>
  );
}
```

#### Letzte N Tage

```typescript
import { useLastNDaysNutrition } from '@/hooks/useLocalNutrition';

function WeekNutritionChart() {
  const {
    data,
    loading,
    error,
    getNutritionRange
  } = useLastNDaysNutrition(7, {
    autoSync: true,
    syncInterval: 15
  });

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View>
      <Text>Last 7 Days:</Text>
      {data.map((day) => (
        <View key={day.date}>
          <Text>{day.date}</Text>
          <Text>{day.calories_consumed} / {day.calorie_goal} kcal</Text>
          <ProgressBar
            progress={day.calories_consumed / day.calorie_goal}
          />
        </View>
      ))}
    </View>
  );
}
```

### Variante 2: Direkte Service-Verwendung

```typescript
import { nutritionSyncService } from '@/services/NutritionSyncService';
import { localNutritionCache } from '@/services/cache/LocalNutritionCache';

// Initialize (wird automatisch durch FoodService gemacht)
await localNutritionCache.initialize();

// Sync last 30 days
await nutritionSyncService.syncNutritionData(userId, {
  daysToSync: 30
});

// Get single day (mit auto-fallback zu Supabase)
const today = new Date().toISOString().split('T')[0];
const data = await nutritionSyncService.getNutritionData(userId, today);

// Get range (mit auto-fallback)
const rangeData = await nutritionSyncService.getNutritionDataRange(
  userId,
  '2024-01-01',
  '2024-01-07'
);

// Force sync (ignoriert Cooldown)
await nutritionSyncService.syncNutritionData(userId, {
  force: true,
  daysToSync: 30
});

// Check sync status
const status = nutritionSyncService.getSyncStatus();
console.log(`Last sync: ${status.minutesSinceLastSync} min ago`);
console.log(`Currently syncing: ${status.isSyncing}`);
```

### Variante 3: Nur lokale Cache (ohne Sync)

```typescript
import { localNutritionCache } from '@/services/cache/LocalNutritionCache';

// Get cached data (null wenn nicht gecached)
const data = await localNutritionCache.getNutritionData('2024-01-15');

// Get last 7 days from cache
const weekData = await localNutritionCache.getLastNDays(7);

// Get date range from cache
const rangeData = await localNutritionCache.getNutritionDataRange(
  '2024-01-01',
  '2024-01-07'
);

// Cache single day manually
await localNutritionCache.cacheNutritionData({
  date: '2024-01-15',
  calorie_goal: 2200,
  calories_consumed: 1850,
  calories_burned: 350,
  net_calories: 1500,
  // ... andere Felder
});

// Batch cache multiple days
await localNutritionCache.batchCacheNutritionData([
  { date: '2024-01-15', /* ... */ },
  { date: '2024-01-14', /* ... */ },
  // ...
]);

// Get cache statistics
const stats = await localNutritionCache.getCacheStats();
console.log(`Cached days: ${stats.total_days}`);
console.log(`Oldest: ${stats.oldest_date}`);
console.log(`Newest: ${stats.newest_date}`);

// Clean old data (>30 days)
await localNutritionCache.cleanOldData();

// Clear entire cache
await localNutritionCache.clearCache();
```

## Daten-Synchronisation

### Automatische Synchronisation

Die Hooks (`useLocalNutrition`) synchronisieren automatisch:

1. **Beim App-Start**: Initial sync der letzten 30 Tage
2. **Alle X Minuten**: Background-Sync (konfigurierbar via `syncInterval`)
3. **Bei Bedarf**: Auto-Fetch wenn Daten nicht im Cache

### Manuelle Synchronisation

```typescript
// Force sync (ignoriert Cooldown)
await syncNow(true);

// Normal sync (respektiert Cooldown)
await syncNow(false);
```

### Sync-Verhalten

```typescript
┌──────────────────────────────────────────────────────┐
│ Nutrition Data Request Flow                          │
└──────────────────────────────────────────────────────┘

User requests date: "2024-01-15"
    │
    ▼
1. Check Local Cache
    │
    ├─ Found? → Return immediately (~5ms)
    │
    └─ Not found?
        │
        ▼
2. Fetch from Supabase
    │
    ├─ Found? → Cache locally + Return (~150ms)
    │
    └─ Not found? → Return null
```

### Cooldown-Period

- **Standard**: 5 Minuten zwischen Auto-Syncs
- **Verhindert**: Zu häufige API-Calls
- **Umgehen**: `syncNow(true)` für Force-Sync

## Performance

### Response Times

| Quelle              | Response Time | Use Case                    |
|---------------------|---------------|------------------------------|
| LOCAL Cache         | <10ms         | Gecachte Tage (letzte 30)   |
| SUPABASE + Cache    | ~150ms        | Erste Abfrage + Auto-Cache  |
| SUPABASE Only       | ~100ms        | Ohne Caching                |

### Cache Hit Rates

Nach Initial-Sync (30 Tage):
- **Heute**: ~100% Cache Hit (immer gecached)
- **Letzte 7 Tage**: ~100% Cache Hit
- **Letzte 30 Tage**: ~100% Cache Hit
- **Älter als 30 Tage**: 0% Cache Hit → Supabase Fetch

## Gespeicherte Daten

Pro Tag werden folgende Werte gecached:

```typescript
interface DailyNutritionData {
  date: string;                    // YYYY-MM-DD

  // Kalorien
  calorie_goal: number;
  calories_consumed: number;
  calories_burned: number;
  net_calories: number;

  // Makros
  protein_consumed: number;
  protein_goal: number;
  carbs_consumed: number;
  carbs_goal: number;
  fat_consumed: number;
  fat_goal: number;

  // Mikros
  fiber_consumed: number;
  sugar_consumed: number;
  sodium_consumed: number;

  // Wasser
  water_consumed_ml: number;
  water_goal_ml: number;

  // Meta
  last_synced: string;             // ISO timestamp
}
```

## Speicherplatz

- **Pro Tag**: ~150 Bytes
- **30 Tage**: ~4.5 KB
- **Indices**: ~1 KB
- **Gesamt**: ~5-6 KB (vernachlässigbar)

## Datenbank-Wartung

### Automatisches Cleanup

```typescript
// Wird automatisch nach jedem Cache-Write ausgeführt
await localNutritionCache.cleanOldData();

// Löscht alle Einträge älter als 30 Tage
// SQL: DELETE FROM daily_nutrition_cache WHERE date < '2024-01-15'
```

### Manuelles Cleanup

```typescript
// Alle gecachten Daten löschen
await localNutritionCache.clearCache();

// Cache-Statistiken anzeigen
const stats = await localNutritionCache.getCacheStats();
console.log(stats);
// {
//   total_days: 30,
//   oldest_date: '2024-01-01',
//   newest_date: '2024-01-30',
//   last_sync: '2024-01-30T12:00:00.000Z'
// }
```

## Testing

### Test-Beispiel

```typescript
import { localNutritionCache } from '@/services/cache/LocalNutritionCache';
import { nutritionSyncService } from '@/services/NutritionSyncService';

// 1. Initialize
await localNutritionCache.initialize();

// 2. Sync test data
const userId = 'test-user-id';
await nutritionSyncService.syncNutritionData(userId, {
  daysToSync: 7
});

// 3. Verify cache
const stats = await localNutritionCache.getCacheStats();
console.log(`Cached ${stats.total_days} days`);

// 4. Test single day fetch
const today = new Date().toISOString().split('T')[0];
const data = await nutritionSyncService.getNutritionData(userId, today);
console.log('Today:', data);

// 5. Test range fetch
const weekData = await localNutritionCache.getLastNDays(7);
console.log('Week data:', weekData);

// 6. Clean up
await localNutritionCache.clearCache();
```

## Troubleshooting

### Problem: "LocalNutritionCache not initialized"

**Lösung**:
```typescript
// Stelle sicher dass initialize() aufgerufen wird
import { foodService } from './services/FoodService';
await foodService.initialize(); // Initialisiert beide Caches
```

### Problem: Daten werden nicht synchronisiert

**Lösung 1**: Check Sync Status
```typescript
const status = nutritionSyncService.getSyncStatus();
console.log('Is syncing:', status.isSyncing);
console.log('Last sync:', status.minutesSinceLastSync, 'min ago');
```

**Lösung 2**: Force Sync
```typescript
await nutritionSyncService.syncNutritionData(userId, { force: true });
```

### Problem: Zu viele API-Calls

**Lösung**: Erhöhe Sync-Interval
```typescript
useLocalNutrition(date, {
  autoSync: true,
  syncInterval: 30  // Nur alle 30 Minuten statt 10
});
```

### Problem: Alte Daten werden nicht gelöscht

**Lösung**: Manuelles Cleanup
```typescript
await localNutritionCache.cleanOldData();
```

## Best Practices

### ✅ DO

- Nutze die React Hooks für Components (`useLocalNutrition`)
- Lass Auto-Sync aktiviert für beste UX
- Sync beim App-Start für aktuelle Daten
- Verwende `refreshData()` für Pull-to-Refresh
- Check Sync-Status vor Force-Sync

### ❌ DON'T

- Nicht mehrmals `initialize()` aufrufen
- Nicht manuell Cache löschen (außer bei Settings)
- Nicht zu kurze Sync-Intervalle (<5 Min)
- Nicht Force-Sync in Loops
- Nicht ohne Error-Handling verwenden

## Integration mit bestehendem Code

### Update bestehender Components

**Vorher** (direkt von Supabase):
```typescript
const { data } = await supabase
  .from('daily_nutrition_summary')
  .select('*')
  .eq('user_id', userId)
  .eq('summary_date', date)
  .single();
```

**Nachher** (mit lokalem Cache):
```typescript
const { data } = useLocalNutrition(date);
// Auto-cached, offline-ready, schneller!
```

## Weiterführende Ressourcen

- [Food Caching System](FOOD_CACHING_SYSTEM_README.md) - Food-Daten Cache
- [Expo SQLite Docs](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Supabase Docs](https://supabase.com/docs)

## Changelog

### v1.0.0 - Initial Release
- ✅ LocalNutritionCache (SQLite)
- ✅ NutritionSyncService (Sync-Logik)
- ✅ useLocalNutrition Hook
- ✅ useLastNDaysNutrition Hook
- ✅ 30-Tage Rolling Cache
- ✅ Auto-Sync & Background-Sync
- ✅ Offline-First Architecture
