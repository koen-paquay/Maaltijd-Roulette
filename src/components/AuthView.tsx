/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile, SavedWeek, DAY_NAMES_DUTCH, BASE_LABELS_DUTCH } from '../types';
import { DatabaseService } from '../lib/db';
import { 
  User, Mail, Lock, ArrowRight, LogOut, Check, Trash2, FolderOpen, CookingPot, AlertCircle
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
  // Input fields for email/password authentication
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const supabaseConfigured = DatabaseService.isSupabaseConfigured();

  // Submit password reset link request
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) {
      setAuthError('Supabase is nog niet geconfigureerd in de omgevingsvariabelen (Settings).');
      return;
    }
    if (!emailInput.trim()) {
      setAuthError('Vul a.u.v. een geldig e-mailadres in.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      await DatabaseService.resetPasswordForEmail(emailInput);
      setResetSuccess(true);
    } catch (err: any) {
      setAuthError(err.message || 'Kon geen reset-link verzenden. Probeer het later opnieuw.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Submit Login or registration request to Supabase
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) {
      setAuthError('Supabase is nog niet geconfigureerd in de omgevingsvariabelen (Settings).');
      return;
    }
    if (!emailInput.trim() || !passwordInput) {
      setAuthError('Vul a.u.v. een geldig e-mailadres en wachtwoord in.');
      return;
    }
    if (isRegisterMode && passwordInput.length < 6) {
      setAuthError('Het wachtwoord moet minimaal 6 tekens bevatten.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      let profile: UserProfile;
      if (isRegisterMode) {
        profile = await DatabaseService.signUp(emailInput, usernameInput, passwordInput);
      } else {
        profile = await DatabaseService.logIn(emailInput, passwordInput);
      }
      setCurrentUser(profile);
      setEmailInput('');
      setPasswordInput('');
      setUsernameInput('');
    } catch (err: any) {
      setAuthError(err.message || 'Authenticatie is mislukt. Controleer uw gegevens.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Switch to sign-out
  const handleSignOut = async () => {
    await DatabaseService.logOut();
    setCurrentUser(null);
    setSavedWeeks([]);
  };

  // Renders login screen when nested in a separate layout, or as full screen backup
  if (!currentUser) {
    if (isForgotPasswordMode) {
      if (resetSuccess) {
        return (
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-xs space-y-4 font-sans max-w-sm mx-auto">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 text-xl">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-display font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                E-mail verzonden
              </h3>
              <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                Er is een e-mail met een herstellink gestuurd naar <strong className="text-slate-700">{emailInput}</strong>. Controleer uw inbox (en spam-folder) om uw wachtwoord opnieuw in te stellen.
              </p>
            </div>

            <button
              id="back-to-login-success"
              type="button"
              onClick={() => {
                setIsForgotPasswordMode(false);
                setResetSuccess(false);
                setEmailInput('');
                setAuthError('');
              }}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-750 rounded-xl font-display text-xs font-bold uppercase tracking-wider leading-none transition cursor-pointer"
            >
              Terug naar inloggen
            </button>
          </div>
        );
      }

      return (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-xs space-y-4 font-sans max-w-sm mx-auto">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-af-orange-light text-af-orange flex items-center justify-center mx-auto mb-2.5 text-xl">
              🔑
            </div>
            <h3 className="font-display font-extrabold text-slate-900 text-sm uppercase tracking-wider">
              Wachtwoord herstellen
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Vul uw e-mailadres in om een herstellink te ontvangen waarmee u een nieuw wachtwoord kunt instellen.
            </p>
          </div>

          <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
            {authError && (
              <p className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-bold leading-relaxed">
                {authError}
              </p>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">E-mailadres</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="reset-email-input"
                  type="email"
                  required
                  disabled={authLoading}
                  placeholder="chef@provibe.nl"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 placeholder-slate-400 font-sans"
                />
              </div>
            </div>

            <button
              id="reset-submit-btn"
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-gradient-to-r from-af-red to-af-orange text-white rounded-xl font-display text-xs font-bold uppercase tracking-wider leading-none inline-flex items-center justify-center gap-2 transition duration-150 hover:translate-y-[-1px] active:translate-y-0 cursor-pointer shadow-active-btn disabled:opacity-50"
            >
              <span>{authLoading ? 'Versturen...' : 'Herstellink versturen'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="flex justify-center text-[10px] font-display uppercase tracking-wider font-extrabold pt-1">
            <button
              id="back-to-login"
              type="button"
              onClick={() => {
                setIsForgotPasswordMode(false);
                setAuthError('');
              }}
              className="text-af-orange hover:underline cursor-pointer"
            >
              Terug naar inloggen
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-xs space-y-4 font-sans max-w-sm mx-auto">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-af-orange-light text-af-orange flex items-center justify-center mx-auto mb-2.5 text-xl">
            🍳
          </div>
          <h3 className="font-display font-extrabold text-slate-900 text-sm uppercase tracking-wider">
            {isRegisterMode ? 'Profiel aanmaken' : 'Inloggen bij Maaltijd Roulette'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {isRegisterMode 
              ? 'Maak een eigen account aan om menu\'s en gerechten op te slaan in de cloud!'
              : 'Log in met uw gegevens om toegang te krijgen tot uw cloud-planner.'}
          </p>
        </div>

        {!supabaseConfigured && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] leading-relaxed flex items-start gap-1.5 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Let op:</strong> Supabase omgevingsvariabelen zijn niet gedetecteerd. 
              Vul <strong>VITE_SUPABASE_URL</strong> en <strong>VITE_SUPABASE_ANON_KEY</strong> in via de Settings van dit project.
            </div>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-3">
          {authError && (
            <p className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-bold leading-relaxed">
              {authError}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">E-mailadres</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="auth-email-input"
                type="email"
                required
                disabled={!supabaseConfigured || authLoading}
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
                  id="auth-username-input"
                  type="text"
                  required
                  disabled={!supabaseConfigured || authLoading}
                  placeholder="Bijv. Chef Peters"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 font-sans"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="auth-password-input"
                type="password"
                required
                disabled={!supabaseConfigured || authLoading}
                placeholder="••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-af-orange focus:ring-1 focus:ring-af-orange text-slate-800 font-sans"
              />
            </div>
          </div>

          {!isRegisterMode && (
            <div className="flex justify-end pt-0.5">
              <button
                id="forgot-password-link"
                type="button"
                onClick={() => {
                  setIsForgotPasswordMode(true);
                  setAuthError('');
                  setEmailInput('');
                }}
                className="text-[10.5px] uppercase font-bold font-display text-slate-400 hover:text-af-orange hover:underline cursor-pointer transition"
              >
                Wachtwoord vergeten?
              </button>
            </div>
          )}

          <button
            id="auth-submit-btn-supabase"
            type="submit"
            disabled={!supabaseConfigured || authLoading}
            className="w-full py-3 bg-gradient-to-r from-af-red to-af-orange text-white rounded-xl font-display text-xs font-bold uppercase tracking-wider leading-none inline-flex items-center justify-center gap-2 transition duration-150 hover:translate-y-[-1px] active:translate-y-0 cursor-pointer shadow-active-btn disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{authLoading ? 'Verifiëren...' : isRegisterMode ? 'Account registreren' : 'Inloggen'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="flex justify-center text-[10px] font-display uppercase tracking-wider font-extrabold pt-1">
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
      </div>
    );
  }

  // LOGGED IN USER PROFILE DASHBOARD VIEW
  return (
    <div className="space-y-6">
      {/* 1. LOGGED IN CARD */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs flex items-center justify-between font-sans">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-af-red to-af-orange text-white flex items-center justify-center font-display font-black text-sm uppercase tracking-wider">
            {currentUser.username.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-sans font-bold text-slate-900 text-sm leading-tight">
              {currentUser.username}
            </h4>
            <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{currentUser.email}</span>
          </div>
        </div>

        <button
          id="auth-signout-btn-panel"
          onClick={handleSignOut}
          className="p-2 rounded-lg text-slate-400 hover:text-af-red hover:bg-red-50 transition cursor-pointer"
          title="Uitloggen"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* 2. EXPLORE SAVED WEEKS */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs space-y-4 font-sans">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-extrabold text-[#111] text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
            <FolderOpen className="h-4 w-4 text-af-orange" />
            Mijn Opgeslagen Menu's ({savedWeeks.length})
          </h3>
          <button 
            onClick={onRefreshSavedWeeks}
            className="text-[10px] text-af-orange font-extrabold uppercase tracking-widest font-display hover:underline cursor-pointer animate-none"
          >
            Verversen
          </button>
        </div>

        {savedWeeks.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl">
            <CookingPot className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400 font-semibold">Nog geen weekmenu's opgeslagen.</p>
            <p className="text-[10px] text-slate-400 pt-0.5">Vul alle 7 dagen van je planner in om deze te bewaren.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {savedWeeks.map(week => (
              <div
                key={week.id}
                className="p-3 border border-slate-50 bg-slate-50/30 rounded-xl flex flex-col gap-2 relative group hover:border-slate-200 transition"
              >
                <div className="flex items-center justify-between pr-8">
                  <div>
                    <h4 className="font-sans font-bold text-slate-800 text-xs">
                      {week.title}
                    </h4>
                    <span className="text-[9px] text-slate-400 leading-none block mt-0.5">
                      Opgeslagen op {new Date(week.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>

                  {/* Open / Restore menu button */}
                  <button
                    id={`btn-load-week-${week.id}`}
                    onClick={() => onLoadSavedWeek(week)}
                    className="px-2.5 py-1 bg-gradient-to-r from-af-red to-af-orange text-white hover:translate-y-[-1px] transition rounded-lg text-[9px] font-black font-display uppercase tracking-wider shadow-xs cursor-pointer"
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
                      <div key={dIdx} className="flex-1 min-w-[34px] bg-white rounded-lg p-1 border border-slate-105 text-center">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-tighter">
                          {day.substring(0, 2)}
                        </span>
                        <span className="text-[10px] leading-tight block truncate mt-0.5">
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
                  className="absolute right-3 top-3 p-1 text-slate-400 hover:text-af-red rounded-md hover:bg-red-50 transition cursor-pointer"
                  title="Menu verwijderen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
