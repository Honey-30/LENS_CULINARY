# Culinary Lens

AI-powered cooking assistant for ingredient recognition, offline-first recipe discovery, pantry intelligence, meal planning, and guided cooking.

> The browser and Google AI Studio title is set to "My Google AI Studio App" while the product name used inside the app remains Culinary Lens.

## Technical Documentation

- Full engineering specification: [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)
- Complete deep-dive project guide: [PROJECT_DETAILED_GUIDE.md](PROJECT_DETAILED_GUIDE.md)

## Latest Updates (April 2026)

- Updated image URLs in static recipe data to working links for reliable recipe thumbnails.
- Upgraded premium UI styling for Shopping List, Saved Recipes, Profile, Pantry, and Cooking Timer experiences.
- Restyled the Meal Planner to a premium light theme while keeping other screens unchanged.
- Separated the public Studio/browser title from the in-app Culinary Lens product name.
- Added quantity + unit entry in Shopping List instead of fixed default values.
- Added broader back-navigation coverage across workflow pages.
- Improved Cooking Mode with smarter per-step timer extraction and optional auto-next behavior.
- Improved "What Can I Cook RIGHT NOW?" matching and ranking quality using stronger ingredient normalization.
- Added Gemini image generation support when API key is available, with safe static-image fallback when unavailable.
- Improved ingredient perception robustness by tuning detection recovery and confidence thresholds.
- Added pantry synchronization updates after cooking completion and tiny last-cooked activity context in pantry view.
- Added per-product count display support (`xN`) for ingredients and pantry items where quantity metadata is available.

## What This Project Is

Culinary Lens is an **AI-powered cooking companion** that uses advanced vision, conversational AI, and personalized intelligence to transform how people cook.

**Core User Journey:**

1. **Scan smart** — AI detects ingredients from fridge, table, or packaged items (with OCR).
2. **Cook instantly** — Zero-input "What Can I Cook RIGHT NOW?" mode suggests recipes in seconds.
3. **Adapt dynamically** — Conversational AI handles substitutions, macro adjustments, and real-time recipe tweaks via voice or text.
4. **Cook hands-free** — Voice commands + AR overlays make kitchen execution seamless.
5. **Get smarter** — Personalized taste model + consumption analytics improve future recommendations.

**Key Differentiators:**

- ✅ **Zero-Input Mode:** Opens app → instant suggestions (no typing, no scan)
- ✅ **Conversational Cooking:** "I don't have onions" → Auto substitutions
- ✅ **Personalized Brain:** Learns spice tolerance, cuisine preference, diet goals
- ✅ **Fridge Intelligence:** Expiry detection + "use today" prioritization
- ✅ **Hands-Free Kitchen:** Voice-first interface for actual kitchen use
- ✅ **Cost & Sustainability:** Optimize by budget, waste reduction, or health goals
- ✅ **Offline-First:** Full recipe discovery without internet
- ✅ **Works Guest Mode:** No sign-in required; cloud sync when ready

## Core Features

### 🎯 Zero-Input Intelligence Layer

1. **"What Can I Cook RIGHT NOW?" Mode** ⚡
   - Zero-input AI suggestions based on pantry + past scans + preferences.
   - Instant recipe readiness scores with estimated cooking time.
   - Example: "You can cook Paneer Butter Masala in 20 min" — no typing required.
   - Learns from user behavior and cooking history.

2. **Personalized Cooking Brain** 🧬
   - Dynamic taste model learns user preferences:
     - Spicy tolerance 🌶️
     - Cuisine preferences
     - Diet type (veg/high protein/low carb)
   - Auto re-ranks recipes based on taste profile.
   - Suggests smart substitutions aligned with preferences.

### 🔍 Advanced Computer Vision

3. **Multi-Zone Scene Detection**
   - Divide images into zones (fridge shelf, table, basket, etc.).
   - Improved accuracy through contextual awareness.
   - Better ingredient classification in real-world scenarios.

4. **Fridge Intelligence Mode**
   - Specialized detection for refrigerated items.
   - Real-time expiry risk detection and highlighting.
   - Prioritizes: "Use this today" vs "Going bad soon" vs "Fresh".
   - Smart waste reduction insights.

