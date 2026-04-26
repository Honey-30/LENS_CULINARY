# Culinary Lens v2 - Complete Project Guide

## 1. What this project is
Culinary Lens is a React + TypeScript cooking assistant that takes users from ingredients to cooked meals.

The app supports:
- AI image-based ingredient detection
- Offline manual cooking and local recipe discovery
- Recipe ranking and generation
- Pantry tracking and expiry awareness
- Shopping list and Google Shopping redirect
- Meal planning and saved recipes
- Guided cooking mode with timers and voice playback
- Guest mode (no login) plus Firebase cloud sync when logged in

Core principle: local-first and graceful fallback if API/cloud is unavailable.

## 2. High-level architecture

Layers:
1. Presentation layer
- `src/App.tsx` as workflow orchestrator
- page components inside `App.tsx`
- feature components in `src/components/*`

2. Domain/service layer
- `src/services/*` handles vision, recipes, pantry, shopping, planner, storage, substitutions, preferences, gamification

3. Persistence layer
- localStorage for guest/offline mode
- Firebase Auth + Firestore for authenticated sync

4. External AI/integrations
- Google GenAI (Gemini) for vision, recipe generation, substitutions, image generation
- Optional Hugging Face object detection (if token is configured)
- Google Shopping web search redirect

## 3. Boot process and app shell

Entry:
- `src/main.tsx` mounts `<App />` inside `<ErrorBoundary />` and `<StrictMode>`.

Global safety:
- `src/components/ErrorBoundary.tsx` catches uncaught runtime errors and shows a reload UI.

Main orchestrator:
- `src/App.tsx` stores all workflow states and renders a single page at a time.
- Uses a finite workflow enum from `src/types.ts`.

Workflow states:
- LANDING
- API_CONFIG
- CAMERA_SCAN
- PROCESSING
- PERCEPTION_MAP
- INGREDIENT_LIST
- RECIPE_SELECTOR
- RECIPE_DETAIL
- COOKING_MODE
- POST_COMPLETION
- SAVED_RECIPES
- OFFLINE_MANUAL
- SCAN_HISTORY
- PANTRY_TRACKER
- MEAL_PLANNER
- PROFILE_SETTINGS
- SHOPPING_LIST

Navigation behavior:
- Bottom nav appears on most non-fullscreen pages.
- Fullscreen/immersive pages hide bottom nav (landing/camera/processing/cooking/api config).
- App also tracks `workflowHistory` and provides a global back button for pages that do not have native back controls.

## 4. Detailed page-by-page breakdown

### 4.1 LANDING page
Purpose:
- Main command center.

What it does:
- Starts instant quick-cook suggestions.
- Opens camera scan workflow.
- Opens offline mode.
- Opens saved recipes and scan vault.
- Handles sign-in/sign-out access.
- Opens API config page.
- Shows gamification progress card (streak, scans, cooks).

Main connections:
- To `CAMERA_SCAN`, `OFFLINE_MANUAL`, `SAVED_RECIPES`, `SCAN_HISTORY`, `API_CONFIG`, `RECIPE_SELECTOR`.

### 4.2 API_CONFIG page
Purpose:
- Configure and validate Gemini API key.

What it does:
- Reads current key from state.
- Validates by a low-cost Gemini ping call.
- Stores key to localStorage as `GEMINI_API_KEY`.
- Toggles free-tier mode and stores `FREE_TIER_MODE`.

Why it matters:
- This page controls whether AI features are enabled and how aggressively API calls are used.

### 4.3 CAMERA_SCAN page
Purpose:
- Capture or upload image for AI perception.

What it does:
- Opens camera using `getUserMedia` with environment-facing mode.
- Captures frame to canvas or accepts file upload.
- Sends image to processing pipeline.
- Cleans media tracks on unmount.

### 4.4 PROCESSING page
Purpose:
- Transitional state while asynchronous AI work runs.

