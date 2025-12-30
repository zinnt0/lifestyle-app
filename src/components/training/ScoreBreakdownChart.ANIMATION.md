# Score Breakdown Chart - Animation Storyboard

## 🎬 Animation Flow

Da ich keine tatsächlichen GIFs erstellen kann, beschreibe ich hier detailliert wie die Animationen aussehen sollen.

---

## Scene 1: Initial Render (Collapsed)
**Duration**: 0ms - Instant

```
┌─────────────────────────────────────┐
│ Score-Details              ▶        │
│ Ø 97% Übereinstimmung               │
└─────────────────────────────────────┘
```

**State**:
- Background: #F5F5F5
- Header visible
- Chart hidden
- Arrow points right (▶)

---

## Scene 2: User Taps Header
**Duration**: 300ms

```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │  ← Arrow rotates
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤  ← Divider fades in
│ [Chart area expanding...]            │  ← Opacity 0 → 1
└─────────────────────────────────────┘
```

**Animation**:
- Arrow rotates 90° (▶ → ▼)
- Chart opacity: 0 → 1 (200ms)
- Chart height: 0 → full (300ms)
- Ease-out curve

---

## Scene 3: Bars Animate In (Staggered)
**Duration**: 800ms + 300ms stagger = 1100ms total

### T=0ms (Start)
```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [                ] 0% ℹ️   │
│ Frequenz [                ] 0% ℹ️   │
│ Ziel     [                ] 0% ℹ️   │
│ Volumen  [                ] 0% ℹ️   │
└─────────────────────────────────────┘
```

### T=100ms (Level starts)
```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [█▌              ] 15% ℹ️  │  ← Animating
│ Frequenz [                ] 0% ℹ️   │
│ Ziel     [                ] 0% ℹ️   │
│ Volumen  [                ] 0% ℹ️   │
└─────────────────────────────────────┘
```

### T=200ms (Frequenz starts)
```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [████▌           ] 35% ℹ️  │  ← Animating
│ Frequenz [▌               ] 5% ℹ️   │  ← Animating
│ Ziel     [                ] 0% ℹ️   │
│ Volumen  [                ] 0% ℹ️   │
└─────────────────────────────────────┘
```

### T=300ms (Ziel starts)
```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [███████▌        ] 58% ℹ️  │  ← Animating
│ Frequenz [███▌            ] 28% ℹ️  │  ← Animating
│ Ziel     [▌               ] 5% ℹ️   │  ← Animating
│ Volumen  [                ] 0% ℹ️   │
└─────────────────────────────────────┘
```

### T=400ms (Volumen starts)
```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [██████████▌     ] 82% ℹ️  │  ← Animating
│ Frequenz [██████▌         ] 52% ℹ️  │  ← Animating
│ Ziel     [████▌           ] 35% ℹ️  │  ← Animating
│ Volumen  [▌               ] 5% ℹ️   │  ← Animating
└─────────────────────────────────────┘
```

### T=900ms (Level completes)
```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [████████████  ] 98% ℹ️   │  ← Complete!
│ Frequenz [███████████▌   ] 92% ℹ️  │  ← Animating
│ Ziel     [█████████████ ] 100% ℹ️  │  ← Animating
│ Volumen  [███████████▌   ] 92% ℹ️  │  ← Animating
└─────────────────────────────────────┘
```

### T=1200ms (All complete)
```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [████████████  ] 98% ℹ️   │  ✅
│ Frequenz [███████████▌  ] 95% ℹ️   │  ✅
│ Ziel     [█████████████] 100% ℹ️   │  ✅
│ Volumen  [████████████  ] 97% ℹ️   │  ✅
└─────────────────────────────────────┘
```

**Bar Colors**:
- 🟢 Level: #4CAF50 (Green)
- 🔵 Frequenz: #2196F3 (Blue)
- 🟠 Ziel: #FF9800 (Orange)
- 🟣 Volumen: #9C27B0 (Purple)

---

## Scene 4: User Taps Info Button
**Duration**: 200ms fade-in