5. **Packaged Food OCR + Nutrition Extraction**
   - Reads labels from packaged items (milk, bread, sauces, etc.).
   - Extracts: Expiry date, calories, ingredients, allergens.
   - Combines OCR data with AI to suggest recipes using packaged items.
   - Seamless integration with meal planning.

### 💬 Conversational & Voice Interface

6. **Conversational Cooking Assistant** 🗣️
   - ChatGPT-like cooking copilot for real-time recipes adjustments.
   - User can say:
     - "I don't have onions, what now?" → Auto substitutions
     - "Make it high protein" → Dynamically adjusts recipe
     - "Reduce calories" → Real-time macro optimization
   - System updates recipe ingredients and steps instantly.

7. **Voice-First Cooking Mode** 🎙️
   - Hands-free kitchen control:
     - "Next step"
     - "Repeat"
     - "Set timer for 5 min"
     - "What's the next ingredient?"
   - Works seamlessly with built-in timers and step guidance.

### 👨‍🍳 Intelligent Cooking Execution

8. **Adaptive Cooking Mode (SUPER UNIQUE)** 🎯
   - Real-time dynamic cooking engine:
     - If user delays → auto-adjusts timing
     - If user skips step → intelligently adapts recipe flow
     - If user says "done early" → moves ahead to next phase
   - Learns cooking speed patterns per user.

9. **AR Cooking Overlay** (Advanced / Optional) 🎥
   - Overlays recipe instructions on camera feed.
   - Visual guides for:
     - Where to cut (with knife positioning hints)
     - How much to pour (visual portions)
     - Optimal heat levels
   - Next-gen kitchen UX.

### 📊 Knowledge & Analytics Layer

10. **Ingredient Graph / Knowledge Graph**
    - Build semantic relationships:
      - Tomato → sauces, curries, salads
      - Paneer → Indian recipes cluster
    - Enables:
      - Better recipe recommendations
      - Smarter substitution suggestions
      - Cross-cuisine inspiration

11. **Scan Evolution Tracking** (VERY UNIQUE) 🔄
    - Track pantry changes over time.
    - Analytics dashboard shows:
      - Waste patterns
      - Consumption habits
      - Seasonal trends
    - Helps optimize future shopping and meal planning.

### 💰 Real-World Utility Features

12. **Cost-Aware Cooking**
    - Add ingredient pricing data.
    - Suggest recipes by:
      - Cheapest option
      - Budget meals
      - Cost per serving
    - Smart budget meal planning.

13. **Sustainability Mode** 🌱
    - Recipes optimized for waste reduction.
    - Leftover-first suggestions:
      - "You have half onion → use it in..."
      - MultiRecipe clustering for ingredient reuse
    - Tracks environmental impact per recipe.

14. **Health Mode (AI Dietician Lite)** 🥗
    - Macro tracking:
      - Calories
      - Protein
      - Carbs
      - Fiber
      - Allergen flags
    - Daily goal suggestions:
      - "You need 20g protein more today"
      - Finds recipes that complement daily nutrition without exceeding targets
    - Meal plan nutritional balance verification.

### 🏛️ Foundation Features

15. **AI Ingredient Vision**
    - Camera scan and image upload.
    - Ingredient detection with confidence cues.
    - Human-detection guardrail for privacy.

16. **Perception Map and Ingredient Manifest**
    - Visual ingredient mapping view.
    - Manual add/remove ingredient control.
    - Smart ingredient substitutions.

17. **Recipe Intelligence**
    - Hybrid matching against static and large local recipe datasets.
    - Nutritional-goal aware sorting.
    - Readiness score to show how closely a recipe matches available ingredients.

18. **Offline-First Cooking**
    - Offline Manual Mode for recipe discovery without camera/API.
    - Large local dataset fallback for robust suggestions.

19. **Scan Vault**
    - Auto-save scan results with timestamp tracking.
    - Reuse prior scan results in one click.
    - Delta insights between scans to track ingredient changes.

20. **Saved Recipes (Guest + Signed-in)**
    - Works without sign-in via local storage fallback.
    - Cloud sync when signed in.
    - Rating and tagging system.

21. **Smart Pantry**
    - Pantry tracking with expiry awareness.
    - Ingredient suggestion chips while typing.
    - Batch add/remove operations.

22. **Shopping List**
    - Add from recipe ingredients.
    - Toggle and clear items.
    - Guest mode local fallback + signed-in cloud mode.
    - Smart grouping by store section.

