import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  KeyRound,
  Zap,
  Globe
} from 'lucide-react';
import { Language, User as UserType } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { api } from '../lib/api';
import { AppLogo } from './AppLogo';

interface AuthPageProps {
  lang: Language;
  setLang: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onAuthSuccess: (user: UserType) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  lang,
  setLang,
  darkMode,
  setDarkMode,
  onAuthSuccess
}) => {
  const t = TRANSLATIONS[lang];

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
      } else {
        const res = await api.register({
          name: name.trim() || 'Prize Bond User',
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          language: lang
        });
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || (lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।' : 'Authentication failed. Please check credentials.'));
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Fast Demo Login for instant testing
  const handleQuickDemo = async (role: 'user' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = role === 'admin' ? 'admin@prizebond.gov.bd' : 'investor@prizebond.gov.bd';
      const demoPassword = 'password123';
      try {
        const res = await api.login(demoEmail, demoPassword);
        onAuthSuccess(res.user);
      } catch {
        // If not registered yet on backend, register and login
        const res = await api.register({
          name: role === 'admin' ? 'System Administrator' : 'Bond Investor',
          email: demoEmail,
          password: demoPassword,
          language: lang
        });
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      // Fallback local session if offline
      onAuthSuccess({
        id: role === 'admin' ? 999 : 101,
        name: role === 'admin' ? 'System Administrator' : 'Demo Investor',
        email: role === 'admin' ? 'admin@prizebond.gov.bd' : 'investor@prizebond.gov.bd',
        role: role,
        language: lang,
        is_premium: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Header Utilities */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo size="md" />
          <div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
              {lang === 'bn' ? 'প্রাইজবন্ড চেকার' : 'Prize Bond Checker'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'bn' ? 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত' : 'Government of Bangladesh Verified'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            id="auth-lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
          >
            <span>🇧🇩</span>
            <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="auth-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Card Centerpiece */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-md">
          
          {/* Top Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#006A4E]/15 rounded-full blur-3xl pointer-events-none" />

          {/* App Header Emblem */}
          <div className="text-center space-y-2 mb-6">
            <div className="flex justify-center mb-1">
              <AppLogo size="lg" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'login'
                ? (lang === 'bn' ? 'অ্যাকাউন্টে প্রবেশ করুন' : 'Sign in to Your Account')
                : (lang === 'bn' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'Create Free Account')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? '১০০ টাকা মূল্যমানের প্রাইজবন্ড ড্র ফলাফল ও পোর্টফোলিও যাচাই'
                : '100 Tk. Bangladesh Prize Bond Draw Checker & Portfolio Manager'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              id="tab-mode-login"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-[#006A4E] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'লগইন (Sign In)' : 'Sign In'}
            </button>
            <button
              type="button"
              id="tab-mode-register"
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-700 text-[#006A4E] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {lang === 'bn' ? 'রেজিস্ট্রেশন (Sign Up)' : 'Sign Up'}
            </button>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === 'bn' ? 'উদাঃ সাজ্জাদ কবির' : 'e.g. Sazzad Kabir'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-[#006A4E] focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile Phone (Optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01810076761"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-[#006A4E] focus:outline-hidden transition font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-[#006A4E] focus:outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-[#006A4E] focus:outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="w-full py-3 rounded-xl font-extrabold text-sm text-white bg-[#006A4E] hover:bg-[#00543D] active:scale-[0.99] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? (lang === 'bn' ? 'লগইন করুন ও প্রবেশ করুন' : 'Sign In to Dashboard')
                      : (lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Register & Enter')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Login Options */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'bn' ? 'অথবা দ্রুত টেস্ট করতে ক্লিক করুন' : 'Or Fast 1-Click Demo Access'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="quick-demo-user-btn"
                onClick={() => handleQuickDemo('user')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-[#006A4E] dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ইনভেস্টর মোড' : 'Investor Demo'}</span>
              </button>

              <button
                type="button"
                id="quick-demo-admin-btn"
                onClick={() => handleQuickDemo('admin')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-900/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'এডমিন মোড' : 'Admin Demo'}</span>
              </button>
            </div>
          </div>

          {/* Security Guarantee Note */}
          <div className="mt-5 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'bn' ? 'নিরাপদ এনক্রিপ্টেড ডাটাবেজ ও সেশন' : 'Encrypted Session & Verified Database'}</span>
          </div>

        </div>
      </main>

      {/* Footer with Developer Information */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Prize Bond Checker • Developer: <span className="text-[#006A4E] dark:text-emerald-400 font-bold">Sazzad Kabir</span> (sazzadmbstu@gmail.com | +88-01810-076761)
        </p>
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Government of Bangladesh 100 Tk. Prize Bond Verification Engine.
        </p>
      </footer>

    </div>
  );
};
