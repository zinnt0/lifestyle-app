# Nutrition UI - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Install Dependencies (1 min)

```bash
npm install --save \
  @gorhom/bottom-sheet \
  react-native-reanimated \
  react-native-gesture-handler \
  react-native-toast-message \
  expo-barcode-scanner \
  @react-native-community/datetimepicker
```

### Step 2: Configure Babel (30 sec)

Edit `babel.config.js`:

```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin', // ADD THIS LINE (must be last!)
  ],
};
```

### Step 3: Update App Root (1 min)

Edit your root `App.tsx`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your existing navigation */}
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>

      {/* ADD THIS */}
      <Toast />
    </GestureHandlerRootView>
  );
}
```

### Step 4: Add to Navigation (2 min)

**Option A: Tab Navigator**

```tsx
// In your TabNavigator.tsx
import { Ionicons } from '@expo/vector-icons';
import { NutritionStackNavigator } from './navigation/NutritionStackNavigator';
import { useAuth } from './contexts/AuthContext'; // Your auth context

export function TabNavigator() {
  const { user } = useAuth();

  return (
    <Tab.Navigator>
      {/* Existing tabs */}
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Training" component={TrainingScreen} />

      {/* ADD THIS */}
      <Tab.Screen
        name="Nutrition"
        children={() => <NutritionStackNavigator userId={user.id} />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

**Option B: Standalone**

```tsx
// In your main App.tsx or navigator
import { NutritionStackNavigator } from './navigation/NutritionStackNavigator';

<Stack.Screen name="Nutrition" component={NutritionStackNavigator} />
```

### Step 5: Configure Permissions (30 sec)

Edit `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-barcode-scanner",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to scan food barcodes"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "We need camera access to scan food barcodes"
      }
    },
    "android": {
      "permissions": ["CAMERA"]
    }
  }
}
```

### Step 6: Clear Cache & Run (30 sec)

```bash
# Clear Metro cache
npx expo start -c
```

## ✅ You're Done!

The nutrition tracking is now live in your app!

## 🎯 What You Get

### Screens
1. **Dashboard** - `/Nutrition` tab
   - Daily calorie & macro progress
   - Water tracking
   - Meal diary

2. **Food Search** - Tap "Search Food"
   - Debounced search
   - Open Food Facts integration
   - Cached results

3. **Barcode Scanner** - Tap "Scan Food"
   - Camera barcode scanning
   - Instant food lookup

4. **Food Detail** - Select any food
   - Portion calculator
   - Add to diary

## 🔧 Customization

### Change Theme Colors

Edit `src/constants/nutritionTheme.ts`:

```tsx
export const nutritionTheme = {
  colors: {
    protein: '#YOUR_COLOR',  // Default: #FF6B6B
    carbs: '#YOUR_COLOR',    // Default: #4ECDC4
    fat: '#YOUR_COLOR',      // Default: #FFD93D
    water: '#YOUR_COLOR',    // Default: #3498DB
  },
  // ...
};
```

### Change Default Water Goal

In your user profile creation:

```sql
INSERT INTO user_profiles (id, water_goal)
VALUES (user_id, 2500); -- 2500ml = 2.5L
```

### Change Nutrition Goals

Update user profile with calorie/macro goals:

```tsx
await supabase
  .from('user_profiles')
  .update({
    calorie_goal: 2000,
    protein_goal: 150,
    carbs_goal: 200,
    fat_goal: 60,
  })
  .eq('id', userId);
```

## 📊 Data Flow

```
User Action → Hook → Supabase → Real-time Update → UI Refresh
     ↓                              ↑
  Local Cache ←──────────────────────┘
```

## 🐛 Troubleshooting

### "Reanimated plugin not found"
```bash
# Clear cache
rm -rf node_modules
npm install
npx expo start -c
```

### "Camera permission denied"
- Check `app.json` has camera permissions
- Rebuild app: `npx expo run:ios` or `npx expo run:android`

### "User ID undefined"
- Ensure you're passing `userId` prop to `NutritionStackNavigator`
- Check your auth context provides `user.id`

### "Database error"
- Ensure Supabase tables are created (see main README)
- Check RLS policies allow user access

## 📱 Test It

1. Open Nutrition tab
2. Tap "Scan Food" → Scan a barcode (e.g., Coca-Cola)
3. Review food details → Add to diary
4. See it appear in dashboard
5. Swipe left to delete
6. Add water using quick buttons

## 🎨 Screenshots (Recommended)

Take screenshots and add to README:
- Dashboard view
- Food search results
- Barcode scanner
- Food detail screen
- Meal diary list

## 📚 Next Steps

1. **Read Full Docs**: `NUTRITION_UI_README.md`
2. **Customize Theme**: Edit `nutritionTheme.ts`
3. **Add Analytics**: Track user engagement
4. **Test Offline**: Verify caching works
5. **Add Insights**: Build nutrition analytics

## 💡 Pro Tips

1. **Pre-populate Cache**: Pre-load popular foods for your region
2. **Custom Foods**: Allow users to create custom entries
3. **Meal Templates**: Save common meals for quick logging
4. **Reminders**: Add notifications to log meals
5. **Insights**: Show weekly/monthly trends

## 🆘 Need Help?

1. Check `NUTRITION_UI_README.md` for detailed docs
2. Review existing backend services (`FoodService.ts`)
3. Check Supabase dashboard for data issues
4. Test with mock data first

## ✨ Credits

- **UI Framework**: React Native + Expo
- **Animations**: React Native Reanimated
- **Database**: Supabase (PostgreSQL + Realtime)
- **Food Data**: Open Food Facts (ODbL License)

---

**Happy Coding! 🚀**
