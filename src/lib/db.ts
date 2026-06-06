/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Meal, SavedWeek, UserProfile, DatabaseConfig } from '../types';
import { DEFAULT_MEALS } from '../data/defaultMeals';

// Key names for LocalStorage
const STORAGE_MEALS_KEY = 'mrp_meals';
const STORAGE_USERS_KEY = 'mrp_registered_users';
const STORAGE_CURRENT_USER_KEY = 'mrp_current_user';
const STORAGE_WEEKS_KEY_PREFIX = 'mrp_weeks_';
const STORAGE_CONFIG_KEY = 'mrp_db_config';

// Load initial meals helper
export function getStoredMeals(): Meal[] {
  const data = localStorage.getItem(STORAGE_MEALS_KEY);
  if (!data) {
    // Populate database with default delicious meals initially
    localStorage.setItem(STORAGE_MEALS_KEY, JSON.stringify(DEFAULT_MEALS));
    return DEFAULT_MEALS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing meals from localStorage, rebuilding defaults:', e);
    return DEFAULT_MEALS;
  }
}

export function saveStoredMeals(meals: Meal[]): void {
  localStorage.setItem(STORAGE_MEALS_KEY, JSON.stringify(meals));
}

// Global DB Client service helper
export const DatabaseService = {
  // Config
  getConfig(): DatabaseConfig {
    const configStr = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (configStr) {
      try { return JSON.parse(configStr); } catch (e) {}
    }
    
    // Read from environment if set, otherwise default to localStorage
    const metaEnv = (import.meta as any).env || {};
    return {
      provider: (metaEnv.VITE_DATABASE_PROVIDER as any) || 'localStorage',
      supabaseUrl: metaEnv.VITE_SUPABASE_URL || '',
      supabaseAnonKey: metaEnv.VITE_SUPABASE_ANON_KEY || '',
      firebaseApiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
      firebaseProjectId: metaEnv.VITE_FIREBASE_PROJECT_ID || ''
    };
  },

  saveConfig(config: DatabaseConfig) {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  },

  // Auth Operations
  async signUp(email: string, username: string): Promise<UserProfile> {
    await simulateNetworkDelay();
    const cleanEmail = email.trim().toLowerCase();
    const users = this._getUsers();
    
    if (users.find(u => u.email === cleanEmail)) {
      throw new Error(`Emailadres '${email}' is al geregistreerd.`);
    }

    const newUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email: cleanEmail,
      username: username.trim() || cleanEmail.split('@')[0],
      isVegetarianFilter: false
    };

    users.push(newUser);
    this._saveUsers(users);
    this._setCurrentLocalUser(newUser);

    // Initialize user specific weeks if needed
    const defaultWeeksKey = STORAGE_WEEKS_KEY_PREFIX + newUser.id;
    if (!localStorage.getItem(defaultWeeksKey)) {
      localStorage.setItem(defaultWeeksKey, JSON.stringify([]));
    }

    return newUser;
  },

  async logIn(email: string): Promise<UserProfile> {
    await simulateNetworkDelay();
    const cleanEmail = email.trim().toLowerCase();
    const users = this._getUsers();
    const found = users.find(u => u.email === cleanEmail);

    if (!found) {
      // Auto-register convenience during vibe coding!
      return this.signUp(cleanEmail, cleanEmail.split('@')[0]);
    }

    this._setCurrentLocalUser(found);
    return found;
  },

  async logOut(): Promise<void> {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  },

  getCurrentUser(): UserProfile | null {
    const data = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  updateCurrentUserProfile(profile: UserProfile): void {
    this._setCurrentLocalUser(profile);
    const users = this._getUsers();
    const idx = users.findIndex(u => u.id === profile.id);
    if (idx !== -1) {
      users[idx] = profile;
      this._saveUsers(users);
    }
  },

  // Meals Operations
  async getMeals(): Promise<Meal[]> {
    await simulateNetworkDelay();
    const config = this.getConfig();
    
    if (config.provider === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
      console.log('Supabase API client placeholder: Fetching meals from Table "meals"');
      // In a real environment, you would run:
      // const { data } = await supabase.from('meals').select('*');
    } else if (config.provider === 'firebase' && config.firebaseProjectId) {
      console.log('Firebase Firestore client placeholder: Fetching meals from Collection "meals"');
    }

    // Default fully working LocalStorage execution
    return getStoredMeals();
  },

  async saveMeal(meal: Meal): Promise<Meal> {
    await simulateNetworkDelay();
    const meals = getStoredMeals();
    const idx = meals.findIndex(m => m.id === meal.id);
    
    if (idx === -1) {
      meals.unshift(meal); // New meals on top
    } else {
      meals[idx] = meal;
    }
    
    saveStoredMeals(meals);
    return meal;
  },

  async deleteMeal(id: string): Promise<string> {
    await simulateNetworkDelay();
    const meals = getStoredMeals();
    const filtered = meals.filter(m => m.id !== id);
    saveStoredMeals(filtered);
    return id;
  },

  // Weekly Schedule Menu Operations
  async getSavedWeeks(userId: string): Promise<SavedWeek[]> {
    await simulateNetworkDelay();
    const key = STORAGE_WEEKS_KEY_PREFIX + userId;
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  async saveWeek(userId: string, week: SavedWeek): Promise<SavedWeek> {
    await simulateNetworkDelay();
    const key = STORAGE_WEEKS_KEY_PREFIX + userId;
    const weeks = await this.getSavedWeeks(userId);
    const idx = weeks.findIndex(w => w.id === week.id);
    
    if (idx === -1) {
      weeks.unshift(week); // Newest first
    } else {
      weeks[idx] = week;
    }

    localStorage.setItem(key, JSON.stringify(weeks));
    return week;
  },

  async deleteWeek(userId: string, weekId: string): Promise<string> {
    await simulateNetworkDelay();
    const key = STORAGE_WEEKS_KEY_PREFIX + userId;
    const weeks = await this.getSavedWeeks(userId);
    const filtered = weeks.filter(w => w.id !== weekId);
    localStorage.setItem(key, JSON.stringify(filtered));
    return weekId;
  },

  // Internal helpers
  _getUsers(): UserProfile[] {
    const data = localStorage.getItem(STORAGE_USERS_KEY);
    if (!data) {
      // Create a default user so they can immediately login
      const defaultUser: UserProfile = {
        id: 'usr_demo',
        email: 'chef@provibe.nl',
        username: 'Vibe Chef',
        isVegetarianFilter: false
      };
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify([defaultUser]));
      return [defaultUser];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  _saveUsers(users: UserProfile[]) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  },

  _setCurrentLocalUser(user: UserProfile) {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  }
};

// Simple helper to simulate actual database network latency!
function simulateNetworkDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 350));
}
