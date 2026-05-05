import React, { useState, useEffect } from 'react';
import { ShoppingListService } from '../services/shoppingListService';
import { InstamartService } from '../services/instamartService';
import { ShoppingListItem } from '../types';
import { Check, PlusCircle, Trash2, ShoppingBag, Sparkles, ClipboardList, CircleCheckBig } from 'lucide-react';
import { getIngredientSuggestions } from '../services/ingredientSuggestionService';

export const ShoppingList: React.FC = () => {
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
    const [newItemUnit, setNewItemUnit] = useState<string>('unit');
    const [isAdding, setIsAdding] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const userId = '';

    const fetchItems = () => {
        ShoppingListService.getShoppingList(userId)
            .then(setItems)
            .catch(() => {
                // FIX: Prevent unhandled rejections during list refresh and surface a user-visible failure.
                setError('Unable to load shopping list right now.');
            });
    };

    useEffect(() => {
        fetchItems();
    }, [userId]);

    useEffect(() => {
        if (!newItemName.trim()) {
            setSuggestions([]);
            return;
        }

        setSuggestions(getIngredientSuggestions(newItemName));
    }, [newItemName]);

    const handleAddItem = async () => {
        if (newItemName.trim() !== '') {
            setIsAdding(true);
            setError(null);
            const newItem: Omit<ShoppingListItem, 'id' | 'isChecked'> = {
                name: newItemName,
                quantity: Number.isFinite(newItemQuantity) && newItemQuantity > 0 ? newItemQuantity : 1,
                unit: newItemUnit.trim() || 'unit',
            };
            try {
                await ShoppingListService.addIngredientsToShoppingList(userId, [newItem]);
                setNewItemName('');
                setNewItemQuantity(1);
                setNewItemUnit('unit');
                setSuggestions([]);
                fetchItems();
            } catch {
                setError('Failed to add this item. Please try again.');
            } finally {
                setIsAdding(false);
            }
        }
    };

    const handleToggleItem = async (item: ShoppingListItem) => {
        setError(null);
        try {
            await ShoppingListService.updateShoppingListItem(userId, item.id, { isChecked: !item.isChecked });
            fetchItems();
        } catch {
            setError('Could not update this item.');
        }
    };

    const handleBuyItem = async (item: ShoppingListItem) => {
        setError(null);
        try {
            // Mark item as checked/purchased first
            await ShoppingListService.updateShoppingListItem(userId, item.id, { isChecked: true });
            
            // Open Google Shopping with the product
            InstamartService.openInstamart(item.name);
            
            // Refresh list to show updated state
            fetchItems();
        } catch {
            setError('Unable to mark item as bought.');
        }
    };

    const handleRemoveItem = async (item: ShoppingListItem) => {
        setError(null);
        try {
            // FIX: Add direct remove action so users can delete stale items without clearing all checked rows.
            await ShoppingListService.removeShoppingListItem(userId, item.id);
            fetchItems();
        } catch {
            setError('Unable to remove this item.');
        }
    };
    
    const handleClearChecked = async () => {
        setError(null);
        try {
            await ShoppingListService.clearCheckedItems(userId);
            fetchItems();
        } catch {
            setError('Unable to clear checked items.');
        }
    };

    const checkedItems = items.filter((item) => item.isChecked);
    const pendingItems = items.filter((item) => !item.isChecked);
    const progress = items.length > 0 ? Math.round((checkedItems.length / items.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eef7ff,transparent_50%),radial-gradient(circle_at_bottom_right,#f5f3ff,transparent_45%),#f8fafc] p-4 sm:p-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-5 rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-3">
                                <Sparkles size={14} />
                                Smart Shopping
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">Shopping List</h2>
                            <p className="mt-1 text-sm text-slate-500">Plan, track, and buy ingredients with one tap.</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3">
                            <ClipboardList size={18} />
                            <div>
                                <p className="text-xs text-slate-300">Completion</p>
                                <p className="text-sm font-bold">{progress}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Total</p>
                            <p className="text-xl font-bold text-slate-800">{items.length}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
                            <p className="text-xs text-amber-700">Pending</p>
                            <p className="text-xl font-bold text-amber-800">{pendingItems.length}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                            <p className="text-xs text-emerald-700">Bought</p>
                            <p className="text-xl font-bold text-emerald-800">{checkedItems.length}</p>
                        </div>
                    </div>

                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="bg-white/85 backdrop-blur-xl p-4 rounded-3xl border border-white/70 shadow-[0_16px_45px_-25px_rgba(15,23,42,0.35)] mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Add a new item..."
                            className="flex-grow p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                            disabled={isAdding}
                        />
                        <button 
                            onClick={handleAddItem} 
                            className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:bg-slate-400"
                            disabled={isAdding}
                        >
                            {isAdding ? '...' : <PlusCircle size={24} />}
                        </button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <label className="text-xs font-semibold text-slate-500 shrink-0">Qty</label>
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={newItemQuantity}
                                onChange={(e) => setNewItemQuantity(Math.max(1, Number(e.target.value) || 1))}
                                className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                disabled={isAdding}
                            />
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <label className="text-xs font-semibold text-slate-500 shrink-0">Unit</label>
                            <select
                                value={newItemUnit}
                                onChange={(e) => setNewItemUnit(e.target.value)}
                                className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none"
                                disabled={isAdding}
                            >
                                <option value="unit">unit</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="l">l</option>
                                <option value="ml">ml</option>
                                <option value="pack">pack</option>
                            </select>
                        </div>
                    </div>

                    {suggestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => setNewItemName(suggestion)}
                                    className="text-xs px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
                    )}
                </div>

                <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-white/70 shadow-[0_16px_45px_-25px_rgba(15,23,42,0.35)]">
                    {items.length > 0 ? (
                        <div className="space-y-4">
                            {pendingItems.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Items</p>
                                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-1">{pendingItems.length}</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {pendingItems.map((item) => (
                                            <li key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 transition-all">
                                                <button onClick={() => handleToggleItem(item)} className="flex-shrink-0" aria-label={`Mark ${item.name} as bought`}>
                                                    <div className="w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all border-slate-300 hover:border-slate-400">
                                                        {item.isChecked && <Check size={18} className="text-white" />}
                                                    </div>
                                                </button>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-medium text-slate-800 truncate">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.quantity} {item.unit}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleBuyItem(item)}
                                                    className="flex-shrink-0 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                    title="Buy on Google Shopping"
                                                >
                                                    <ShoppingBag size={17} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveItem(item)}
                                                    className="flex-shrink-0 p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {checkedItems.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchased</p>
                                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-1">{checkedItems.length}</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {checkedItems.map((item) => (
                                            <li key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 transition-all">
                                                <button onClick={() => handleToggleItem(item)} className="flex-shrink-0" aria-label={`Unmark ${item.name}`}>
                                                    <div className="w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all border-emerald-500 bg-emerald-500">
                                                        {item.isChecked && <Check size={18} className="text-white" />}
                                                    </div>
                                                </button>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-medium text-emerald-900 line-through truncate">{item.name}</p>
                                                    <p className="text-xs text-emerald-700">{item.quantity} {item.unit}</p>
                                                </div>
                                                <CircleCheckBig size={18} className="text-emerald-600" />
                                                <button
                                                    onClick={() => handleRemoveItem(item)}
                                                    className="flex-shrink-0 p-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors border border-red-100"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <ShoppingBag size={22} />
                            </div>
                            <p className="font-medium text-slate-700">Your shopping list is empty.</p>
                            <p className="text-sm">Add ingredients above to start building your next grocery run.</p>
                        </div>
                    )}
                </div>
                {items.some(item => item.isChecked) && (
                    <button 
                        onClick={handleClearChecked} 
                        className="mt-5 w-full p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                    >
                        <Trash2 size={18} />
                        Clear Checked Items
                    </button>
                )}
            </div>
        </div>
    );
};