23. **Meal Planner**
    - Plan meals by date and type.
    - Guest mode local fallback + signed-in cloud mode.
    - Nutritional summary per day/week.

24. **Cooking Mode**
    - Step-by-step guided instructions.
    - Built-in per-step countdown timer.
    - Voice playback support.
    - Equipment and ingredient prep visualization.

25. **Ingredient Presets & Smart UX**
    - Ingredient Presets: save, reuse, and delete custom ingredient sets.
    - Pantry Autofill Assistant: merge missing pantry items into current session.
    - Ingredient type-ahead support across key manual inputs.

## Architecture Highlights

### Intelligence Layers

- **Vision Layer:** Multi-zone scene detection + packaged food OCR for comprehensive ingredient capture
- **Personalization Layer:** Taste model + consumption analytics for dynamic re-ranking
- **Reasoning Layer:** Ingredient graph + knowledge base for smart substitutions
- **Adaptation Layer:** Real-time recipe modification based on user input (voice, text, or live cooking adjustments)
- **Analytics Layer:** Waste patterns, cost insights, nutritional balance tracking

### Upcoming Roadmap

🚀 **Phase 2 (Advanced):**
- AR cooking overlay with visual guidance
- Voice-first kitchen interface expansion
- Ingredient sustainability scoring
- Team meal planning (family/household sync)
- Recipe cost analytics dashboard

🚀 **Phase 3 (Game Changer):**
- LLM-powered nutrition planning with daily goal recommendations
- Social recipe sharing + community feedback
- Smart grocery store integration
- ML-based cooking technique tutorials
- Multi-language support

## Tech Stack

1. Frontend: React 19 + TypeScript + Vite
2. UI/Motion: Tailwind-style utility classes + Motion + Lucide icons
3. Charts: Recharts
4. AI/ML: 
   - Google GenAI SDK (recipe suggestions, conversational cooking)
   - TensorFlow.js or ONNX (optional: local ML for taste model, cost predictions)
5. Vision: OpenCV.js or MediaPipe (multi-zone detection, scene segmentation)
6. Voice: Web Speech API + text-to-speech (hands-free cooking)
7. AR (Optional): Three.js + WebAR or similar
8. Auth/Cloud: Firebase Auth + Firestore
9. Offline Persistence: localStorage-based service layer + IndexedDB for large datasets

## Project Structure

1. `src/App.tsx`:
- Main workflow state machine and primary pages.

2. `src/components/`:
- Focused feature UIs (Pantry, Meal Planner, Profile, Timer, Shopping List, Error Boundary).

3. `src/services/`:
- Domain logic for recipes, vision, storage, pantry, meal plan, shopping list, scan vault, ingredient presets, suggestions.

4. `src/services/staticRecipes.ts`:
- Large static recipe source for offline matching.

5. `src/services/recipeDatabase.ts`:
- Additional generated local recipe dataset used in matching logic.

## Prerequisites

1. Node.js 18+
2. npm 9+

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure API key (optional for online AI features):

- In-app settings supports entering Gemini API key.
- You can also provide `GEMINI_API_KEY` via environment at runtime.
- For voice features, ensure microphone permissions are granted.

3. Enable Optional Features:

- **Vision Zones (Multi-zone detection):** Requires TensorFlow.js or MediaPipe setup (included in dependencies).
- **Voice-First Cooking:** Requires `web-speech-api` polyfill for cross-browser support.
- **AR Overlays:** Optional; requires Three.js (can be added separately).
- **Conversational AI:** Uses Gemini API; ensure API key is configured.

4. Start development server:

```bash
npm run dev
```

5. Open:

- http://localhost:3000

## Scripts

1. Development

```bash
npm run dev
```

2. TypeScript check

```bash
npm run lint
```

3. Production build

```bash
npm run build
```

4. Preview build

```bash
npm run preview
```

---

# 📖 User Guide: Feature Documentation

## 🎯 Readiness Score - Understanding Recipe Compatibility

### What is Readiness Score?

The **Readiness Score** is a percentage (0-100%) that shows how well a recipe matches your current pantry and preferences. It combines:
- **Ingredient availability**: How many ingredients you already have
- **Cooking time**: Estimated prep + cook duration
- **Personal preferences**: Your taste profile, diet, spice tolerance
- **Difficulty level**: Recipe complexity vs your skill level

