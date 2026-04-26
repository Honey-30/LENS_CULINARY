/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Settings, 
  History, 
  ChefHat, 
  WifiOff, 
  Calendar,
  Database,
  ShoppingCart,
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Minus,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Info,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Flame,
  Dna,
  Scale,
  Zap,
  LayoutGrid,
  Package,
  Heart,
  User as UserIcon,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { cn } from './lib/utils';
import { 
  Ingredient, 
  Recipe, 
  RecipeStep, 
  NutritionalGoal, 
  WorkflowState, 
  UserProfile,
  ScanResult,
  Substitution
} from './types';
import { VisionEngine } from './services/visionEngine';
import { RecipeEngine } from './services/recipeEngine';
import { StorageService } from './services/storageService';
import { MealPlanService, MealPlanEntry } from './services/mealPlanService';
import { STATIC_RECIPES } from './services/staticRecipes';
import { LARGE_RECIPE_DATABASE } from './services/recipeDatabase';
import { PantryService } from './services/pantryService';
import { PantryTracker } from './components/PantryTracker';
import { MealPlanner } from './components/MealPlanner';
import { ProfileSettings } from './components/ProfileSettings';
import { ShoppingList } from './components/ShoppingList';
import { CookingTimer } from './components/CookingTimer';
import { User } from 'firebase/auth';
import { ShoppingListService } from './services/shoppingListService';
import { ScanResultService } from './services/scanResultService';
import { LocalSavedRecipeService } from './services/localSavedRecipeService';
import { INGREDIENT_DICTIONARY } from './services/ingredientSuggestionService';
import { IngredientPresetService, IngredientPreset } from './services/ingredientPresetService';
import { InstantRecipeSuggestionService } from './services/instantRecipeSuggestionService';
import { InstamartService } from './services/instamartService';
import { getSubstitutions as getAISubstitutions } from './services/substitutionService';
import { generateRecipeImage } from './services/recipeImageService';
import { GamificationService, GamificationBadge, GamificationState } from './services/gamificationService';

const FALLBACK_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000';
const OFFLINE_RECIPES = [...STATIC_RECIPES, ...LARGE_RECIPE_DATABASE];

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-zinc-800 shadow-sm',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-full',
    md: 'px-5 py-2.5 text-sm font-medium rounded-full',
    lg: 'px-8 py-4 text-base font-medium rounded-full',
    icon: 'p-2 rounded-full',
  };
  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all',
      onClick && 'cursor-pointer active:scale-[0.98]',
      className
    )}
  >
    {children}
  </div>
);

const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'success' | 'warning' | 'info' }) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-blue-50 text-blue-600',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};

const STATIC_SUBSTITUTIONS: Record<string, string[]> = {
  'milk': ['almond milk', 'soy milk', 'oat milk'],
  'egg': ['flaxseed meal', 'applesauce', 'mashed banana'],
  'butter': ['coconut oil', 'margarine', 'applesauce'],
  'flour': ['almond flour', 'oat flour', 'coconut flour'],
  'sugar': ['honey', 'maple syrup', 'stevia'],
  'onion': ['shallots', 'leeks', 'chives'],
  'garlic': ['garlic powder', 'shallots', 'chives'],
  'tomato': ['red bell pepper', 'tomatillo', 'carrots'],
  'potato': ['sweet potato', 'cauliflower', 'turnips'],
  'chicken': ['tofu', 'tempeh', 'seitan'],
  'beef': ['mushrooms', 'lentils', 'black beans'],
};

const normalizeIngredientName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasIngredientMatch = (target: string, availableNames: string[]) => {
  const normalizedTarget = normalizeIngredientName(target);
  return availableNames.some((name) =>
    name.includes(normalizedTarget) || normalizedTarget.includes(name)
  );
};

const getMissingAmountHint = (ingredient: string): string => {
  const trimmed = (ingredient || '').trim();
  const quantityMatch = trimmed.match(/^(\d+(?:[./]\d+)?)\s*(cups?|cup|tbsp|tsp|g|kg|ml|l|oz|lb|cloves?|pieces?|piece|slices?)?\s+(.+)$/i);
  if (quantityMatch) {
    const quantity = quantityMatch[1];
    const unit = quantityMatch[2] || 'unit';
    return `${quantity} ${unit}`;
  }

  return 'Approx 1 unit';
};

const getShoppingEstimate = (ingredient: string): { quantity: number; unit: string } => {
  const trimmed = (ingredient || '').trim();
  const quantityMatch = trimmed.match(/^(\d+(?:[./]\d+)?)\s*(cups?|cup|tbsp|tsp|g|kg|ml|l|oz|lb|cloves?|pieces?|piece|slices?)?\s+(.+)$/i);
  if (!quantityMatch) {
    return { quantity: 1, unit: 'unit' };
  }

  const raw = quantityMatch[1];
  const unit = quantityMatch[2] || 'unit';

  let quantity = 1;
  if (raw.includes('/')) {
    const [a, b] = raw.split('/').map(Number);
    quantity = b ? a / b : a;
  } else {
    quantity = Number(raw);
  }

  return {
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unit,
  };
};

const formatSmartQuantity = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0';
  const rounded = Math.round(value * 100) / 100;

  const fractionMap: Array<[number, string]> = [
    [0.25, '1/4'],
    [0.33, '1/3'],
    [0.5, '1/2'],
    [0.67, '2/3'],
    [0.75, '3/4'],
  ];

  const whole = Math.floor(rounded);
  const decimal = Number((rounded - whole).toFixed(2));
  const nearestFraction = fractionMap.find(([candidate]) => Math.abs(candidate - decimal) <= 0.04);

  if (nearestFraction) {
    const fractionLabel = nearestFraction[1];
    return whole > 0 ? `${whole} ${fractionLabel}` : fractionLabel;
  }

  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
};

const scaleIngredientForDisplay = (ingredient: string, factor: number): string => {
  if (!ingredient || factor === 1) return ingredient;

  const match = ingredient.match(/^(\d+(?:[./]\d+)?)\s*(cups?|cup|tbsp|tsp|g|kg|ml|l|oz|lb|cloves?|pieces?|piece|slices?)?\s+(.+)$/i);
  if (!match) return ingredient;

  const rawAmount = match[1];
  const rawUnit = (match[2] || 'unit').toLowerCase();
  const name = match[3];
  const baseAmount = rawAmount.includes('/')
    ? rawAmount.split('/').map(Number).reduce((a, b) => (b ? a / b : a), 1)
    : Number(rawAmount);

  if (!Number.isFinite(baseAmount) || baseAmount <= 0) return ingredient;

  let scaled = baseAmount * factor;
  let finalUnit = rawUnit;

  // Kitchen-friendly conversion for tiny tablespoon values.
  if ((rawUnit === 'tbsp' || rawUnit === 'tablespoon' || rawUnit === 'tablespoons') && scaled < 1) {
    scaled = scaled * 3;
    finalUnit = 'tsp';
  }

  // Kitchen-friendly conversion for tiny cup values.
  if ((rawUnit === 'cup' || rawUnit === 'cups') && scaled < 0.5) {
    scaled = scaled * 16;
    finalUnit = 'tbsp';
  }

  return `${formatSmartQuantity(scaled)} ${finalUnit} ${name}`;
};

const daysUntilDate = (dateValue?: string): number => {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const getPantryPriorityScore = (recipe: Recipe, pantryItems: Ingredient[]): number => {
  if (!recipe.ingredients.length || !pantryItems.length) return 0;

  const score = pantryItems.reduce((total, item) => {
    const normalizedPantryName = normalizeIngredientName(item.name);
    const matchesRecipe = recipe.ingredients.some((ingredient) => {
      const normalizedIngredient = normalizeIngredientName(ingredient);
      return normalizedIngredient.includes(normalizedPantryName) || normalizedPantryName.includes(normalizedIngredient);
    });

    if (!matchesRecipe) return total;

    const expiryDays = daysUntilDate(item.expiryDate);
    if (expiryDays <= 2) return total + 5;
    if (expiryDays <= 5) return total + 3;
    return total + 1;
  }, 0);

  return score;
};

const parseStepDurationFromInstruction = (instruction: string): number | undefined => {
  if (!instruction) return undefined;
  const text = instruction.toLowerCase();

  const rangePattern = /(\d+)\s*(?:-|to|–)\s*(\d+)\s*(hours?|hrs?|hr|minutes?|mins?|min|seconds?|secs?|sec)\b/;
  const rangeMatch = text.match(rangePattern);
  if (rangeMatch) {
    const upper = Number(rangeMatch[2]);
    const unit = rangeMatch[3];
    if (unit.startsWith('hour') || unit.startsWith('hr')) return upper * 3600;
    if (unit.startsWith('min')) return upper * 60;
    return upper;
  }

  const hourMatch = text.match(/(\d+)\s*(hours?|hrs?|hr)\b/);
  const minuteMatch = text.match(/(\d+)\s*(minutes?|mins?|min)\b/);
  const secondMatch = text.match(/(\d+)\s*(seconds?|secs?|sec)\b/);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const seconds = secondMatch ? Number(secondMatch[1]) : 0;

  const total = hours * 3600 + minutes * 60 + seconds;
  if (total > 0) return total;

  const compactMinutes = text.match(/\b(\d+)\s*m\b/);
  if (compactMinutes) {
    const value = Number(compactMinutes[1]);
    return value > 0 ? value * 60 : undefined;
  }

  return undefined;
};

const parseStepDurationRangeOptions = (instruction: string): number[] => {
  if (!instruction) return [];
  const text = instruction.toLowerCase();
  const rangeMatch = text.match(/(\d+)\s*(?:-|to|–)\s*(\d+)\s*(hours?|hrs?|hr|minutes?|mins?|min|seconds?|secs?|sec)\b/);
  if (!rangeMatch) return [];

  const start = Number(rangeMatch[1]);
  const end = Number(rangeMatch[2]);
  const unit = rangeMatch[3];
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];

  const toSeconds = (value: number) => {
    if (unit.startsWith('hour') || unit.startsWith('hr')) return value * 3600;
    if (unit.startsWith('min')) return value * 60;
    return value;
  };

  const options: number[] = [];
  const width = end - start;

  options.push(toSeconds(start));
  if (width >= 2) {
    const mid = start + Math.round(width / 2);
    options.push(toSeconds(mid));
  }
  options.push(toSeconds(end));

  return Array.from(new Set(options)).sort((a, b) => a - b);
};

