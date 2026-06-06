/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Meal, SavedWeek, UserProfile } from './types';
import { DatabaseService, supabase } from './lib/db';
import MealManager from './components/MealManager';
import ScheduleView from './components/ScheduleView';
import AuthView from './components/AuthView';
import { 
  CalendarDays, Utensils, User, RefreshCw, ShieldAlert, Sparkles, AlertCircle, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'meals' | 'account'>('planner');
  
  // App Global Sync States
  const [meals, setMeals] = useState<Meal[]>([]);
  const [schedule, setSchedule] = useState<(Meal | null)[]>(Array(7).fill(null));
  const [lockedDays, setLockedDays] = useState<boolean[]>(Array(7).fill(false));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [savedWeeks, setSavedWeeks] = useState<SavedWeek[]>([]);
  
  // Visual states
  const [isDataSyncing, setIsDataSyncing] = useState(true);
  const [vegetariansOnlyFilter, setVegetariansOnlyFilter] = useState(false);

  // Initialize and listen to native Supabase Auth status changes
  useEffect(() => {
    async function checkCurrentSession() {
      setIsDataSyncing(true);
      try {
        const user = await DatabaseService.getCurrentSessionUser();
        if (user) {
          setCurrentUser(user);
          setVegetariansOnlyFilter(user.isVegetarianFilter);
          
          if (user.activeSchedule) {
            setSchedule(user.activeSchedule);
          }
          if (user.lockedDays) {
            setLockedDays(user.lockedDays);
          }

          // Preload meals and schedules in the background
          const loadedMeals = await DatabaseService.getMeals(user.id);
          setMeals(loadedMeals);
          const weeks = await DatabaseService.getSavedWeeks(user.id);
          setSavedWeeks(weeks);
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
      } finally {
        setIsDataSyncing(false);
      }
    }

    checkCurrentSession();

    if (!supabase) {
      return;
    }

    // Subscribe to auth events (SignIn, SignOut, TokenRefresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsDataSyncing(true);
      try {
        if (session?.user) {
          const userProfile = await DatabaseService.getCurrentSessionUser();
          if (userProfile) {
            setCurrentUser(userProfile);
            setVegetariansOnlyFilter(userProfile.isVegetarianFilter);
            
            if (userProfile.activeSchedule) {
              setSchedule(userProfile.activeSchedule);
            }
            if (userProfile.lockedDays) {
              setLockedDays(userProfile.lockedDays);
            }

            // Forcefully load specific cloud items for this user session
            const loadedMeals = await DatabaseService.getMeals(userProfile.id);
            setMeals(loadedMeals);
            
            const weeks = await DatabaseService.getSavedWeeks(userProfile.id);
            setSavedWeeks(weeks);
          }
        } else {
          setCurrentUser(null);
          setMeals([]);
          setSavedWeeks([]);
          setSchedule(Array(7).fill(null));
          setLockedDays(Array(7).fill(false));
        }
      } catch (err) {
        console.error('Auth state change syncing failed:', err);
      } finally {
        setIsDataSyncing(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Autosave active progress (schedule + lockedDays) to user profile metadata when they change
  useEffect(() => {
    if (!currentUser) return;

    const syncToCloud = async () => {
      try {
        // Fetch fresh copy to avoid overwrite during concurrent states
        const rawUser = await DatabaseService.getCurrentSessionUser();
        if (!rawUser) return;

        const hasChanges = 
          JSON.stringify(rawUser.activeSchedule) !== JSON.stringify(schedule) ||
          JSON.stringify(rawUser.lockedDays) !== JSON.stringify(lockedDays);

        if (hasChanges) {
          const updatedProfile: UserProfile = {
            ...rawUser,
            activeSchedule: schedule,
            lockedDays: lockedDays
          };
          setCurrentUser(updatedProfile);
          await DatabaseService.updateCurrentUserProfile(updatedProfile);
        }
      } catch (error) {
        console.error('Failed to autosave progress:', error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      syncToCloud();
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [schedule, lockedDays, currentUser?.id]);

  // Hook to handle updating vegetarian profile setting
  const handleToggleVegetarianFilter = async (val: boolean) => {
    setVegetariansOnlyFilter(val);
    if (currentUser) {
      const updatedProfile = { ...currentUser, isVegetarianFilter: val };
      setCurrentUser(updatedProfile);
      await DatabaseService.updateCurrentUserProfile(updatedProfile);
    }
  };

  // 1. ADD MEAL
  const handleAddMeal = async (newMeal: Meal) => {
    if (!currentUser) return;
    setIsDataSyncing(true);
    try {
      const saved = await DatabaseService.saveMeal(currentUser.id, newMeal);
      setMeals(prev => [saved, ...prev]);
    } finally {
      setIsDataSyncing(false);
    }
  };

  // 2. UPDATE MEAL
  const handleUpdateMeal = async (updatedMeal: Meal) => {
    if (!currentUser) return;
    setIsDataSyncing(true);
    try {
      const saved = await DatabaseService.saveMeal(currentUser.id, updatedMeal);
      setMeals(prev => prev.map(m => m.id === saved.id ? saved : m));
      
      // Update items inside active planning table if any
      setSchedule(prev => prev.map(m => m && m.id === saved.id ? saved : m));
    } finally {
      setIsDataSyncing(false);
    }
  };

  // 3. DELETE MEAL
  const handleDeleteMeal = async (id: string) => {
    if (!currentUser) return;
    setIsDataSyncing(true);
    try {
      await DatabaseService.deleteMeal(currentUser.id, id);
      setMeals(prev => prev.filter(m => m.id !== id));
      
      // If deleted meal was planned, clear it
      setSchedule(prev => prev.map(m => m && m.id === id ? null : m));
    } finally {
      setIsDataSyncing(false);
    }
  };

  // 4. SAVE CURRENT WEEK TO USER'S ACC
  const handleSaveWeek = async (title: string, currentSchedule: (Meal | null)[]) => {
    if (!currentUser) return;
    setIsDataSyncing(true);
    try {
      const newWeek: SavedWeek = {
        id: 'week_' + Date.now(),
        title,
        createdAt: new Date().toISOString(),
        schedule: currentSchedule,
        isVegetarianFilter: vegetariansOnlyFilter
      };
      await DatabaseService.saveWeek(currentUser.id, newWeek);
      
      // Reload lists
      const weeks = await DatabaseService.getSavedWeeks(currentUser.id);
      setSavedWeeks(weeks);
    } finally {
      setIsDataSyncing(false);
    }
  };

  // 5. RESTORE SAVED WEEK INTO Planner
  const handleLoadSavedWeek = (week: SavedWeek) => {
    if (confirm(`Weet u zeker dat u "${week.title}" wilt laden in uw actieve planner? Dit overschrijft uw huidige keuzes.`)) {
      setSchedule(week.schedule);
      setVegetariansOnlyFilter(week.isVegetarianFilter);
      setActiveTab('planner');
    }
  };

  // 6. DELETE SAVED WEEK
  const handleDeleteSavedWeek = async (weekId: string) => {
    if (!currentUser) return;
    if (confirm('Weet u zeker dat u dit opgeslagen weekmenu wilt verwijderen?')) {
      setIsDataSyncing(true);
      try {
        await DatabaseService.deleteWeek(currentUser.id, weekId);
        // Reload list
        const weeks = await DatabaseService.getSavedWeeks(currentUser.id);
        setSavedWeeks(weeks);
      } finally {
        setIsDataSyncing(false);
      }
    }
  };

  const handleRefreshSavedWeeks = async () => {
    if (!currentUser) return;
    setIsDataSyncing(true);
    try {
      const weeks = await DatabaseService.getSavedWeeks(currentUser.id);
      setSavedWeeks(weeks);
    } finally {
      setIsDataSyncing(false);
    }
  };

  // Global log-out command
  const handleSignOut = async () => {
    setIsDataSyncing(true);
    try {
      await DatabaseService.logOut();
      setCurrentUser(null);
      setMeals([]);
      setSavedWeeks([]);
      setSchedule(Array(7).fill(null));
    } finally {
      setIsDataSyncing(false);
    }
  };

  // Inner layout renderer
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'planner':
        return (
          <ScheduleView
            meals={meals}
            schedule={schedule}
            setSchedule={setSchedule}
            lockedDays={lockedDays}
            setLockedDays={setLockedDays}
            isVegeFilter={vegetariansOnlyFilter}
            setIsVegeFilter={handleToggleVegetarianFilter}
            userId={currentUser?.id}
            onSaveWeek={handleSaveWeek}
          />
        );
      case 'meals':
        return (
          <MealManager
            meals={meals}
            onAddMeal={handleAddMeal}
            onUpdateMeal={handleUpdateMeal}
            onDeleteMeal={handleDeleteMeal}
            isLoading={isDataSyncing}
          />
        );
      case 'account':
        return (
          <AuthView
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            savedWeeks={savedWeeks}
            setSavedWeeks={setSavedWeeks}
            onLoadSavedWeek={handleLoadSavedWeek}
            onDeleteSavedWeek={handleDeleteSavedWeek}
            onRefreshSavedWeeks={handleRefreshSavedWeeks}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-0 sm:p-4 md:p-8 text-slate-900 selection:bg-af-orange-transparent selection:text-af-orange font-sans">
      
      {/* MAIN CONTAINER APPLICATION WORKSPACE */}
      <div 
        id="app-wrapper-frame"
        className="w-full max-w-2xl bg-white relative flex flex-col min-h-screen sm:min-h-[85vh] sm:rounded-2xl sm:shadow-lg border border-slate-200/80 overflow-hidden shadow-sm"
      >

        {/* 3. APP TOP ACTIONS BAR HEADER */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-5 pt-7 md:pt-5 pb-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <img
              src="https://pizza.agilefanatics.com/images/logo.png"
              alt="Agile Fanatics"
              className="h-5 w-auto block select-none"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div className="h-3 w-[1px] bg-slate-200" />
            <div>
              <h1 className="font-display font-extrabold text-xs text-af-orange tracking-wider uppercase leading-none flex items-center gap-1">
                Maaltijd Roulette <span className="text-[9px] bg-af-orange-light text-af-orange border border-af-orange-transparent font-extrabold px-1 rounded-sm leading-tight">PRO</span>
              </h1>
              <span className="text-[9px] text-slate-400 font-sans font-medium tracking-wide block mt-1">
                Agile Fanatics · Planner
              </span>
            </div>
          </div>

          {/* Sync DB indicator spinner & logout button */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="popLayout">
              {isDataSyncing && (
                <motion.div
                  id="sync-indicator"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full"
                >
                  <RefreshCw className="h-2.5 w-2.5 animate-spin text-af-orange" />
                  <span className="hidden xs:inline">Syncing...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logout button in the top right corner of the screen */}
            {currentUser && (
              <button
                id="header-logout-btn-corner"
                onClick={handleSignOut}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-af-red hover:bg-neutral-50 border border-slate-200 rounded-xl transition cursor-pointer font-display uppercase tracking-wider"
                title="Direct uitloggen"
              >
                <LogOut className="h-3 w-3 text-slate-400" />
                <span>Uitloggen</span>
              </button>
            )}
          </div>
        </header>

        {/* 4. MAIN BODY SCROLLABLE WINDOW */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 bg-slate-50/40 flex flex-col justify-start">
          {!currentUser ? (
            <div className="my-auto py-4">
              <AuthView
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                savedWeeks={savedWeeks}
                setSavedWeeks={setSavedWeeks}
                onLoadSavedWeek={handleLoadSavedWeek}
                onDeleteSavedWeek={handleDeleteSavedWeek}
                onRefreshSavedWeeks={handleRefreshSavedWeeks}
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderActiveTabContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* 5. NATIVE STYLE BOTTOM TAB NAVIGATION BAR (ONLY IF LOGGED IN) */}
        {currentUser && (
          <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white border-t border-slate-105 z-50 px-5 pt-2.5 pb-5.5 shadow-md flex items-center justify-around font-display">
            <button
              id="tab-btn-planner"
              onClick={() => setActiveTab('planner')}
              className={`flex flex-col items-center gap-1 cursor-pointer select-none py-1 transition relative ${
                activeTab === 'planner' ? 'text-af-orange font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CalendarDays className="h-4.5 w-4.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider leading-none mt-0.5">Planner</span>
              {activeTab === 'planner' && (
                <motion.div layoutId="activeTabIndicator" className="absolute -bottom-1 w-5 h-0.5 bg-af-orange rounded-full" />
              )}
            </button>
            
            <button
              id="tab-btn-meals"
              onClick={() => setActiveTab('meals')}
              className={`flex flex-col items-center gap-1 cursor-pointer select-none py-1 transition relative ${
                activeTab === 'meals' ? 'text-af-orange font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Utensils className="h-4.5 w-4.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider leading-none mt-0.5">Gerechten</span>
              {activeTab === 'meals' && (
                <motion.div layoutId="activeTabIndicator" className="absolute -bottom-1 w-5 h-0.5 bg-af-orange rounded-full" />
              )}
            </button>

            <button
              id="tab-btn-account"
              onClick={() => setActiveTab('account')}
              className={`flex flex-col items-center gap-1 cursor-pointer select-none py-1 transition relative ${
                activeTab === 'account' ? 'text-af-orange font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider leading-none mt-0.5">Profiel</span>
              {activeTab === 'account' && (
                <motion.div layoutId="activeTabIndicator" className="absolute -bottom-1 w-5 h-0.5 bg-af-orange rounded-full" />
              )}
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
