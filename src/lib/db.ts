/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Meal, SavedWeek, UserProfile, DatabaseConfig } from '../types';
import { DEFAULT_MEALS } from '../data/defaultMeals';

// Get and parse environment variables
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Safely initialize the Supabase client
export const supabase = supabaseUrl.startsWith('http')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage keys for fallback/config storage
const STORAGE_CONFIG_KEY = 'mrp_db_config';

function mapLegacyBase(base: string, name: string): Meal['base'] {
  const normBase = (base || '').toLowerCase().trim();
  const validBases = ['pasta', 'rijst', 'aardappels', 'noedels', 'deeg', 'wraps', 'soep'];
  
  if (validBases.includes(normBase)) {
    return normBase as Meal['base'];
  }
  
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('pizza') || lowerName.includes('pannenkoek') || lowerName.includes('quiche') || lowerName.includes('focaccia') || lowerName.includes('deeg') || lowerName.includes('lahmacun') || lowerName.includes('plaatkoek')) {
    return 'deeg';
  }
  if (lowerName.includes('wrap') || lowerName.includes('taco') || lowerName.includes('quesadilla') || lowerName.includes('burrito') || lowerName.includes('tortilla') || lowerName.includes('fajita')) {
    return 'wraps';
  }
  if (lowerName.includes('soep') || lowerName.includes('bouillon') || lowerName.includes('snert') || lowerName.includes('tom kha')) {
    return 'soep';
  }
  if (lowerName.includes('pasta') || lowerName.includes('spaghetti') || lowerName.includes('lasagne') || lowerName.includes('macaroni') || lowerName.includes('penne') || lowerName.includes('gnocchi') || lowerName.includes('tagliatelle') || lowerName.includes('tortellini')) {
    return 'pasta';
  }
  if (lowerName.includes('rijst') || lowerName.includes('curry') || lowerName.includes('nasi') || lowerName.includes('pokebowl') || lowerName.includes('chili') || lowerName.includes('risotto') || lowerName.includes('pilav')) {
    return 'rijst';
  }
  if (lowerName.includes('aardappel') || lowerName.includes('friet') || lowerName.includes('frites') || lowerName.includes('boerenkool') || lowerName.includes('stamppot') || lowerName.includes('hutspot') || lowerName.includes('puree') || lowerName.includes('gratin') || lowerName.includes('patat') || lowerName.includes('snack')) {
    return 'aardappels';
  }
  if (lowerName.includes('noedel') || lowerName.includes('bami') || lowerName.includes('ramen') || lowerName.includes('wok') || lowerName.includes('udong') || lowerName.includes('pad thai')) {
    return 'noedels';
  }
  
  return 'pasta'; // safe default fallback
}