### How to Use Readiness Score

**Better Match = Higher Score**

| Score Range | Meaning | Recommendation |
|-------------|---------|-----------------|
| 90-100% ✅ | Perfect match | Cook it now! All ingredients ready |
| 75-89% | Very good | Minor substitutions needed |
| 60-74% | Good | Missing a few ingredients |
| 45-59% | Fair | More substitutions required |
| <45% ⚠️ | Poor match | Consider other recipes |

**Example:**
- You have: Chicken, Rice, Broccoli, Garlic
- Recipe needs: Chicken, Rice, Broccoli, Garlic, Soy Sauce, Ginger
- **Readiness: 66%** (4 of 6 items available)

### Tips for Better Readiness Scores
1. ✅ **Keep pantry updated** - Scan ingredients after shopping
2. ✅ **Set your preferences** - Configure spice & diet in Profile Settings
3. ✅ **Add specialty items** - Pantry accepts manual ingredient entries
4. ✅ **Use presets** - Save your common ingredient sets for instant matching

---

## 🤖 Top Tier Tools & Advanced Features

### 1. **Pantry Autofill Assistant** 🧠

**Purpose**: Automatically suggests pantry items you might have forgotten to log.

**How to Use:**

1. **Open Pantry Tracker** → Bottom section shows "Pantry Autofill Assistant"
2. **View Suggestions** → App analyzes your scan history and past recipes
3. **Merge Items** → Click "Merge Pantry Suggestions" to add forgotten items
4. **Auto-detection** → System learns:
   - Items you frequently use
   - Items from past scans
   - Items common in your recipes

**Example Workflow:**
```
You scanned milk 3 times → Autofill suggests: "Add milk to pantry?"
You cooked with butter last week → Autofill suggests: "Add butter?"
```

**When to Use:**
- After mass cooking/meal prep
- When you notice missing staples in recipes
- When comparing pantry vs scan history

---

### 2. **Ingredient Presets** 💾

**Purpose**: Save and reuse your favorite ingredient combinations in one tap.

**How to Save a Preset:**

1. **In Pantry Tracker** → Select your ingredients
2. **Enter Preset Name** → E.g., "Gym Meal Set", "Quick Breakfast", "Dinner Prep"
3. **Click Save** → Preset is stored locally
4. **Reuse Anytime** → One-tap apply past presets

**Built-in Presets Example:**

| Preset Name | Ingredients | Use Case |
|------------|------------|----------|
| Gym Meal Set | Chicken, Rice, Broccoli, Eggs, Protein Powder | High-protein meals |
| Quick Breakfast | Oats, Milk, Banana, Honey, Almonds | 5-minute breakfast |
| Dinner Prep | Garlic, Onion, Tomato, Chicken, Spices | Indian curries |
| Mediterranean | Olive Oil, Feta, Cucumber, Tomato, Oregano | Greek salads |

**How to Reuse:**

1. **Pantry Tracker** → "No presets yet" section
2. **Select past preset** → Original ingredients load instantly
3. **Modify if needed** → Add/remove items on the fly
4. **Save recipes** → Pre-filled ingredient list in recipes

**Pro Tip:**
- Save presets for **every season** (winter comfort food, summer light meals)
- Save by **cooking skill level** (beginner 5-min, advanced techniques)
- Save by **dietary goal** (keto, vegan, calorie-controlled)

---

### 3. **Conversion & Measurement Tool** 📏

**Purpose**: Convert measurements, scale recipes, and adjust portions dynamically.

**How to Use:**

**Scaling a Recipe:**
1. **Open Recipe** → View ingredient list
2. **Adjust Servings** → Change from 4 to 2 servings
3. **Auto-scale** → All quantities update proportionally
4. **Example:**
   - Original: 2 cups rice for 4 people
   - Scaled to 2: 1 cup rice for 2 people ✓

**Converting Units:**
1. **Select Ingredient** → E.g., "butter"
2. **Change Unit** → Cups → Grams → Tablespoons
3. **Auto-convert** → System shows equivalent amounts
4. **Common conversions:**
   - 1 cup = 240 ml
   - 1 tbsp = 15 ml
   - 100g = 3.5 oz

**Macro Adjustment:**
1. **Recipe Details** → View Calories, Protein, Carbs, Fat
2. **Adjust Servings** → Macros recalculate automatically
3. **Example:** "Make it 1000-calorie meal"
   - System suggests compatible portions
   - Recommends recipe modifications

