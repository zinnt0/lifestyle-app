# Nutrition Tracking UI - Documentation

## Overview

Production-ready React Native UI components for nutrition tracking, built on top of the multi-layer food caching system. Features beautiful, animated interfaces with real-time data synchronization.

## 🎨 Features

### ✅ Complete Feature Set
- **Dashboard** - Daily calorie & macro tracking with animated progress rings
- **Food Search** - Debounced search with Open Food Facts integration
- **Barcode Scanner** - Camera-based barcode scanning for instant food lookup
- **Food Detail** - Portion calculator with live nutrition updates
- **Water Tracking** - Quick-add water intake with progress visualization
- **Meal Diary** - Swipe-to-delete food entries grouped by meal type
- **Real-time Updates** - Supabase subscriptions for instant UI updates
- **Offline Support** - Local caching with automatic fallback

### 🎯 UI/UX Highlights
- Smooth animations with `react-native-reanimated`
- Accessibility labels on all interactive elements
- Error boundaries and loading states
- Toast notifications for user feedback
- Responsive design for all screen sizes
- Dark mode compatible (via theme)

## 📁 Project Structure

```
src/
├── hooks/
│   └── useNutrition.ts              # Custom hooks for data fetching
│
├── components/Nutrition/
│   ├── CalorieProgressRing.tsx      # Animated calorie progress circle
│   ├── MacroBreakdown.tsx           # Protein/Carbs/Fat progress rings
│   ├── WaterTracker.tsx             # Water intake tracker
│   ├── MealDiaryList.tsx            # Meal entries with swipe-to-delete
│   ├── FoodSearch.tsx               # Search component
│   ├── AttributionFooter.tsx        # Open Food Facts attribution
│   └── index.ts                     # Barrel export
│
├── screens/Nutrition/
│   ├── NutritionDashboardScreen.tsx # Main dashboard
│   ├── FoodSearchScreen.tsx         # Search screen wrapper
│   ├── BarcodeScannerScreen.tsx     # Barcode scanner
│   ├── FoodDetailScreen.tsx         # Food detail & add to diary
│   └── index.ts                     # Barrel export
│
├── navigation/
│   └── NutritionStackNavigator.tsx  # Navigation config
│
├── constants/
│   └── nutritionTheme.ts            # Theme & style constants
│
└── types/
    └── nutrition.ts                 # TypeScript types (already exists)
```

## 🚀 Installation

### 1. Install Dependencies

```bash
npm install --save \
  @gorhom/bottom-sheet \
  react-native-reanimated \
  react-native-gesture-handler \
  react-native-toast-message \
  expo-barcode-scanner \
  @react-native-community/datetimepicker
```

### 2. Configure Reanimated

Add to `babel.config.js`:

```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin', // Must be last!
  ],
};
```

### 3. Setup Gesture Handler

In your root `App.tsx` or `index.tsx`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your app content */}
    </GestureHandlerRootView>
  );
}
```

### 4. Setup Toast Notifications

Add `ToastMessage` to your root component:

```tsx
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <>
      {/* Your navigation */}
      <Toast />
    </>
  );
}
```

## 🔧 Integration Guide

### Step 1: Add to Navigation

```tsx
// In your TabNavigator or MainNavigator
import { NutritionStackNavigator } from './navigation/NutritionStackNavigator';

<Tab.Screen
  name="Nutrition"
  component={NutritionStackNavigator}
  options={{
    tabBarIcon: ({ color }) => (
      <Ionicons name="nutrition" size={24} color={color} />
    ),
  }}
/>
```

### Step 2: Get User ID from Auth

```tsx
// Example with Supabase auth
import { useAuth } from './contexts/AuthContext';

export function NutritionTab() {
  const { user } = useAuth();

  if (!user) return <LoginScreen />;

  return <NutritionStackNavigator userId={user.id} />;
}
```

### Step 3: Request Camera Permissions

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-barcode-scanner",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access camera for scanning food barcodes"
        }
      ]
    ]
  }
}
```

## 📊 Custom Hooks

### `useNutritionSummary`

Fetches daily nutrition summary with real-time updates.

```tsx
const { summary, loading, error, refresh } = useNutritionSummary(userId, date);

// summary: DailySummary | null
// - total_calories, total_protein, total_carbs, total_fat
// - goal_calories, goal_protein, goal_carbs, goal_fat
// - meals: { breakfast, lunch, dinner, snack }
```

### `useFoodDiary`

Manages food diary entries for a specific date.