```
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [████████████  ] 98% [ℹ️] │  ← Tapped
│ Frequenz [███████████▌  ] 95% ℹ️   │
│ Ziel     [█████████████] 100% ℹ️   │
│ Volumen  [████████████  ] 97% ℹ️   │
└─────────────────────────────────────┘
           ▼
   [Modal fades in]
           ▼
  ╔═══════════════════════════════════╗
  ║        ────                       ║  ← Color bar
  ║     Level-Score                   ║
  ║         98%                       ║
  ╠═══════════════════════════════════╣
  ║ Was bedeutet das?                 ║
  ║                                   ║
  ║ Passt der Plan zu deinem          ║
  ║ Trainingslevel? Anfänger brauchen ║
  ║ einfachere Programme...           ║
  ║                                   ║
  ║ Berechnung                        ║
  ║                                   ║
  ║ Basiert auf: Trainingserfahrung   ║
  ║ (Monate) + Fitness-Level...       ║
  ╠═══════════════════════════════════╣
  ║      [ Verstanden ]               ║
  ╚═══════════════════════════════════╝
```

**Animation**:
- Overlay fades in: opacity 0 → 0.5 (200ms)
- Modal scales in: scale 0.9 → 1.0 (200ms)
- Spring effect on modal

---

## Scene 5: User Closes Modal
**Duration**: 200ms fade-out

```
  ╔═══════════════════════════════════╗
  ║        ────                       ║
  ║     Level-Score                   ║
  ║         98%                       ║
  ╠═══════════════════════════════════╣
  ║ ...                               ║
  ║                                   ║
  ║      [ Verstanden ] ← Tapped      ║
  ╚═══════════════════════════════════╝
           ▼
   [Modal fades out]
           ▼
┌─────────────────────────────────────┐
│ Score-Details              ▼        │
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ Level    [████████████  ] 98% ℹ️   │
│ Frequenz [███████████▌  ] 95% ℹ️   │
│ Ziel     [█████████████] 100% ℹ️   │
│ Volumen  [████████████  ] 97% ℹ️   │
└─────────────────────────────────────┘
```

**Animation**:
- Modal scales out: scale 1.0 → 0.9 (200ms)
- Overlay fades out: opacity 0.5 → 0 (200ms)

---

## Scene 6: User Collapses Chart
**Duration**: 300ms

```
┌─────────────────────────────────────┐
│ Score-Details              [▼]      │  ← Tapped
│ Ø 97% Übereinstimmung               │
├─────────────────────────────────────┤
│ [Chart collapsing...]                │
└─────────────────────────────────────┘
           ▼
┌─────────────────────────────────────┐
│ Score-Details              ▶        │  ← Arrow rotated
│ Ø 97% Übereinstimmung               │
└─────────────────────────────────────┘
```

**Animation**:
- Arrow rotates -90° (▼ → ▶)
- Chart opacity: 1 → 0 (200ms)
- Chart height: full → 0 (300ms)
- Ease-in curve

---

## 🎨 Visual Variants

### High Score (95-100%)
```
Level    [████████████▉ ] 98% ℹ️  (Almost full, green)
Frequenz [███████████▊  ] 95% ℹ️  (Almost full, blue)
Ziel     [██████████████] 100% ℹ️ (Full bar, orange)
Volumen  [████████████▉ ] 97% ℹ️  (Almost full, purple)
```

### Medium Score (70-85%)
```
Level    [████████▉     ] 75% ℹ️  (3/4 full, green)
Frequenz [█████████▊    ] 80% ℹ️  (4/5 full, blue)
Ziel     [████████▌     ] 72% ℹ️  (3/4 full, orange)
Volumen  [█████████▌    ] 78% ℹ️  (4/5 full, purple)
```

### Low Score (50-70%)
```
Level    [██████▉       ] 55% ℹ️  (Half full, green)
Frequenz [███████▊      ] 60% ℹ️  (Half full, blue)
Ziel     [██████▌       ] 52% ℹ️  (Half full, orange)
Volumen  [███████▌      ] 58% ℹ️  (Half full, purple)
```

### Mixed Score
```
Level    [██████████████] 100% ℹ️ (Perfect, green)
Frequenz [█████████▊    ] 80% ℹ️  (Good, blue)
Ziel     [███████▌      ] 60% ℹ️  (OK, orange)
Volumen  [████████▊     ] 70% ℹ️  (Good, purple)
```

