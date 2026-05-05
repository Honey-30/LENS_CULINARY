/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recipe } from '../types';

const LOCAL_SAVED_RECIPES_KEY = 'CULINARY_LENS_LOCAL_SAVED_RECIPES';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export class StorageService {
  static async signInWithGoogle(): Promise<null> {
    return null;
  }

  static async logout(): Promise<void> {
    return;
  }

  static onAuthChange(callback: (user: null) => void) {
    callback(null);
    return () => undefined;
  }

  static async saveRecipe(userId: string, recipe: Recipe): Promise<void> {
    const current = StorageService.getSavedRecipes();
    const next = [...current.filter((item) => item.id !== recipe.id), recipe];
    localStorage.setItem(LOCAL_SAVED_RECIPES_KEY, JSON.stringify(next));
  }

  static async deleteRecipe(userId: string, recipeId: string): Promise<void> {
    const next = StorageService.getSavedRecipes().filter((recipe) => recipe.id !== recipeId);
    localStorage.setItem(LOCAL_SAVED_RECIPES_KEY, JSON.stringify(next));
  }

  static onSavedRecipesChange(userId: string, callback: (recipes: Recipe[]) => void) {
    callback(StorageService.getSavedRecipes());
    return () => undefined;
  }

  static async testConnection() {
    return;
  }

  private static getSavedRecipes(): Recipe[] {
    const raw = localStorage.getItem(LOCAL_SAVED_RECIPES_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
    } catch {
      return [];
    }
  }
}