```tsx
const {
  entries,
  loading,
  addEntry,
  updateEntry,
  deleteEntry,
  refresh
} = useFoodDiary(userId, date);

// Add new entry
await addEntry({
  food_item: foodItem,
  amount: 150, // grams
  meal_type: 'lunch',
  consumed_at: new Date().toISOString(),
  calories: 300,
  protein: 25,
  carbs: 30,
  fat: 10,
});

// Delete entry (with swipe gesture)
await deleteEntry(entryId);
```

### `useWaterTracking`

Tracks water intake for a date.

```tsx
const {
  totalWater,
  entries,
  goal,
  loading,
  addWater
} = useWaterTracking(userId, date);

// Quick add water
await addWater(250); // 250ml
```

### `useFoodSearch`

Search food with debouncing (300ms).

```tsx
const { results, search, loading, error, reset } = useFoodSearch();

// Search
search('apple juice');

// Results update automatically after 300ms
```

### `useBarcodeScanner`

Scan barcodes and fetch food data.

```tsx
const { food, scan, loading, error, reset } = useBarcodeScanner();

// Scan barcode
await scan('5000112548167');

// food: FoodItem | null
```

## 🎨 Theming

All styles use the nutrition theme from `constants/nutritionTheme.ts`:

```tsx
import { nutritionTheme } from '../constants/nutritionTheme';

// Colors
nutritionTheme.colors.protein    // #FF6B6B (red/pink)
nutritionTheme.colors.carbs      // #4ECDC4 (teal)
nutritionTheme.colors.fat        // #FFD93D (yellow)
nutritionTheme.colors.water      // #3498DB (blue)

// Progress colors
nutritionTheme.colors.goalMet    // Green (95-105%)
nutritionTheme.colors.goalNear   // Orange (80-95%)
nutritionTheme.colors.goalFar    // Red (<80%)
nutritionTheme.colors.goalOver   // Purple (>105%)

// Spacing
nutritionTheme.spacing.xs        // 4
nutritionTheme.spacing.sm        // 8
nutritionTheme.spacing.md        // 16
nutritionTheme.spacing.lg        // 24
nutritionTheme.spacing.xl        // 32
nutritionTheme.spacing.xxl       // 48

// Border Radius
nutritionTheme.borderRadius.sm   // 8
nutritionTheme.borderRadius.md   // 12
nutritionTheme.borderRadius.lg   // 16
```

### Helper Functions

```tsx
// Get progress color based on percentage
const color = getProgressColor(0.85); // Returns goalNear (orange)

// Get nutriscore color
const color = getNutriscoreColor('A'); // Returns dark green

// Format nutrition values
formatCalories(1532.7);           // "1533"
formatNutritionValue(25.4);       // "25g"
formatNutritionValue(25.4, 'ml'); // "25ml"
```

## 🔔 Toast Notifications

Use toast for user feedback:

```tsx
import Toast from 'react-native-toast-message';

// Success
Toast.show({
  type: 'success',
  text1: 'Success',
  text2: 'Food added to diary',
});

// Error
Toast.show({
  type: 'error',
  text1: 'Error',
  text2: 'Failed to add food',
});

// Info
Toast.show({
  type: 'info',
  text1: 'Offline Mode',
  text2: 'Using cached data',
});
```

## 📱 Screen Examples

### Dashboard Screen

```tsx
<NutritionDashboardScreen userId={user.id} />
```

Features:
- Date selector (Today, Yesterday, Custom)
- Calorie progress ring (animated)
- Macro breakdown (3 small rings)
- Water tracker with quick-add
- Quick actions (Scan, Search, Add Water)
- Meal diary list (grouped by meal type)

### Food Search Screen

```tsx
<FoodSearchScreen />
```

Features:
- Debounced search input (300ms)
- Loading indicator
- Results list with:
  - Food name & brand
  - Calories & macros preview
  - Nutriscore badge
  - Source badge (Cached/OFF)
- Pull-to-refresh
- Attribution footer

### Barcode Scanner Screen

```tsx
<BarcodeScannerScreen />
```

Features:
- Camera view with scan area overlay
- Corner markers for alignment
- Loading state during lookup
- Success state with food preview
- Error state with manual entry option
- Scan again functionality

### Food Detail Screen

```tsx
<FoodDetailScreen userId={user.id} />
```

Features:
- Food header with Nutriscore
- Portion size input (live calculation)
- Nutrition facts table
- Meal type selector (4 buttons)
- Date picker
- Notes input (optional)
- Add to diary button

## ♿ Accessibility

All components include:
- `accessibilityLabel` on interactive elements
- Proper heading hierarchy
- Color contrast compliance
- Screen reader support
- Keyboard navigation (web)

