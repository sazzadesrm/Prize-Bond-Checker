import React, { useState } from 'react';
import {
  Search,
  Layers,
  Calendar,
  Wallet,
  BookOpen,
  ShieldCheck,
  Moon,
  Sun,
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Language, NavTab, User, NotificationItem } from '../types';
import { TRANSLATIONS, formatBnNumber } from '../i18n/translations';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  currentTab: string;
  setTab: (tab: any) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isDark?: boolean;
  setIsDark?: (dark: boolean) => void;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  notifications?: NotificationItem[];
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setTab,
  lang,
  setLang,
  isDark,
  setIsDark,
  darkMode,
  setDarkMode,
  user,
  onOpenAuth,
  onLogout,
  notifications = [],
  onOpenNotifications
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  const themeDark = isDark ?? darkMode ?? false;
  const toggleTheme = () => {
    if (setIsDark) setIsDark(!themeDark);
    else if (setDarkMode) setDarkMode(!themeDark);
  };

  const unreadCount = (notifications || []).filter(n => n && !n.is_read).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'single', label: t.nav_single, icon: <Search className="w-4 h-4" /> },
    { id: 'batch', label: t.nav_batch, icon: <Layers className="w-4 h-4" /> },
    { id: 'schedule', label: t.nav_schedule, icon: <Calendar className="w-4 h-4" /> },
    { id: 'portfolio', label: t.nav_portfolio, icon: <Wallet className="w-4 h-4" /> },
    { id: 'guide', label: t.nav_guide, icon: <BookOpen className="w-4 h-4" /> },
    ...(user?.role === 'admin' ? [{ id: 'admin' as NavTab, label: t.nav_admin, icon: <ShieldCheck className="w-4 h-4 text-amber-500" />, badge: 'ADMIN' }] : [])
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand & Logo */}
          <div 
            id="brand-logo-btn"
            onClick={() => { setTab('single'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <AppLogo size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'প্রাইজবন্ড চেকার' : 'Prize Bond Checker'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {lang === 'bn' ? '১০০ ৳' : '100 Tk.'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {lang === 'bn' ? 'সরকারি ফলাফল যাচাই প্ল্যাটফর্ম' : 'Official Draw Result Verifier'}
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006A4E] dark:text-emerald-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-sm ${
                      item.badge === 'ADMIN' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#006A4E] dark:bg-emerald-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Language, Dark Mode, Notifications, User Auth */}
          <div className="flex items-center gap-2">
            
            {/* Language Toggle */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Toggle Bengali / English"
            >
              <span className="text-sm">🇧🇩</span>
              <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              id="dark-mode-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Theme"
            >
              {themeDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notifications Bell */}
            <button
              id="notif-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-[#F42A41] text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Auth Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div 
                    id="user-dropdown-popover"
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email || user.phone}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {user.role === 'admin' ? 'Super Admin' : (user.is_premium ? 'Premium Investor' : 'Standard Member')}
                      </span>
                    </div>

                    <button
                      id="dropdown-profile-btn"
                      onClick={() => { setTab('profile'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#006A4E] dark:text-emerald-400" />
                      <span>{lang === 'bn' ? 'আমার প্রোফাইল' : 'My Profile'}</span>
                    </button>

                    <button
                      id="dropdown-portfolio-btn"
                      onClick={() => { setTab('portfolio'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2"
                    >
                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.nav_portfolio}</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        id="dropdown-admin-btn"
                        onClick={() => { setTab('admin'); setUserDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t.nav_admin}</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                    <button
                      id="dropdown-signout-btn"
                      onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.signout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-signin-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#006A4E] text-white hover:bg-[#00523C] transition shadow-xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t.signin}</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg lg:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => {
                setTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                currentTab === item.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006A4E] dark:text-emerald-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-sm bg-slate-200 dark:bg-slate-700">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
