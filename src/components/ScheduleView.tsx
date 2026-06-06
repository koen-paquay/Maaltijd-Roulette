/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Meal, DAY_NAMES_DUTCH, BASE_LABELS_DUTCH, BASE_COLORS, SavedWeek } from '../types';
import { 
  Sparkles, Lock, Unlock, RefreshCw, Archive, Search, HelpCircle, AlertCircle, CheckCircle, Save, Leaf, Eye, X, BookOpen
} from 'lucide-react';
import Modal from './Modal';

interface ScheduleViewProps {
  meals: Meal[];
  schedule: (Meal | null)[];
  setSchedule: React.Dispatch<React.SetStateAction<(Meal | null)[]>>;
  isVegeFilter: boolean;
  setIsVegeFilter: (val: boolean) => void;
  userId: string | undefined;
  onSaveWeek: (title: string, schedule: (Meal | null)[]) => Promise<void>;
}

export default function ScheduleView({
  meals,
  schedule,
  setSchedule,
  isVegeFilter,
  setIsVegeFilter,
  userId,
  onSaveWeek
}: ScheduleViewProps) {
  // Manual selection modal state
  const [manualSelectDayIdx, setManualSelectDayIdx] = useState<number | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  
  // Save custom week state
  const [isSaveWeekOpen, setIsSaveWeekOpen] = useState(false);
  const [saveWeekTitle, setSaveWeekTitle] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Locked days state (0 to 6)
  const [lockedDays, setLockedDays] = useState<boolean[]>([false, false, false, false, false, false, true]); // Sunday Sunday is locked by default

  // Days fill progress
  const filledCount = useMemo(() => {
    return schedule.filter(m => m !== null).length;
  }, [schedule]);

  // Sunday setup helper (ensure sunday has 'Patat met snacks' and stays locked if not set)
  React.useEffect(() => {
    if (!schedule[6] || schedule[6].id !== 'sunday-fixed') {
      const updated = [...schedule];
      updated[6] = {
        id: 'sunday-fixed',
        name: 'Patat met snacks 🍟',
        base: 'overig',
        isVegetarian: true, // satisfies either filter
        notes: 'Zondagse traditie, altijd lekker!'
      };
      setSchedule(updated);
    }
  }, [schedule, setSchedule]);

  // Core Cooldown Check Function: Bidirectional 5-days check
  const checkMealCooldownConflict = (meal: Meal, dayIdx: number, currentSchedule: (Meal | null)[]): { hasConflict: boolean; reason?: string } => {
    if (dayIdx === 6) return { hasConflict: false }; // Bypass for Sunday
    if (meal.base === 'overig') return { hasConflict: false }; // Overig has no constraints

    for (let i = 0; i < 6; i++) { // Only checking Monday-Saturday
      if (i === dayIdx) continue;
      
      const gap = Math.abs(i - dayIdx);
      if (gap <= 5) {
        const otherMeal = currentSchedule[i];
        if (otherMeal && otherMeal.base === meal.base) {
          return {
            hasConflict: true,
            reason: `De basis '${BASE_LABELS_DUTCH[meal.base]}' is al gekozen op ${DAY_NAMES_DUTCH[i]} (reeds ${6 - gap}e dag, cooldown is 5 dagen).`
          };
        }
      }
    }

    return { hasConflict: false };
  };

  // Check if a base is allowed on a day
  const isBaseAllowedOnDay = (base: string, dayIdx: number, currentSchedule: (Meal | null)[]): boolean => {
    if (dayIdx === 6) return true;
    if (base === 'overig') return true;

    for (let i = 0; i < 6; i++) {
      if (i === dayIdx) continue;
      if (Math.abs(i - dayIdx) <= 5) {
        const other = currentSchedule[i];
        if (other && other.base === base) {
          return false;
        }
      }
    }
    return true;
  };

  // Backtracking algorithm to generate the entire week Mon-Sat
  const handleSpinEntireWeek = () => {
    // Collect vegetarian options if toggle set
    const filteredMeals = isVegeFilter ? meals.filter(m => m.isVegetarian) : meals;

    if (filteredMeals.length === 0) {
      alert('Geen geschikte maaltijden gevonden om te kiezen. Voeg er eerst een paar toe in "Mijn Gerechten".');
      return;
    }

    const testSchedule = [...schedule];
    testSchedule[6] = {
      id: 'sunday-fixed',
      name: 'Patat met snacks 🍟',
      base: 'overig',
      isVegetarian: true,
      notes: 'Zondagse traditie, altijd lekker!'
    };

    // Perform depth-first backtracking search
    function solve(dayIdx: number): boolean {
      if (dayIdx === 6) {
        return true; // We successfully filled Monday through Saturday
      }

      // If day is locked and already has a valid selection, proceed
      if (lockedDays[dayIdx] && testSchedule[dayIdx] !== null) {
        // Just verify if the pre-existing meal is allowed (typically yes, but if filters changed it might be invalid)
        // For standard UI experience, we trust the lock.
        return solve(dayIdx + 1);
      }

      // Try in random order
      const shuffledOptions = [...filteredMeals].sort(() => Math.random() - 0.5);

      for (const meal of shuffledOptions) {
        const conflict = checkMealCooldownConflict(meal, dayIdx, testSchedule);
        if (!conflict.hasConflict) {
          testSchedule[dayIdx] = meal;
          if (solve(dayIdx + 1)) {
            return true;
          }
          // Backtrack
          if (!lockedDays[dayIdx]) {
            testSchedule[dayIdx] = null;
          }
        }
      }

      return false; // Backtrack failure
    }

    const success = solve(0);
    if (success) {
      setSchedule(testSchedule);
    } else {
      alert('Kon geen geldig schema genereren dat voldoet aan de 5-daagse cooldown regel met de huidige maaltijden. Probeer enkele dagen te ontgrendelen of de vegetarische filter tijdelijk uit te zetten.');
    }
  };

  // Spin a single day
  const handleSpinSingleDay = (dayIdx: number) => {
    if (dayIdx === 6) return; // Sunday is fixed

    const filteredMeals = isVegeFilter ? meals.filter(m => m.isVegetarian) : meals;
    const allowed = filteredMeals.filter(m => {
      const conflict = checkMealCooldownConflict(m, dayIdx, schedule);
      return !conflict.hasConflict;
    });

    if (allowed.length === 0) {
      alert('Geen geschikte maaltijd gevonden die aan de cooldown regels voldoet voor deze dag. Probeer de andere dagen te wijzigen.');
      return;
    }

    const randomMeal = allowed[Math.floor(Math.random() * allowed.length)];
    const updated = [...schedule];
    updated[dayIdx] = randomMeal;
    setSchedule(updated);
  };

  // Toggle lock state
  const toggleLock = (dayIdx: number) => {
    if (dayIdx === 6) return; // Sunday is always locked
    const updated = [...lockedDays];
    updated[dayIdx] = !updated[dayIdx];
    setLockedDays(updated);
  };

  // Clear a single day's menu selection
  const clearDay = (dayIdx: number) => {
    if (dayIdx === 6) return; // Can't clear Sunday
    const updated = [...schedule];
    updated[dayIdx] = null;
    setSchedule(updated);
    
    // Unlock automatically when cleared so it is spinable
    const updatedLocks = [...lockedDays];
    updatedLocks[dayIdx] = false;
    setLockedDays(updatedLocks);
  };

  // Manual select list
  const manualFilteredMeals = useMemo(() => {
    if (manualSelectDayIdx === null) return [];
    
    const term = manualSearchQuery.toLowerCase();
    const baseList = isVegeFilter ? meals.filter(m => m.isVegetarian) : meals;

    return baseList.filter(meal => {
      const matchesSearch = meal.name.toLowerCase().includes(term) || (meal.notes && meal.notes.toLowerCase().includes(term));
      return matchesSearch;
    });
  }, [meals, manualSelectDayIdx, manualSearchQuery, isVegeFilter]);

  // Click on manual selected meal
  const selectManualMeal = (meal: Meal) => {
    if (manualSelectDayIdx === null) return;
    
    // Check conflict first before setting
    const conflict = checkMealCooldownConflict(meal, manualSelectDayIdx, schedule);
    if (conflict.hasConflict) {
      if (!confirm(`Let op: ${conflict.reason}\nWilt u dit gerecht toch forceren en de cooldown regel handmatig negeren?`)) {
        return;
      }
    }

    const updated = [...schedule];
    updated[manualSelectDayIdx] = meal;
    setSchedule(updated);
    setManualSelectDayIdx(null);
    setManualSearchQuery('');
  };

  // Clear all week selections (reset except Sunday)
  const clearAllWeek = () => {
    if (confirm('Wilt u het schema voor de hele week wissen? (Vergrendelde dagen worden ook gewist, behalve Zondag)')) {
      const cleared = Array(7).fill(null);
      cleared[6] = {
        id: 'sunday-fixed',
        name: 'Patat met snacks 🍟',
        base: 'overig',
        isVegetarian: true,
        notes: 'Zondagse traditie, altijd lekker!'
      };
      setSchedule(cleared);
      setLockedDays([false, false, false, false, false, false, true]);
    }
  };

  // Open Save Week dialogue
  const handleOpenSaveWeek = () => {
    if (filledCount < 7) {
      alert('Vul eerst alle dagen van de week in om een volledig weekmenu op te slaan.');
      return;
    }
    const currentWeekNum = getWeekNumber(new Date());
    setSaveWeekTitle(`Weekmenu ${currentWeekNum}`);
    setSaveError('');
    setSaveSuccess('');
    setIsSaveWeekOpen(true);
  };

  const handleConfirmSaveWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveWeekTitle.trim()) {
      setSaveError('Geef a.u.b. een titel op.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      await onSaveWeek(saveWeekTitle.trim(), schedule);
      setSaveSuccess('Weekmenu succesvol opgeslagen in uw profiel!');
      setTimeout(() => {
        setIsSaveWeekOpen(false);
        setSaveSuccess('');
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message || 'Kon menu niet opslaan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Settings Controls */}
      <div className="p-3.5 bg-af-orange-light rounded-xl border border-af-orange-transparent flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs font-sans">
        {/* Toggle Vegetarian */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-vegetarisch-planning"
            onClick={() => setIsVegeFilter(!isVegeFilter)}
            className={`cursor-pointer w-10 h-6 flex items-center rounded-full p-1 transition-colors outline-none ${
              isVegeFilter ? 'bg-af-orange shadow-active-btn' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                isVegeFilter ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <div>
            <span className="text-xs font-extrabold text-[#111] flex items-center gap-1 font-display uppercase tracking-wider">
              <Leaf className={`h-3 w-3 ${isVegeFilter ? 'text-af-orange fill-af-orange' : 'text-slate-400'}`} />
              Alleen vegetarisch
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">Randomiseer uitsluitend vega maaltijden</span>
          </div>
        </div>

        {/* Action Button: Reset All */}
        <button
          id="btn-clear-week"
          onClick={clearAllWeek}
          className="text-xs px-3 py-1.5 cursor-pointer rounded-lg text-slate-500 hover:text-af-red hover:bg-red-50 transition border border-transparent hover:border-red-100 font-bold font-display uppercase tracking-wider"
        >
          Alles wissen
        </button>
      </div>

      {/* Main Wheel SPIN Trigger Banner */}
      <div className="text-center py-2 font-display">
        <button
          id="btn-spin-entire-week"
          onClick={handleSpinEntireWeek}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-af-red via-af-orange to-[#FF8C00] text-white font-display font-extrabold text-xs tracking-widest hover:translate-y-[-1px] active:translate-y-0 transition duration-150 flex items-center justify-center gap-2 shadow-md shadow-active-btn hover:shadow-lg cursor-pointer uppercase"
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>Super-Roulette: Genereer Week! 🎰</span>
        </button>
        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-sans font-medium">
          Vergrendel dagen die je wilt behouden met de <Lock className="inline h-2.5 w-2.5 mx-0.5 text-af-orange" /> knop. De rest wordt opgevuld binnen de 5-daagse regel!
        </p>
      </div>

      {/* Vertical list of days */}
      <div className="space-y-3">
        {DAY_NAMES_DUTCH.map((dayName, idx) => {
          const meal = schedule[idx];
          const isSunday = idx === 6;
          const isDayLocked = lockedDays[idx];
          
          // Check for visual conflict alerts on this specific day
          const conflictCheck = meal ? checkMealCooldownConflict(meal, idx, schedule) : { hasConflict: false };

          return (
            <div
              key={idx}
              id={`day-row-${idx}`}
              className={`rounded-xl border p-3.5 flex flex-col transition duration-200 relative overflow-hidden ${
                conflictCheck.hasConflict ? 'border-red-200 bg-red-50/20' :
                isSunday ? 'border-amber-200 bg-amber-50/15 border-l-4 border-l-amber-500' : 
                meal ? 'border-af-border border-l-4 border-l-af-orange bg-af-card/60 hover:bg-af-card-hover/90 shadow-2xs' : 'border-slate-100 bg-white'
              }`}
            >
              {/* Card top row */}
              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-[11px] text-slate-400 uppercase tracking-widest">
                  {dayName}
                </span>

                {/* Day status indicators / actions */}
                <div className="flex items-center gap-1.5 z-10">
                  {/* Clear selection */}
                  {meal && !isSunday && (
                    <button
                      id={`btn-clear-day-${idx}`}
                      onClick={() => clearDay(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                      title="Maaltijd wissen"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Lock/Unlock Toggle */}
                  <button
                    id={`btn-lock-${idx}`}
                    onClick={() => toggleLock(idx)}
                    disabled={isSunday}
                    className={`p-1.5 rounded-lg transition ${
                      isSunday ? 'text-amber-600 bg-amber-50/80 border-amber-100' :
                      isDayLocked 
                        ? 'text-af-orange bg-af-orange-light border border-af-orange-transparent hover:bg-af-orange-light/80' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-605 cursor-pointer'
                    }`}
                    title={isSunday ? 'Altijd vastgesteld' : isDayLocked ? 'Dag vergrendeld' : 'Vergrendel dag'}
                  >
                    {isDayLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Meal details block */}
              <div className="mt-2 flex items-center min-h-[52px]">
                {meal ? (
                  <div className="flex items-start gap-2.5 w-full">
                    {/* Category emblem indicator */}
                    <div className={`mt-1 text-[9px] px-2 py-0.5 rounded-md font-extrabold border shrink-0 text-center uppercase tracking-wider font-display bg-gradient-to-br ${BASE_COLORS[meal.base] || ''}`}>
                      {BASE_LABELS_DUTCH[meal.base].split(' ')[0]}
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-sans font-bold text-sm text-slate-900 leading-snug">
                          {meal.name}
                        </h4>
                        {meal.isVegetarian && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-1 border border-emerald-100">
                            <Leaf className="h-2.5 w-2.5 text-emerald-600 fill-emerald-600 self-center" />
                          </span>
                        )}
                      </div>
                      
                      {meal.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1 leading-relaxed">
                          {meal.notes}
                        </p>
                      )}

                      {/* Display warning if conflict exists */}
                      {conflictCheck.hasConflict && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-red-650 font-semibold">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                          <span className="line-clamp-1">{conflictCheck.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 italic text-xs py-1.5 w-full font-medium">
                    <div className="h-8 w-8 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                      🛒
                    </div>
                    <span>Tik op "Kies handmatig" of spin de Roulette...</span>
                  </div>
                )}

                {/* Spin / Manual selector buttons triggered on cards directly */}
                {!isSunday && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-1">
                    {!isDayLocked && (
                      <button
                        id={`btn-spin-day-${idx}`}
                        onClick={() => handleSpinSingleDay(idx)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-af-orange-light hover:text-af-orange transition text-slate-500 cursor-pointer shadow-xs border border-slate-150"
                        title="Spin deze dag"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      id={`btn-select-manual-${idx}`}
                      onClick={() => {
                        setManualSelectDayIdx(idx); 
                        setManualSearchQuery('');
                      }}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-af-orange-light hover:text-af-orange transition text-slate-500 cursor-pointer shadow-xs border border-slate-150"
                      title="Kies handmatig"
                    >
                      <Search className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress & Save Week action at bottom */}
      <div className="pt-2 font-sans">
        <div className="flex justify-between items-center mb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">
          <span>Voortgang Weekmenu</span>
          <span>{filledCount} van de 7 dagen ingevuld</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-af-red to-af-orange transition-all duration-300"
            style={{ width: `${(filledCount / 7) * 100}%` }}
          />
        </div>

        {filledCount === 7 && (
          <div className="mt-4 text-center font-display">
            {userId ? (
              <button
                id="btn-save-week-trigger"
                onClick={handleOpenSaveWeek}
                className="w-full py-3 bg-gradient-to-r from-af-red to-af-orange text-white hover:translate-y-[-1px] active:translate-y-0 transition duration-150 rounded-xl text-xs font-bold leading-none inline-flex items-center justify-center gap-2 shadow-premium cursor-pointer uppercase tracking-wider"
              >
                <Save className="h-3.5 w-3.5" />
                Sla dit weekmenu op voor later!
              </button>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed font-sans">
                  📢 Log in via de <strong>Beheer & Account</strong> tab om uw weekmenu's op te slaan in uw eigen profiel!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Manual Selector */}
      <Modal
        isOpen={manualSelectDayIdx !== null}
        onClose={() => setManualSelectDayIdx(null)}
        title={manualSelectDayIdx !== null ? `Gerecht handmatig kiezen voor ${DAY_NAMES_DUTCH[manualSelectDayIdx]} 🗓️` : ''}
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="manual-search-box"
              type="text"
              placeholder="Zoek maaltijd uit database..."
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 font-sans"
            />
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between font-sans">
            <span>Getoonde resultaten: {manualFilteredMeals.length}</span>
            {isVegeFilter && <span className="text-af-orange font-bold uppercase tracking-wider font-display">Vegetarische filter actief!</span>}
          </div>

          {/* List scrollable box */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {manualFilteredMeals.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">Geen maaltijden gevonden die matchen...</p>
            ) : (
              manualFilteredMeals.map(meal => {
                const isDayConflict = manualSelectDayIdx !== null 
                  ? checkMealCooldownConflict(meal, manualSelectDayIdx, schedule)
                  : { hasConflict: false };
                
                const baseColors = BASE_COLORS[meal.base] || '';

                return (
                  <button
                    key={meal.id}
                    id={`manual-select-item-${meal.id}`}
                    onClick={() => selectManualMeal(meal)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between hover:border-slate-400 ${
                      isDayConflict.hasConflict 
                        ? 'border-red-100 bg-red-50/20 active:bg-orange-50' 
                        : 'border-slate-100 bg-slate-50/40 active:bg-slate-100'
                    }`}
                  >
                    <div className="pr-4 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-sans font-bold text-xs text-slate-800 truncate block">
                          {meal.name}
                        </span>
                        {meal.isVegetarian && (
                          <Leaf className="h-2.5 w-2.5 text-emerald-600 fill-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      {meal.notes && (
                        <p className="text-[10px] text-slate-400 italic truncate mt-0.5">{meal.notes}</p>
                      )}

                      {/* Conflict details visual warning */}
                      {isDayConflict.hasConflict && (
                        <p className="text-[9px] text-amber-700 font-semibold mt-0.5 line-clamp-1">
                          🚨 Cooldown Conflict met andere dagen!
                        </p>
                      )}
                    </div>

                    <span className={`text-[9px] rounded-lg border px-1.5 py-0.5 font-bold uppercase tracking-wide shrink-0 ${baseColors.split(' ').slice(2).join(' ')}`}>
                      {BASE_LABELS_DUTCH[meal.base].split(' ')[1]}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL: Save Week */}
      <Modal
        isOpen={isSaveWeekOpen}
        onClose={() => setIsSaveWeekOpen(false)}
        title="Weekmenu opslaan in profiel"
      >
        <form onSubmit={handleConfirmSaveWeek} className="space-y-4">
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide font-display">
              Titel voor uw opgeslagen menu
            </label>
            <input
              id="save-week-title"
              type="text"
              required
              placeholder="Bijv. Gezond & Snel weekmenu..."
              value={saveWeekTitle}
              onChange={(e) => setSaveWeekTitle(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange text-slate-800 font-sans"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Dit menu wordt geregistreerd aan uw profiel. Je kunt de menu's op elk moment weer inladen.
            </p>
          </div>

          <div className="flex gap-2 font-display">
            <button
              id="btn-save-week-cancel"
              type="button"
              onClick={() => setIsSaveWeekOpen(false)}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Annuleren
            </button>
            <button
              id="btn-save-week-submit"
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-af-red to-af-orange text-white rounded-xl transition cursor-pointer shadow-active-btn"
            >
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Helpers
function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}