---

### 4. **Smart Shopping List with Instamart Integration** 🛒

**Purpose**: Plan shopping and buy items instantly from Swiggy Instamart.

**How to Use:**

1. **Add Items** → Type ingredient name (e.g., "milk")
2. **Auto-suggestions** → Suggestions appear as you type
3. **Manage List** → 
   - ✅ Check items when bought
   - 📌 Organize by category (dairy, vegetables, grains)
   - 🗑️ Delete items

**Instamart Feature:**
1. **Click "Buy" Button** → Blue shopping bag icon per item
2. **Opens Swiggy Instamart** → Search page loads with product name
3. **Purchase Flow** → Complete order on Instamart
4. **Item Auto-Marks** → ✓ Marked as purchased when you click Buy
5. **Alternative Format**: Opens web OR app depending on device

**Example:**
```
Shopping List:
- Milk 1L [✅ BUY] → Opens Swiggy with "Milk 1L" search
- Eggs [✅ BUY] → Opens Swiggy with "Eggs" search
- Rice 2kg [✅ BUY] → Opens Swiggy with "Rice 2kg" search
```

---

### 5. **Smart Pantry with Expiry Tracking** 📅

**Purpose**: Track ingredients, monitor expiry dates, reduce food waste.

**How to Use:**

**Add Items:**
1. **Manual Add** → Type ingredient name
2. **Auto-Detection** → System shows:
   - Category (Vegetable, Dairy, Grain)
   - Storage location (Fridge, Freezer, Pantry)
   - Shelf life (e.g., 14 days for milk)
3. **Custom Expiry** → Optional: override with your purchase date

**Expiry Categories:**
```
🔴 Expiring Soon (within 3 days) → RED HIGHLIGHT
   "Use milk today!"
   
🟡 Going Bad Soon (1-2 weeks) → YELLOW 
   "Use carrots this week"
   
🟢 Fresh (3+ weeks) → GREEN
   "Pantry is well-stocked"
```

**Auto-Sync from Scans:**
1. **Scan Fridge** → Ingredients detected automatically
2. **Add to Pantry** → One-click "Add to Pantry Button"
3. **Auto-Expiry** → Calculated based on item type + date
4. **Track Changes** → Pantry updates across sessions

**Pro Features:**
- 📊 **Waste Analytics** → See which items you throw away most
- 🔄 **Scan History** → Reuse past scans; track changes
- 🎯 **Use-Today Priority** → Filters show expiring items first in recipe suggestions

---

### 6. **Meal Planner with Date & Time Selection** 📅

**Purpose**: Schedule meals by date, time, and meal type.

**How to Use:**

1. **Browse Recipes** → Select any recipe card
2. **Click Planner Icon** → Opens Modal dialog
3. **Select Date** → Pick any future date
4. **Select Meal Type** → BREAKFAST | LUNCH | DINNER | SNACK
5. **Confirm** → Meal added to calendar

**Weekly View:**
```
MONDAY
├─ Breakfast: Oatmeal
├─ Lunch: Grilled Chicken
└─ Dinner: Pasta Carbonara

TUESDAY
├─ Breakfast: Eggs & Toast
├─ Lunch: Dal Rice
└─ Dinner: Fish Curry
```

**Integration:**
- ✅ Auto-populates shopping list
- ✅ Generates nutritional summary
- ✅ Tracks meal variety
- ✅ Suggests complementary meals

---

### 7. **Personalized Profile Settings** 🧬

**Purpose**: Define your cooking preferences for smarter recommendations.

**Personalized Cooking Brain Settings:**

| Setting | Range | Impact |
|---------|-------|--------|
| **Spicy Tolerance** | 0-10 slider | Ranks recipes by heat level |
| **Diet Type** | Any / Vegetarian / High Protein / Low Carb | Filters available recipes |
| **Cuisine Preferences** | Multi-select (9 cuisines) | Auto re-ranks matching recipes |
| **Allergies** | Tag-based | Auto-excludes allergenic recipes |

**How to Configure:**

1. **Open Profile Settings** → Gear icon
2. **Personalized Cooking Brain** ❤️ section
3. **Adjust Sliders:**
   - Spicy: 🌶️ Slide left (mild) → right (fiery)
   - Skill Level: 1 (beginner) → 5 (expert)