What it does:
- Shows loading animation and stage text.
- Keeps user informed while image processing or recipe synthesis runs.

### 4.5 PERCEPTION_MAP page
Purpose:
- Build trust by visualizing detected ingredients.

What it does:
- Shows image with markers and optional bounding boxes.
- Lists detected entities with confidence/category.
- Shows pantry source counts (total/scanned/manual).
- Continues to ingredient manifest.

### 4.6 INGREDIENT_LIST page
Purpose:
- Final ingredient editing and preference setup before recipe generation.

What it does:
- Add/remove manual ingredients.
- Show substitutions per ingredient.
- Merge pantry autofill suggestions.
- Save/use/delete ingredient presets.
- Set cuisine and nutrition goals.
- Trigger synthesis (`startSynthesis`).

### 4.7 RECIPE_SELECTOR page
Purpose:
- Show ranked recipes from static and AI sources.

What it does:
- Displays recipe cards with readiness score.
- Supports save/unsave recipe.
- Opens add-to-meal-plan dialog.
- Opens details page.
- Back path changes depending on entry source (landing or ingredient list).

### 4.8 RECIPE_DETAIL page
Purpose:
- Deep decision page before cooking.

What it does:
- Loads hero image using recipe image service (AI or placeholder fallback).
- Shows nutrition chart and scaled macros.
- Supports serving size scaling.
- Shows smart cost estimate and timeline hints.
- Compares required ingredients against session + pantry availability.
- Marks missing ingredients and opens buy/substitution actions.
- Opens substitution bottom sheet with ranked alternatives.
- Starts cooking mode.

### 4.9 COOKING_MODE page
Purpose:
- Guided execution.

What it does:
- Displays one step at a time.
- Computes timer duration from explicit duration or parsed instruction text.
- Uses `CookingTimer` for countdown.
- Can auto-advance only when timer is trustworthy.
- Supports voice speech and mute toggle.
- Previous/next step controls.
- On completion: updates pantry consumption and gamification, then goes to completion page.

### 4.10 POST_COMPLETION page
Purpose:
- End-state celebration and summary.

What it does:
- Shows completion message.
- Displays macro summary.
- Displays newly unlocked badges.
- Sends user back to home or scan flow.

### 4.11 SAVED_RECIPES page
Purpose:
- Personal cookbook.

What it does:
- Shows saved recipes from cloud (signed-in) or local fallback (guest).
- Remove saved recipe.
- Start cooking directly.
- Shows summary counters and empty state.

### 4.12 OFFLINE_MANUAL page
Purpose:
- No-camera/no-AI fallback discovery.

What it does:
- Manual ingredient chip entry.
- Cuisine filters.
- Matches against local static datasets.
- If matches are low, uses fallback local recipe set.

### 4.13 SCAN_HISTORY page
Purpose:
- Scan vault and reusability.

What it does:
- Lists historical scans with timestamp, confidence, ingredients.
- Shows delta vs previous scan (added/removed ingredient count).
- Re-injects a scan into current workflow.
- Deletes scan entries.

### 4.14 PANTRY_TRACKER page
Purpose:
- Long-lived pantry management.

What it does:
- Manual add with optional expiry date.
- Auto category/storage/shelf life from pantry dataset.
- Type-ahead ingredient suggestions.
- Expiry warnings for near-expiry items.
- Source analytics (scanned/manual).
- Last-cooked consumption context.

### 4.15 MEAL_PLANNER page
Purpose:
- Daily and weekly planning.

What it does:
- Loads entries from local/cloud.
- Day navigation and weekly grid.
- Add/edit/delete entries.
- Weekly auto-generation by goal: BALANCED/HIGH_PROTEIN/LOW_CARB/VEG_FORWARD.
- Replaces duplicated generated week IDs before insert.

### 4.16 PROFILE_SETTINGS page
Purpose:
- Personalization and account controls.

