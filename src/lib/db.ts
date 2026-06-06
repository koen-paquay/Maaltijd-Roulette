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

    return {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      username: data.user.user_metadata?.username || cleanEmail.split('@')[0],
      isVegetarianFilter: !!data.user.user_metadata?.isVegetarianFilter
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
      return {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Gebruiker',
        isVegetarianFilter: !!user.user_metadata?.isVegetarianFilter
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
          isVegetarianFilter: profile.isVegetarianFilter
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
        base: m.base as any,
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

    if (error) {
      throw new Error(`Gerecht opslaan mislukt: ${error.message}`);
    }

    return meal;
  },

  async deleteMeal(userId: string, id: string): Promise<string> {
    if (!supabase) return id;

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Gerecht verwijderen mislukt: ${error.message}`);
    }

    return id;
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
        schedule: w.schedule as (Meal | null)[],
        isVegetarianFilter: w.is_vegetarian_filter
      }));
    } catch (e) {
      console.error('Failed to get saved schedules from Supabase:', e);
      return [];
    }
  },

  async saveWeek(userId: string, week: SavedWeek): Promise<SavedWeek> {
    if (!supabase) return week;

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

    if (error) {
      throw new Error(`Weekmenu opslaan mislukt: ${error.message}`);
    }

    return week;
  },

  async deleteWeek(userId: string, weekId: string): Promise<string> {
    if (!supabase) return weekId;

    const { error } = await supabase
      .from('saved_weeks')
      .delete()
      .eq('id', weekId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Weekmenu verwijderen mislukt: ${error.message}`);
    }

    return weekId;
  }
};