4. **Select Cuisines:** 
   - Mark favorites: Italian, Thai, Mexican, etc.
   - Select "ALL" to remove filters
5. **Set Allergies:** Add items (peanuts, gluten, etc.)
6. **Save** → Auto-syncs with cloud

**Benefit:**
- 🎯 "What Can I Cook NOW?" mode learns from this
- 🎯 Instant suggestions match your taste
- 🎯 Substitutions respect your preferences

---

### 8. **Zero-Input "What Can I Cook RIGHT NOW?" Mode** ⚡

**Purpose**: Get instant recipe suggestions without typing or scanning.

**How to Use:**

1. **Landing Page** → Click "What Can I Cook RIGHT NOW?" button ⚡
2. **Auto-Analysis** → System checks:
   - Your pantry items
   - Recent scan history (last 5 scans)
   - Your taste preferences
   - Available time
3. **See Results** → Top 3 recipes with:
   - Estimated cook time
   - Readiness score %
   - Required ingredients highlighted

**Example Output:**
```
🥘 PANEER BUTTER MASALA
Readiness: 89% | Time: 20 min
✓ Have: Paneer, Butter, Onion, Garlic, Spices
✗ Need: Cream, Tomato Paste

🍜 FRIED RICE
Readiness: 96% | Time: 15 min
✓ Have: Rice, Eggs, Vegetables, Soy Sauce
✗ Need: None!

🍛 DAL RICE
Readiness: 92% | Time: 25 min
✓ Have: Dal, Rice, Spices
✗ Need: Onion (optional)
```

**When to Use:**
- 🏃 In a hurry (lunch/dinner prep)
- 🤔 Unsure what to cook
- 📱 Just opened the app
- 🎯 Want personalized suggestions

---

### 9. **Cooking Mode with Timers & Step Guidance** ⏱️

**Purpose**: Execute recipes hands-free with audio guidance and timers.

**How to Use:**

1. **Select Recipe** → Open any recipe
2. **Click "Cook Now"** → Enter Cooking Mode
3. **Step-by-Step Interface:**
   - 📝 Current step highlighted
   - ⏱️ Timer for this step (auto-starts)
   - 🔉 Audio playback (tap speaker icon)
   - ➡️ Next/Previous navigation

**Timer Features:**
- ⏰ Auto-countdown per step
- 📢 Audio alert when time's up
- 🔁 Repeat step audio
- 🎙️ Voice commands: "Next step", "Set timer 5 min"

**Step Format:**
```
STEP 3 of 6
Heat oil in pan
⏱️ [2:30 min remaining]
[Play Audio] [Skip] [Add Time]
Equipment needed: Pan, Oil
Ingredients: 2 tbsp Oil
→ NEXT STEP
```

**Pro Features:**
- 📸 Equipment prep visualization
- 📊 Ingredient checkoff as you go
- 🎨 Real-time adjustments (skip step, add time)
- 💬 Swap ingredients mid-recipe

---

### 10. **Saved Recipes & Collections** 📚

**Purpose**: Build your personal recipe library with ratings and tags.

**How to Use:**

1. **While Browsing** → Heart icon to save recipe
2. **Add Rating** → ⭐ 1-5 stars
3. **Add Tags** → "Quick", "Healthy", "Indian", "Dinner"
4. **View Saved** → Browse all saved recipes

**Collections:**
- 💚 Favorites (5-star recipes)
- 🥗 Healthy (low-cal, high-protein)
- 🚀 Quick Meals (<30 min)
- 👨‍👩‍👧‍👦 Family Favorites
- 🌶️ Spicy Challenged

**Search & Filter:**
```
Filters:
├─ Cuisine: Italian, Thai, Indian
├─ Cook Time: <15min, 15-30min, >30min
├─ Difficulty: Easy, Medium, Hard
├─ Tags: Quick, Healthy, Vegan
└─ Rating: ⭐⭐⭐⭐ and up
```

---

## 🔧 Additional Top-Tier Features

### A. **Scan History Vault** 📷
- Auto-saves all scan results with timestamps
- Reuse scans: Compare pantry changes over time
- Track trends: "Which items disappear fastest?"

### B. **Ingredient Suggestions** 💡
- Auto-complete while typing ingredient names
- Learn from your pantry history
- Common ingredient combinations

