/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recipe } from '../types';

const LOCAL_MEAL_PLAN_KEY = 'CULINARY_LENS_LOCAL_MEAL_PLAN';

export interface MealPlanEntry {
  id?: string;
  recipeId: string;
  recipeTitle: string;
  date: string; // ISO date string
  type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  recipeImageUrl?: string;
}

export class MealPlanService {
  static async addEntry(userId: string, entry: MealPlanEntry): Promise<void> {
    const id = entry.id || `meal-${Date.now()}`;
    const current = this.getLocalEntries();
    const next = [{ ...entry, id }, ...current.filter((item) => item.id !== id)];
    localStorage.setItem(LOCAL_MEAL_PLAN_KEY, JSON.stringify(next));
  }

  static async removeEntry(userId: string, entryId: string): Promise<void> {
    const next = this.getLocalEntries().filter((entry) => entry.id !== entryId);
    localStorage.setItem(LOCAL_MEAL_PLAN_KEY, JSON.stringify(next));
  }

  static async getEntries(userId: string): Promise<MealPlanEntry[]> {
    return this.getLocalEntries();
  }

  static onMealPlanChange(userId: string, callback: (entries: MealPlanEntry[]) => void) {
    callback(this.getLocalEntries());
    return () => undefined;
  }

  private static getLocalEntries(): MealPlanEntry[] {
    const raw = localStorage.getItem(LOCAL_MEAL_PLAN_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as MealPlanEntry[]) : [];
    } catch {
      return [];
    }
  }
}