const STEP_ACTION_VERBS = [
  'mix', 'stir', 'add', 'plate', 'garnish', 'season', 'fold',
  'whisk', 'pour', 'chop', 'slice', 'knead', 'toss', 'coat',
  'spread', 'drain', 'rinse', 'peel', 'grate', 'mash', 'blend',
  'sauté', 'saute', 'fry', 'boil', 'simmer', 'bake', 'roast',
  'grill', 'steam', 'cool', 'rest', 'refrigerate', 'freeze',
];

const hasStepActionVerb = (instruction: string): boolean => {
  const text = (instruction || '').toLowerCase();
  return STEP_ACTION_VERBS.some((verb) => text.includes(verb));
};

const resolveStepDuration = (instruction: string, explicitDuration?: number): { duration: number; source: 'recipe' | 'detected' | 'suggested-action' | 'suggested-default'; suggested: boolean } => {
  const detectedDuration = parseStepDurationFromInstruction(instruction);

  // Preserve exact recipe-provided durations.
  if (typeof explicitDuration === 'number' && Number.isFinite(explicitDuration) && explicitDuration > 0) {
    if (detectedDuration && detectedDuration > 0) {
      const ratio = detectedDuration / explicitDuration;
      const looksLikeUnitMismatch =
        (ratio >= 59 && ratio <= 61) ||
        (ratio >= 3590 && ratio <= 3610);

      // If recipe duration appears to be minute/hour units while timer expects seconds,
      // trust the instruction-derived duration to keep UI timer aligned with step text.
      if (looksLikeUnitMismatch) {
        return { duration: detectedDuration, source: 'detected', suggested: false };
      }
    }

    return { duration: explicitDuration, source: 'recipe', suggested: false };
  }

  // Use explicit duration text if present in instruction.
  if (detectedDuration && detectedDuration > 0) {
    return { duration: detectedDuration, source: 'detected', suggested: false };
  }

  // Every step must have a timer fallback.
  if (hasStepActionVerb(instruction)) {
    // FIX: Suggested fallback timers should be practical (minutes), not a few seconds.
    return { duration: 300, source: 'suggested-action', suggested: true };
  }

  // FIX: Keep a manual safety timer for non-timed instructions without forcing rapid auto-skip.
  return { duration: 180, source: 'suggested-default', suggested: true };
};

const formatDurationLabel = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds && hours === 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
};

const normalizeRecipeTimeMinutes = (rawValue: number): number => {
  if (!Number.isFinite(rawValue) || rawValue <= 0) return 0;

  // AI sometimes returns prep/cook in seconds; convert obvious second-based values.
  if (rawValue >= 300 && rawValue % 60 === 0) {
    return Math.max(1, Math.round(rawValue / 60));
  }

  return Math.round(rawValue);
};

const getRecipeTotalMinutes = (recipe: Recipe): number => {
  return normalizeRecipeTimeMinutes(recipe.prepTime) + normalizeRecipeTimeMinutes(recipe.cookTime);
};

const estimateRecipeCost = (ingredientCount: number): number => {
  // FIX: Restore deterministic per-recipe cost estimate so recipe detail no longer shows empty cost intelligence.
  const perIngredientUsd = 1.75;
  const baseUsd = 2.5;
  const usdToInr = 83;
  return Number(((baseUsd + ingredientCount * perIngredientUsd) * usdToInr).toFixed(0));
};

const buildTimelineInsight = (recipe: Recipe): string[] => {
  // FIX: Reintroduce timeline breakdown to avoid missing cooking guidance panel.
  const prepMinutes = normalizeRecipeTimeMinutes(recipe.prepTime);
  const cookMinutes = normalizeRecipeTimeMinutes(recipe.cookTime);
  return [
    `Prep: ${prepMinutes} min`,
    `Cook: ${cookMinutes} min`,
    `Total: ${prepMinutes + cookMinutes} min`,
  ];
};

const COOKING_CHECKPOINTS_KEY = 'CULINARY_LENS_COOKING_CHECKPOINTS';

const getCookingCheckpointMap = (): Record<string, number> => {
  const raw = localStorage.getItem(COOKING_CHECKPOINTS_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveCookingCheckpoint = (recipeId: string, stepIndex: number) => {
  if (!recipeId) return;
  const map = getCookingCheckpointMap();
  map[recipeId] = Math.max(0, stepIndex || 0);
  localStorage.setItem(COOKING_CHECKPOINTS_KEY, JSON.stringify(map));
};

const clearCookingCheckpoint = (recipeId: string) => {
  if (!recipeId) return;
  const map = getCookingCheckpointMap();
  if (!(recipeId in map)) return;
  delete map[recipeId];
  localStorage.setItem(COOKING_CHECKPOINTS_KEY, JSON.stringify(map));
};

const getCookingCheckpoint = (recipeId: string): number => {
  if (!recipeId) return 0;
  const map = getCookingCheckpointMap();
  const value = map[recipeId];
  return typeof value === 'number' && value >= 0 ? value : 0;
};

const RECENT_RECIPES_CACHE_KEY = 'CULINARY_LENS_RECENT_RECIPES';

const getRecentRecipesCache = (): Recipe[] => {
  const raw = localStorage.getItem(RECENT_RECIPES_CACHE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
  } catch {
    return [];
  }
};

const saveRecentRecipesCache = (recipes: Recipe[]) => {
  if (!Array.isArray(recipes) || recipes.length === 0) return;

  const previous = getRecentRecipesCache();
  const merged = [...recipes, ...previous].filter((recipe, index, list) => {
    const id = recipe?.id;
    if (!id) return false;
    return list.findIndex((item) => item?.id === id) === index;
  });

  localStorage.setItem(RECENT_RECIPES_CACHE_KEY, JSON.stringify(merged.slice(0, 5)));
};

type TasteFeedback = 'TOO_SPICY' | 'TOO_BLAND' | 'PERFECT' | null;
const TASTE_FEEDBACK_KEY = 'CULINARY_LENS_TASTE_FEEDBACK';

const getStoredTasteFeedback = (): TasteFeedback => {
  const value = localStorage.getItem(TASTE_FEEDBACK_KEY);
  if (value === 'TOO_SPICY' || value === 'TOO_BLAND' || value === 'PERFECT') return value;
  return null;
};

const setStoredTasteFeedback = (value: TasteFeedback) => {
  if (!value) {
    localStorage.removeItem(TASTE_FEEDBACK_KEY);
    return;
  }
  localStorage.setItem(TASTE_FEEDBACK_KEY, value);
};

const applyTasteFeedbackNudge = (recipes: Recipe[], feedback: TasteFeedback): Recipe[] => {
  if (!feedback || recipes.length <= 1) return recipes;

  const spicyWords = ['spicy', 'chili', 'pepper', 'hot'];
  const mildWords = ['mild', 'creamy', 'buttery', 'light'];

  const scoreRecipe = (recipe: Recipe): number => {
    const haystack = `${recipe.title} ${recipe.description}`.toLowerCase();
    const spicyScore = spicyWords.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);
    const mildScore = mildWords.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);

    if (feedback === 'TOO_SPICY') return mildScore - spicyScore;
    if (feedback === 'TOO_BLAND') return spicyScore - mildScore;
    return spicyScore + mildScore;
  };

  return [...recipes].sort((a, b) => scoreRecipe(b) - scoreRecipe(a));
};

// --- Main App ---

