# Nutrition Documentation

Comprehensive user documentation for the nutrition calculation system.

## 📚 Available Guides

### [Nutrition Calculation Guide](./nutrition-calculation-guide.md)

**Complete user guide covering:**

1. **Basics** 🎯
   - What is BMR, TDEE, Macros?
   - Why it matters for fitness goals

2. **Training Goals** 📊
   - Strength Building 🏋️
   - Muscle Gain 💪
   - Weight Loss ⚖️
   - Endurance 🏃
   - General Fitness 🌟

3. **Scientific Foundation** 🔬
   - Mifflin-St Jeor Formula
   - Physical Activity Levels (PAL)
   - Protein Recommendations

4. **Goal Setting** ⚖️
   - Realistic timelines
   - Handling goal conflicts
   - Body recomposition explained

5. **Dynamic Adjustments** 🔄
   - TDEE Calibration
   - When to change goals
   - Plateau handling

6. **FAQ** ❓
   - 15+ common questions answered
   - Evidence-based responses

7. **Scientific Sources** 📚
   - All DOI references
   - Peer-reviewed research

**Target Audience:** End users, fitness enthusiasts
**Format:** Markdown, mobile-friendly
**Language:** German

---

## 📱 Interactive Components

### NutritionFAQ Component

Interactive FAQ component for the app with:

**Features:**
- ✅ Accordion-style Q&A
- ✅ Search functionality
- ✅ Category filtering (Basics, Goals, Macros, Progress, Advanced)
- ✅ Feedback buttons ("War das hilfreich?")
- ✅ Empty state handling

**Usage:**
```tsx
import { NutritionFAQ } from '@/components/Nutrition/NutritionFAQ';

<NutritionFAQ
  onFeedback={(questionId, helpful) => {
    console.log(`Feedback: ${questionId} - ${helpful}`);
  }}
/>
```

**Location:**
- Component: `src/components/Nutrition/NutritionFAQ.tsx`
- Example Screen: `src/components/Nutrition/NutritionFAQScreen.example.tsx`

---

## 🎯 Content Overview

### Nutrition Calculation Guide

#### Section 1: Basics (2,000 words)
**Topics:**
- BMR definition & calculation
- TDEE calculation & components
- Macronutrients explained
- Why calorie balance matters

#### Section 2: Training Goals (8,000 words)
**For each goal:**
- Definition & target audience
- Calorie adjustment explained
- Macro distribution with rationale
- Example weekly meal plan
- Scientific justification

**Goals covered:**
1. Strength (+250 kcal, 1.9 g/kg protein)
2. Muscle Gain (+400 kcal, 2.0 g/kg protein)
3. Weight Loss (-500 kcal, 2.2 g/kg protein)
4. Endurance (+100 kcal, 1.5 g/kg protein, high carbs)
5. General Fitness (adaptive, 1.7 g/kg protein)

#### Section 3: Scientific Foundation (3,000 words)
**Topics:**
- Mifflin-St Jeor formula validation
- PAL factor selection (5 levels with examples)
- Protein requirements by goal
- Evidence from peer-reviewed studies

#### Section 4: Goal Setting (2,000 words)
**Topics:**
- 7,700 kcal rule explained
- Realistic weight loss/gain rates
- Timeline calculations with examples
- Goal conflict detection
- Body recomposition strategy

#### Section 5: TDEE Calibration (1,500 words)
**Topics:**
- Why formulas aren't perfect
- Real-world data calibration
- Confidence levels
- When to adjust goals
- Plateau handling strategies

#### Section 6: FAQ (3,000 words)
**15 Questions covering:**
- Basics (BMR, TDEE, PAL selection, calibration)
- Goals (choosing, deficit size, conflicts)
- Macros (protein, flexibility, carbs/fats)
- Progress (fluctuations, plateau, too fast)
- Advanced (cardio, cheat days, recomposition)

#### Section 7: Scientific Sources (500 words)
**12 Peer-reviewed references with:**
- Full citation
- DOI link
- Brief summary
- Relevance to calculations

---

## 🔬 Scientific Rigor

All content is backed by peer-reviewed research:

### Key Studies Referenced

1. **BMR Calculation**
   - Mifflin et al. (1990) - DOI: 10.1093/ajcn/51.2.241
   - Accuracy: ±10% for 68% of population

2. **Protein Requirements**
   - Morton et al. (2018) - DOI: 10.1136/bjsports-2017-097608
   - Optimal: 1.6-2.2 g/kg for muscle gain