### C. **Nutritional Summary** 🥗
- Daily macros: Calories, Protein, Carbs, Fat
- Weekly meal balance
- Dietary goal tracking (keto, vegan, high-protein, etc.)

### D. **Recipe Database** 📚
- **1050+ recipes** covering 18 global cuisines
- Offline-first: Works without internet
- Smart matching: Ingredient + preference based

### E. **Multi-Language Support** 🌍
- Interface in English, Hindi, Spanish
- Recipes describe in preferred language
- Voice commands in native language

---

## 🎯 Quick Start Checklist

- [ ] **Fill your profile** → Allergies, diet, spice preference
- [ ] **Scan your fridge** → Get baseline pantry
- [ ] **Save ingredient presets** → Gym meals, quick breakfast, etc.
- [ ] **Set up meal plan** → Next week's meals
- [ ] **Create shopping list** → From meal recipes
- [ ] **Enable notifications** → Expiry alerts, meal reminders
- [ ] **Explore "What Can I Cook NOW?"** → See instant suggestions

---

## Data and Persistence Model

### Firestore (signed-in mode)
- Saved recipes + user ratings/tags
- Shopping list + collaborative lists
- Meal planner + nutritional summaries
- User taste profile (spice tolerance, cuisine preferences, diet goals)
- Cooking history + recipe feedback
- Cost preferences and budget goals
- Health/dietary tracking

### localStorage (guest/offline mode)
- Saved recipes fallback
- Shopping list fallback
- Meal plan fallback
- Scan vault + historical scans with timestamps
- Ingredient presets
- Pantry inventory + expiry tracking
- Taste model (local user preferences)
- Notification preferences and local UX states
- Consumption analytics (waste patterns, frequency data)

### IndexedDB (large datasets, optional)
- Large static recipe corpus for offline search
- Ingredient graph/knowledge base
- Cached AI responses for common queries

## Offline Experience

1. Offline Manual Mode allows ingredient entry without camera/API.
2. Recipe selection uses local datasets for continuity.
3. Most planning/list/saved flows remain usable in guest mode.

## Quality Checks

Use these before shipping:

```bash
npm run lint
npm run build
```

## Quality Checks

Use these before shipping:

```bash
npm run lint
npm run build
```

## Implementation Guide for Advanced Features

### 1. Zero-Input "What Can I Cook RIGHT NOW?" Mode

**Implementation Path:**
1. Create `instantRecipeSuggestion.ts` service that aggregates:
   - Current pantry items
   - Past 5 scans (from scan vault)
   - User taste preferences (from user model)
2. Rank recipes using hybrid score: (ingredient match × personalization multiplier)
3. Display top 3 suggestions with:
   - Estimated cook time
   - Readiness percentage
   - "Cook Now" CTA

**Component:** Add `QuickCookMode.tsx` as landing page option

### 2. Personalized Cooking Brain

**Implementation Path:**
1. Create `tasteModel.ts` service with schema:
   ```
   {
     spiceTolerance: 0-10,
     cuisinePreferences: string[],
     dietType: "veg" | "non-veg" | "high-protein" | "low-carb",
     allergens: string[],
     cookingSkillLevel: 1-5
   }
   ```
2. Build user preference learning from:
   - Recipe ratings/likes
   - Ingredient selections
   - Substitution choices
3. Apply taste model to recipe re-ranking

### 3. Conversational Cooking Assistant

**Implementation Path:**
1. Create `conversationalEngine.ts` that extends `visionEngine.ts`
2. Add new intent types:
   - `substitute_ingredient`: "I don't have X"
   - `adjust_macros`: "Make it high protein"
   - `modify_taste`: "Less spicy"
3. Use Gemini API with system prompt: "You are a cooking assistant. When user makes requests, modify recipe JSON in real-time."
4. Return updated recipe structure with:
   - Modified ingredients
   - Updated steps
   - Nutritional changes
   - Warnings if major changes

### 4. Voice-First Cooking

**Implementation Path:**
1. Integrate Web Speech API in `CookingTimer.tsx`
2. Add voice command handler for:
   - "Next step"
   - "Repeat"
   - "Set timer for X minutes"
   - "What's next?"
3. Use text-to-speech for step playback (browser or Firebase ML)
4. Store voice preferences in user settings