What it does:
- Skill level selector.
- Allergies add/remove.
- Taste model controls (spicy tolerance, diet, cuisines).
- Notification flag toggle.
- Sign out.

Persistence:
- Allergies via `AllergyService`.
- Taste profile via `TasteModelService`.
- Notifications flag in localStorage.

### 4.17 SHOPPING_LIST page
Purpose:
- Grocery planning and purchase flow.

What it does:
- Add items with quantity + unit.
- Suggest ingredients while typing.
- Toggle purchased state.
- Remove individual item.
- Clear checked items.
- Completion progress tracking.
- Buy action opens Google Shopping search in new tab.

## 5. Feature components and their roles

`src/components/CookingTimer.tsx`
- Circular timer with play/pause/reset.
- Supports suggested timers and optional auto-start.

`src/components/PantryTracker.tsx`
- Full pantry management UI.

`src/components/MealPlanner.tsx`
- Weekly/day planner UI and goal-based generation.

`src/components/ProfileSettings.tsx`
- Preferences, allergies, account actions.

`src/components/ShoppingList.tsx`
- Grocery list UI with buy actions.

`src/components/ErrorBoundary.tsx`
- Global crash containment.

## 6. Service-by-service technical detail

### Vision and perception
`src/services/visionEngine.ts`
- Two-stage pipeline:
  1) Optional HF detector (`HF_API_TOKEN` env required)
  2) Gemini enrichment and structured JSON schema output
- Filters non-food labels.
- Fuses confidence and bounding boxes from both stages.
- Deduplicates ingredients and enforces confidence thresholds.
- Caches last result by image signature to reduce duplicate calls.

### Recipe intelligence
`src/services/recipeEngine.ts`
- Uses combined local dataset (`STATIC_RECIPES + LARGE_RECIPE_DATABASE`) for baseline matching.
- Applies cuisine + nutrition filters + overlap ranking.
- Applies allergy filtering.
- In no-key mode: static fallback only.
- In free-tier mode with enough static matches: skips AI generation.
- Otherwise asks Gemini for additional recipes and composes static + AI mix.
- AI failures fall back to static matches.

`src/services/instantRecipeSuggestionService.ts`
- Quick-cook suggestions from pantry + recent scans + current session ingredients.
- Uses normalization/stemming for stronger ingredient matching.
- Applies taste model multipliers (cuisine/diet/spicy) and allergy penalties.

### Recipe images
`src/services/recipeImageService.ts`
- Tries Gemini image-capable generation when key exists.
- Caches images by recipe name.
- Falls back to generated SVG placeholders if unavailable.

### Pantry and shelf life
`src/services/pantryService.ts`
- Local pantry CRUD.
- Auto metadata and expiry via pantry dataset.
- Separate sources: SCAN vs MANUAL.
- Expiry check and consumption tracking after cooking.

`src/services/pantryProductDataset.ts`
- Large metadata map of ingredient -> category/storage/shelf-life.
- Used by pantry UI and expiry logic.

### Shopping
`src/services/shoppingListService.ts`
- Guest mode: localStorage list.
- Signed-in mode: Firestore under user scope.
- Supports add/update/remove/clear-checked.

`src/services/instamartService.ts`
- Despite the name, this currently opens Google Shopping search URLs:
  - `https://www.google.com/search?q=<query>&tbm=shop`
- No external shopping API key needed.
- Opens a single combined query for multi-item shopping to avoid popup blocking.

### Planner and saved recipes
`src/services/mealPlanService.ts`
- Guest mode local storage; signed-in mode Firestore.
- CRUD operations and optional live listener method.

`src/services/storageService.ts`
- Firebase Google sign-in and auth observer.
- Cloud saved recipe CRUD + real-time listener.
- Structured Firestore error diagnostics.

`src/services/localSavedRecipeService.ts`
- Guest fallback for saved recipes.