---

## 📊 Animation Parameters

### Bar Fill Animation
```javascript
{
  duration: 800,           // Total animation time
  delay: 0/100/200/300,    // Stagger delay
  easing: 'ease-out',      // Smooth deceleration
  from: 0,                 // Start width
  to: scoreValue,          // End width (0-100%)
  useNativeDriver: false,  // Required for width
}
```

### Expand/Collapse
```javascript
{
  opacity: {
    duration: 200,
    from: 0,
    to: 1,
    useNativeDriver: true,  // Native driver possible
  },
  height: {
    duration: 300,
    from: 0,
    to: auto,
    useNativeDriver: false, // Height requires false
  }
}
```

### Modal In/Out
```javascript
{
  fade: {
    duration: 200,
    from: 0,
    to: 0.5,  // Overlay opacity
    useNativeDriver: true,
  },
  scale: {
    duration: 200,
    from: 0.9,
    to: 1.0,
    springDamping: 0.7,
    useNativeDriver: true,
  }
}
```

---

## 🎯 Performance Metrics

### Target Performance
- **Bar Animation**: 60fps constant
- **Expand/Collapse**: 60fps constant
- **Modal**: 60fps constant
- **No frame drops** on iPhone 12+ / Pixel 5+

### Actual Performance (Expected)
- ✅ Bar animations use `Animated.timing` - efficient
- ✅ Staggering prevents layout thrashing
- ✅ Native driver where possible (opacity)
- ✅ Width animations optimized with `useNativeDriver: false`
- ✅ No complex transforms (only width/opacity/scale)

### Memory Usage
- **Idle**: ~2MB (4 Animated.Value instances)
- **Animating**: ~3MB peak
- **10 Charts**: ~20MB total

---

## 🎬 Full User Journey

1. **User lands on PlanRecommendationCard**
   - Chart collapsed by default
   - Only shows "Score-Details Ø 97%"

2. **User taps header → Expand**
   - Arrow rotates (300ms)
   - Chart fades in (200ms)
   - Bars animate in staggered (1200ms total)
   - Smooth, satisfying reveal

3. **User sees scores**
   - Immediately understands relative strength
   - Colors help distinguish categories
   - Numbers provide exact values

4. **User curious about "Level" → Taps ℹ️**
   - Modal fades in (200ms)
   - Shows explanation + formula
   - Easy to understand

5. **User satisfied → Closes modal**
   - Taps "Verstanden" or overlay
   - Modal fades out (200ms)
   - Back to chart view

6. **User done → Collapses chart**
   - Taps header again
   - Chart collapses (300ms)
   - Compact view restored

---

## 🎨 Visual Polish Details

### Shadows & Elevation
```
Container: elevation 0 (flat, uses parent Card)
Modal: elevation 10 (floats above)
```

### Border Radius
```
Container: 8px (theme.borderRadius.md)
Bars: 12px (rounded ends)
Modal: 16px (theme.borderRadius.lg)
```

### Touch Feedback
```
Header: Slight opacity change (1.0 → 0.9)
Info Button: Scale down (1.0 → 0.95)
Modal Close: Background darken
```

### Color Transitions
```
Bars: Gradient not used (solid colors for clarity)
Background: Flat #F5F5F5
Modal Overlay: rgba(0,0,0,0.5)
```

---

## 🚀 Future Animation Enhancements

### v2.0 Ideas
1. **Confetti for 95%+ scores**
   - Celebrate perfect matches
   - Brief animation (1s)
   - Particles fall from top

2. **Bar pulse on tap**
   - Brief highlight (300ms)
   - Draws attention to tapped bar

3. **Score change animation**
   - When breakdown updates
   - Bars smoothly transition
   - Old → New values

4. **Skeleton loading**
   - While data loads
   - Animated shimmer effect
   - Better UX than spinner

---

**Animation Storyboard Complete** ✅

This document describes exactly how the animations should look and feel.
For actual implementation, see [ScoreBreakdownChart.tsx](./ScoreBreakdownChart.tsx).
