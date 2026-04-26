/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, Ingredient, NutritionalGoal } from "../types";
import { STATIC_RECIPES } from "./staticRecipes";
import { LARGE_RECIPE_DATABASE } from "./recipeDatabase";
import { AllergyService } from "./allergyService";

const ALL_RECIPES = [...STATIC_RECIPES, ...LARGE_RECIPE_DATABASE];
const STATIC_IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=1000',
];

export class RecipeEngine {
  private ai: GoogleGenAI;
  private hasApiKey: boolean;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.hasApiKey = Boolean(apiKey && apiKey.trim().length > 0);
  }

  private getStaticFallbackImage(seed: number = 0): string {
    return STATIC_IMAGE_FALLBACKS[Math.abs(seed) % STATIC_IMAGE_FALLBACKS.length];
  }

  private async generateRecipeImage(recipe: { title?: string; description?: string; cuisine?: string }, index: number): Promise<string> {
    if (!this.hasApiKey) {
      return this.getStaticFallbackImage(index);
    }

    const prompt = `Professional food photography of ${recipe.title || 'a delicious dish'}, ${recipe.description || ''}, ${recipe.cuisine || ''} cuisine, plated, realistic lighting, detailed texture, no text, no watermark.`;

    try {
      const modelsClient = (this.ai as any)?.models;
      if (!modelsClient?.generateImages) {
        return this.getStaticFallbackImage(index);
      }

      const response = await modelsClient.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      const bytes = response?.generatedImages?.[0]?.image?.imageBytes;
      if (bytes && typeof bytes === 'string') {
        return `data:image/jpeg;base64,${bytes}`;
      }

      return this.getStaticFallbackImage(index);
    } catch {
      return this.getStaticFallbackImage(index);
    }
  }

  async synthesizeRecipes(
    ingredients: Ingredient[],
    cuisine: string,
    goal: NutritionalGoal,
    freeTier: boolean = false
  ): Promise<Recipe[]> {
    const ingredientNames = ingredients.map(i => i.name.toLowerCase());
    
    // 1. Intelligent Static Matching with Nutritional Scoring
    let staticMatches = ALL_RECIPES.filter(recipe => {
      const matchesCuisine = cuisine === 'ALL' || recipe.cuisine.toUpperCase() === cuisine.toUpperCase();
      
      // Nutritional Filtering
      let matchesGoal = true;
      if (goal === 'LOW CALORIE') matchesGoal = recipe.macros.calories < 400;
      if (goal === 'HIGH PROTEIN') matchesGoal = recipe.macros.protein > 20;
      if (goal === 'LOW CARB') matchesGoal = recipe.macros.carbs < 30;

      const overlap = recipe.ingredients.filter(ing => 
        ingredientNames.some(name => {
          const ingLower = ing.toLowerCase();
          const nameLower = name.toLowerCase();
          return nameLower.includes(ingLower) || ingLower.includes(nameLower);
        })
      ).length;

      // Score based on overlap and goal matching
      return matchesCuisine && matchesGoal && overlap >= 1;
    }).sort((a, b) => {
      const overlapA = a.ingredients.filter(ing => ingredientNames.some(name => name.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(name.toLowerCase()))).length;
      const overlapB = b.ingredients.filter(ing => ingredientNames.some(name => name.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(name.toLowerCase()))).length;
      
      // Secondary sort by nutritional goal alignment
      if (overlapB === overlapA) {
        if (goal === 'HIGH PROTEIN') return b.macros.protein - a.macros.protein;
        if (goal === 'LOW CALORIE') return a.macros.calories - b.macros.calories;
        if (goal === 'LOW CARB') return a.macros.carbs - b.macros.carbs;
      }
      return overlapB - overlapA;
    });

    // Allergy Filtering
    staticMatches = AllergyService.filterRecipes(staticMatches);

    if (!this.hasApiKey) {
      if (staticMatches.length > 0) return staticMatches.slice(0, 5);
      return ALL_RECIPES.slice(0, 5);
    }

    // If in free tier mode and we have enough static matches, skip AI generation
    if (freeTier && staticMatches.length >= 5) {
      console.log(`RecipeEngine: Skipping AI generation in Free Tier Mode (found ${staticMatches.length} static matches)`);
      return staticMatches.slice(0, 5);
    }

    // 2. AI Generation
    const allergies = AllergyService.getAllergies().filter(Boolean);
    const allergyConstraint = allergies.length > 0
      ? `Avoid these allergens completely: ${allergies.join(', ')}. Never include them in ingredients.`
      : '';

    const prompt = `Generate 2 unique recipes using these ingredients: ${ingredientNames.join(', ')}. 
    Cuisine preference: ${cuisine}. 
    Nutritional goal: ${goal}. 
    ${allergyConstraint}
    Return a JSON array of recipe objects with title, description, cuisine, ingredients, steps (id, instruction, duration in seconds, tip), prepTime, cookTime, servings, difficulty, macros (calories, protein, carbs, fat), and imageUrl (a descriptive string for image search, e.g., 'vibrant pasta carbonara with fresh herbs').`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                cuisine: { type: Type.STRING },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      instruction: { type: Type.STRING },
                      duration: { type: Type.NUMBER, description: "Step duration in seconds" },
                      tip: { type: Type.STRING }
                    },
                    required: ["id", "instruction"]
                  }
                },
                prepTime: { type: Type.NUMBER },
                cookTime: { type: Type.NUMBER },
                servings: { type: Type.NUMBER },
                difficulty: { type: Type.STRING, enum: ["EASY", "MEDIUM", "HARD"] },
                macros: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER }
                  }
                },
                imageUrl: { type: Type.STRING, description: "Image search term" }
              },
              required: ["title", "description", "cuisine", "ingredients", "steps", "macros", "imageUrl"]
            }
          }
        }
      });

      const aiRawRecipes = JSON.parse(response.text || "[]");
      const aiRecipesRaw = await Promise.all(
        aiRawRecipes.map(async (r: any, index: number) => ({
          ...r,
          id: `ai-${Date.now()}-${index}`,
          source: 'AI',
          isAI: true,
          imageUrl: await this.generateRecipeImage(r, index),
        }))
      );
      const aiRecipes = AllergyService.filterRecipes(aiRecipesRaw);

      // 3. Composition
      let finalRecipes: Recipe[] = [];
      if (staticMatches.length >= 2) {
        finalRecipes = [...staticMatches.slice(0, 2), aiRecipes[0]];
      } else if (staticMatches.length === 1) {
        finalRecipes = [staticMatches[0], ...aiRecipes.slice(0, 2)];
      } else {
        finalRecipes = aiRecipes.slice(0, 3);
      }

      return AllergyService.filterRecipes(finalRecipes.filter(Boolean));
    } catch (error) {
      console.error('Recipe synthesis error:', error);
      // Fallback to static matches if AI fails
      return staticMatches.slice(0, 3);
    }
  }
}
