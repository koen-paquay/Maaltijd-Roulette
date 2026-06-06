/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Meal, MealBase, BASE_LABELS_DUTCH, BASE_COLORS } from '../types';
import { 
  Plus, Search, Leaf, Trash2, Edit3, Sparkles, Filter, AlertTriangle, HelpCircle, ArrowUpDown
} from 'lucide-react';
import Modal from './Modal';

interface MealManagerProps {
  meals: Meal[];
  onAddMeal: (meal: Meal) => Promise<void>;
  onUpdateMeal: (meal: Meal) => Promise<void>;
  onDeleteMeal: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function MealManager({ 
  meals, 
  onAddMeal, 
  onUpdateMeal, 
  onDeleteMeal,
  isLoading 
}: MealManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBaseFilter, setSelectedBaseFilter] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | 'vegetarian' | 'meat'>('all');
  
  // Edit & Add state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  
  // Grid/List view toggle
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Meal Form fields
  const [formName, setFormName] = useState('');
  const [formBase, setFormBase] = useState<MealBase>('overig');
  const [formIsVegetarian, setFormIsVegetarian] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingMeal(null);
    setFormName('');
    setFormBase('overig');
    setFormIsVegetarian(false);
    setFormNotes('');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormName(meal.name);
    setFormBase(meal.base);
    setFormIsVegetarian(meal.isVegetarian);
    setFormNotes(meal.notes || '');
    setFormError('');
    setIsFormOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Vul a.u.b. een maaltijdnaam in.');
      return;
    }

    const mealData: Meal = {
      id: editingMeal ? editingMeal.id : 'meal_' + Date.now(),
      name: formName.trim(),
      base: formBase,
      isVegetarian: formIsVegetarian,
      notes: formNotes.trim() || undefined
    };

    try {
      if (editingMeal) {
        await onUpdateMeal(mealData);
      } else {
        await onAddMeal(mealData);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Fout bij opslaan.');
    }
  };

  // Delete Meal
  const handleDelete = async (id: string) => {
    if (confirm('Weet u zeker dat u dit gerecht wilt verwijderen uit de database?')) {
      await onDeleteMeal(id);
    }
  };

  // Filtered Meals
  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (meal.notes && meal.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesBase = selectedBaseFilter === 'all' || meal.base === selectedBaseFilter;
      const matchesDiet = dietFilter === 'all' || 
                          (dietFilter === 'vegetarian' && meal.isVegetarian) ||
                          (dietFilter === 'meat' && !meal.isVegetarian);
      return matchesSearch && matchesBase && matchesDiet;
    });
  }, [meals, searchQuery, selectedBaseFilter, dietFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const counts = { pasta: 0, aardappels: 0, rijst: 0, noedels: 0, overig: 0 };
    let vegetarianCount = 0;

    meals.forEach(m => {
      counts[m.base]++;
      if (m.isVegetarian) vegetarianCount++;
    });

    return {
      counts,
      total: meals.length,
      vegetarian: vegetarianCount,
      nonVegetarian: meals.length - vegetarianCount
    };
  }, [meals]);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 font-display">
        <div className="rounded-xl border border-af-orange-transparent bg-af-orange-light/50 p-4 text-center">
          <p className="text-[11px] text-af-orange font-bold uppercase tracking-wider">Totaal Gerechten</p>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">stuks</span>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-center">
          <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">Vegetarisch (V-Label)</p>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold text-slate-900">{stats.vegetarian}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
              ({stats.total > 0 ? Math.round((stats.vegetarian / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Database Distribution Chart */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
        <h4 className="font-display text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          Ingrediënten Verdeling (% in bibliotheek)
        </h4>
        <div className="space-y-2">
          {(Object.keys(BASE_LABELS_DUTCH) as MealBase[]).map(base => {
            const count = stats.counts[base] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            const colorClass = base === 'pasta' ? 'bg-amber-500' :
                               base === 'aardappels' ? 'bg-yellow-600' :
                               base === 'rijst' ? 'bg-sky-500' :
                               base === 'noedels' ? 'bg-purple-500' : 'bg-emerald-500';
            return (
              <div key={base} className="flex items-center text-xs">
                <span className="w-24 text-slate-600 font-medium truncate font-sans">{BASE_LABELS_DUTCH[base]}</span>
                <div className="flex-1 ml-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colorClass}`} 
                    style={{ width: `${Math.max(3, pct)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-slate-500 font-semibold ml-2 text-[11px]">{count}</span>
              </div>
            );
          })}
        </div>
        
        {/* Help box for the cooldown */}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-af-orange-light border border-af-orange-transparent p-3.5">
          <HelpCircle className="h-4 w-4 text-af-orange shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
            <strong>Tip voor cooldown:</strong> Omdat Pasta, Aardappels, Rijst en Noedels een 5-daagse cooldown triggeren, heb je minimaal <strong>2-3 gerechten uit de overige-categorie ('🍽️ Overig')</strong> nodig om een geldige vliegende start van 7 dagen te genereren!
          </p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="space-y-3 font-sans">
        {/* Row 1: Search & Add button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="meal-search"
              type="text"
              placeholder="Zoek gerechten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 placeholder-slate-400 transition font-sans"
            />
          </div>
          <button
            id="btn-add-meal"
            onClick={handleOpenAdd}
            className="rounded-xl bg-gradient-to-r from-af-red to-af-orange px-4 text-white hover:translate-y-[-1px] active:translate-y-0 transition flex items-center justify-center gap-1 py-2.5 shadow-sm shadow-active-btn font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nieuw
          </button>
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
            <Filter className="h-3 w-3" /> Filters
          </div>
          
          {/* Base Select slider */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button
              id="filter-base-all"
              onClick={() => setSelectedBaseFilter('all')}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer border ${
                selectedBaseFilter === 'all' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Alles ({meals.length})
            </button>
            {(Object.keys(BASE_LABELS_DUTCH) as MealBase[]).map(base => {
              const count = meals.filter(m => m.base === base).length;
              return (
                <button
                  key={base}
                  id={`filter-base-${base}`}
                  onClick={() => setSelectedBaseFilter(base)}
                  className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer border ${
                    selectedBaseFilter === base 
                      ? 'bg-af-orange text-white border-af-orange font-bold font-sans' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {BASE_LABELS_DUTCH[base]} ({count})
                </button>
              );
            })}
          </div>

          {/* Diet Toggle */}
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 mt-1">
            <label className="text-xs text-slate-500 font-medium">Dieet Filter:</label>
            <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 text-xs">
              <button
                id="diet-all"
                onClick={() => setDietFilter('all')}
                className={`px-3 py-1 rounded-md transition ${dietFilter === 'all' ? 'bg-slate-100 text-slate-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Alles
              </button>
              <button
                id="diet-vega"
                onClick={() => setDietFilter('vegetarian')}
                className={`px-3 py-1 rounded-md flex items-center gap-1 transition ${dietFilter === 'vegetarian' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-500 hover:text-emerald-850'}`}
              >
                <Leaf className="h-3 w-3 text-emerald-600 fill-emerald-600" /> Vega
              </button>
              <button
                id="diet-meat"
                onClick={() => setDietFilter('meat')}
                className={`px-3 py-1 rounded-md transition ${dietFilter === 'meat' ? 'bg-amber-50 text-amber-850 font-semibold' : 'text-slate-500 hover:text-amber-850'}`}
              >
                Vlees/Vis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipes List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-sans font-bold text-sm text-slate-700">
          Resultaten ({filteredMeals.length})
        </h3>
        <p className="text-xs text-slate-400">Klik op gerechten om te bewerken</p>
      </div>

      {/* Scrollable Container with cards */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {filteredMeals.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">Geen gerechten gevonden</p>
            <p className="text-xs text-slate-400 mt-1">Pas je zoekopdracht of filters aan!</p>
          </div>
        ) : (
          filteredMeals.map(meal => {
            const baseTheme = BASE_COLORS[meal.base] || '';
            return (
              <div
                key={meal.id}
                id={`meal-item-${meal.id}`}
                className="group relative flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-xs hover:border-af-orange/30 hover:bg-af-orange-light/10 transition"
              >
                <div 
                  className="flex-1 pr-12 cursor-pointer"
                  onClick={() => handleOpenEdit(meal)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition">
                      {meal.name}
                    </span>
                    {meal.isVegetarian && (
                      <span className="flex items-center gap-0.5 rounded-full bg-emerald-100/70 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                        <Leaf className="h-2 w-2 text-emerald-600 fill-emerald-600" /> VEGA
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1 flex items-center gap-3">
                    <span className={`rounded-xl border px-1.5 py-0.5 font-sans text-[10px] font-semibold ${baseTheme.split(' ').slice(2).join(' ')}`}>
                      {BASE_LABELS_DUTCH[meal.base].split(' ')[1]}
                    </span>
                    {meal.notes && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-1">
                        {meal.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hover actions desktop, always visible mobile */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button
                    id={`btn-edit-${meal.id}`}
                    onClick={() => handleOpenEdit(meal)}
                    className="p-1 px-1.5 text-slate-450 hover:text-af-orange hover:bg-af-orange-light rounded-lg transition"
                    title="Bewerken"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    id={`btn-delete-${meal.id}`}
                    onClick={() => handleDelete(meal.id)}
                    className="p-1 px-1.5 text-slate-450 hover:text-af-red hover:bg-red-50 rounded-lg transition"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Dialog for Add/Edit */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        title={editingMeal ? 'Gerecht bewerken 🍲' : 'Nieuw gerecht toevoegen ➕'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2 h-auto">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide font-display">
              Naam van het gerecht
            </label>
            <input
              id="form-meal-name"
              type="text"
              required
              placeholder="Bijv. Spaghetti Bolognese..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 placeholder-slate-400 font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide font-display">
              Basis ingrediënt type
            </label>
            <select
              id="form-meal-base"
              value={formBase}
              onChange={(e) => setFormBase(e.target.value as MealBase)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 bg-white font-sans"
            >
              {(Object.keys(BASE_LABELS_DUTCH) as MealBase[]).map(base => (
                <option key={base} value={base}>
                  {BASE_LABELS_DUTCH[base]}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {formBase === 'overig' 
                ? 'Overige maaltijden kennen geen cooldown en mogen opeenvolgend gegeten worden.' 
                : `${BASE_LABELS_DUTCH[formBase].split(' ')[1]} triggert een strikte cooldown van 5 dagen op andere gerechten van dit type.`}
            </p>
          </div>

          {/* Toggle for Vegetarian */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Vegetarisch gerecht</p>
                <p className="text-[10px] text-slate-400">Vink aan als dit gerecht geen vlees/vis bevat</p>
              </div>
            </div>
            <input
              id="form-meal-is-vegetarian"
              type="checkbox"
              checked={formIsVegetarian}
              onChange={(e) => setFormIsVegetarian(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wide font-display">
              Notitie / Extra Details (optioneel)
            </label>
            <textarea
              id="form-meal-notes"
              rows={2}
              placeholder="Bijv. Serveren met wat komkommersalade of kaas..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 placeholder-slate-400 font-sans"
            />
          </div>

          <div className="pt-2 flex gap-2 font-display">
            <button
              id="form-meal-cancel"
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-wider border border-slate-200 text-slate-705 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Annuleren
            </button>
            <button
              id="form-meal-submit"
              type="submit"
              className="flex-1 py-3 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-af-red to-af-orange text-white rounded-xl hover:translate-y-[-1px] transition shadow-sm shadow-active-btn cursor-pointer"
            >
              {editingMeal ? 'Akkoord' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