export default function App() {
  const getTodayInputDate = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  // State
  const [workflow, setWorkflow] = useState<WorkflowState>('LANDING');
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowState[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeCardImages, setRecipeCardImages] = useState<Record<string, string>>({});
  const [prioritizePantryUse, setPrioritizePantryUse] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nutritionalGoal, setNutritionalGoal] = useState<NutritionalGoal>('BALANCED');
  const [cuisinePreference, setCuisinePreference] = useState('ALL');
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [localSavedRecipes, setLocalSavedRecipes] = useState<Recipe[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFreeTier, setIsFreeTier] = useState(() => localStorage.getItem('FREE_TIER_MODE') === 'true');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [servingsScale, setServingsScale] = useState(1);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [recipeEntryWorkflow, setRecipeEntryWorkflow] = useState<'LANDING' | 'INGREDIENT_LIST'>('INGREDIENT_LIST');
  const [mealPlanDialogOpen, setMealPlanDialogOpen] = useState(false);
  const [mealPlanRecipe, setMealPlanRecipe] = useState<Recipe | null>(null);
  const [mealPlanDate, setMealPlanDate] = useState<string>(() => getTodayInputDate());
  const [mealPlanType, setMealPlanType] = useState<MealPlanEntry['type']>('DINNER');
  const [gamificationState, setGamificationState] = useState<GamificationState>(() => GamificationService.getState());
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<GamificationBadge[]>([]);
  const [tasteFeedback, setTasteFeedback] = useState<TasteFeedback>(() => getStoredTasteFeedback());

  const handleRecipeImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    img.onerror = null;
    img.src = FALLBACK_RECIPE_IMAGE;
  };

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousWorkflowRef = useRef<WorkflowState>('LANDING');
  const isGoingBackRef = useRef(false);

  // Services
  const visionEngine = React.useMemo(() => new VisionEngine(apiKey), [apiKey]);
  const recipeEngine = React.useMemo(() => new RecipeEngine(apiKey), [apiKey]);

  // Effects
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('GEMINI_API_KEY', apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('FREE_TIER_MODE', isFreeTier.toString());
  }, [isFreeTier]);

  useEffect(() => {
    setScanResults(ScanResultService.getScanResults());
    setLocalSavedRecipes(LocalSavedRecipeService.getSavedRecipes());
    setGamificationState(GamificationService.getState());
  }, []);

  useEffect(() => {
    const previous = previousWorkflowRef.current;

    if (previous === workflow) return;

    if (isGoingBackRef.current) {
      isGoingBackRef.current = false;
      previousWorkflowRef.current = workflow;
      return;
    }

    setWorkflowHistory((history) => {
      const next = [...history, previous];
      return next.length > 40 ? next.slice(next.length - 40) : next;
    });

    previousWorkflowRef.current = workflow;
  }, [workflow]);

  useEffect(() => {
    let unsubSavedRecipes: (() => void) | null = null;

    const unsub = StorageService.onAuthChange((u) => {
      setUser(u);

      if (unsubSavedRecipes) {
        unsubSavedRecipes();
        unsubSavedRecipes = null;
      }

      if (u) {
        unsubSavedRecipes = StorageService.onSavedRecipesChange(u.uid, setSavedRecipes);
      } else {
        setSavedRecipes([]);
      }
    });

    return () => {
      if (unsubSavedRecipes) {
        unsubSavedRecipes();
      }
      unsub();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!recipes.length) {
      setRecipeCardImages({});
      return () => {
        isActive = false;
      };
    }

    const loadRecipeCardImages = async () => {
      const entries = await Promise.all(
        recipes.map(async (recipe) => {
          try {
            const generated = await generateRecipeImage(recipe.title, recipe.ingredients, {
              cuisine: recipe.cuisine,
              description: recipe.description,
            }, {
              fallbackImageUrl: recipe.imageUrl,
            });
            return [recipe.id, generated] as const;
          } catch {
            return [recipe.id, recipe.imageUrl || FALLBACK_RECIPE_IMAGE] as const;
          }
        })
      );

      if (!isActive) return;
      setRecipeCardImages(Object.fromEntries(entries));
    };

    loadRecipeCardImages();

    return () => {
      isActive = false;
    };
  }, [recipes]);

  // Handlers
  const handleSignIn = async () => {
    try {
      await StorageService.signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked. Please allow popups for this site and try again.");
      } else if (err.code !== 'auth/user-cancelled') {
        setError("Sign-in failed. Please try again or check your internet connection.");
      }
    }
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setWorkflow('LANDING');
  };

  const handleGoBack = () => {
    setWorkflowHistory((history) => {
      if (history.length === 0) return history;

      const next = [...history];
      const previous = next.pop()!;
      isGoingBackRef.current = true;
      setWorkflow(previous);
      return next;
    });
  };

  const validateApiKey = async (key: string) => {
    setIsValidating(true);
    setValidationStatus('idle');
    try {
      const tempAi = new GoogleGenAI({ apiKey: key });
      // Simple validation call
      await tempAi.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: "ping" }] }],
        config: { maxOutputTokens: 1 }
      });
      setValidationStatus('success');
      setApiKey(key);
      return true;
    } catch (err) {
      console.error('API Key validation failed:', err);
      setValidationStatus('error');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const getSubstitutions = async (ingredient: string) => {
    const lowerIng = ingredient.toLowerCase();
    if (isFreeTier && STATIC_SUBSTITUTIONS[lowerIng]) {
      console.log("App: Using static substitutions in Free Tier Mode");
      return STATIC_SUBSTITUTIONS[lowerIng];
    }

    const prompt = `Suggest 3 smart substitutions for '${ingredient}' in a recipe. Return a JSON array of strings.`;
    try {
      const response = await visionEngine['ai'].models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return STATIC_SUBSTITUTIONS[lowerIng] || ["No substitutions found"];
    }
  };

  const addToMealPlan = async (recipe: Recipe, date: string, mealType: MealPlanEntry['type']) => {
    const entry: MealPlanEntry = {
      id: `meal-${Date.now()}`,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      date,
      type: mealType,
      recipeImageUrl: recipe.imageUrl
    };
    try {
      await MealPlanService.addEntry(user?.uid || '', entry);
      alert(`Added ${recipe.title} to your ${mealType} on ${date}`);
    } catch (err) {
      console.error('Failed to add to meal plan:', err);
      setError("Failed to add to meal plan.");
    }
  };

  const openMealPlanDialog = (recipe: Recipe) => {
    setMealPlanRecipe(recipe);
    setMealPlanDate(getTodayInputDate());
    setMealPlanType('DINNER');
    setMealPlanDialogOpen(true);
  };

  const confirmAddToMealPlan = async () => {
    if (!mealPlanRecipe) return;
    await addToMealPlan(mealPlanRecipe, mealPlanDate, mealPlanType);
    setMealPlanDialogOpen(false);
    setMealPlanRecipe(null);
  };

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
        const base64 = imageDataUrl.split(',')[1];
        setCapturedImage(imageDataUrl);
        processImage(base64, imageDataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        const base64 = imageDataUrl.split(',')[1];
        setCapturedImage(imageDataUrl);
        processImage(base64, imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string, imageDataUrl: string | null = null) => {
    setWorkflow('PROCESSING');
    setIsProcessing(true);
    setError(null);
    try {
      const { ingredients: detected, humanDetected } = await visionEngine.processImage(base64);
      if (humanDetected) {
        setError("Human detected in frame. Please scan food items only for privacy.");
        setWorkflow('CAMERA_SCAN');
      } else {
        setIngredients(detected);
        PantryService.addDetectedIngredients(detected);
        const scanProgress = GamificationService.recordScan();
        setGamificationState(scanProgress.state);
        if (scanProgress.newlyUnlocked.length) {
          setNewlyUnlockedBadges(scanProgress.newlyUnlocked);
        }
        const stored = ScanResultService.saveScanResult(imageDataUrl ?? capturedImage, detected);
        setScanResults((prev) => [stored, ...prev].slice(0, 50));
        setWorkflow('PERCEPTION_MAP');
      }
    } catch (err) {
      setError("Failed to process image. Try offline mode or check your API key.");
      setWorkflow('OFFLINE_MANUAL');
    } finally {
      setIsProcessing(false);
    }
  };

  const startSynthesis = async () => {
    setRecipeEntryWorkflow('INGREDIENT_LIST');
    setWorkflow('PROCESSING');
    setIsProcessing(true);
    try {
      const results = await recipeEngine.synthesizeRecipes(ingredients, cuisinePreference, nutritionalGoal, isFreeTier);
      const nudged = applyTasteFeedbackNudge(results, tasteFeedback);
      setRecipes(nudged);
      saveRecentRecipesCache(nudged);
      setWorkflow('RECIPE_SELECTOR');
    } catch (err) {
      const cached = getRecentRecipesCache();
      if (cached.length > 0) {
        setError("Synthesis failed. Using your recent offline recipes.");
        setRecipes(cached.slice(0, 3));
      } else {
        setError("Synthesis failed. Using local recipes.");
        setRecipes(OFFLINE_RECIPES.slice(0, 3));
      }
      setWorkflow('RECIPE_SELECTOR');
    } finally {
      setIsProcessing(false);
    }
  };

  const runInstantQuickCook = () => {
    const suggestions = InstantRecipeSuggestionService.suggestFromPantryAndHistory(scanResults, 3, ingredients);

    if (!suggestions.length) {
      setError('No instant matches yet. Add pantry items or run one scan first.');
      setWorkflow('OFFLINE_MANUAL');
      return;
    }

    const pantryIngredients = PantryService.getPantry();
    const historicalNames = scanResults
      .slice(0, 5)
      .flatMap((scan) => scan.ingredients.map((ingredient) => ingredient.name));
    const uniqueNames = Array.from(new Set([...pantryIngredients.map((item) => item.name), ...historicalNames]));

    setIngredients(
      uniqueNames.map((name, index) => ({
        id: `instant-${index}`,
        name,
        category: 'INSTANT',
        confidence: 0.9,
      }))
    );

    setRecipes(suggestions.map((item) => item.recipe));
    setNutritionalGoal('BALANCED');
    setRecipeEntryWorkflow('LANDING');
    setWorkflow('RECIPE_SELECTOR');
  };

  const saveRecipe = async (recipe: Recipe) => {
    try {
      if (user) {
        await StorageService.saveRecipe(user.uid, recipe);
      } else {
        const next = LocalSavedRecipeService.saveRecipe(recipe);
        setLocalSavedRecipes(next);
      }
    } catch (err) {
      console.error('Failed to save recipe:', err);
      setError("Couldn't save recipe. Please try again.");
    }
  };

  const removeSavedRecipe = async (recipeId: string) => {
    try {
      if (user) {
        await StorageService.deleteRecipe(user.uid, recipeId);
      } else {
        const next = LocalSavedRecipeService.deleteRecipe(recipeId);
        setLocalSavedRecipes(next);
      }
    } catch (err) {
      console.error('Failed to delete saved recipe:', err);
      setError("Couldn't remove recipe. Please try again.");
    }
  };

  const speak = (text: string) => {
    if (isMuted) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const [showAddedAlert, setShowAddedAlert] = useState(false);

  const visibleSavedRecipes = user ? savedRecipes : localSavedRecipes;

  const handleAddIngredientsToShoppingList = () => {
    if (selectedRecipe) {
        const items = selectedRecipe.ingredients.map(name => ({
            name,
            quantity: 1, // Default quantity
            unit: 'unit', // Default unit
            recipeId: selectedRecipe.id
        }));
      ShoppingListService.addIngredientsToShoppingList(user?.uid || '', items)
            .then(() => {
                setShowAddedAlert(true);
                setTimeout(() => setShowAddedAlert(false), 3000);
            })
            .catch(error => {
                console.error("Failed to add ingredients to shopping list:", error);
                alert('Failed to add ingredients. Please try again.');
            });
    }
  };

  const handleUseScanResult = (scanResult: ScanResult) => {
    setIngredients(scanResult.ingredients);
    setCapturedImage(scanResult.imageDataUrl);
    setWorkflow('PERCEPTION_MAP');
  };

  const handleDeleteScanResult = (scanId: string) => {
    setScanResults(ScanResultService.deleteScanResult(scanId));
  };

  const getScanDelta = (currentScan: ScanResult, previousScan?: ScanResult) => {
    if (!previousScan) return { added: 0, removed: 0 };

    const currentNames = new Set(currentScan.ingredients.map((item) => item.name.toLowerCase()));
    const previousNames = new Set(previousScan.ingredients.map((item) => item.name.toLowerCase()));

    const added = [...currentNames].filter((name) => !previousNames.has(name)).length;
    const removed = [...previousNames].filter((name) => !currentNames.has(name)).length;

    return { added, removed };
  };

  // --- Views ---

  const LandingPage = () => (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 bg-black rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
            <ChefHat className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">Culinary Lens</h1>
          <p className="text-zinc-500 text-lg">Intelligent cooking, reimagined for your kitchen.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button onClick={runInstantQuickCook} className="w-full py-6 text-lg" variant="outline">
            <Zap className="mr-2 w-5 h-5" /> What Can I Cook RIGHT NOW?
          </Button>
          <Button onClick={() => setWorkflow('CAMERA_SCAN')} className="w-full py-6 text-lg" variant="primary">
            <Camera className="mr-2 w-5 h-5" /> Start Scanning
          </Button>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setWorkflow('OFFLINE_MANUAL')} variant="secondary" className="py-4">
              <WifiOff className="mr-2 w-4 h-4" /> Offline
            </Button>
            <Button onClick={() => setWorkflow('SAVED_RECIPES')} variant="secondary" className="py-4">
              <History className="mr-2 w-4 h-4" /> Saved
            </Button>
          </div>
          <Button onClick={() => setWorkflow('SCAN_HISTORY')} variant="secondary" className="w-full py-4">
            <Database className="mr-2 w-4 h-4" /> Scan Vault
          </Button>
        </div>

        <Card className="p-4 text-left space-y-2 border-zinc-200">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Progress</p>
            <Badge variant="info">Streak {gamificationState.streak}d</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Scans</p>
              <p className="text-lg font-bold text-zinc-900">{gamificationState.totalScans}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Cooks</p>
              <p className="text-lg font-bold text-zinc-900">{gamificationState.totalCooks}</p>
            </div>
          </div>
        </Card>

        <div className="pt-8 border-t border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-zinc-200" referrerPolicy="no-referrer" />
                <div className="text-left">
                  <p className="text-xs font-bold text-zinc-900">{user.displayName}</p>
                  <button onClick={handleLogout} className="text-[10px] text-zinc-500 hover:text-black uppercase font-bold tracking-wider">Sign Out</button>
                </div>
              </>
            ) : (
              <Button onClick={handleSignIn} variant="ghost" size="sm">
                <LogIn className="mr-2 w-4 h-4" /> Sign In
              </Button>
            )}
          </div>
          <Button onClick={() => setWorkflow('API_CONFIG')} variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-zinc-400" />
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const APIConfigPage = () => {
    const [tempKey, setTempKey] = useState(apiKey);

    const handleSave = async () => {
      if (!tempKey) {
        setError("Please enter an API key.");
        return;
      }
      const isValid = await validateApiKey(tempKey);
      if (isValid) {
        setTimeout(() => setWorkflow('LANDING'), 1500);
      }
    };

    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-md mx-auto space-y-8 pt-12">
          <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
            <p className="text-zinc-500">Set up your AI engine for the best experience.</p>
          </div>
          <Card className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Gemini API Key</label>
              <div className="relative">
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className={cn(
                    "w-full bg-zinc-50 border rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all",
                    validationStatus === 'success' ? "border-green-500 ring-2 ring-green-500/10" : 
                    validationStatus === 'error' ? "border-red-500 ring-2 ring-red-500/10" : "border-zinc-100 focus:ring-2 focus:ring-black/5"
                  )}
                />
                {isValidating && (
                  <div className="absolute right-4 top-3.5">
                    <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                  </div>
                )}
                {validationStatus === 'success' && <CheckCircle2 className="absolute right-4 top-3.5 w-4 h-4 text-green-500" />}
                {validationStatus === 'error' && <AlertCircle className="absolute right-4 top-3.5 w-4 h-4 text-red-500" />}
              </div>
              {validationStatus === 'error' && <p className="text-[10px] text-red-500 ml-1">Invalid API key. Please check and try again.</p>}
              {validationStatus === 'success' && <p className="text-[10px] text-green-500 ml-1">API key validated successfully!</p>}
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Free Tier Mode</h4>
                  <p className="text-[10px] text-zinc-500">Minimize API calls to stay within free limits.</p>
                </div>
                <button 
                  onClick={() => setIsFreeTier(!isFreeTier)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    isFreeTier ? "bg-green-500" : "bg-zinc-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    isFreeTier ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Your key is stored locally and used only for ingredient recognition and recipe synthesis. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-black underline">AI Studio</a>.
            </p>
            <Button 
              onClick={handleSave} 
              disabled={isValidating}
              className="w-full py-4 text-base font-bold"
            >
              {isValidating ? 'Validating...' : 'Validate & Save'}
            </Button>
          </Card>
        </div>
      </div>
    );
  };

  const CameraScanPage = () => {
    useEffect(() => {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Ensure video plays
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(console.error);
            };
          }
        } catch (err) {
          setError("Camera access denied.");
        }
      };
      startCamera();
      return () => {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(t => {
            t.stop();
            stream.removeTrack(t);
          });
          videoRef.current.srcObject = null;
        }
      };
    }, []);

    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div className="flex justify-between items-center">
            <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon" className="bg-white/10 backdrop-blur-md text-white">
              <X className="w-6 h-6" />
            </Button>
            <Badge variant="info" className="bg-white/20 text-white backdrop-blur-md border-none">Online Mode</Badge>
          </div>

          <div className="flex flex-col items-center gap-8 pb-12">
            <div className="w-24 h-24 border-4 border-white/30 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-white rounded-full animate-ping opacity-20" />
              <button 
                onClick={handleCapture}
                className="w-20 h-20 bg-white rounded-full active:scale-90 transition-transform shadow-2xl"
              />
            </div>
            <div className="flex gap-4">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <div className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload Image
                </div>
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="absolute top-20 left-6 right-6 bg-red-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-xl animate-bounce">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  };

  const ProcessingPage = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-zinc-100 rounded-[2.5rem]" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-black rounded-[2.5rem] border-t-transparent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ChefHat className="w-10 h-10 text-black" />
        </div>
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Analyzing Ingredients</h2>
      <p className="text-zinc-500 max-w-xs">Our AI is identifying items and calculating nutritional profiles...</p>
      
      <div className="mt-12 space-y-3 w-full max-w-xs">
        {['Detecting objects...', 'Validating food items...', 'Generating profiles...'].map((text, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.5 }}
            className="flex items-center gap-3 text-xs font-medium text-zinc-400"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
            {text}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const PerceptionMapPage = () => {
    const pantrySourceCounts = PantryService.getSourceCounts();

    return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow('CAMERA_SCAN')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold">Perception Map</h2>
          <div className="w-10" />
        </div>

        <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-black group">
          {capturedImage && <img src={capturedImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />}
          
          {/* Scanning Line Animation */}
          <motion.div 
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.8)] z-10 pointer-events-none"
          />

          <div className="absolute inset-0">
            {ingredients.map((ing, i) => (
              <React.Fragment key={ing.id}>
                {(() => {
                  const bboxTop = ing.boundingBox ? ing.boundingBox[0] / 10 : undefined;
                  const bboxLeft = ing.boundingBox ? ing.boundingBox[1] / 10 : undefined;
                  const rawTop = bboxTop !== undefined ? bboxTop - 3 : (ing.y ?? (20 + (i * 10)));
                  const rawLeft = bboxLeft !== undefined ? bboxLeft + 2 : (ing.x ?? (20 + (i * 10)));
                  const markerTop = Math.min(96, Math.max(4, rawTop));
                  const markerLeft = Math.min(96, Math.max(4, rawLeft));

                  return (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                        delay: i * 0.05
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                      style={{
                        top: `${markerTop}%`,
                        left: `${markerLeft}%`
                      }}
                    >
                      <div className="relative group/marker">
                        {/* Outer Glow */}
                        <div className={cn(
                          "absolute -inset-2 rounded-full blur-sm opacity-40 animate-pulse",
                          ing.confidence > 0.9 ? "bg-green-400" : "bg-blue-400"
                        )} />

                        {/* Main Pill */}
                        <div className="bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/50 cursor-pointer hover:scale-110 transition-transform">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            ing.confidence > 0.9 ? "bg-green-500" : "bg-blue-500"
                          )} />
                          <span className="text-[11px] font-bold text-zinc-900 whitespace-nowrap">{ing.name}</span>
                          <span className="text-[9px] font-bold text-zinc-400">{Math.round(ing.confidence * 100)}%</span>
                        </div>

                        {/* Connector Line (Optional visual flair) */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4 bg-gradient-to-b from-white/50 to-transparent" />
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Bounding Box */}
                {ing.boundingBox && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="absolute border-2 border-blue-400 bg-blue-400/10 rounded-lg pointer-events-none"
                    style={{
                      top: `${ing.boundingBox[0] / 10}%`,
                      left: `${ing.boundingBox[1] / 10}%`,
                      width: `${(ing.boundingBox[3] - ing.boundingBox[1]) / 10}%`,
                      height: `${(ing.boundingBox[2] - ing.boundingBox[0]) / 10}%`,
                    }}
                  />
                )}
                
              </React.Fragment>
            ))}
          </div>
          
          {/* Vignette Overlay */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.4)]" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Detected Entities</h3>
            <span className="text-[10px] font-bold bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full uppercase">{ingredients.length} Found</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white border border-zinc-100 rounded-xl p-2">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Detected</p>
              <p className="text-sm font-bold text-zinc-900">{ingredients.length}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-2">
              <p className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">Pantry Total</p>
              <p className="text-sm font-bold text-blue-900">{pantrySourceCounts.total}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2">
              <p className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">Scanned</p>
              <p className="text-sm font-bold text-emerald-900">{pantrySourceCounts.scanned}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {ingredients.map(ing => (
              <motion.div
                key={ing.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-4 flex items-center justify-between hover:border-zinc-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100">
                      <Zap className={cn("w-5 h-5", ing.confidence > 0.9 ? "text-green-500" : "text-blue-500")} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{ing.name}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">{ing.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={ing.confidence > 0.9 ? 'success' : 'info'}>
                      {Math.round(ing.confidence * 100)}% Match
                    </Badge>
                    {ing.nutritionalEstimate && (
                      <span className="text-[9px] font-bold text-zinc-400">{ing.nutritionalEstimate.calories} kcal</span>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={() => setWorkflow('INGREDIENT_LIST')} className="w-full py-6 text-lg shadow-xl shadow-black/10">
            Confirm Perception <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
  };

  const IngredientListPage = () => {
    const [substitutions, setSubstitutions] = useState<Record<string, string[]>>({});
    const [presetName, setPresetName] = useState('');
    const [presets, setPresets] = useState<IngredientPreset[]>([]);

    const pantryItems = PantryService.getPantry();
    const ingredientNameSet = new Set(ingredients.map((item) => item.name.toLowerCase()));
    const pantrySuggestions = pantryItems.filter((item) => !ingredientNameSet.has(item.name.toLowerCase())).slice(0, 6);

    useEffect(() => {
      setPresets(IngredientPresetService.list());
    }, []);

    const handleShowSubstitutions = async (ing: string) => {
      if (substitutions[ing]) return;
      const subs = await getSubstitutions(ing);
      setSubstitutions(prev => ({ ...prev, [ing]: subs }));
    };

    const handleSavePreset = () => {
      if (!presetName.trim() || ingredients.length === 0) return;
      setPresets(IngredientPresetService.save(presetName, ingredients));
      setPresetName('');
    };

    const handleApplyPreset = (preset: IngredientPreset) => {
      setIngredients(preset.ingredients.map((item, index) => ({ ...item, id: `${item.id}-${Date.now()}-${index}` })));
    };

    const handleDeletePreset = (presetId: string) => {
      setPresets(IngredientPresetService.remove(presetId));
    };

    const handleMergePantrySuggestions = () => {
      if (pantrySuggestions.length === 0) return;

      const mapped = pantrySuggestions.map((item, index) => ({
        id: `pantry-merge-${Date.now()}-${index}`,
        name: item.name,
        category: item.category || 'Pantry',
        confidence: item.confidence || 1,
      }));

      setIngredients([...ingredients, ...mapped]);
    };

    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-md mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Button onClick={() => setWorkflow('PERCEPTION_MAP')} variant="ghost" size="icon">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-xl font-bold">Ingredient Manifest</h2>
            <Button onClick={() => {
              if (confirm("Clear all ingredients?")) setIngredients([]);
            }} variant="ghost" size="icon">
              <Trash2 className="w-5 h-5 text-zinc-400" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Pantry</h3>
                <div className="flex gap-2">
                  <input 
                    id="manual-ingredient-input"
                    type="text" 
                    list="ingredient-suggestions"
                    placeholder="Add item..."
                    className="bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none w-32"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setIngredients([...ingredients, { id: Date.now().toString(), name: val, category: 'Manual', confidence: 1 }]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <Button variant="secondary" size="sm" onClick={() => {
                    const input = document.getElementById('manual-ingredient-input') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      setIngredients([...ingredients, { id: Date.now().toString(), name: val, category: 'Manual', confidence: 1 }]);
                      input.value = '';
                    }
                  }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {ingredients.map(ing => (
                  <div key={ing.id} className="space-y-2">
                    <div className="bg-zinc-100 px-4 py-3 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-900">{ing.name}</span>
                        <button 
                          onClick={() => handleShowSubstitutions(ing.name)}
                          className="text-[10px] font-bold text-blue-500 uppercase tracking-wider hover:underline"
                        >
                          Substitutes
                        </button>
                      </div>
                      <button 
                        onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {substitutions[ing.name] && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pl-4 flex flex-wrap gap-2"
                      >
                        {substitutions[ing.name].map((sub, i) => (
                          <span key={i} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                            {sub}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top Tier Tools</h3>

              <Card className="space-y-3 border border-blue-100 bg-blue-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Pantry Autofill Assistant</p>
                  <Badge variant="info">{pantrySuggestions.length} suggestions</Badge>
                </div>
                <p className="text-xs text-blue-700/80">Auto-merge useful pantry items not yet in this session.</p>
                {pantrySuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pantrySuggestions.map((item) => (
                      <span key={item.id} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white text-blue-600 border border-blue-100">
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
                <Button variant="secondary" onClick={handleMergePantrySuggestions} className="w-full">
                  Merge Pantry Suggestions
                </Button>
              </Card>

              <Card className="space-y-3 border border-emerald-100 bg-emerald-50/50">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Ingredient Presets</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name (e.g., Gym Meal Set)"
                    className="flex-1 bg-white border border-emerald-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                  <Button size="sm" onClick={handleSavePreset}>Save</Button>
                </div>
                {presets.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {presets.slice(0, 8).map((preset) => (
                      <div key={preset.id} className="flex items-center justify-between gap-2 bg-white border border-emerald-100 rounded-xl p-2">
                        <div>
                          <p className="text-xs font-bold text-emerald-700">{preset.name}</p>
                          <p className="text-[10px] text-emerald-600/70">{preset.ingredients.length} ingredients</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleApplyPreset(preset)}>Use</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePreset(preset.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700/70">No presets yet. Save your current ingredient set for one-tap reuse.</p>
                )}
              </Card>
            </div>

            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Preferences</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Cuisine</label>
                  <select 
                    value={cuisinePreference}
                    onChange={(e) => setCuisinePreference(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 text-sm focus:outline-none"
                  >
                    <option value="ALL">All Cuisines</option>
                    <option value="ITALIAN">Italian</option>
                    <option value="CHINESE">Chinese</option>
                    <option value="MEXICAN">Mexican</option>
                    <option value="INDIAN">Indian</option>
                    <option value="GREEK">Greek</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Nutritional Goal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'BALANCED', icon: Scale, label: 'Balanced' },
                      { id: 'HIGH PROTEIN', icon: Dna, label: 'High Protein' },
                      { id: 'LOW CALORIE', icon: Zap, label: 'Low Calorie' },
                      { id: 'LOW CARB', icon: Flame, label: 'Low Carb' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setNutritionalGoal(g.id as NutritionalGoal)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-2xl border transition-all text-left",
                          nutritionalGoal === g.id 
                            ? "bg-black border-black text-white shadow-lg" 
                            : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        <g.icon className={cn("w-4 h-4", nutritionalGoal === g.id ? "text-white" : "text-zinc-400")} />
                        <span className="text-xs font-bold">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={startSynthesis} className="w-full py-6 text-lg mt-8">
            Generate Recipes <ChefHat className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  };

  const RecipeSelectorPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow(recipeEntryWorkflow)} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold">Recipe Intelligence</h2>
          <div className="w-10" />
        </div>

        {/* Waste Minimizer Tip */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-emerald-700 font-bold text-sm">Waste Minimizer</h4>
            <p className="text-emerald-600 text-xs leading-relaxed">
              These recipes use {Math.floor(Math.random() * 30) + 70}% of your detected ingredients to help you reduce food waste.
            </p>
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-zinc-100 rounded-2xl p-3">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recipe Sorting</p>
              <p className="text-xs text-zinc-600">Prioritize expiring pantry items</p>
            </div>
            <button
              onClick={() => setPrioritizePantryUse((prev) => !prev)}
              className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                prioritizePantryUse
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-zinc-50 border-zinc-200 text-zinc-600"
              )}
            >
              {prioritizePantryUse ? 'Pantry First: On' : 'Pantry First: Off'}
            </button>
          </div>

          {[...recipes]
            .sort((a, b) => {
              if (!prioritizePantryUse) return 0;
              const pantryItems = PantryService.getPantry();
              const scoreA = getPantryPriorityScore(a, pantryItems);
              const scoreB = getPantryPriorityScore(b, pantryItems);
              return scoreB - scoreA;
            })
            .map((recipe, i) => (
            (() => {
              const ingredientNames = ingredients.map((item) => item.name.toLowerCase());
              const overlapCount = recipe.ingredients.filter((ingredient) => ingredientNames.some((name) => name.includes(ingredient.toLowerCase()) || ingredient.toLowerCase().includes(name))).length;
              const readinessScore = Math.min(100, Math.round((overlapCount / Math.max(recipe.ingredients.length, 1)) * 100));

              return (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-0 overflow-hidden group">
                <div className="relative aspect-video overflow-hidden">
                  <img src={recipeCardImages[recipe.id] || recipe.imageUrl || FALLBACK_RECIPE_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" onError={handleRecipeImageError} />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant={recipe.source === 'AI' ? 'info' : 'default'} className="bg-white/90 backdrop-blur-md">
                      {recipe.source === 'AI' ? 'AI Synthesized' : 'Static Match'}
                    </Badge>
                    <Badge variant="success" className="bg-white/90 backdrop-blur-md">{recipe.difficulty}</Badge>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-zinc-900">{recipe.title}</h3>
                    <p className="text-sm text-zinc-500 line-clamp-2">{recipe.description}</p>
                    <div className="pt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <span>Readiness Score</span>
                        <span className="text-zinc-700">{readinessScore}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${readinessScore}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <div className="flex items-center gap-4">
                      <span>{getRecipeTotalMinutes(recipe)} MIN</span>
                      <span>{recipe.macros.calories} KCAL</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openMealPlanDialog(recipe)}>
                        <LayoutGrid className="w-4 h-4 text-zinc-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => saveRecipe(recipe)}>
                        <Save className={cn("w-4 h-4", visibleSavedRecipes.some(r => r.id === recipe.id) ? "text-blue-500 fill-blue-500" : "text-zinc-400")} />
                      </Button>
                      <Button onClick={() => {
                        setSelectedRecipe(recipe);
                        setServingsScale(1);
                        setWorkflow('RECIPE_DETAIL');
                      }}>
                        View Details <ArrowRight className="ml-2 w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
              );
            })()
          ))}
        </div>
      </div>
    </div>
  );

  const RecipeDetailPage = () => {
    const [boughtMissingIngredients, setBoughtMissingIngredients] = useState<string[]>([]);
    const [substituteModalOpen, setSubstituteModalOpen] = useState(false);
    const [substituteIngredient, setSubstituteIngredient] = useState<string>('');
    const [substituteResults, setSubstituteResults] = useState<Substitution[]>([]);
    const [substituteLoading, setSubstituteLoading] = useState(false);
    const [substituteError, setSubstituteError] = useState<string | null>(null);
    const [recipeHeroImage, setRecipeHeroImage] = useState<string>('');
    const [recipeHeroLoading, setRecipeHeroLoading] = useState(true);
    const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
    const [isAddingMissingToList, setIsAddingMissingToList] = useState(false);

    useEffect(() => {
      setBoughtMissingIngredients([]);
    }, [selectedRecipe?.id]);

    useEffect(() => {
      setSubstituteModalOpen(false);
      setSubstituteIngredient('');
      setSubstituteResults([]);
      setSubstituteLoading(false);
      setSubstituteError(null);
    }, [selectedRecipe?.id]);

    useEffect(() => {
      let isActive = true;

      const loadRecipeImage = async () => {
        if (!selectedRecipe) {
          setRecipeHeroImage('');
          setRecipeHeroLoading(false);
          return;
        }

        setRecipeHeroLoading(true);
        const generatedImage = await generateRecipeImage(selectedRecipe.title, selectedRecipe.ingredients, {
          cuisine: selectedRecipe.cuisine,
          description: selectedRecipe.description,
        }, {
          fallbackImageUrl: selectedRecipe.imageUrl,
        });

        if (!isActive) return;
        setRecipeHeroImage(generatedImage);
        setRecipeHeroLoading(false);
      };

      loadRecipeImage();

      return () => {
        isActive = false;
      };
    }, [selectedRecipe?.id]);

    if (!selectedRecipe) return null;

    const handleRegenerateRecipeImage = async () => {
      setIsRegeneratingImage(true);
      setRecipeHeroLoading(true);
      try {
        const refreshed = await generateRecipeImage(selectedRecipe.title, selectedRecipe.ingredients, {
          cuisine: selectedRecipe.cuisine,
          description: selectedRecipe.description,
        }, {
          fallbackImageUrl: selectedRecipe.imageUrl,
          forceRefresh: true,
        });
        setRecipeHeroImage(refreshed);
      } finally {
        setRecipeHeroLoading(false);
        setIsRegeneratingImage(false);
      }
    };
    
    const macroData = [
      { name: 'Protein', value: selectedRecipe.macros.protein * 4, color: '#10b981' },
      { name: 'Carbs', value: selectedRecipe.macros.carbs * 4, color: '#3b82f6' },
      { name: 'Fat', value: selectedRecipe.macros.fat * 9, color: '#f59e0b' },
    ];

    const scaleFactor = servingsScale;
    const scaledCalories = Math.round(selectedRecipe.macros.calories * scaleFactor);
    const scaledProtein = Math.round(selectedRecipe.macros.protein * scaleFactor);
    const scaledCarbs = Math.round(selectedRecipe.macros.carbs * scaleFactor);
    const scaledFat = Math.round(selectedRecipe.macros.fat * scaleFactor);

    const availableIngredientNames = Array.from(
      new Set([
        ...ingredients.map((item) => normalizeIngredientName(item.name)),
        ...PantryService.getPantry().map((item) => normalizeIngredientName(item.name)),
      ])
    );

    const missingIngredients = selectedRecipe.ingredients.filter(
      (ing) => !hasIngredientMatch(ing, availableIngredientNames)
    );
    const savedStepForRecipe = getCookingCheckpoint(selectedRecipe.id);

    const openSubstituteModal = async (ingredient: string) => {
      const pantryItems = PantryService.getPantry().map((item) => item.name);
      const dietaryPrefs = [nutritionalGoal, cuisinePreference].filter(Boolean);

      setSubstituteIngredient(ingredient);
      setSubstituteModalOpen(true);
      setSubstituteLoading(true);
      setSubstituteError(null);
      setSubstituteResults([]);

      try {
        const results = await getAISubstitutions(ingredient, pantryItems, dietaryPrefs);
        setSubstituteResults(results);
      } catch (error) {
        console.error('Failed to load substitutions:', error);
        setSubstituteError('Unable to load substitutions right now. Please try again.');
      } finally {
        setSubstituteLoading(false);
      }
    };

    const handleAddMissingToShoppingList = async () => {
      if (!selectedRecipe || missingIngredients.length === 0 || isAddingMissingToList) return;

      setIsAddingMissingToList(true);
      try {
        const items = missingIngredients.map((name) => {
          const estimate = getShoppingEstimate(name);
          return {
            name,
            quantity: estimate.quantity,
            unit: estimate.unit,
            recipeId: selectedRecipe.id,
          };
        });

        await ShoppingListService.addIngredientsToShoppingList(user?.uid || '', items);
        setBoughtMissingIngredients((prev) => Array.from(new Set([...prev, ...missingIngredients])));
      } catch (error) {
        console.error('Failed to add missing ingredients:', error);
        setError('Unable to add missing ingredients to shopping list right now.');
      } finally {
        setIsAddingMissingToList(false);
      }
    };

    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="relative h-[200px] overflow-hidden rounded-b-3xl">
          {recipeHeroLoading ? (
            <div className="w-full h-full bg-zinc-200 animate-pulse" />
          ) : (
            <motion.img
              key={recipeHeroImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              src={recipeHeroImage}
              className="w-full h-full object-cover"
              alt={selectedRecipe.title}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Button 
            onClick={() => setWorkflow('RECIPE_SELECTOR')} 
            variant="ghost" 
            size="icon" 
            className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <Button
            onClick={handleRegenerateRecipeImage}
            variant="ghost"
            size="sm"
            className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white hover:bg-white/40"
            disabled={isRegeneratingImage}
          >
            {isRegeneratingImage ? 'Regenerating...' : 'Regenerate Image'}
          </Button>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex gap-2 mb-2">
              <Badge variant="info" className="bg-white/20 backdrop-blur-md text-white border-white/30">{selectedRecipe.cuisine}</Badge>
              <Badge variant="success" className="bg-white/20 backdrop-blur-md text-white border-white/30">{selectedRecipe.difficulty}</Badge>
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight">{selectedRecipe.title}</h1>
          </div>
        </div>

        <div className="p-6 space-y-8 max-w-md mx-auto">
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Time</p>
              <p className="text-sm font-bold text-zinc-900">{getRecipeTotalMinutes(selectedRecipe)}m</p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Calories</p>
              <p className="text-sm font-bold text-zinc-900">{scaledCalories} kcal</p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Servings</p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setServingsScale(Math.max(0.5, servingsScale - 0.5))} className="text-zinc-400 hover:text-black">
                  <Minus className="w-3 h-3" />
                </button>
                <p className="text-sm font-bold text-zinc-900">{selectedRecipe.servings * scaleFactor}</p>
                <button onClick={() => setServingsScale(servingsScale + 0.5)} className="text-zinc-400 hover:text-black">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-900">Nutritional Intelligence</h3>
            <div className="h-48 w-full bg-zinc-50 rounded-3xl p-4 border border-zinc-100">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Protein</p>
                <p className="text-sm font-bold text-emerald-700">{scaledProtein}g</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Carbs</p>
                <p className="text-sm font-bold text-blue-700">{scaledCarbs}g</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Fat</p>
                <p className="text-sm font-bold text-amber-700">{scaledFat}g</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-4 bg-blue-50 border-blue-100 shadow-none">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Smart Cost Intelligence</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">₹{estimateRecipeCost(selectedRecipe.ingredients.length).toLocaleString('en-IN')}</p>
              <p className="text-xs text-blue-700 mt-1">Estimated total based on ingredient count and pantry-adjusted baseline.</p>
            </Card>
            <Card className="p-4 bg-emerald-50 border-emerald-100 shadow-none">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Precision Cook Timeline</p>
              <ul className="mt-1 space-y-1">
                {buildTimelineInsight(selectedRecipe).map((line) => (
                  <li key={line} className="text-xs text-emerald-800">{line}</li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-900">Ingredient Manifest</h3>
            <div className="space-y-2">
              {selectedRecipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <span className="text-sm font-medium text-zinc-700">{scaleIngredientForDisplay(ing, scaleFactor)}</span>
                  <div className="flex items-center gap-2">
                    {hasIngredientMatch(ing, availableIngredientNames) ? (
                      <Badge variant="success" className="text-[8px] px-1.5 py-0">In Stock</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[8px] px-1.5 py-0">Missing</Badge>
                    )}
                    {STATIC_SUBSTITUTIONS[ing.toLowerCase()] && (
                      <Badge variant="info" className="text-[8px] px-1.5 py-0">Swap Available</Badge>
                    )}
                    {hasIngredientMatch(ing, availableIngredientNames) ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {missingIngredients.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Missing Ingredients (Tap To Buy)</h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleAddMissingToShoppingList}
                    disabled={isAddingMissingToList}
                  >
                    {isAddingMissingToList ? 'Adding...' : 'Add All Missing'}
                  </Button>
                </div>
                {missingIngredients.map((ingredient) => (
                  (() => {
                    const isBought = boughtMissingIngredients.includes(ingredient);
                    const amountHint = getMissingAmountHint(ingredient);
                    return (
                  <div
                    key={`missing-${ingredient}`}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl border transition-colors text-left",
                      isBought
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-amber-50 border-amber-100"
                    )}
                  >
                    <div className="text-left">
                      <p className={cn("text-sm font-medium", isBought ? "text-emerald-900" : "text-amber-900")}>{ingredient}</p>
                      <p className={cn("text-[11px]", isBought ? "text-emerald-700" : "text-amber-700")}>Estimated amount: {amountHint}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openSubstituteModal(ingredient)}
                        className="text-zinc-600"
                      >
                        Need a substitute?
                      </Button>
                      <button
                        onClick={() => {
                          InstamartService.openInstamart(ingredient);
                          setBoughtMissingIngredients((prev) => (prev.includes(ingredient) ? prev : [...prev, ingredient]));
                        }}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border",
                          isBought
                            ? "text-emerald-700 border-emerald-200 bg-emerald-100"
                            : "text-amber-700 border-amber-200 bg-amber-100 hover:bg-amber-200"
                        )}
                      >
                        {isBought ? 'Bought' : 'Buy'}
                      </button>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={() => {
              const savedStep = getCookingCheckpoint(selectedRecipe.id);
              const safeStep = Math.min(savedStep, Math.max(selectedRecipe.steps.length - 1, 0));
              setCurrentStepIndex(safeStep);
              setWorkflow('COOKING_MODE');
            }} 
            className="w-full py-6 text-lg shadow-xl shadow-black/10"
          >
            {savedStepForRecipe > 0 ? 'Resume Cooking Mode' : 'Start Cooking Mode'} <Play className="ml-2 w-4 h-4 fill-current" />
          </Button>
        </div>

        <AnimatePresence>
          {substituteModalOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSubstituteModalOpen(false)}
                className="fixed inset-0 bg-black/40 z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl border-t border-zinc-100 p-5 max-w-md mx-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ingredient Substitution Engine</p>
                    <h4 className="text-base font-bold text-zinc-900">{substituteIngredient}</h4>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSubstituteModalOpen(false)}>Dismiss</Button>
                </div>

                {substituteLoading && (
                  <div className="space-y-2">
                    {[0, 1, 2].map((s) => (
                      <div key={s} className="p-3 rounded-2xl border border-zinc-100 bg-zinc-50 animate-pulse">
                        <div className="h-3 w-40 bg-zinc-200 rounded mb-2" />
                        <div className="h-2 w-56 bg-zinc-200 rounded" />
                      </div>
                    ))}
                  </div>
                )}

                {!substituteLoading && substituteError && (
                  <div className="p-3 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-sm">
                    {substituteError}
                  </div>
                )}

                {!substituteLoading && !substituteError && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {substituteResults.length === 0 ? (
                      <p className="text-sm text-zinc-500 p-3 bg-zinc-50 border border-zinc-100 rounded-2xl">No substitutes available right now.</p>
                    ) : (
                      substituteResults.map((item, index) => (
                        <div
                          key={`${item.substitute}-${index}`}
                          className={cn(
                            "p-3 rounded-2xl border",
                            item.pantryMatch
                              ? "bg-emerald-50 border-emerald-100"
                              : "bg-zinc-50 border-zinc-100"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-sm font-bold", item.pantryMatch ? 'text-emerald-900' : 'text-zinc-900')}>
                              {item.substitute}
                            </p>
                            <Badge variant={item.pantryMatch ? 'success' : 'default'}>
                              {Math.round(item.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className={cn("text-xs mt-1", item.pantryMatch ? 'text-emerald-700' : 'text-zinc-500')}>
                            {item.notes}
                          </p>
                          {item.pantryMatch && (
                            <p className="text-[10px] mt-1 font-bold uppercase tracking-wider text-emerald-600">Available in your pantry</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const CookingModePage = () => {
    if (!selectedRecipe) return null;
    const currentStep = selectedRecipe.steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / selectedRecipe.steps.length) * 100;
    const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(true);
    const [keepScreenAwake, setKeepScreenAwake] = useState(() => localStorage.getItem('COOK_MODE_KEEP_AWAKE') === 'true');
    const wakeLockRef = useRef<any>(null);
    const resolvedStepDuration = resolveStepDuration(currentStep.instruction, currentStep.duration);
    const stepDuration = resolvedStepDuration.duration;
    const rangeOptions = parseStepDurationRangeOptions(currentStep.instruction);
    const [selectedTimerDuration, setSelectedTimerDuration] = useState(stepDuration);
    const isSuggestedTimer = resolvedStepDuration.suggested;
    const canAutoAdvanceFromTimer = !isSuggestedTimer;
    const supportsWakeLock = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

    useEffect(() => {
      speak(currentStep.instruction);
    }, [currentStepIndex]);

    useEffect(() => {
      // FIX: Steps without explicit timing should not auto-advance by default.
      setAutoAdvanceTimer(canAutoAdvanceFromTimer);
    }, [canAutoAdvanceFromTimer, currentStepIndex]);

    useEffect(() => {
      setSelectedTimerDuration(stepDuration);
    }, [stepDuration, currentStepIndex]);

    useEffect(() => {
      saveCookingCheckpoint(selectedRecipe.id, currentStepIndex);
    }, [selectedRecipe.id, currentStepIndex]);

    useEffect(() => {
      localStorage.setItem('COOK_MODE_KEEP_AWAKE', keepScreenAwake ? 'true' : 'false');
    }, [keepScreenAwake]);

    useEffect(() => {
      let isCancelled = false;

      const requestWakeLock = async () => {
        if (!keepScreenAwake || !supportsWakeLock) return;

        try {
          const wakeLock = await (navigator as any).wakeLock.request('screen');
          if (isCancelled) {
            await wakeLock.release();
            return;
          }

          wakeLockRef.current = wakeLock;
          wakeLock.addEventListener?.('release', () => {
            wakeLockRef.current = null;
          });
        } catch {
          // Keep cooking mode functional even if wake lock is unavailable.
        }
      };

      const releaseWakeLock = async () => {
        try {
          await wakeLockRef.current?.release?.();
        } catch {
          // Ignore release errors.
        } finally {
          wakeLockRef.current = null;
        }
      };

      if (keepScreenAwake) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }

      return () => {
        isCancelled = true;
        releaseWakeLock();
      };
    }, [keepScreenAwake, supportsWakeLock]);

    const handleTimerComplete = () => {
      speak("Time is up.");

      if (autoAdvanceTimer && canAutoAdvanceFromTimer && currentStepIndex < selectedRecipe.steps.length - 1) {
        speak("Moving to the next step.");
        setCurrentStepIndex(currentStepIndex + 1);
      }
    };

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-zinc-100">
          <Button onClick={() => setWorkflow('RECIPE_SELECTOR')} variant="ghost" size="icon">
            <X className="w-6 h-6" />
          </Button>
          <div className="text-center">
              const savedStep = getCookingCheckpoint(selectedRecipe.id);
              const safeStep = Math.min(savedStep, Math.max(selectedRecipe.steps.length - 1, 0));
              setCurrentStepIndex(safeStep);
            <h3 className="text-sm font-bold text-zinc-900 truncate max-w-[200px]">{selectedRecipe.title}</h3>
          </div>
          <Button onClick={() => setIsMuted(!isMuted)} variant="ghost" size="icon">
            {isMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-zinc-900" />}
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12">
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-black"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <ChefHat className="w-10 h-10 text-zinc-300" />
              </div>
              <h2 className="text-3xl font-bold leading-tight text-zinc-900">
                {currentStep.instruction}
              </h2>
              
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="info">Smart Timer: {formatDurationLabel(selectedTimerDuration)}</Badge>
                  {resolvedStepDuration.source === 'recipe' ? (
                    <Badge variant="default">Recipe Defined</Badge>
                  ) : resolvedStepDuration.source === 'detected' ? (
                    <Badge variant="warning">Detected From Instruction</Badge>
                  ) : (
                    <Badge variant="warning">Suggested</Badge>
                  )}
                </div>

                {rangeOptions.length > 1 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {rangeOptions.map((seconds) => (
                      <button
                        key={`timer-option-${seconds}`}
                        onClick={() => setSelectedTimerDuration(seconds)}
                        className={cn(
                          'text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-colors',
                          selectedTimerDuration === seconds
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                        )}
                      >
                        {formatDurationLabel(seconds)}
                      </button>
                    ))}
                  </div>
                )}

                <CookingTimer
                  duration={selectedTimerDuration}
                  autoStart={!isSuggestedTimer}
                  label={resolvedStepDuration.suggested ? 'Step Timer' : 'Timer'}
                  suggested={resolvedStepDuration.suggested}
                  onComplete={handleTimerComplete}
                />

                <button
                  onClick={() => setAutoAdvanceTimer((prev) => !prev)}
                  className={cn(
                    "mx-auto text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                    autoAdvanceTimer
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-zinc-50 border-zinc-200 text-zinc-600"
                  )}
                >
                  Auto move to next step: {autoAdvanceTimer ? 'On' : 'Off'}
                </button>

                <button
                  onClick={() => setKeepScreenAwake((prev) => !prev)}
                  disabled={!supportsWakeLock}
                  className={cn(
                    "mx-auto text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    keepScreenAwake
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-zinc-50 border-zinc-200 text-zinc-600"
                  )}
                >
                  Keep screen awake: {keepScreenAwake ? 'On' : 'Off'}
                </button>

                {!supportsWakeLock && (
                  <p className="text-[11px] text-zinc-500">
                    This browser does not support screen wake lock.
                  </p>
                )}

                {isSuggestedTimer && (
                  <p className="text-xs text-zinc-500">
                    No time found in instruction. Start this suggested timer manually when ready.
                  </p>
                )}
              </div>

              {currentStep.tip && (
                <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3 text-left max-w-sm mx-auto">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 leading-relaxed font-medium">{currentStep.tip}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-8 grid grid-cols-2 gap-4">
          <Button 
            variant="secondary" 
            className="py-6"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
          >
            <ArrowLeft className="mr-2 w-5 h-5" /> Previous
          </Button>
          {currentStepIndex === selectedRecipe.steps.length - 1 ? (
            <Button 
              variant="primary" 
              className="py-6 bg-green-600 hover:bg-green-700"
              onClick={() => {
                const consumedCount = PantryService.consumeIngredientsByNames(selectedRecipe.ingredients);
                PantryService.recordLastCookActivity(selectedRecipe.title, consumedCount);
                clearCookingCheckpoint(selectedRecipe.id);
                const cookProgress = GamificationService.recordCook();
                setGamificationState(cookProgress.state);
                if (cookProgress.newlyUnlocked.length) {
                  setNewlyUnlockedBadges(cookProgress.newlyUnlocked);
                }
                setWorkflow('POST_COMPLETION');
              }}
            >
              Complete <CheckCircle2 className="ml-2 w-5 h-5" />
            </Button>
          ) : (
            <Button 
              variant="primary" 
              className="py-6"
              onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
            >
              Next Step <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const PostCompletionPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center justify-center text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="w-24 h-24 bg-green-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="text-green-600 w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight">Chef's Kiss!</h2>
          <p className="text-zinc-500">You've successfully completed this recipe.</p>
        </div>

        <Card className="p-8 space-y-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nutritional Impact</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{selectedRecipe?.macros.calories}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Calories</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{selectedRecipe?.macros.protein}g</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Protein</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{selectedRecipe?.macros.carbs}g</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Carbs</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{selectedRecipe?.macros.fat}g</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fat</p>
            </div>
          </div>
        </Card>

        {newlyUnlockedBadges.length > 0 && (
          <Card className="p-5 space-y-3 border-amber-100 bg-amber-50">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">New Badges Unlocked</p>
            <div className="space-y-2">
              {newlyUnlockedBadges.map((badge) => (
                <div key={badge.id} className="rounded-2xl border border-amber-200 bg-white p-3 text-left">
                  <p className="text-sm font-bold text-zinc-900">{badge.title}</p>
                  <p className="text-xs text-zinc-600">{badge.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Taste Feedback</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'TOO_SPICY', label: 'Too Spicy' },
              { id: 'TOO_BLAND', label: 'Too Bland' },
              { id: 'PERFECT', label: 'Perfect' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  const selected = option.id as TasteFeedback;
                  setTasteFeedback(selected);
                  setStoredTasteFeedback(selected);
                }}
                className={cn(
                  'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                  tasteFeedback === option.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">Saved locally and used to nudge future recipe ranking.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button onClick={() => {
            setNewlyUnlockedBadges([]);
            setWorkflow('LANDING');
          }} className="w-full py-4">
            Back to Home
          </Button>
          <Button onClick={() => setWorkflow('CAMERA_SCAN')} variant="secondary" className="w-full py-4">
            Scan More Ingredients
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const SavedRecipesPage = () => {
    const cuisineCount = new Set(visibleSavedRecipes.map((recipe) => recipe.cuisine)).size;
    const featuredCuisines = Array.from(new Set(visibleSavedRecipes.map((recipe) => recipe.cuisine))).slice(0, 3);

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eef4ff,transparent_40%),radial-gradient(circle_at_bottom_right,#f4fff7,transparent_45%),#fafafa] p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="rounded-3xl border border-white/70 bg-white/85 backdrop-blur-xl p-5 sm:p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)]">
            <div className="flex justify-between items-center">
              <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon" className="bg-zinc-100 hover:bg-zinc-200">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Saved Recipes</h2>
              <div className="w-10" />
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Saved</p>
                <p className="text-2xl font-extrabold text-zinc-900">{visibleSavedRecipes.length}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Cuisines</p>
                <p className="text-2xl font-extrabold text-blue-900">{cuisineCount}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Ready To Cook</p>
                <p className="text-2xl font-extrabold text-emerald-900">{visibleSavedRecipes.length}</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Favorites</p>
                <p className="text-2xl font-extrabold text-rose-900">{visibleSavedRecipes.length > 0 ? 'On' : 'Off'}</p>
              </div>
            </div>

            {featuredCuisines.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {featuredCuisines.map((cuisine) => (
                  <Badge key={cuisine} variant="info" className="text-[10px] px-3 py-1">{cuisine}</Badge>
                ))}
              </div>
            )}
          </div>

          {visibleSavedRecipes.length === 0 ? (
            <div className="rounded-3xl border border-zinc-100 bg-white p-10 text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <History className="w-10 h-10 text-zinc-200" />
              </div>
              <div className="space-y-1">
                <p className="text-zinc-700 font-semibold">No saved recipes yet.</p>
                <p className="text-sm text-zinc-500">Save your favorite dishes from recipe cards to build your personal cookbook.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {visibleSavedRecipes.map(recipe => (
                <Card key={recipe.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 group border-zinc-100/90 hover:border-zinc-200 hover:shadow-lg">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-zinc-100 shrink-0">
                      <img src={recipe.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleRecipeImageError} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-zinc-900 truncate">{recipe.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{recipe.cuisine}</p>
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => removeSavedRecipe(recipe.id)} className="hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-zinc-300 hover:text-red-500" />
                    </Button>
                    <Button size="sm" className="px-4" onClick={() => {
                      setSelectedRecipe(recipe);
                      setCurrentStepIndex(0);
                      setWorkflow('COOKING_MODE');
                    }}>
                      Cook
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const OfflineManualPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-500" />
            <h2 className="text-xl font-bold">Offline Mode</h2>
          </div>
          <div className="w-10" />
        </div>

        <Card className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Manual Entry</h3>
            <div className="flex gap-2">
              <input 
                id="offline-manual-input"
                type="text"
                list="ingredient-suggestions"
                placeholder="Add ingredient..."
                className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 text-sm focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if (val) {
                      setIngredients([...ingredients, { id: Date.now().toString(), name: val, category: 'Manual', confidence: 1 }]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <Button
                size="icon"
                className="h-12 w-12 rounded-2xl"
                onClick={() => {
                  const input = document.getElementById('offline-manual-input') as HTMLInputElement | null;
                  const val = input?.value.trim();
                  if (input && val) {
                    setIngredients([...ingredients, { id: Date.now().toString(), name: val, category: 'Manual', confidence: 1 }]);
                    input.value = '';
                  }
                }}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredients.map(ing => (
                <div key={ing.id} className="bg-zinc-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">{ing.name}</span>
                  <button onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}>
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-100">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cuisine</h3>
            <div className="grid grid-cols-3 gap-2">
              {['ALL', 'ITALIAN', 'CHINESE', 'MEXICAN', 'INDIAN', 'GREEK'].map(c => (
                <button
                  key={c}
                  onClick={() => setCuisinePreference(c)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
                    cuisinePreference === c ? "bg-black border-black text-white" : "bg-white border-zinc-100 text-zinc-400"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => {
            const matches = OFFLINE_RECIPES.filter(r => 
              (cuisinePreference === 'ALL' || r.cuisine === cuisinePreference) &&
              r.ingredients.some(ri => ingredients.some(i => i.name.toLowerCase().includes(ri.toLowerCase())))
            );
            setRecipes(matches.length > 0 ? matches : OFFLINE_RECIPES.slice(0, 3));
            setWorkflow('RECIPE_SELECTOR');
          }} className="w-full py-6 text-lg">
            Find Local Recipes
          </Button>
        </Card>
      </div>
    </div>
  );

  const ScanHistoryPage = () => (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-md mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Button onClick={() => setWorkflow('LANDING')} variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold">Scan Vault</h2>
          <div className="w-10" />
        </div>

        {scanResults.length === 0 ? (
          <Card className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
              <Database className="w-7 h-7 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-600">No saved scans yet.</p>
            <p className="text-xs text-zinc-400">Capture or upload an image to auto-save scan results here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {scanResults.map((scan, index) => {
              const delta = getScanDelta(scan, scanResults[index + 1]);

              return (
                <Card key={scan.id} className="p-0 overflow-hidden">
                  {scan.imageDataUrl && (
                    <div className="h-36 w-full overflow-hidden bg-zinc-100">
                      <img src={scan.imageDataUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                      <Badge variant="info">{scan.ingredientCount} items</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="font-bold text-zinc-700">Confidence:</span>
                      <span>{Math.round(scan.averageConfidence * 100)}%</span>
                      {index < scanResults.length - 1 && (
                        <>
                          <span className="mx-1">|</span>
                          <span className="text-green-600">+{delta.added}</span>
                          <span className="text-red-500">-{delta.removed}</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {scan.ingredients.slice(0, 5).map((ingredient) => (
                        <span key={`${scan.id}-${ingredient.id}`} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-100 text-zinc-600">
                          {ingredient.name}
                        </span>
                      ))}
                      {scan.ingredients.length > 5 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">
                          +{scan.ingredients.length - 5} more
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button variant="secondary" className="w-full" onClick={() => handleUseScanResult(scan)}>
                        Use This Result
                      </Button>
                      <Button variant="danger" className="w-full" onClick={() => handleDeleteScanResult(scan.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const pagesWithoutNativeBack = ['PANTRY_TRACKER', 'MEAL_PLANNER', 'PROFILE_SETTINGS', 'SHOPPING_LIST'] as WorkflowState[];
  const showGlobalBackButton = pagesWithoutNativeBack.includes(workflow) && workflowHistory.length > 0;

  return (
    <div className={cn("font-sans antialiased text-zinc-900", ['LANDING', 'API_CONFIG', 'CAMERA_SCAN', 'PROCESSING', 'COOKING_MODE'].indexOf(workflow) === -1 && "pb-24")}>
      {showGlobalBackButton && (
        <div className="fixed top-4 left-4 z-[55]">
          <Button onClick={handleGoBack} variant="ghost" size="icon" className="bg-white/90 border border-zinc-200 shadow-sm backdrop-blur-xl hover:bg-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {workflow === 'LANDING' && <LandingPage key="landing" />}
        {workflow === 'API_CONFIG' && <APIConfigPage key="config" />}
        {workflow === 'CAMERA_SCAN' && <CameraScanPage key="scan" />}
        {workflow === 'PROCESSING' && <ProcessingPage key="processing" />}
        {workflow === 'PERCEPTION_MAP' && <PerceptionMapPage key="perception" />}
        {workflow === 'INGREDIENT_LIST' && <IngredientListPage key="list" />}
        {workflow === 'RECIPE_SELECTOR' && <RecipeSelectorPage key="selector" />}
        {workflow === 'RECIPE_DETAIL' && <RecipeDetailPage key="detail" />}
        {workflow === 'COOKING_MODE' && <CookingModePage key="cooking" />}
        {workflow === 'POST_COMPLETION' && <PostCompletionPage key="completion" />}
        {workflow === 'SAVED_RECIPES' && <SavedRecipesPage key="saved" />}
        {workflow === 'OFFLINE_MANUAL' && <OfflineManualPage key="offline" />}
        {workflow === 'SCAN_HISTORY' && <ScanHistoryPage key="scan-history" />}
        {workflow === 'PANTRY_TRACKER' && <PantryTracker key="pantry" />}
        {workflow === 'MEAL_PLANNER' && <MealPlanner key="planner" userId={user?.uid || ''} />}
        {workflow === 'PROFILE_SETTINGS' && <ProfileSettings key="profile" user={user as any} onLogout={handleLogout} />}
        {workflow === 'SHOPPING_LIST' && <ShoppingList key="shopping-list" user={user} />}
      </AnimatePresence>

      <AnimatePresence>
        {mealPlanDialogOpen && mealPlanRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-md"
            >
              <Card className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">Plan This Recipe</h3>
                    <p className="text-sm text-zinc-500 line-clamp-1">{mealPlanRecipe.title}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setMealPlanDialogOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Day</label>
                  <input
                    type="date"
                    value={mealPlanDate}
                    onChange={(event) => setMealPlanDate(event.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealPlanEntry['type'][]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setMealPlanType(type)}
                        className={cn(
                          'px-3 py-2 rounded-xl border text-xs font-bold tracking-wide transition-all',
                          mealPlanType === type
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="w-full" onClick={() => setMealPlanDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="w-full" onClick={confirmAddToMealPlan}>
                    Add To Planner
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {['LANDING', 'API_CONFIG', 'CAMERA_SCAN', 'PROCESSING', 'COOKING_MODE'].indexOf(workflow) === -1 && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 px-6 py-3 z-50">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <NavButton 
              active={workflow === 'CAMERA_SCAN' || workflow === 'PERCEPTION_MAP' || workflow === 'INGREDIENT_LIST'} 
              onClick={() => setWorkflow('CAMERA_SCAN')} 
              icon={<Camera className="w-6 h-6" />} 
              label="Scan" 
            />
            <NavButton 
              active={workflow === 'PANTRY_TRACKER'} 
              onClick={() => setWorkflow('PANTRY_TRACKER')} 
              icon={<Package className="w-6 h-6" />} 
              label="Pantry" 
            />
            <NavButton 
              active={workflow === 'MEAL_PLANNER'} 
              onClick={() => setWorkflow('MEAL_PLANNER')} 
              icon={<Calendar className="w-6 h-6" />} 
              label="Planner" 
            />
            <NavButton 
              active={workflow === 'SAVED_RECIPES'} 
              onClick={() => setWorkflow('SAVED_RECIPES')} 
              icon={<Heart className="w-6 h-6" />} 
              label="Saved" 
            />
            <NavButton 
              active={workflow === 'SHOPPING_LIST'} 
              onClick={() => setWorkflow('SHOPPING_LIST')} 
              icon={<ShoppingCart className="w-6 h-6" />} 
              label="List" 
            />
            <NavButton 
              active={workflow === 'PROFILE_SETTINGS'} 
              onClick={() => setWorkflow('PROFILE_SETTINGS')} 
              icon={<UserIcon className="w-6 h-6" />} 
              label="Profile" 
            />
          </div>
        </nav>
      )}

      <datalist id="ingredient-suggestions">
        {INGREDIENT_DICTIONARY.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-black rounded-full mt-0.5" />}
    </button>
  );
}
