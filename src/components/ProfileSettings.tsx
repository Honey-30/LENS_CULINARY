import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Bell, LogOut, ChevronRight, X, Heart, Award, Flame, ScanLine, Package, Database } from 'lucide-react';
import { AllergyService } from '../services/allergyService';
import { DietPreference, TasteModelService } from '../services/tasteModelService';
import { GamificationService } from '../services/gamificationService';
import { PantryService } from '../services/pantryService';
import { ScanResultService } from '../services/scanResultService';
import { LocalSavedRecipeService } from '../services/localSavedRecipeService';
import { UserProfile } from '../types';

interface ProfileSettingsProps {
  user: UserProfile | null;
  onLogout: () => void;
}

type TasteFeedback = 'TOO_SPICY' | 'TOO_BLAND' | 'PERFECT' | null;

const SKILL_LEVEL_STORAGE_KEY = 'CL_PROFILE_SKILL_LEVEL';
const TASTE_FEEDBACK_KEY = 'CULINARY_LENS_TASTE_FEEDBACK';
const COOK_MODE_KEEP_AWAKE_KEY = 'COOK_MODE_KEEP_AWAKE';
const ALLERGY_SUGGESTIONS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Soy',
  'Wheat',
  'Gluten',
  'Fish',
  'Shellfish',
  'Sesame',
  'Mustard',
  'Celery',
  'Lupin',
  'Sulphites',
  'Mushroom',
  'Garlic',
  'Onion',
];

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onLogout }) => {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>(() => {
    const stored = localStorage.getItem(SKILL_LEVEL_STORAGE_KEY);
    if (stored === 'BEGINNER' || stored === 'INTERMEDIATE' || stored === 'ADVANCED') return stored;
    return 'BEGINNER';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => localStorage.getItem('CL_NOTIFICATIONS_ENABLED') !== 'false');
  const [keepScreenAwake, setKeepScreenAwake] = useState<boolean>(() => localStorage.getItem(COOK_MODE_KEEP_AWAKE_KEY) === 'true');
  const [spicyTolerance, setSpicyTolerance] = useState(5);
  const [dietPreference, setDietPreference] = useState<DietPreference>('ANY');
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>(['ALL']);
  const [tasteFeedback, setTasteFeedback] = useState<TasteFeedback>(() => {
    const value = localStorage.getItem(TASTE_FEEDBACK_KEY);
    if (value === 'TOO_SPICY' || value === 'TOO_BLAND' || value === 'PERFECT') return value;
    return null;
  });

  const gamification = GamificationService.getState();
  const pantryCount = PantryService.getPantry().length;
  const expiringSoonCount = PantryService.checkExpiry().length;
  const scanVaultCount = ScanResultService.getScanResults().length;
  const localSavedCount = LocalSavedRecipeService.getSavedRecipes().length;

  const cuisineOptions = ['ALL', 'INDIAN', 'ITALIAN', 'CHINESE', 'MEXICAN', 'JAPANESE', 'THAI', 'MEDITERRANEAN', 'AMERICAN'];
  const profileStrength = Math.min(100, Math.max(0, Math.round((allergies.length > 0 ? 35 : 20) + spicyTolerance * 4 + (dietPreference !== 'ANY' ? 12 : 0) + (cuisinePreferences.includes('ALL') ? 8 : Math.min(20, cuisinePreferences.length * 4)) + (tasteFeedback ? 8 : 0))));
  const filteredAllergySuggestions = ALLERGY_SUGGESTIONS
    .filter((item) => item.toLowerCase().includes(newAllergy.trim().toLowerCase()))
    .filter((item) => !allergies.some((allergy) => allergy.toLowerCase() === item.toLowerCase()))
    .slice(0, 6);

  useEffect(() => {
    setAllergies(AllergyService.getAllergies());
    const tasteModel = TasteModelService.getTasteModel();
    setSpicyTolerance(tasteModel.spicyTolerance);
    setDietPreference(tasteModel.dietPreference);
    setCuisinePreferences(tasteModel.cuisinePreferences);
    if (user?.preferences?.skillLevel) {
      setSkillLevel(user.preferences.skillLevel);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('CL_NOTIFICATIONS_ENABLED', notificationsEnabled ? 'true' : 'false');
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem(COOK_MODE_KEEP_AWAKE_KEY, keepScreenAwake ? 'true' : 'false');
  }, [keepScreenAwake]);

  useEffect(() => {
    localStorage.setItem(SKILL_LEVEL_STORAGE_KEY, skillLevel);
  }, [skillLevel]);

  useEffect(() => {
    if (!tasteFeedback) {
      localStorage.removeItem(TASTE_FEEDBACK_KEY);
      return;
    }
    localStorage.setItem(TASTE_FEEDBACK_KEY, tasteFeedback);
  }, [tasteFeedback]);

  useEffect(() => {
    TasteModelService.saveTasteModel({
      spicyTolerance,
      dietPreference,
      cuisinePreferences,
    });
  }, [spicyTolerance, dietPreference, cuisinePreferences]);

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    const normalizedInput = newAllergy.trim();
    if (allergies.some((item) => item.toLowerCase() === normalizedInput.toLowerCase())) {
      setNewAllergy('');
      return;
    }

    const updated = [...allergies, normalizedInput];
    setAllergies(updated);
    AllergyService.setAllergies(updated);
    setNewAllergy('');
  };

  const handleSelectAllergySuggestion = (value: string) => {
    if (!value.trim()) return;
    if (allergies.some((item) => item.toLowerCase() === value.toLowerCase())) return;

    const updated = [...allergies, value];
    setAllergies(updated);
    AllergyService.setAllergies(updated);
    setNewAllergy('');
  };

  const handleRemoveAllergy = (allergy: string) => {
    const updated = allergies.filter(a => a !== allergy);
    setAllergies(updated);
    AllergyService.setAllergies(updated);
  };

  const toggleCuisine = (cuisine: string) => {
    if (cuisine === 'ALL') {
      setCuisinePreferences(['ALL']);
      return;
    }

    const withoutAll = cuisinePreferences.filter((item) => item !== 'ALL');
    const exists = withoutAll.includes(cuisine);
    const next = exists ? withoutAll.filter((item) => item !== cuisine) : [...withoutAll, cuisine];
    setCuisinePreferences(next.length ? next : ['ALL']);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf2ff,transparent_42%),radial-gradient(circle_at_bottom_right,#f1fff8,transparent_45%),#f8fafc] p-4 sm:p-6 space-y-6 max-w-3xl mx-auto pb-24">
      <header className="space-y-4">
        <div className="rounded-3xl border border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-300 flex items-center justify-center text-blue-500 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{user?.displayName || 'Chef Guest'}</h1>
              <p className="text-zinc-600 text-sm">{user?.email || 'guest@culinarylens.ai'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Skill</p>
              <p className="text-sm font-bold text-zinc-900">{skillLevel}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Spice</p>
              <p className="text-sm font-bold text-amber-900">{spicyTolerance}/10</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Profile</p>
              <p className="text-sm font-bold text-blue-900">{profileStrength}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Taste Profile Strength</p>
              <p className="text-xs font-semibold text-zinc-700">{profileStrength}%</p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-500" style={{ width: `${profileStrength}%` }} />
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-700 flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-blue-500" />
          Feature Pulse
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Scan Streak</p>
            <p className="text-lg font-bold text-blue-900 flex items-center gap-1"><Flame className="w-4 h-4" />{gamification.streak}d</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Scans</p>
            <p className="text-lg font-bold text-zinc-900">{gamification.totalScans}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Cooks</p>
            <p className="text-lg font-bold text-emerald-900">{gamification.totalCooks}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pantry Items</p>
            <p className="text-lg font-bold text-amber-900">{pantryCount}</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Expiring Soon</p>
            <p className="text-lg font-bold text-red-900">{expiringSoonCount}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Scan Vault</p>
            <p className="text-lg font-bold text-zinc-900 flex items-center gap-1"><Database className="w-4 h-4" />{scanVaultCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Saved Recipes (Local)</p>
            <p className="text-sm font-bold text-zinc-900">{localSavedCount}</p>
          </div>
          <Package className="w-5 h-5 text-zinc-400" />
        </div>
      </section>

      {/* Skill Level */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-700 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Cooking Skill Level
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setSkillLevel(level)}
              className={`p-4 rounded-2xl border-2 transition-all text-center ${
                skillLevel === level 
                  ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm' 
                  : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              <div className="text-xs font-bold mb-1">{level}</div>
              <div className="text-[10px] opacity-60">
                {level === 'BEGINNER' && 'Simple recipes'}
                {level === 'INTERMEDIATE' && 'Complex flavors'}
                {level === 'ADVANCED' && 'Professional techniques'}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-700 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Experience Preferences
        </h2>

        <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.4)]">
          <button
            onClick={() => setNotificationsEnabled((prev) => !prev)}
            className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-left hover:border-zinc-300 transition-all"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Notifications</p>
              <p className="text-sm font-semibold text-zinc-800">{notificationsEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>

          <button
            onClick={() => setKeepScreenAwake((prev) => !prev)}
            className="w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-left hover:border-zinc-300 transition-all"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cook Mode Screen Awake</p>
              <p className="text-sm font-semibold text-zinc-800">{keepScreenAwake ? 'Always On' : 'Default'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Last Taste Feedback</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'TOO_SPICY', label: 'Too Spicy' },
                { id: 'TOO_BLAND', label: 'Too Bland' },
                { id: 'PERFECT', label: 'Perfect' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTasteFeedback(option.id as TasteFeedback)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    tasteFeedback === option.id
                      ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 bg-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Allergies & Restrictions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-700 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          Allergies & Dietary Restrictions
        </h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
            placeholder="Add allergy (e.g., Peanuts, Shellfish)..."
            list="allergy-suggestions"
            className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-300 transition-all"
          />
          <datalist id="allergy-suggestions">
            {ALLERGY_SUGGESTIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <button
            onClick={handleAddAllergy}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-sm"
          >
            Add
          </button>
        </div>

        {newAllergy.trim().length > 0 && filteredAllergySuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filteredAllergySuggestions.map((item) => (
              <button
                key={`allergy-suggestion-${item}`}
                onClick={() => handleSelectAllergySuggestion(item)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {allergies.map((allergy) => (
              <motion.div
                key={allergy}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
              >
                {allergy}
                  <button onClick={() => handleRemoveAllergy(allergy)} className="hover:text-red-900">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Personalized Cooking Brain */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-700 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Personalized Cooking Brain
        </h2>

        <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-5 space-y-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.4)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Spicy tolerance</label>
              <span className="text-sm text-amber-600 font-semibold">{spicyTolerance}/10</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={spicyTolerance}
              onChange={(e) => setSpicyTolerance(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Diet mode</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'ANY', label: 'Any' },
                { id: 'VEG', label: 'Vegetarian' },
                { id: 'HIGH_PROTEIN', label: 'High Protein' },
                { id: 'LOW_CARB', label: 'Low Carb' },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDietPreference(option.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    dietPreference === option.id
                      ? 'border-blue-400 text-blue-700 bg-blue-50'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 bg-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Cuisine preference</label>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map((cuisine) => {
                const active = cuisinePreferences.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    onClick={() => toggleCuisine(cuisine)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    {cuisine}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Account Actions */}
      <div className="pt-6 border-t border-zinc-200 space-y-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-all group"
        >
          <div className="flex items-center gap-3 text-red-600">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400/70 group-hover:text-red-600" />
        </button>
      </div>
    </div>
  );
};