### User intelligence and safety
`src/services/allergyService.ts`
- Stores allergies locally.
- Recipe filtering and ingredient allergen checks.

`src/services/tasteModelService.ts`
- Stores/retrieves taste model (spice, diet, cuisines).

`src/services/substitutionService.ts`
- AI substitutions if key exists.
- Static substitution fallback if AI fails/no key.
- Pantry-aware ranking (in-stock substitutions are prioritized).

`src/services/gamificationService.ts`
- Tracks streak, total scans, total cooks.
- Unlocks badge milestones.

`src/services/scanResultService.ts`
- Scan vault persistence with max-cap and confidence summary.

`src/services/ingredientSuggestionService.ts`
- Builds dictionary from defaults + all recipe ingredients.
- Used for type-ahead chips across pages.

`src/services/ingredientPresetService.ts`
- Save/list/delete reusable ingredient bundles.

## 7. Data model summary

Main types from `src/types.ts`:
- `Ingredient`
- `Recipe` and `RecipeStep`
- `NutritionalGoal`
- `UserProfile`
- `ShoppingListItem`
- `ScanResult`
- `Substitution`
- `WorkflowState`

How they connect:
- `Ingredient[]` is produced by scan/offline/manual and feeds recipe synthesis.
- `Recipe[]` from engine drives selector -> detail -> cooking flow.
- `ShoppingListItem` and `MealPlanEntry` are side utilities from recipe details/selector.
- `ScanResult` powers history and instant recommendation context.

## 8. Dataset details

Primary local recipe datasets:
1. `STATIC_RECIPES` (`src/services/staticRecipes.ts`)
- Curated recipe array used for deterministic fallback and baseline matching.

2. `LARGE_RECIPE_DATABASE` (`src/services/recipeDatabase.ts`)
- Programmatically generated offline dataset.
- `generateRecipes(2000)` creates 2000 recipes from cuisine/protein/veggie/base/sauce combinations.
- Exported as `RECIPE_DATASET` and aliased to `LARGE_RECIPE_DATABASE`.

Pantry metadata dataset:
- `PANTRY_PRODUCT_DATASET` (`src/services/pantryProductDataset.ts`)
- Contains ingredient storage class and shelf-life defaults.

Ingredient suggestion dataset:
- Built by merging default ingredient list plus ingredients extracted from both recipe datasets.

## 9. Offline-first behavior (exact)

Offline and no-key operation support:
- Manual recipe discovery still works from local datasets.
- Saved recipes, pantry, shopping, meal plan, scan history all have local persistence paths.
- Quick-cook can run from pantry + local scan history context.
- Substitutions and recipe images have local/static fallback behavior.

Local storage keys currently used:
- `GEMINI_API_KEY`
- `FREE_TIER_MODE`
- `SCAN_VAULT_RESULTS`
- `CULINARY_LENS_PANTRY`
- `CULINARY_LENS_LAST_COOK_ACTIVITY`
- `CULINARY_LENS_LOCAL_SAVED_RECIPES`
- `CULINARY_LENS_LOCAL_SHOPPING_LIST`
- `CULINARY_LENS_LOCAL_MEAL_PLAN`
- `CULINARY_LENS_INGREDIENT_PRESETS`
- `CULINARY_LENS_TASTE_MODEL`
- `CULINARY_LENS_ALLERGIES`
- `CULINARY_LENS_GAMIFICATION`
- `CULINARY_LENS_LAST_SCAN_DAY`
- `CL_NOTIFICATIONS_ENABLED`

## 10. API configuration and keys

### Gemini API key
Where used:
- App initialization and validation in `App.tsx`
- Vision pipeline (`VisionEngine`)
- Recipe generation (`RecipeEngine`)
- Substitution AI (`substitutionService`)
- Recipe image generation (`recipeImageService`)

Storage:
- Saved to localStorage as `GEMINI_API_KEY`.

Validation flow:
- API Config page calls Gemini with a tiny test prompt (`ping`) and sets success/error status.

