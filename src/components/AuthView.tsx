/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, SavedWeek, DatabaseConfig, DAY_NAMES_DUTCH, BASE_LABELS_DUTCH } from '../types';
import { DatabaseService } from '../lib/db';
import { 
  User, Mail, ArrowRight, Shield, LogOut, Code, Key, Server, Copy, Check, Trash2, FolderOpen, CookingPot, ExternalLink
} from 'lucide-react';

interface AuthViewProps {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  savedWeeks: SavedWeek[];
  setSavedWeeks: React.Dispatch<React.SetStateAction<SavedWeek[]>>;
  onLoadSavedWeek: (week: SavedWeek) => void;
  onDeleteSavedWeek: (id: string) => Promise<void>;
  onRefreshSavedWeeks: () => Promise<void>;
}

export default function AuthView({
  currentUser,
  setCurrentUser,
  savedWeeks,
  setSavedWeeks,
  onLoadSavedWeek,
  onDeleteSavedWeek,
  onRefreshSavedWeeks
}: AuthViewProps) {
  // Input fields
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);


  // DB configuration fields
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    provider: 'localStorage',
    supabaseUrl: '',
    supabaseAnonKey: '',
    firebaseApiKey: '',
    firebaseProjectId: ''
  });
  const [configCopied, setConfigCopied] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Load config on mount
  useEffect(() => {
    const loaded = DatabaseService.getConfig();
    setDbConfig(loaded);
  }, []);

  // Submit Login/Signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthError('Zorg dat u een geldig emailadres invult.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      let profile: UserProfile;
      if (isRegisterMode) {
        profile = await DatabaseService.signUp(emailInput, usernameInput);
      } else {
        profile = await DatabaseService.logIn(emailInput);
      }
      setCurrentUser(profile);
      setEmailInput('');
      setUsernameInput('');
    } catch (err: any) {
      setAuthError(err.message || 'Fout bij authenticatie. Probeer het opnieuw.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await DatabaseService.logOut();
    setCurrentUser(null);
    setSavedWeeks([]);
  };

  // Save DB Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    DatabaseService.saveConfig(dbConfig);
    setConfigSuccess(true);
    setTimeout(() => setConfigSuccess(false), 2000);
  };

  // Quick Account selector for Vibe Coding
  const handleQuickDemoSession = async (role: 'chef' | 'suzy') => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const email = role === 'chef' ? 'chef@provibe.nl' : 'suzy.vega@vibe.nl';
      const name = role === 'chef' ? 'Chef Kok' : 'Suzy Vegetarië';
      
      const profile = await DatabaseService.logIn(email);
      if (profile.username !== name) {
        // Just update username to make it clean
        profile.username = name;
        DatabaseService.updateCurrentUserProfile(profile);
      }
      setCurrentUser(profile);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCopyEnvPlaceholder = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setConfigCopied(id);
    setTimeout(() => setConfigCopied(null), 1500);
  };

  return (    <div className="space-y-6">
      {/* 1. MAIN ACCOUNT AUTH CARD */}
      {!currentUser ? (
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs space-y-4 font-sans">
          <div className="text-center">
            <div className="h-11 w-11 rounded-full bg-af-orange-light text-af-orange flex items-center justify-center mx-auto mb-2 text-lg">
              🍳
            </div>
            <h3 className="font-display font-extrabold text-af-orange text-xs uppercase tracking-wider">Inloggen of Profiel aanmaken</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
              Krijg toegang tot uw eigen ingrediënten-bibliotheek en sla wekelijkse menu's op!
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authError && (
              <p className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-bold font-sans">
                {authError}
              </p>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">E-mailadres</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="chef@provibe.nl"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 placeholder-slate-400 font-sans"
                />
              </div>
            </div>

            {isRegisterMode && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Gebruikersnaam</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="auth-username"
                    type="text"
                    placeholder="Bijv. Familie Peters"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 font-sans"
                  />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-af-red to-af-orange text-white rounded-xl font-display text-xs font-bold uppercase tracking-wider leading-none inline-flex items-center justify-center gap-2 transition duration-150 hover:translate-y-[-1px] active:translate-y-0 cursor-pointer shadow-active-btn"
            >
              <span>{authLoading ? 'Verifiëren...' : isRegisterMode ? 'Profiel Registeren' : 'Inloggen / Snel Aanmelden'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="flex justify-center text-[11px] font-display uppercase tracking-wider font-bold pt-1">
            <button
              id="auth-switch-mode"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthError('');
              }}
              className="text-af-orange hover:underline cursor-pointer"
            >
              {isRegisterMode ? 'Heeft u al een profiel? Log direct in' : 'Nieuwe gebruiker? Klik hier om te registreren'}
            </button>
          </div>

          {/* Quick Sandbox Profiles */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-widest text-center mb-2 font-display">
              Snel testen (AF-Sessies)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-demo-chef"
                onClick={() => handleQuickDemoSession('chef')}
                className="py-2.5 rounded-xl border border-emerald-100/50 bg-emerald-50/10 text-[11px] font-extrabold text-slate-700 hover:bg-emerald-50 active:scale-95 transition text-center cursor-pointer font-display uppercase tracking-wider"
              >
                👨‍🍳 Chef AF Kok
              </button>
              <button
                id="btn-demo-suzy"
                onClick={() => handleQuickDemoSession('suzy')}
                className="py-2.5 rounded-xl border border-af-orange-transparent bg-af-orange-light text-[11px] font-extrabold text-slate-700 hover:bg-af-orange-light/80 active:scale-95 transition text-center cursor-pointer font-display uppercase tracking-wider"
              >
                🥕 Suzy Vegetarië
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PROFILES LOGGED IN CARD */
        <div className="space-y-4 font-sans">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-af-red to-af-orange text-white flex items-center justify-center font-display font-black text-sm uppercase tracking-wider">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-sans font-bold text-slate-900 text-sm leading-tight">
                  {currentUser.username}
                </h4>
                <span className="text-[11px] text-slate-550 block">{currentUser.email}</span>
              </div>
            </div>

            <button
              id="auth-signout"
              onClick={handleSignOut}
              className="p-2 rounded-lg text-slate-400 hover:text-af-red hover:bg-red-50 transition cursor-pointer"
              title="Uitloggen"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* 2. EXPLORE SAVED WEEKS */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-[#111] text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                <FolderOpen className="h-4 w-4 text-af-orange" />
                Mijn Opgeslagen Menu's ({savedWeeks.length})
              </h3>
              <button 
                onClick={onRefreshSavedWeeks}
                className="text-[10px] text-af-orange font-extrabold uppercase tracking-widest font-display hover:underline cursor-pointer"
              >
                Verversen
              </button>
            </div>

            {savedWeeks.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl">
                <CookingPot className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400 font-medium">Nog geen weekmenu's opgeslagen.</p>
                <p className="text-[10px] text-slate-400 pt-0.5">Vul alle 7 dagen van je planner in om deze te bewaren.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {savedWeeks.map(week => {
                  return (
                    <div
                      key={week.id}
                      className="p-3 border border-slate-50 bg-slate-50/30 rounded-xl flex flex-col gap-2 relative group hover:border-slate-200 transition"
                    >
                      <div className="flex items-center justify-between pr-8">
                        <div>
                          <h4 className="font-sans font-bold text-slate-800 text-xs">
                            {week.title}
                          </h4>
                          <span className="text-[9px] text-slate-400 leading-none">
                            Opgeslagen op {new Date(week.createdAt).toLocaleDateString('nl-NL')}
                          </span>
                        </div>

                        {/* Open / Restore menu button */}
                        <button
                          id={`btn-load-week-${week.id}`}
                          onClick={() => onLoadSavedWeek(week)}
                          className="px-2.5 py-1 bg-gradient-to-r from-af-red to-af-orange text-white hover:translate-y-[-1px] transition rounded-lg text-[9px] font-black font-display uppercase tracking-wider shadow-xs transition cursor-pointer"
                          title="Volledige menu laden in de planner"
                        >
                          Inladen 📅
                        </button>
                      </div>

                      {/* Micro inline preview of days base categorization */}
                      <div className="flex gap-1 overflow-x-auto pb-0.5 select-none touch-pan-x">
                        {DAY_NAMES_DUTCH.map((day, dIdx) => {
                          const mValue = week.schedule[dIdx];
                          return (
                            <div key={dIdx} className="flex-1 min-w-[34px] bg-white rounded-lg p-1 border border-slate-100/60 text-center">
                              <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-tighter">
                                {day.substring(0, 2)}
                              </span>
                              <span className="text-[10px] leading-tight block truncate">
                                {mValue ? BASE_LABELS_DUTCH[mValue.base].split(' ')[0] : '🛒'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Delete week button */}
                      <button
                        id={`btn-delete-week-${week.id}`}
                        onClick={() => onDeleteSavedWeek(week.id)}
                        className="absolute right-3 top-3 p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition"
                        title="Tabel verwijderen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DATABASE CONFIGURATION CREDENTIAL SHEET */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-start gap-2">
          <Server className="h-5 w-5 text-af-orange shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-extrabold text-xs uppercase tracking-wider text-slate-900 leading-none">Database & Externe Opslag</h3>
            <span className="text-[10px] text-slate-400 leading-relaxed font-sans block mt-1.5">
              Verander hier de database adapter of voeg je eigen cloud database toe!
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-3 pt-1">
          {configSuccess && (
            <div className="p-2.5 bg-af-orange-light border border-af-orange-transparent rounded-xl text-xs text-af-orange flex items-center gap-1 font-bold font-sans">
              <Check className="h-3.5 w-3.5 text-af-orange" /> Configuratie opgeslagen!
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Database Provider</label>
            <select
              id="config-provider"
              value={dbConfig.provider}
              onChange={(e) => setDbConfig({...dbConfig, provider: e.target.value as any})}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange font-sans cursor-pointer"
            >
              <option value="localStorage">Robuuste LocalStorage (Geen database-sleutels nodig) 👍</option>
              <option value="supabase">Supabase Relational Cloud API</option>
              <option value="firebase">Google Firebase Firestore DB</option>
            </select>
          </div>

          {dbConfig.provider === 'localStorage' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] text-slate-550 leading-relaxed font-medium font-sans">
                <strong>Actieve status:</strong> Uw gegevens worden 100% veilig opgeslagen in de browser local storage. Dit werkt direct en is ideaal voor mobiel-offline en sandbox presentaties!
              </p>
            </div>
          )}

          {dbConfig.provider === 'supabase' && (
            <div className="space-y-2 p-3 bg-af-orange-light border border-af-orange-transparent rounded-xl">
              <p className="text-[10px] text-slate-800 font-bold uppercase tracking-wider mb-1 font-display">Supabase Credentials</p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">SUPABASE_URL</label>
                <input
                  type="text"
                  placeholder="https://yourproject.supabase.co"
                  value={dbConfig.supabaseUrl}
                  onChange={(e) => setDbConfig({...dbConfig, supabaseUrl: e.target.value})}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">SUPABASE_ANON_KEY</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={dbConfig.supabaseAnonKey}
                  onChange={(e) => setDbConfig({...dbConfig, supabaseAnonKey: e.target.value})}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange font-sans"
                />
              </div>
            </div>
          )}

          {dbConfig.provider === 'firebase' && (
            <div className="space-y-2 p-3 bg-red-50/20 border border-red-105 rounded-xl">
              <p className="text-[10px] text-slate-800 font-bold uppercase tracking-wider mb-1 font-display">Firebase Credentials</p>
 
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">FIREBASE_API_KEY</label>
                <input
                  type="password"
                  placeholder="AIzaSyA8..."
                  value={dbConfig.firebaseApiKey}
                  onChange={(e) => setDbConfig({...dbConfig, firebaseApiKey: e.target.value})}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">FIREBASE_PROJECT_ID</label>
                <input
                  type="text"
                  placeholder="maaltijd-roulette-pro-fd312"
                  value={dbConfig.firebaseProjectId}
                  onChange={(e) => setDbConfig({...dbConfig, firebaseProjectId: e.target.value})}
                  className="w-full text-xs px-2.5 py-1.5 rounded bg-white border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange font-sans"
                />
              </div>
            </div>
          )}

          <button
            id="config-save-btn"
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-af-red to-af-orange text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider transition duration-150 hover:translate-y-[-1px] active:translate-y-0 cursor-pointer shadow-active-btn"
          >
            Sla Database-opties op
          </button>
        </form>

        {/* .env instructions for production deployment */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 font-semibold mb-2 flex items-center gap-1">
            <Code className="h-3.5 w-3.5 text-slate-400" />
            Vibe Coding Instructies voor .env:
          </p>
          <div className="bg-slate-900 rounded-xl p-3 text-[10px] font-mono text-slate-300 relative select-all scrollbar-hide overflow-x-auto">
            <span className="block text-[8px] text-slate-500 mb-1">PROTIP: KOPIEER DEZE REGELS NAAR JE .ENV BESTAND</span>
            <div>VITE_DATABASE_PROVIDER="supabase"</div>
            <div>VITE_SUPABASE_URL="https://yourproject.supabase.co"</div>
            <div>VITE_SUPABASE_ANON_KEY="eyJhbGc..."</div>
          </div>
        </div>
      </div>
    </div>
  );
}