Example:
```tsx
<TouchableOpacity
  onPress={handleScan}
  accessibilityLabel="Scan food barcode"
  accessibilityRole="button"
>
  <Text>Scan</Text>
</TouchableOpacity>
```

## 🐛 Error Handling

All hooks and components include error handling:

```tsx
const { data, error, loading } = useSomeHook();

if (error) {
  return (
    <ErrorView
      message={error.message}
      onRetry={refresh}
    />
  );
}
```

Error states show:
- Icon (alert-circle)
- Error message
- Retry button

## 🔄 Real-time Updates

Using Supabase Realtime subscriptions:

```tsx
// Automatic updates when:
// 1. New food entry added
// 2. Food entry updated
// 3. Food entry deleted
// 4. Water intake added
// 5. Daily summary recalculated

// Example: Food diary subscription
useEffect(() => {
  const channel = supabase
    .channel(`food_diary_${userId}_${date}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_food_diary',
      filter: `user_id=eq.${userId}`,
    }, handleChange)
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [userId, date]);
```

## 📄 Open Food Facts Attribution

**IMPORTANT**: You MUST display attribution as per ODbL license requirements.

The `AttributionFooter` component is included and should be shown:

1. **Compact mode** - In search results footer
2. **Full mode** - In settings/about screen

```tsx
// Compact (in FoodSearchScreen)
<AttributionFooter compact />

// Full (in Settings/About)
<AttributionFooter />
```

Attribution text:
> "Nutritional data is provided by Open Food Facts (openfoodfacts.org), available under the Open Database License (ODbL)."

## 🧪 Testing

### Manual Testing Checklist

- [ ] Dashboard loads with correct date
- [ ] Calorie ring animates smoothly
- [ ] Macro rings show correct percentages
- [ ] Water tracker updates instantly
- [ ] Quick actions navigate correctly
- [ ] Food search debounces properly
- [ ] Search results clickable
- [ ] Barcode scanner requests permission
- [ ] Scanner detects barcodes
- [ ] Food detail calculates portions correctly
- [ ] Meal type selector works
- [ ] Date picker shows/hides
- [ ] Add to diary succeeds
- [ ] Swipe to delete works
- [ ] Real-time updates work
- [ ] Offline mode shows cached data
- [ ] Error states display properly
- [ ] Toast notifications appear

## 🚨 Common Issues

### 1. Reanimated not working
```bash
# Clear cache and restart
npx expo start -c
```

### 2. Gesture Handler conflicts
```tsx
// Ensure GestureHandlerRootView wraps entire app
<GestureHandlerRootView style={{ flex: 1 }}>
  <App />
</GestureHandlerRootView>
```

### 3. Camera permission denied
```json
// Check app.json has correct permissions
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "We need camera access to scan barcodes"
      }
    },
    "android": {
      "permissions": ["CAMERA"]
    }
  }
}
```

### 4. TypeScript errors
```bash
# Ensure types are up to date
npm install --save-dev @types/react @types/react-native
```

## 📈 Performance Optimization

### 1. Memoization
All calculated values use `useMemo`:

```tsx
const calorieProgress = useMemo(() => {
  if (!summary) return 0;
  return (summary.total_calories / summary.goal_calories) * 100;
}, [summary]);
```

### 2. Debouncing
Search debounced to 300ms to reduce API calls:

```tsx
const debounceTimer = useRef<NodeJS.Timeout | null>(null);

debounceTimer.current = setTimeout(async () => {
  // Perform search
}, 300);
```

### 3. Lazy Loading
Components load only when needed (navigation-based).

### 4. Image Optimization
No heavy images used - all icons are vectors.

## 🔐 Security Notes

- User IDs validated on backend
- No sensitive data in local storage
- API calls authenticated via Supabase
- Camera permission properly requested
- No XSS vulnerabilities (text properly escaped)

## 📚 Additional Resources

- [Open Food Facts API Docs](https://wiki.openfoodfacts.org/API)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [React Navigation Docs](https://reactnavigation.org/)
- [Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)

## 🎯 Future Enhancements

- [ ] Meal planning
- [ ] Recipe tracking
- [ ] Nutrition insights/analytics
- [ ] Export to CSV
- [ ] Weekly/monthly reports
- [ ] Integration with fitness trackers
- [ ] Custom food creation
- [ ] Favorites list
- [ ] Meal templates

## 📄 License

This UI layer is part of your proprietary application. The nutrition data from Open Food Facts is licensed under ODbL and must be attributed.

---

**Built with ❤️ using React Native, Expo, and Supabase**
