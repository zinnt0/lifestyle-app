# Nutrition Components Reference

Complete reference for all nutrition tracking UI components.

## 📑 Table of Contents

- [Hooks](#hooks)
- [Screens](#screens)
- [Components](#components)
- [Navigation](#navigation)
- [Theme & Utilities](#theme--utilities)

---

## 🎣 Hooks

### `useNutritionSummary(userId, date)`
**File**: `src/hooks/useNutrition.ts`

Fetches daily nutrition summary with real-time updates.

```tsx
const { summary, loading, error, refresh } = useNutritionSummary(userId, '2025-01-03');
```

**Returns**:
- `summary`: `DailySummary | null` - Daily totals and goals
- `loading`: `boolean` - Loading state
- `error`: `Error | null` - Error object if failed
- `refresh`: `() => Promise<void>` - Manual refresh function

**Summary Object**:
```tsx
{
  date: '2025-01-03',
  user_id: string,
  total_calories: 1523,
  total_protein: 125,
  total_carbs: 180,
  total_fat: 45,
  goal_calories: 2000,
  goal_protein: 150,
  goal_carbs: 200,
  goal_fat: 60,
  meals: {
    breakfast: { calories, protein, carbs, fat, entry_count },
    lunch: { ... },
    dinner: { ... },
    snack: { ... }
  }
}
```

---

### `useFoodDiary(userId, date)`
**File**: `src/hooks/useNutrition.ts`

Manages food diary entries with CRUD operations.

```tsx
const {
  entries,
  loading,
  error,
  addEntry,
  updateEntry,
  deleteEntry,
  refresh
} = useFoodDiary(userId, '2025-01-03');
```

**Returns**:
- `entries`: `DiaryEntry[]` - Array of food entries
- `addEntry(entry)`: Add new diary entry
- `updateEntry(id, updates)`: Update existing entry
- `deleteEntry(id)`: Delete entry

**Example Usage**:
```tsx
await addEntry({
  food_item: { /* FoodItem object */ },
  amount: 150,
  meal_type: 'lunch',
  consumed_at: new Date().toISOString(),
  calories: 300,
  protein: 25,
  carbs: 30,
  fat: 10,
  notes: 'Post-workout meal',
});
```

---

### `useWaterTracking(userId, date)`
**File**: `src/hooks/useNutrition.ts`

Tracks daily water intake.

```tsx
const {
  totalWater,
  entries,
  goal,
  loading,
  error,
  addWater,
  refresh
} = useWaterTracking(userId, '2025-01-03');
```

**Returns**:
- `totalWater`: `number` - Total ml consumed today
- `entries`: `WaterEntry[]` - Individual water logs
- `goal`: `number` - Daily goal in ml
- `addWater(amount)`: Add water (in ml)

**Example**:
```tsx
await addWater(250); // Add 250ml
```

---

### `useFoodSearch()`
**File**: `src/hooks/useNutrition.ts`

Debounced food search (300ms delay).

```tsx
const { results, search, loading, error, reset } = useFoodSearch();
```

**Returns**:
- `results`: `FoodItem[]` - Search results
- `search(query)`: Trigger search
- `reset()`: Clear results

**Example**:
```tsx
// User types "apple juice"
search('apple juice');
// Wait 300ms → API call → results updated
```

---

### `useBarcodeScanner()`
**File**: `src/hooks/useNutrition.ts`

Barcode scanning and food lookup.

```tsx
const { food, scan, loading, error, reset } = useBarcodeScanner();
```

**Returns**:
- `food`: `FoodItem | null` - Found food item
- `scan(barcode)`: Scan barcode
- `reset()`: Clear result

**Example**:
```tsx
await scan('5000112548167'); // Coca-Cola barcode
// food: { name: 'Coca-Cola', calories: 42, ... }
```

---

## 📱 Screens

### `NutritionDashboardScreen`
**File**: `src/screens/Nutrition/NutritionDashboardScreen.tsx`

Main nutrition dashboard with overview of daily intake.

**Props**:
- `userId`: `string` (required)

**Features**:
- Date selector (Today/Yesterday/Custom)
- Calorie progress ring (animated)
- Macro breakdown (3 rings)
- Water tracker
- Quick action buttons
- Meal diary list (grouped)

**Usage**:
```tsx
<NutritionDashboardScreen userId={user.id} />
```

---

### `FoodSearchScreen`
**File**: `src/screens/Nutrition/FoodSearchScreen.tsx`

Full-screen food search interface.

**Features**:
- Search input with debouncing
- Results list with nutrition preview
- Nutriscore badges
- Source indicators (Cached/OFF)
- Attribution footer

**Navigation**:
```tsx
navigation.navigate('FoodSearch');
```

---

### `BarcodeScannerScreen`
**File**: `src/screens/Nutrition/BarcodeScannerScreen.tsx`

Barcode scanner with camera integration.

**Features**:
- Camera view with overlay
- Corner markers for alignment
- Automatic barcode detection
- Success/Error states
- Manual entry fallback

**Navigation**:
```tsx
navigation.navigate('BarcodeScanner');
```

**Supported Formats**:
- EAN-13, EAN-8
- UPC-A, UPC-E

---

### `FoodDetailScreen`
**File**: `src/screens/Nutrition/FoodDetailScreen.tsx`

Food details with portion calculator and diary entry form.

**Route Params**:
- `food`: `FoodItem` (required)

**Props**:
- `userId`: `string` (required)

**Features**:
- Food info with Nutriscore
- Serving size input (live calc)
- Nutrition facts table
- Meal type selector
- Date picker
- Notes field
- Add to diary

**Navigation**:
```tsx
navigation.navigate('FoodDetail', { food: foodItem });
```

---

## 🧩 Components

### `CalorieProgressRing`
**File**: `src/components/Nutrition/CalorieProgressRing.tsx`

Animated circular progress indicator for calories.

**Props**:
```tsx
{
  consumed: number;      // Calories consumed
  goal: number;          // Daily goal
  size?: number;         // Ring diameter (default: 180)
  strokeWidth?: number;  // Ring thickness (default: 16)
}
```

**Example**:
```tsx
<CalorieProgressRing
  consumed={1523}
  goal={2000}
  size={200}
/>
```

**Visual**:
- Center: Current calories
- Subtext: "of [goal]"
- Bottom: "[remaining] left"
- Color: Based on progress %

---

### `MacroBreakdown`
**File**: `src/components/Nutrition/MacroBreakdown.tsx`

Three small progress rings for macros (P/C/F).

**Props**:
```tsx
{
  protein: { consumed: number; goal: number; };
  carbs: { consumed: number; goal: number; };
  fat: { consumed: number; goal: number; };
}
```

**Example**:
```tsx
<MacroBreakdown
  protein={{ consumed: 125, goal: 150 }}
  carbs={{ consumed: 180, goal: 200 }}
  fat={{ consumed: 45, goal: 60 }}
/>
```

**Colors**:
- Protein: Red/Pink (#FF6B6B)
- Carbs: Teal (#4ECDC4)
- Fat: Yellow (#FFD93D)

---

### `WaterTracker`
**File**: `src/components/Nutrition/WaterTracker.tsx`

Water intake progress bar with quick-add buttons.

**Props**:
```tsx
{
  totalWater: number;     // Current total (ml)
  goal: number;           // Daily goal (ml)
  onAddWater: (amount: number) => void;
}
```

**Example**:
```tsx
<WaterTracker
  totalWater={1200}
  goal={2000}
  onAddWater={(amount) => addWater(amount)}
/>
```

**Quick Add Buttons**:
- +250ml
- +500ml
- +1000ml

---

### `MealDiaryList`
**File**: `src/components/Nutrition/MealDiaryList.tsx`

Meal entries grouped by type with swipe-to-delete.

**Props**:
```tsx
{
  entries: DiaryEntry[];
  userId: string;
}
```

**Example**:
```tsx
<MealDiaryList
  entries={diaryEntries}
  userId={user.id}
/>
```

**Features**:
- Grouped by: Breakfast, Lunch, Dinner, Snack
- Meal totals (kcal)
- Swipe left to delete
- Macro preview tags (P/C/F)
- Empty state

---

### `FoodSearch`
**File**: `src/components/Nutrition/FoodSearch.tsx`

Reusable food search component.

**Props**:
```tsx
{
  onFoodSelect: (food: FoodItem) => void;
}
```

**Example**:
```tsx
<FoodSearch
  onFoodSelect={(food) => {
    navigation.navigate('FoodDetail', { food });
  }}
/>
```

**Features**:
- Search input with clear button
- Loading indicator
- Results list
- Empty states (no results, error)
- Pull-to-refresh

---

### `AttributionFooter`
**File**: `src/components/Nutrition/AttributionFooter.tsx`

Open Food Facts attribution (ODbL requirement).

**Props**:
```tsx
{
  compact?: boolean;  // Compact vs full mode
}
```

**Example**:
```tsx
// Compact (footer)
<AttributionFooter compact />

// Full (settings page)
<AttributionFooter />
```

**Full Mode Includes**:
- Info icon + title
- Description paragraph
- License info
- Links (Learn More, Contribute)
- OFF logo

---

## 🧭 Navigation

### `NutritionStackNavigator`
**File**: `src/navigation/NutritionStackNavigator.tsx`

Stack navigator for nutrition flow.

**Props**:
- `userId`: `string` (required)

**Screens**:
1. `NutritionDashboard` - Root
2. `FoodSearch` - Modal
3. `BarcodeScanner` - Full screen modal
4. `FoodDetail` - Modal

**Type Definitions**:
```tsx
type NutritionStackParamList = {
  NutritionDashboard: undefined;
  FoodSearch: undefined;
  BarcodeScanner: undefined;
  FoodDetail: { food: FoodItem };
};
```

**Usage**:
```tsx
<NutritionStackNavigator userId={user.id} />
```

---

## 🎨 Theme & Utilities

### `nutritionTheme`
**File**: `src/constants/nutritionTheme.ts`

Central theme configuration.

**Structure**:
```tsx
{
  colors: {
    // Macros
    protein: '#FF6B6B',
    carbs: '#4ECDC4',
    fat: '#FFD93D',
    fiber: '#95E1D3',
    water: '#3498DB',

    // Progress
    goalMet: '#34C759',
    goalNear: '#FF9500',
    goalFar: '#FF3B30',
    goalOver: '#5856D6',

    // Nutriscore
    nutriscoreA: '#038141',
    nutriscoreB: '#85BB2F',
    nutriscoreC: '#FECB02',
    nutriscoreD: '#EE8100',
    nutriscoreE: '#E63E11',

    // UI
    cardBackground: '#FFFFFF',
    divider: '#E5E5EA',
  },

  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
  },

  borderRadius: {
    sm: 8, md: 12, lg: 16, xl: 24, round: 9999
  },

  typography: {
    h1: { fontSize: 32, fontWeight: '700' },
    h2: { fontSize: 24, fontWeight: '600' },
    // ...
  },

  shadows: {
    card: { /* shadow styles */ },
    button: { /* shadow styles */ }
  },

  nutrition: {
    thresholds: { /* progress thresholds */ },
    calorieRing: { size: 180, strokeWidth: 16 },
    macroRing: { size: 100, strokeWidth: 10 },
  }
}
```

### Helper Functions

#### `getProgressColor(percentage)`
Returns color based on goal progress.

```tsx
getProgressColor(0.5);   // #FF3B30 (red - far from goal)
getProgressColor(0.85);  // #FF9500 (orange - near goal)
getProgressColor(0.98);  // #34C759 (green - met goal)
getProgressColor(1.1);   // #5856D6 (purple - over goal)
```

#### `getNutriscoreColor(grade)`
Returns color for Nutriscore badge.

```tsx
getNutriscoreColor('A'); // '#038141' (dark green)
getNutriscoreColor('E'); // '#E63E11' (red)
```

#### `formatCalories(value)`
Formats calorie values.

```tsx
formatCalories(1532.7);   // "1533"
formatCalories(undefined); // "0"
```

#### `formatNutritionValue(value, unit)`
Formats nutrition values with units.

```tsx
formatNutritionValue(25.4);         // "25g"
formatNutritionValue(25.4, 'ml');   // "25ml"
formatNutritionValue(undefined);    // "-"
```

---

## 📦 Barrel Exports

### Components
```tsx
// src/components/Nutrition/index.ts
export {
  CalorieProgressRing,
  MacroBreakdown,
  WaterTracker,
  MealDiaryList,
  FoodSearch,
  AttributionFooter,
} from './components/Nutrition';
```

### Screens
```tsx
// src/screens/Nutrition/index.ts
export {
  NutritionDashboardScreen,
  FoodSearchScreen,
  BarcodeScannerScreen,
  FoodDetailScreen,
} from './screens/Nutrition';
```

---

## 🔄 State Management Flow

```
User Action
    ↓
Custom Hook (useNutrition.ts)
    ↓
Supabase Client (CRUD operations)
    ↓
Database (PostgreSQL)
    ↓
Realtime Subscription
    ↓
Hook State Update
    ↓
Component Re-render
```

**Example Flow - Add Food**:
1. User fills FoodDetailScreen form
2. Presses "Add to Diary"
3. `useFoodDiary.addEntry()` called
4. Insert into `user_food_diary` table
5. Database trigger updates `daily_nutrition_summary`
6. Realtime subscription fires
7. `useNutritionSummary` updates
8. Dashboard re-renders with new data
9. Toast notification shows success

---

## 📊 Data Dependencies

```
NutritionDashboardScreen
├── useNutritionSummary → daily_nutrition_summary
├── useFoodDiary → user_food_diary
└── useWaterTracking → water_intake + user_profiles

FoodSearchScreen
└── useFoodSearch → FoodService → OFF API + Cache

BarcodeScannerScreen
└── useBarcodeScanner → FoodService → OFF API + Cache

FoodDetailScreen
└── useFoodDiary → user_food_diary
```

---

## 🎯 Component Selection Guide

**Need to show daily progress?**
→ Use `NutritionDashboardScreen`

**Need to search for food?**
→ Use `FoodSearch` component or `FoodSearchScreen`

**Need to scan barcode?**
→ Use `BarcodeScannerScreen`

**Need to add food to diary?**
→ Use `FoodDetailScreen`

**Need calorie visualization?**
→ Use `CalorieProgressRing`

**Need macro visualization?**
→ Use `MacroBreakdown`

**Need water tracking?**
→ Use `WaterTracker`

**Need to list meals?**
→ Use `MealDiaryList`

**Need attribution?**
→ Use `AttributionFooter`

---

## 📝 TypeScript Types

All types defined in `src/types/nutrition.ts`:

- `FoodItem` - Food product data
- `CachedFoodItem` - Food with cache metadata
- `DiaryEntry` - Single food entry
- `MealType` - 'breakfast' | 'lunch' | 'dinner' | 'snack'
- `DailySummary` - Daily nutrition totals
- `MealSummary` - Per-meal totals
- `NutritionGoals` - User goals
- `OFFProduct` - Open Food Facts API response
- `SearchResult` - Search result with metadata

---

**Complete Component Reference v1.0**
