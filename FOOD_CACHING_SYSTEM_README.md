# Multi-Layer Food Caching System

Intelligentes 3-Layer Caching-System für React Native Fitness-App mit Open Food Facts Integration.

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    Food Service                          │
│                  (Orchestrator)                          │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   LAYER 1    │  │   LAYER 2    │  │   LAYER 3    │
│    LOCAL     │  │    CLOUD     │  │  EXTERNAL    │
│   SQLite     │  │  Supabase    │  │ Open Food    │
│              │  │              │  │   Facts API  │
│ ⚡ Instant   │  │ 🌐 Shared    │  │ 🌍 Source    │
│ 📱 Offline   │  │ 👥 All Users │  │ 🔄 Rate      │
│              │  │              │  │    Limited   │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Features

✅ **3-Layer Intelligent Caching**
- Local SQLite für instant offline access
- Cloud Supabase für shared cache zwischen Users
- Open Food Facts API als ultimate source of truth

✅ **Smart Fallback-Logik**
- Automatischer Fallback zwischen Layers
- Cache propagation (External → Cloud → Local)
- Offline-Support mit cached data

✅ **Usage-Based Optimization**
- Tracking häufig genutzter Foods
- Auto-pruning auf Top 50 User-Foods
- Prefetching popular Foods

✅ **Rate Limiting**
- Sliding window algorithm
- 100 requests/minute (OFF limit)
- Automatic waiting wenn limit erreicht

✅ **Full-Text Search**
- Multi-layer search mit deduplication
- PostgreSQL full-text search (German)
- Fallback zu ILIKE search

## Installation

### 1. Dependencies installieren

```bash
npm install expo-sqlite
# oder
npx expo install expo-sqlite
```

Alle anderen Dependencies (Supabase, TypeScript, etc.) sind bereits installiert.

### 2. Supabase Datenbank Setup

#### Option A: Via Supabase Dashboard

1. Gehe zu deinem Supabase Projekt
2. Öffne SQL Editor
3. Führe folgendes SQL aus:

```sql
-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_de TEXT,
  brand TEXT,

  -- Macronutrients (per 100g)
  calories REAL,
  protein REAL,
  carbs REAL,
  fat REAL,
  fiber REAL,
  sugar REAL,
  sodium REAL,

  -- Serving info
  serving_size REAL,
  serving_unit TEXT,

  -- Quality scores
  nutriscore_grade TEXT,
  nova_group INTEGER,
  ecoscore_grade TEXT,

  -- Metadata
  categories_tags TEXT[],
  allergens TEXT[],
  source TEXT DEFAULT 'openfoodfacts',

  -- Usage tracking
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Full-text search
  search_vector tsvector
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_food_usage_count ON food_items(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_food_last_used ON food_items(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_food_search_vector ON food_items USING GIN(search_vector);

-- Create trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION update_food_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('german', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('german', COALESCE(NEW.name_de, '')), 'A') ||
    setweight(to_tsvector('german', COALESCE(NEW.brand, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_food_search_vector
BEFORE INSERT OR UPDATE ON food_items
FOR EACH ROW
EXECUTE FUNCTION update_food_search_vector();

-- Create RPC function for incrementing usage count
CREATE OR REPLACE FUNCTION increment_food_usage(food_barcode TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE food_items
  SET usage_count = usage_count + 1,
      last_used = NOW()
  WHERE barcode = food_barcode;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (optional, aber empfohlen)
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

-- Create policy: Everyone can read
CREATE POLICY "Allow public read access"
ON food_items FOR SELECT
USING (true);

-- Create policy: Authenticated users can insert/update
CREATE POLICY "Allow authenticated insert/update"
ON food_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
ON food_items FOR UPDATE
TO authenticated
USING (true);
```

#### Option B: Via Supabase CLI

Erstelle eine neue Migration:

```bash
# In deinem Projekt-Root
cd supabase
supabase migration new create_food_items_table

# Kopiere das obige SQL in die neue Migration-Datei
# Dann pushe zu Supabase:
supabase db push
```

### 3. App initialisieren

