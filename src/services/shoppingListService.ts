/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingListItem } from '../types';

const LOCAL_SHOPPING_LIST_KEY = 'CULINARY_LENS_LOCAL_SHOPPING_LIST';

const getShoppingListCollection = (userId: string) => userId;

export const ShoppingListService = {
    async getShoppingList(userId: string): Promise<ShoppingListItem[]> {
        return getLocalShoppingList();
    },

    async addIngredientsToShoppingList(userId: string, items: Omit<ShoppingListItem, 'id' | 'isChecked'>[]): Promise<void> {
        const current = getLocalShoppingList();
        const toAdd: ShoppingListItem[] = items.map((item) => ({
            ...item,
            id: `local-shopping-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            isChecked: false,
        }));
        setLocalShoppingList([...toAdd, ...current]);
    },

    async updateShoppingListItem(userId: string, itemId: string, updates: Partial<ShoppingListItem>): Promise<void> {
        const updated = getLocalShoppingList().map((item) => item.id === itemId ? { ...item, ...updates } : item);
        setLocalShoppingList(updated);
    },

    async removeShoppingListItem(userId: string, itemId: string): Promise<void> {
        const updated = getLocalShoppingList().filter((item) => item.id !== itemId);
        setLocalShoppingList(updated);
    },

    async clearCheckedItems(userId: string): Promise<void> {
        const updated = getLocalShoppingList().filter((item) => !item.isChecked);
        setLocalShoppingList(updated);
    }
};

function getLocalShoppingList(): ShoppingListItem[] {
    const raw = localStorage.getItem(LOCAL_SHOPPING_LIST_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ShoppingListItem[]) : [];
    } catch {
        return [];
    }
}

function setLocalShoppingList(items: ShoppingListItem[]) {
    localStorage.setItem(LOCAL_SHOPPING_LIST_KEY, JSON.stringify(items));
}
