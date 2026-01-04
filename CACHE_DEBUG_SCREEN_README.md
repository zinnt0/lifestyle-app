# Cache Debug Screen

Entwickler-Tool zum Inspizieren und Verwalten der lokalen SQLite-Caches direkt in der App.

## Zugriff

### Development-Modus
Der Debug-Screen ist **nur im Development-Modus** (`__DEV__`) verfügbar und erscheint automatisch auf dem Home Dashboard.

**Navigation:**
```
Home Dashboard → "Cache Debug" Button (unten)
```

**Hinweis:** Der Button wird NUR angezeigt wenn:
- `__DEV__` = `true` (Development-Modus)
- User eingeloggt ist

## Features

### 📊 Cache-Statistiken

#### Food Cache
- **Anzahl gecachter Foods** (max. 50)
- **Top 10 meist-genutzte Foods** mit Usage-Count
- Details: Name, Brand, Verwendungshäufigkeit

#### Nutrition Cache
- **Anzahl gecachter Tage** (max. 30)
- **Ältestes/Neuestes Datum**
- **Letzte Synchronisation**
- Datum-Range Übersicht

#### Profile Cache
- **Cache-Status** (Cached / Not Cached)
- **Cached At** - Wann wurde gecached
- **Updated At** - Letzte Profil-Aktualisierung

### 🔄 Sync-Funktionen

**Nutrition Sync:**
```
Button: "Sync Nutrition (30 days)"
→ Lädt letzte 30 Tage von Supabase
→ Zeigt Anzahl synchronisierter Tage
```

**Profile Sync:**
```
Button: "Refresh Profile" / "Sync Profile"
→ Lädt aktuelles Profil von Supabase
→ Aktualisiert lokalen Cache
```

### 🗑️ Cache-Verwaltung

**Clear Food Cache:**
- Löscht alle 50 gecachten Foods
- Confirmation-Dialog
- Reload nach Löschung

**Clear Nutrition Cache:**
- Löscht alle 30 Tage Nutrition-Daten
- Confirmation-Dialog
- Reload nach Löschung

**Clear Profile Cache:**
- Löscht gecachtes User-Profil
- Confirmation-Dialog
- Reload nach Löschung

**Clear ALL Caches (Danger Zone):**
- Löscht ALLE drei Caches
- Double-Confirmation
- Vollständiger Reset

## UI/UX

### Expandable Sections
```
🍔 Food Cache (15 items)          ▶
📊 Nutrition Cache (28 days)      ▶
👤 Profile Cache (Cached)         ▶
⚠️ Danger Zone
```

**Tap auf Section** → Expandiert/Kollabiert

### Pull-to-Refresh
```
↓ Pull nach unten → Refresh alle Stats
```

### Color Coding
- ✅ **Grün** - Cache aktiv/gefüllt
- ❌ **Rot** - Cache leer/nicht gefunden
- 🔵 **Blau** - Primary Actions (Sync)
- 🔴 **Rot** - Danger Actions (Clear)

## Verwendung

### Development Testing

**1. Food Cache prüfen:**
```
1. Öffne Cache Debug
2. Tap auf "🍔 Food Cache"
3. Prüfe Top 10 Foods
4. Checke Usage Counts
```

**2. Nutrition Cache prüfen:**
```
1. Tap auf "📊 Nutrition Cache"
2. Prüfe Anzahl Tage (sollte ≤30 sein)
3. Check Datum-Range
4. Prüfe Last Sync Zeit
```

**3. Profile Cache prüfen:**
```
1. Tap auf "👤 Profile Cache"
2. Status sollte "Cached" sein
3. Check Cached/Updated Timestamps
```

### Cache Reset (Testing)

**Scenario: Food-Suche testen**
```
1. Clear Food Cache
2. Suche nach Food
3. Prüfe ob neu gecached wurde
4. Check in Debug Screen
```

**Scenario: Nutrition Sync testen**
```
1. Clear Nutrition Cache
2. Tap "Sync Nutrition (30 days)"
3. Warte auf Sync
4. Prüfe Anzahl Tage = 30
```

**Scenario: Profile Update testen**
```
1. Update Profil (z.B. Gewicht)
2. Öffne Cache Debug
3. Check "Updated At" Timestamp
4. Prüfe ob Update reflected ist
```

