/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Meal {
  id: string;
  name: string;
  base: 'pasta' | 'rijst' | 'aardappels' | 'noedels' | 'deeg' | 'wraps' | 'soep';
  isVegetarian: boolean;
  notes?: string;
}

export type MealBase = Meal['base'];

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  isVegetarianFilter: boolean;
}

export interface SavedWeek {
  id: string;
  title: string;
  createdAt: string;
  schedule: (Meal | null)[]; // 7 days: 0 = Mon, 6 = Sun
  isVegetarianFilter: boolean;
}

export interface DatabaseConfig {
  provider: 'localStorage' | 'supabase';
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const DAY_NAMES_DUTCH = [
  'Maandag',
  'Dinsdag',
  'Woensdag',
  'Donderdag',
  'Vrijdag',
  'Zaterdag',
  'Zondag'
];

export const BASE_LABELS_DUTCH: Record<MealBase, string> = {
  pasta: '🍝 Pasta',
  rijst: '🍚 Rijst',
  aardappels: '🥔 Aardappels',
  noedels: '🥢 Noedels',
  deeg: '🍕 Deeg',
  wraps: '🌮 Wraps',
  soep: '🥣 Soep'
};

export const BASE_COLORS: Record<MealBase, string> = {
  pasta: 'from-amber-500 to-orange-600 bg-amber-500/10 text-amber-500 border-amber-500/20',
  rijst: 'from-sky-500 to-blue-600 bg-sky-500/10 text-sky-600 border-sky-500/20',
  aardappels: 'from-yellow-600 to-amber-800 bg-yellow-600/10 text-yellow-700 border-yellow-600/20',
  noedels: 'from-purple-500 to-pink-600 bg-purple-500/10 text-purple-600 border-purple-500/20',
  deeg: 'from-rose-500 to-red-600 bg-rose-500/10 text-rose-600 border-rose-500/20',
  wraps: 'from-emerald-500 to-teal-600 bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  soep: 'from-teal-500 to-cyan-600 bg-teal-500/10 text-teal-600 border-teal-500/20'
};