In deiner [App.tsx](App.tsx):

```typescript
import { useEffect } from 'react';
import { foodService } from './src/services/FoodService';

export default function App() {
  useEffect(() => {
    // Initialize food service on app start
    foodService.initialize()
      .then(() => console.log('FoodService initialized'))
      .catch((error) => console.error('FoodService init failed:', error));
  }, []);

  return (
    // Your app components
  );
}
```

## Verwendung

### Barcode Scan & Lookup

```typescript
import { foodService } from '../services/FoodService';
import { FoodServiceError, FoodServiceErrorCode } from '../types/nutrition';

async function handleBarcodeScan(barcode: string) {
  try {
    // Automatic 3-layer fallback
    const food = await foodService.getFoodByBarcode(barcode);

    console.log(`Found: ${food.name}`);
    console.log(`Calories: ${food.calories} kcal/100g`);
    console.log(`Protein: ${food.protein}g/100g`);

  } catch (error) {
    if (error instanceof FoodServiceError) {
      if (error.code === FoodServiceErrorCode.BARCODE_NOT_FOUND) {
        Alert.alert('Nicht gefunden', 'Produkt nicht in Datenbank');
      } else if (error.code === FoodServiceErrorCode.NETWORK_ERROR) {
        Alert.alert('Netzwerkfehler', 'Bitte Internetverbindung prüfen');
      }
    }
  }
}
```

### Food Search

```typescript
import { foodService } from '../services/FoodService';

async function searchFood(query: string) {
  try {
    const result = await foodService.searchFoods(query);

    console.log(`Found ${result.total_count} results from ${result.source}`);
    console.log(`Query time: ${result.query_time_ms}ms`);

    result.items.forEach((food) => {
      console.log(`- ${food.name} (${food.brand})`);
    });

  } catch (error) {
    console.error('Search failed:', error);
  }
}
```

### Quick-Add (User's Top Foods)

```typescript
import { foodService } from '../services/FoodService';

function QuickAddScreen() {
  const [topFoods, setTopFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    loadTopFoods();
  }, []);

  const loadTopFoods = async () => {
    const foods = await foodService.getUserTopFoods(10);
    setTopFoods(foods);
  };

  return (
    <FlatList
      data={topFoods}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => addToMeal(item)}>
          <Text>{item.name}</Text>
          <Text>{item.calories} kcal</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

### Cache Statistics

```typescript
import { foodService } from '../services/FoodService';

async function showCacheStats() {
  const stats = await foodService.getCacheStats();

  console.log(`Local cache: ${stats.local_count} items`);
  console.log(`Cloud cache: ${stats.cloud_stats.total_items} items`);
  console.log(`Total usage: ${stats.cloud_stats.total_usage} lookups`);
}
```

## Projektstruktur

```
src/
├── types/
│   └── nutrition.ts              # TypeScript interfaces
│
├── services/
│   ├── FoodService.ts            # Main orchestrator
│   │
│   ├── api/
│   │   ├── OpenFoodFactsAPI.ts   # External API client
│   │   └── RateLimiter.ts        # Rate limiting
│   │
│   └── cache/
│       ├── LocalFoodCache.ts     # SQLite layer
│       └── CloudFoodCache.ts     # Supabase layer
│
└── ... (rest of app)
```

## Performance

### Typical Response Times

| Layer    | Response Time | Use Case                    |
|----------|---------------|------------------------------|
| LOCAL    | <10ms         | Häufig verwendete Foods     |
| CLOUD    | 50-200ms      | Von anderen Users gecached  |
| EXTERNAL | 500-2000ms    | Erste Abfrage eines Products|

### Cache Hit Rates (nach Warmup)

- Local: ~60-70% (User's eigene Foods)
- Cloud: ~25-30% (andere Users)
- External: ~5-10% (neue Products)

## Open Food Facts API

### Basis-Informationen

- **Base URL**: `https://world.openfoodfacts.org/api/v2`
- **Rate Limit**: 100 requests/minute (konservativ)
- **User-Agent**: Pflicht (wird automatisch gesetzt)
- **Dokumentation**: https://wiki.openfoodfacts.org/API

