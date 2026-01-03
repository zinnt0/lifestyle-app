# Nutrition UI - Cheat Sheet

Quick reference for common tasks.

## 🚀 Quick Start (Copy-Paste)

### Add to Navigation
```tsx
import { NutritionStackNavigator } from './navigation/NutritionStackNavigator';

<Tab.Screen
  name="Nutrition"
  children={() => <NutritionStackNavigator userId={user.id} />}
/>
```

### Use Dashboard
```tsx
import { NutritionDashboardScreen } from './screens/Nutrition';

<NutritionDashboardScreen userId={user.id} />
```

## 🎣 Hook Examples

### Get Daily Summary
```tsx
const { summary, loading, refresh } = useNutritionSummary(userId, '2025-01-03');

console.log(summary.total_calories); // 1523
console.log(summary.goal_calories);  // 2000
```

### Add Food to Diary
```tsx
const { addEntry } = useFoodDiary(userId, date);

await addEntry({
  food_item: foodItem,
  amount: 150,
  meal_type: 'lunch',
  consumed_at: new Date().toISOString(),
  calories: 300,
  protein: 25,
  carbs: 30,
  fat: 10,
});
```

### Track Water
```tsx
const { addWater, totalWater, goal } = useWaterTracking(userId, date);

await addWater(250); // Add 250ml
console.log(`${totalWater}ml / ${goal}ml`);
```

### Search Food
```tsx
const { results, search } = useFoodSearch();

search('apple'); // Debounced 300ms
```

### Scan Barcode
```tsx
const { food, scan } = useBarcodeScanner();

await scan('5000112548167');
console.log(food.name); // "Coca-Cola"
```

## 🧩 Component Snippets

### Calorie Ring
```tsx
<CalorieProgressRing consumed={1523} goal={2000} />
```

### Macro Breakdown
```tsx
<MacroBreakdown
  protein={{ consumed: 125, goal: 150 }}
  carbs={{ consumed: 180, goal: 200 }}
  fat={{ consumed: 45, goal: 60 }}
/>
```

### Water Tracker
```tsx
<WaterTracker
  totalWater={1200}
  goal={2000}
  onAddWater={(amount) => addWater(amount)}
/>
```

### Meal List
```tsx
<MealDiaryList entries={diaryEntries} userId={userId} />
```

## 🎨 Theme Quick Access

```tsx
import { nutritionTheme, getProgressColor } from '../constants/nutritionTheme';

// Colors
nutritionTheme.colors.protein    // #FF6B6B
nutritionTheme.colors.carbs      // #4ECDC4
nutritionTheme.colors.fat        // #FFD93D
nutritionTheme.colors.water      // #3498DB

// Spacing
nutritionTheme.spacing.md        // 16
nutritionTheme.spacing.lg        // 24

// Get dynamic color
const color = getProgressColor(0.85); // Orange (near goal)
```

## 🧭 Navigation

```tsx
// Navigate to search
navigation.navigate('FoodSearch');

// Navigate to scanner
navigation.navigate('BarcodeScanner');

// Navigate to detail
navigation.navigate('FoodDetail', { food: foodItem });
```

## 🔔 Toast Notifications

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
  text2: error.message,
});
```

## 🎯 Common Patterns

### Loading + Error State
```tsx
const { data, loading, error, refresh } = useSomeHook();

if (loading) return <ActivityIndicator />;
if (error) return <ErrorView onRetry={refresh} />;
return <DataView data={data} />;
```

### Date Formatting
```tsx
const today = new Date().toISOString().split('T')[0];
// "2025-01-03"
```

### Calculate Nutrition
```tsx
const ratio = servingSize / 100;
const calories = (food.calories || 0) * ratio;
```

## 🐛 Debug Commands

```bash
# Clear cache
npx expo start -c

# Check TypeScript
npm run lint

# View logs
npx react-native log-ios
npx react-native log-android
```

## 📱 Test Data

### Mock Food Item
```tsx
const mockFood: FoodItem = {
  barcode: '12345',
  source: 'openfoodfacts',
  name: 'Apple',
  calories: 52,
  protein: 0.3,
  carbs: 14,
  fat: 0.2,
};
```

### Mock Diary Entry
```tsx
const mockEntry: DiaryEntry = {
  id: '1',
  user_id: userId,
  food_item: mockFood,
  amount: 150,
  meal_type: 'snack',
  consumed_at: new Date().toISOString(),
  calories: 78,
  protein: 0.45,
  carbs: 21,
  fat: 0.3,
  created_at: new Date().toISOString(),
};
```

## ⚡ Performance Tips

```tsx
// Memoize expensive calculations
const progress = useMemo(() => {
  return (consumed / goal) * 100;
}, [consumed, goal]);

// Debounce user input
const debouncedSearch = useCallback(
  debounce((query) => search(query), 300),
  []
);
```

## 🔐 Security Checks

```tsx
// Validate user owns entry
const { data, error } = await supabase
  .from('user_food_diary')
  .select()
  .eq('id', entryId)
  .eq('user_id', userId) // ← Important!
  .single();
```

## 📖 Quick Links

- Full Docs: `NUTRITION_UI_README.md`
- Component API: `NUTRITION_COMPONENT_REFERENCE.md`
- Integration: `NUTRITION_QUICK_START.md`
- Summary: `NUTRITION_UI_SUMMARY.md`

