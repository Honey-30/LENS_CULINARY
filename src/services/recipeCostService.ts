import { Ingredient, Recipe } from '../types';

const LOCAL_PRICE_TABLE: Array<{ terms: string[]; priceInInr: number }> = [
  { terms: ['salt', 'pepper', 'chili flakes', 'oregano', 'basil', 'coriander', 'cumin', 'turmeric', 'paprika'], priceInInr: 10 },
  { terms: ['garlic', 'ginger', 'onion', 'tomato'], priceInInr: 18 },
  { terms: ['carrot', 'cucumber', 'capsicum', 'bell pepper', 'spinach', 'broccoli', 'zucchini', 'mushroom', 'cauliflower'], priceInInr: 28 },
  { terms: ['potato', 'sweet potato', 'peas', 'corn', 'beans', 'lentils', 'chickpeas', 'rice', 'pasta', 'noodle', 'bread', 'tortilla'], priceInInr: 35 },
  { terms: ['milk', 'curd', 'yogurt', 'paneer', 'cheese', 'butter', 'cream', 'egg'], priceInInr: 55 },
  { terms: ['tofu', 'tempeh', 'soy sauce', 'miso', 'tahini', 'pesto', 'tomato sauce', 'curry paste'], priceInInr: 60 },
  { terms: ['chicken', 'shrimp', 'prawn', 'fish', 'salmon', 'beef', 'mutton', 'lamb', 'pork'], priceInInr: 140 },
  { terms: ['almond', 'cashew', 'walnut', 'pistachio', 'seed', 'nut'], priceInInr: 85 },
];

const BASIC_PANTRY_DISCOUNT_TERMS = ['salt', 'pepper', 'garlic', 'onion', 'rice', 'oil', 'water'];

function normalizeText(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findIngredientPrice(ingredient: string): number {
  const normalized = normalizeText(ingredient);
  if (!normalized) return 25;

  for (const entry of LOCAL_PRICE_TABLE) {
    if (entry.terms.some((term) => normalized.includes(term))) {
      return entry.priceInInr;
    }
  }

  if (normalized.includes('spice') || normalized.includes('herb') || normalized.includes('seasoning')) {
    return 12;
  }

  if (normalized.includes('sauce') || normalized.includes('paste') || normalized.includes('dressing')) {
    return 30;
  }

  return 25;
}

function isLikelyPantryStaple(ingredient: string): boolean {
  const normalized = normalizeText(ingredient);
  return BASIC_PANTRY_DISCOUNT_TERMS.some((term) => normalized.includes(term));
}

export function estimateRecipeCost(recipe: Recipe, pantryItems: Ingredient[] = []): number {
  const ingredientNames = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const pantryNames = pantryItems.map((item) => normalizeText(item.name));

  const ingredientCost = ingredientNames.reduce((total, ingredient) => {
    const normalized = normalizeText(ingredient);
    const basePrice = findIngredientPrice(normalized);
    const matchedInPantry = pantryNames.some((pantryName) => pantryName.includes(normalized) || normalized.includes(pantryName));
    const pantryDiscount = matchedInPantry || isLikelyPantryStaple(normalized) ? 0.6 : 1;
    return total + Math.round(basePrice * pantryDiscount);
  }, 0);

  const servingsMultiplier = recipe.servings >= 5 ? 1.3 : recipe.servings >= 3 ? 1.12 : 1;
  const prepComplexity = recipe.steps.length >= 7 ? 1.08 : recipe.steps.length >= 4 ? 1.04 : 1;
  const rawEstimate = Math.round((ingredientCost + 45) * servingsMultiplier * prepComplexity);

  return Math.max(120, Math.min(rawEstimate, 1499));
}