### Wichtige Endpoints

```
GET /api/v2/product/{barcode}.json
GET /api/v2/search?search_terms={query}&page_size={limit}
```

### Datenqualität

- ✅ Sehr gute Abdeckung für DE/EU Produkte
- ✅ Community-basiert, ständig wachsend
- ⚠️ Manche Produkte haben unvollständige Daten
- ⚠️ Nutriscore/Ecoscore nicht immer verfügbar

## Troubleshooting

### Problem: "Local cache not initialized"

**Lösung**:
```typescript
// Stelle sicher dass initialize() aufgerufen wird
await foodService.initialize();
```

### Problem: "Rate limit exceeded"

**Lösung**: Der RateLimiter wartet automatisch. Falls es häufig passiert:
```typescript
// Erhöhe das Limit (nur wenn nötig)
const limiter = new RateLimiter(150, 60000); // 150/min
```

### Problem: Supabase connection error

**Lösung**:
1. Prüfe `.env` Datei:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```
2. Prüfe RLS Policies in Supabase
3. Prüfe Internetverbindung

### Problem: SQLite errors on iOS

**Lösung**:
```bash
# Rebuild iOS
cd ios && pod install && cd ..
npx expo run:ios
```

## Optimierungen

### Prefetching

```typescript
// Automatisch beim App-Start
foodService.initialize(); // ruft prefetchPopularFoods() auf

// Manuell
await foodService.prefetchPopularFoods();
```

### Cache Pruning

```typescript
// Automatisch bei jedem Cache (keeps top 50)
// Manuell:
await localFoodCache.pruneCache();
```

### Search Performance

```sql
-- Für bessere Search-Performance in Supabase:
-- Stelle sicher dass search_vector index existiert:
CREATE INDEX idx_food_search_vector ON food_items USING GIN(search_vector);
```

## Testing

### Test Barcodes (Deutsche Produkte)

```typescript
// Coca Cola
await foodService.getFoodByBarcode('5449000000996');

// Milka Schokolade
await foodService.getFoodByBarcode('7622300441890');

// Haribo Goldbären
await foodService.getFoodByBarcode('4001686332009');
```

### Test Search Queries

```typescript
await foodService.searchFoods('cola');
await foodService.searchFoods('milch');
await foodService.searchFoods('brot');
```

## Best Practices

### ✅ DO

- Initialize FoodService beim App-Start
- Nutze try-catch für alle async Operationen
- Zeige Loading-States während API calls
- Cache neue Foods automatisch
- Nutze getUserTopFoods() für Quick-Add UI

### ❌ DON'T

- Nicht mehrmals initialize() aufrufen
- Nicht ohne Error-Handling verwenden
- Nicht Local Cache manuell löschen (außer bei Settings)
- Nicht zu viele API-Calls in kurzer Zeit

## Migration von bestehendem Code

Falls du bereits Food-Daten hast:

```typescript
// Alt: Direkter API call
const response = await fetch(`https://off.../product/${barcode}`);

// Neu: Via FoodService (mit Caching)
const food = await foodService.getFoodByBarcode(barcode);
```

## Monitoring & Analytics

```typescript
// Cache-Performance tracken
const stats = await foodService.getCacheStats();

// In Analytics senden
analytics.track('cache_stats', {
  local_count: stats.local_count,
  cloud_count: stats.cloud_stats.total_items,
});
```

## Weiterführende Ressourcen

- [Open Food Facts API Docs](https://wiki.openfoodfacts.org/API)
- [Expo SQLite Docs](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)

## Support

Bei Fragen oder Problemen:
1. Prüfe dieses README
2. Prüfe Console-Logs (alle Services loggen mit Prefix)
3. Prüfe Supabase Dashboard für Cloud-Errors
4. Prüfe Network-Tab für API-Calls

## Changelog

### v1.0.0 - Initial Release
- ✅ 3-Layer Caching System
- ✅ Open Food Facts Integration
- ✅ Rate Limiting
- ✅ Full-Text Search
- ✅ Offline Support
- ✅ Usage Tracking