3. **Deficit Limits**
   - Hector & Phillips (2018) - DOI: 10.1123/ijsnem.2017-0273
   - Max: -500 kcal for muscle preservation

4. **High Protein in Deficit**
   - Pasiakos et al. (2013) - DOI: 10.1096/fj.13-230227
   - 2.4 g/kg reduces muscle loss by 25-50%

5. **Macro Distribution**
   - Thomas et al. (2016) - DOI: 10.1249/MSS.0000000000000852
   - ACSM Position Statement

---

## 📊 Content Statistics

- **Total Words:** ~20,000
- **Reading Time:** ~80 minutes
- **Scientific References:** 12
- **Example Calculations:** 15+
- **FAQ Questions:** 15
- **Training Goals:** 5 (detailed)

---

## 🎨 Content Structure

### Typography Hierarchy
```markdown
# Main Title (H1)
## Major Section (H2)
### Subsection (H3)
#### Detail Section (H4)

**Bold** for emphasis
*Italic* for quotes
`Code` for formulas
> Blockquotes for studies

Tables for comparisons
Lists for steps
Examples in code blocks
```

### Visual Elements
- ✅ Checkmarks for benefits
- ❌ X for risks/problems
- 🎯 Icons for sections
- Tables for data comparison
- Code blocks for examples

---

## 🌍 Localization

**Current:** German (de-DE)
**Planned:** English (en-US)

### Translation Considerations
- Scientific terms (BMR, TDEE) - keep English abbreviations
- DOI links - keep as-is
- Formulas - universal
- Examples - adapt for locale (kg vs lbs)

---

## 🔄 Maintenance

### Update Schedule
- **Monthly:** Check for new research
- **Quarterly:** Update statistics & examples
- **Annually:** Review all scientific sources

### Version Control
```
Version 1.0 (Jan 2024):
- Initial comprehensive guide
- 5 training goals
- 15 FAQ questions
- 12 scientific references
```

---

## 📱 App Integration

### Where to Use

1. **Onboarding Flow**
   - Link to guide during goal setup
   - Explain BMR/TDEE calculations

2. **FAQ Screen**
   - Dedicated tab/screen
   - Search & category filter
   - In-app component

3. **Goal Conflicts**
   - Link to conflict section
   - Explain body recomposition

4. **Help & Support**
   - Full guide access
   - Contextual help links

5. **Settings**
   - Link from PAL selection
   - Link from goal selection

### Deep Linking
```typescript
// Link to specific sections
navigation.navigate('FAQ', { category: 'macros' });
navigation.navigate('Guide', { section: 'weight-loss' });
navigation.navigate('Guide', { section: 'tdee-calibration' });
```

---

## 🎓 Educational Value

### Learning Objectives

After reading, users should understand:
1. ✅ How their calorie targets are calculated
2. ✅ Why protein requirements vary by goal
3. ✅ Realistic expectations for their goal
4. ✅ How to handle plateaus
5. ✅ When and how to adjust their plan

### Bloom's Taxonomy Levels
- **Remember:** BMR definition, PAL levels
- **Understand:** Why protein is higher in deficit
- **Apply:** Calculate own timeline
- **Analyze:** Identify goal conflicts
- **Evaluate:** Assess progress vs expectations

---

## 📈 Success Metrics

### User Engagement
- FAQ views per user
- Average read time
- Search queries
- Feedback button clicks (helpful/not helpful)

### Support Reduction
- Fewer support tickets about calculations
- Self-service resolution rate
- User confidence in plan

---

## 🚀 Future Enhancements

### Planned Features
1. **Interactive Calculators**
   - BMR calculator
   - TDEE calculator
   - Timeline estimator

2. **Video Content**
   - PAL level demonstrations
   - Meal prep examples
   - Progress tracking tutorial

3. **Personalized Recommendations**
   - AI-generated tips based on user data
   - Goal-specific quick tips

4. **Community Q&A**
   - User-submitted questions
   - Expert answers
   - Voting system

---

## 📝 Contributing

### Adding FAQ Questions

1. Edit `NutritionFAQ.tsx`
2. Add to `FAQ_DATA` array
3. Assign category
4. Write clear question & detailed answer
5. Test search functionality

### Updating Guide Content

1. Edit `nutrition-calculation-guide.md`
2. Maintain section structure
3. Add scientific sources
4. Update version in README

---

## 📞 Support

For questions about this documentation:
- **Content:** Open GitHub issue with `docs` label
- **Technical:** Open GitHub issue with `component` label
- **Scientific accuracy:** Include DOI references

---

*Last Updated: January 2024*
*Version: 1.0*