### 5. Multi-Zone Scene Detection

**Implementation Path:**
1. Use MediaPipe or TensorFlow.js for image segmentation
2. Divide image into zones: top (fridge), middle (table), bottom (basket)
3. Run ingredient detection per zone
4. Return results with zone context:
   ```
   {
     zone: "fridge",
     items: [...],
     confidence: 0.92
   }
   ```

### 6. Fridge Intelligence Mode

**Implementation Path:**
1. Create `fridgeIntelligence.ts` service
2. Add expiry tracking to pantry items:
   ```
   {
     name: "milk",
     addedDate: timestamp,
     expiryEstimate: timestamp,
     status: "fresh" | "use-today" | "going-bad"
   }
   ```
3. Highlight urgent items in UI
4. Suggest recipes prioritizing "use today" items

### 7. Packaged Food OCR + Nutrition Extraction

**Implementation Path:**
1. Use Google Vision API for OCR (or Tesseract.js locally)
2. Extract:
   - Expiry date (regex patterns)
   - Calories (text search)
   - Ingredients list
3. Create `packagedFoodParser.ts` to structure extracted data
4. Combine with AI to suggest recipes using packaged items
5. Store in pantry as special item type: `{type: "packaged", label_data: {...}}`

### 8. Adaptive Cooking Mode

**Implementation Path:**
1. Extend `CookingTimer.tsx` with adaptive engine
2. Track:
   - User step duration vs estimated time
   - Skipped steps
   - Early/late completions
3. Adjust timing for remaining steps:
   ```
   adjustedTime = estimatedTime × (userAvgSpeed / appAvgSpeed)
   ```
4. Offer step re-ordering if user is ahead/behind

### 9. Ingredient Graph / Knowledge Graph

**Implementation Path:**
1. Create `ingredientGraph.ts` with relationship map:
   ```
   {
     "tomato": {
       recipes: ["curry", "pasta", "salad"],
       substitutes: ["tomato-paste", "sun-dried-tomato"],
       cuisines: ["Indian", "Italian"],
       pairs-with: ["onion", "garlic"]
     }
   }
   ```
2. Use for:
   - Better substitution suggestions
   - Cross-recipe ingredient reuse
   - Cuisine discovery
3. Optional: Build dynamically from recipe corpus

### 10. Scan Evolution Tracking

**Implementation Path:**
1. Extend `scanResultService.ts` to store:
   ```
   {
     scanId,
     timestamp,
     items: [...],
     delta: {added: [...], removed: [...]}
   }
   ```
2. Create analytics dashboard showing:
   - Waste trends (items never used)
   - Consumption frequency
   - Seasonal patterns
3. Use Recharts for visualization

### 11. Cost-Aware Cooking & Sustainability Mode

**Implementation Path:**
1. Add pricing layer to ingredients:
   ```
   {
     name: "paneer",
     cost: 5.99,
     unit: "per-kg",
     costPer-serving: 1.50
   }
   ```
2. Add recipe cost calculation
3. Filter by: cheapest, most sustainable (least waste), high-value
4. Sustainability scoring:
   - Uses available pantry items
   - Leftovers reuse potential
   - Carbon footprint (optional)

### 12. Health Mode (AI Dietician Lite)

**Implementation Path:**
1. Store daily macro goals in user profile
2. Create `nutritionTracker.ts` service:
   ```
   {
     dailyGoals: {calories: 2000, protein: 100, carbs: 200, fat: 60},
     consumed: {...},
     remaining: {...}
   }
   ```
3. Suggest recipes that fit remaining macros:
   ```
   filterRecipes(recipes, (recipe) => 
     recipe.protein <= remaining.protein &&
     recipe.calories <= remaining.calories
   )
   ```
4. Show meal nutritional summary in planner
5. Warn if recipe exceeds remaining macros

## Notes

1. Build may emit non-blocking chunk size warnings due large client-side datasets.
2. If desired, use route/component code-splitting to reduce bundle size.
3. Voice and AR features require modern browser support (test across devices).
4. Implement feature flags for gradual rollout of advanced features.
5. Store large datasets (recipe corpus, ingredient graph) in IndexedDB for performance.
6. Consider implementing analytics logging to improve personalization algorithm.
7. Privacy first: All personal data (taste model, health data) should be encrypted before cloud sync.

## License

Apache-2.0 (see source headers).