export const DatabaseService = {
  // Config
  getConfig(): DatabaseConfig {
    return {
      provider: 'supabase',
      supabaseUrl,
      supabaseAnonKey
    };
  },

  isSupabaseConfigured(): boolean {
    return !!supabase;
  },

  // Auth Operations
  async signUp(email: string, username: string, password?: string): Promise<UserProfile> {
    if (!supabase) {
      throw new Error(
        'Supabase is niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe in de omgevingsvariabelen.'
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim() || cleanEmail.split('@')[0];

    // Supabase Auth SignUp
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password || 'Welkom01!', // Fallback password for seamless registration
      options: {
        data: {
          username: cleanUsername
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.user) {
      throw new Error('Onverwachte fout bij registratie.');
    }

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      username: cleanUsername,
      isVegetarianFilter: false
    };

    return profile;
  },

  async logIn(email: string, password?: string): Promise<UserProfile> {
    if (!supabase) {
      throw new Error(
        'Supabase is niet geconfigureerd. Voeg VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe in de omgevingsvariabelen.'
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Supabase Auth Login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password || 'Welkom01!' // Fallback password for seamless login
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.user) {
      throw new Error('Gebruiker niet gevonden of ongeldig.');
    }

    const rawSchedule = data.user.user_metadata?.activeSchedule;
    const mappedSchedule = Array.isArray(rawSchedule) ? rawSchedule.map((m: any) => {
      if (!m) return null;
      return {
        ...m,
        base: mapLegacyBase(m.base, m.name)
      };
    }) : undefined;

    return {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      username: data.user.user_metadata?.username || cleanEmail.split('@')[0],
      isVegetarianFilter: !!data.user.user_metadata?.isVegetarianFilter,
      activeSchedule: mappedSchedule,
      lockedDays: data.user.user_metadata?.lockedDays
    };
  },

  async logOut(): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out from Supabase Auth:', error);
    }
  },

  // Helper to extract active user from current Supabase session
  async getCurrentSessionUser(): Promise<UserProfile | null> {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return null;

      const user = session.user;
      const rawSchedule = user.user_metadata?.activeSchedule;
      const mappedSchedule = Array.isArray(rawSchedule) ? rawSchedule.map((m: any) => {
        if (!m) return null;
        return {
          ...m,
          base: mapLegacyBase(m.base, m.name)
        };
      }) : undefined;

      return {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Gebruiker',
        isVegetarianFilter: !!user.user_metadata?.isVegetarianFilter,
        activeSchedule: mappedSchedule,
        lockedDays: user.user_metadata?.lockedDays || undefined
      };
    } catch (e) {
      console.error('Error retrieving session user:', e);
      return null;
    }
  },

  async updateCurrentUserProfile(profile: UserProfile): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          username: profile.username,
          isVegetarianFilter: profile.isVegetarianFilter,
          activeSchedule: profile.activeSchedule,
          lockedDays: profile.lockedDays
        }
      });
      if (error) throw error;
    } catch (e) {
      console.error('Error updating user metadata in Supabase:', e);
    }
  },

  // Meals Operations for active user
  async getMeals(userId: string): Promise<Meal[]> {
    if (!supabase) return DEFAULT_MEALS;
    
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching meals from Supabase, loading defaults:', error);
        return DEFAULT_MEALS;
      }

      if (!data || data.length === 0) {
        // Automatically provision DEFAULT_MEALS to Supabase for a cold start!
        const mealsToInsert = DEFAULT_MEALS.map(m => ({
          id: m.id,
          user_id: userId,
          name: m.name,
          base: m.base,
          is_vegetarian: m.isVegetarian,
          notes: m.notes || ''
        }));

        await supabase.from('meals').insert(mealsToInsert);
        return DEFAULT_MEALS;
      }

      return data.map(m => ({
        id: m.id,
        name: m.name,
        base: mapLegacyBase(m.base, m.name),
        isVegetarian: m.is_vegetarian,
        notes: m.notes
      }));
    } catch (e) {
      console.error('Failed to get meals from Supabase:', e);
      return DEFAULT_MEALS;
    }
  },

  async saveMeal(userId: string, meal: Meal): Promise<Meal> {
    if (!supabase) return meal;
    try {
      const { error } = await supabase
        .from('meals')
        .upsert({
          id: meal.id,
          user_id: userId,
          name: meal.name,
          base: meal.base,
          is_vegetarian: meal.isVegetarian,
          notes: meal.notes || ''
        });

      if (error) throw error;
      return meal;
    } catch (e: any) {
      console.error('DatabaseService.saveMeal error:', e);
      throw new Error(`Gerecht opslaan mislukt: ${e.message}`);
    }
  },

  async deleteMeal(userId: string, id: string): Promise<string> {
    if (!supabase) return id;
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return id;
    } catch (e: any) {
      console.error('DatabaseService.deleteMeal error:', e);
      throw new Error(`Gerecht verwijderen mislukt: ${e.message}`);
    }
  },

  // Weekly Schedule Menu Operations for active user
  async getSavedWeeks(userId: string): Promise<SavedWeek[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('saved_weeks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching week schedules from Supabase:', error);
        return [];
      }

      return (data || []).map(w => ({
        id: w.id,
        title: w.title,
        createdAt: w.created_at,
        schedule: ((w.schedule || []) as (Meal | null)[]).map(m => {
          if (!m) return null;
          return {
            ...m,
            base: mapLegacyBase(m.base, m.name)
          };
        }),
        isVegetarianFilter: w.is_vegetarian_filter
      }));
    } catch (e) {
      console.error('Failed to get saved schedules from Supabase:', e);
      return [];
    }
  },

  async saveWeek(userId: string, week: SavedWeek): Promise<SavedWeek> {
    if (!supabase) return week;
    try {
      const { error } = await supabase
        .from('saved_weeks')
        .upsert({
          id: week.id,
          user_id: userId,
          title: week.title,
          schedule: week.schedule,
          is_vegetarian_filter: week.isVegetarianFilter,
          created_at: week.createdAt
        });

      if (error) throw error;
      return week;
    } catch (e: any) {
      console.error('DatabaseService.saveWeek error:', e);
      throw new Error(`Weekmenu opslaan mislukt: ${e.message}`);
    }
  },

  async deleteWeek(userId: string, weekId: string): Promise<string> {
    if (!supabase) return weekId;
    try {
      const { error } = await supabase
        .from('saved_weeks')
        .delete()
        .eq('id', weekId)
        .eq('user_id', userId);

      if (error) throw error;
      return weekId;
    } catch (e: any) {
      console.error('DatabaseService.deleteWeek error:', e);
      throw new Error(`Weekmenu verwijderen mislukt: ${e.message}`);
    }
  }
};