### Hugging Face token (optional)
Where used:
- `visionEngine.ts` for stage-1 object detection.

Behavior:
- If `HF_API_TOKEN` missing, app skips HF stage and continues with Gemini-only perception.

### Firebase config
Where used:
- `src/firebase.ts` initializes Auth + Firestore from `src/firebase-applet-config.json`.

Cloud responsibilities:
- Auth via Google sign-in popup.
- User-scoped Firestore data for saved recipes, shopping list, meal plan.

## 11. Google Shopping integration details

Current behavior:
- The app does not call a dedicated Google Shopping API.
- It opens a web shopping search URL (`tbm=shop`) in a new tab.

Why this design:
- No API key requirement.
- Works in browser immediately.
- Lower complexity and fewer quota/auth concerns.

Entry points:
- Shopping list item buy action.
- Missing ingredient buy action in recipe detail.

## 12. Page connection map

Primary journey:
- LANDING -> CAMERA_SCAN -> PROCESSING -> PERCEPTION_MAP -> INGREDIENT_LIST -> PROCESSING -> RECIPE_SELECTOR -> RECIPE_DETAIL -> COOKING_MODE -> POST_COMPLETION -> LANDING

Offline journey:
- LANDING -> OFFLINE_MANUAL -> RECIPE_SELECTOR -> RECIPE_DETAIL -> COOKING_MODE

Utility journeys:
- LANDING -> SAVED_RECIPES -> COOKING_MODE
- LANDING -> SCAN_HISTORY -> (Use This Result) -> PERCEPTION_MAP
- Bottom nav links between Scan, Pantry, Planner, Saved, List, Profile

Connection mechanics:
- `workflow` state determines rendered page.
- `setWorkflow()` is the route change mechanism.
- `workflowHistory` stack stores prior states and powers back navigation for selected pages.

## 13. What is currently working

Confirmed working architecture in code:
- Full state-driven page workflow in `App.tsx`.
- Camera capture and upload paths.
- AI + fallback perception pipeline.
- Hybrid recipe generation with static fallback.
- Offline manual recipe discovery.
- Scan vault save/reuse/delete.
- Pantry add/remove/expiry/source analytics.
- Meal planning with weekly generation and edit.
- Shopping list CRUD and buy redirects.
- Saved recipes in guest and signed-in modes.
- Guided cooking timer flow with post-cook pantry updates.
- API key config page and free-tier mode.
- Firebase auth and Firestore integration paths.

## 14. Security and data boundaries

Firestore rules (`firestore.rules`) enforce:
- User-scoped read/write by UID ownership for user docs and `savedRecipes`.
- Additional admin override path.

Practical note:
- Some features are local-first and intentionally do not require cloud.

## 15. How this was built (engineering approach)

Implementation pattern used in this project:
- Single-page workflow state machine in `App.tsx`.
- Feature-specific service classes for domain logic.
- Shared typed contracts in `src/types.ts`.
- Progressive enhancement:
  - AI-enabled path when key/network available
  - static/local fallback path when unavailable
- User-centric resilience:
  - do not block entire app when one integration fails
  - preserve core cooking journey in guest/offline mode

## 16. Small but important implementation details

- Vision engine performs ingredient deduplication and confidence fusion.
- Cooking timer auto-advance is disabled for suggested/manual fallback timers.
- Quick-cook reasons include readiness and personalization factors.
- Weekly planner generation removes duplicate generated IDs before writing new week.
- Shopping multi-open uses one combined query to reduce popup blocker issues.
- ErrorBoundary can parse structured JSON error payloads from service layer.

## 17. Suggested next documentation extensions

If you want even deeper docs, add:
1. Sequence diagrams for scan flow, synthesis flow, and planner write flow.
2. Data dictionary tables for every field in every model.
3. E2E test case matrix per page and failure state.
4. Deployment and environment setup runbook.