## Technische Details

### Datenquellen

**Food Cache:**
```typescript
await localFoodCache.getCacheSize()
await localFoodCache.getTopFoods(10)
```

**Nutrition Cache:**
```typescript
await localNutritionCache.getCacheStats()
// Returns: { total_days, oldest_date, newest_date, last_sync }
```

**Profile Cache:**
```typescript
await localProfileCache.isProfileCached(userId)
await localProfileCache.getCacheMetadata(userId)
```

### Sync Services

**Nutrition Sync:**
```typescript
await nutritionSyncService.syncNutritionData(userId, {
  force: true,
  daysToSync: 30
})
```

**Profile Sync:**
```typescript
await profileSyncService.refreshProfile(userId)
```

### Clear Operations

**Individual:**
```typescript
await localFoodCache.clearCache()
await localNutritionCache.clearCache()
await localProfileCache.deleteProfile(userId)
```

**All:**
```typescript
Promise.all([
  localFoodCache.clearCache(),
  localNutritionCache.clearCache(),
  localProfileCache.deleteProfile(userId)
])
```

## Screenshots & Layout

```
┌─────────────────────────────────┐
│  🔧 Cache Debug                 │
│  Local SQLite Cache Inspector   │
├─────────────────────────────────┤
│                                 │
│  🍔 Food Cache (15 items)    ▼  │
│  ┌───────────────────────────┐ │
│  │ Cached Foods: 15/50       │ │
│  │                           │ │
│  │ Top 10 Most Used:         │ │
│  │ #1  Coca Cola             │ │
│  │     Coca-Cola • Used 12x  │ │
│  │ #2  Banane                │ │
│  │     Bio • Used 8x         │ │
│  │ ...                       │ │
│  │                           │ │
│  │ [Clear Food Cache]        │ │
│  └───────────────────────────┘ │
│                                 │
│  📊 Nutrition Cache (28d)    ▶  │
│                                 │
│  👤 Profile Cache (Cached)   ▶  │
│                                 │
│  ⚠️ Danger Zone                 │
│  ┌───────────────────────────┐ │
│  │ This will delete ALL      │ │
│  │ cached data               │ │
│  │                           │ │
│  │ [Clear ALL Caches]        │ │
│  └───────────────────────────┘ │
│                                 │
│  💾 All data is stored in      │
│  SQLite database: food_cache.db│
└─────────────────────────────────┘
```

## Troubleshooting

### Problem: Button nicht sichtbar

**Ursache:** Production-Modus
**Lösung:**
```bash
# Stelle sicher dass im Development-Modus
npx expo start --dev-client
```

### Problem: "User not found"

**Ursache:** Nicht eingeloggt
**Lösung:** Login durchführen

### Problem: Caches zeigen 0 Items

**Ursache:** Noch nicht initialisiert/verwendet
**Lösung:**
```
1. App normal benutzen (Foods suchen, etc.)
2. Caches füllen sich automatisch
3. Refresh Cache Debug Screen
```

### Problem: Sync schlägt fehl

**Ursache:** Keine Internet-Verbindung
**Lösung:** Internet-Verbindung prüfen

## Best Practices

### ✅ DO

- Verwende Debug Screen für Testing
- Clear Caches zwischen Tests
- Prüfe Cache-Stats regelmäßig
- Teste Sync-Funktionalität
- Nutze Pull-to-Refresh

### ❌ DON'T

- Nicht im Production-Build verwenden
- Nicht unnötig Caches löschen
- Nicht während aktiver User-Session löschen
- Nicht zu oft Sync triggern

## Production-Modus

Im Production-Build (`__DEV__ = false`):
- ❌ Debug-Button wird NICHT angezeigt
- ❌ Screen ist NICHT zugänglich
- ✅ Caches funktionieren normal weiter

**Code:**
```typescript
{__DEV__ && (
  <TouchableOpacity>
    Cache Debug
  </TouchableOpacity>
)}
```

## Verwandte Dokumentation

- [Local Food Cache](FOOD_CACHING_SYSTEM_README.md)
- [Local Nutrition Cache](LOCAL_NUTRITION_CACHE_README.md)
- [Local Profile Cache](LOCAL_PROFILE_CACHE_README.md)
