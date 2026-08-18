import React, { useState, useEffect } from 'react';
import {
  Search,
  Layers,
  Calendar,
  Wallet,
  BookOpen,
  ShieldCheck,
  Building,
  Info,
  ExternalLink,
  ChevronRight,
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import { Language, User, DrawScheduleItem, NotificationItem, NavTab } from './types';
import { TRANSLATIONS } from './i18n/translations';
import { api } from './lib/api';
import { Header } from './components/Header';
import { AppLogo } from './components/AppLogo';
import { SingleChecker } from './components/SingleChecker';
import { BatchChecker } from './components/BatchChecker';
import { DrawSchedule } from './components/DrawSchedule';
import { PortfolioManager } from './components/PortfolioManager';
import { ClaimGuide } from './components/ClaimGuide';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';
import { NotificationsModal } from './components/NotificationsModal';
import { UserProfile } from './components/UserProfile';

const DEFAULT_DRAWS: DrawScheduleItem[] = [
  { id: 1, draw_number: 119, scheduled_date: '2025-07-31', location: 'Barishal', status: 'upcoming' },
  { id: 2, draw_number: 118, scheduled_date: '2025-04-30', location: 'Dhaka', status: 'completed' },
  { id: 3, draw_number: 117, scheduled_date: '2025-01-31', location: 'Chattogram', status: 'completed' },
  { id: 4, draw_number: 116, scheduled_date: '2024-10-31', location: 'Rajshahi', status: 'completed' },
  { id: 5, draw_number: 115, scheduled_date: '2024-07-31', location: 'Khulna', status: 'completed' },
  { id: 6, draw_number: 114, scheduled_date: '2024-04-30', location: 'Sylhet', status: 'completed' },
  { id: 7, draw_number: 113, scheduled_date: '2024-01-31', location: 'Mymensingh', status: 'completed' },
  { id: 8, draw_number: 112, scheduled_date: '2023-10-31', location: 'Rangpur', status: 'completed' },
  { id: 9, draw_number: 111, scheduled_date: '2023-07-31', location: 'Dhaka', status: 'completed' }
];

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('pb_dark_mode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('single');

  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [draws, setDraws] = useState<DrawScheduleItem[]>(DEFAULT_DRAWS);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pb_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pb_dark_mode', 'false');
    }
  }, [darkMode]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res?.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Initial load: Fetch logged-in user (if token exists), draw schedules, and notifications
  useEffect(() => {
    const init = async () => {
      try {
        const [userRes, drawsRes, notifRes] = await Promise.allSettled([
          api.getProfile(),
          api.getDraws(),
          api.getNotifications()
        ]);

        if (userRes.status === 'fulfilled' && userRes.value?.user) {
          setUser(userRes.value.user);
          if (userRes.value.user.language) {
            setLang(userRes.value.user.language as Language);
          }
        }

        if (drawsRes.status === 'fulfilled' && Array.isArray(drawsRes.value?.draws) && drawsRes.value.draws.length > 0) {
          setDraws(drawsRes.value.draws);
        }

        if (notifRes.status === 'fulfilled' && notifRes.value?.notifications) {
          setNotifications(notifRes.value.notifications);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    init();
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    if (currentTab === 'profile') {
      setCurrentTab('single');
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (updatedUser.language) {
      setLang(updatedUser.language);
    }
  };

  const t = TRANSLATIONS[lang];

  // Initial loading screen
  if (loadingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-4 animate-in fade-in">
          <AppLogo size="lg" />
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-4 h-4 border-2 border-[#006A4E] border-t-transparent rounded-full animate-spin" />
            <span>{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading Prize Bond Checker...'}</span>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT OPEN PAGE: Authentication Gateway
  if (!user) {
    return (
      <AuthPage
        lang={lang}
        setLang={setLang}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          if (authenticatedUser.language) {
            setLang(authenticatedUser.language);
          }
          loadNotifications();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Main Navigation Header */}
      <Header
        lang={lang}
        setLang={setLang}
        isDark={darkMode}
        setIsDark={setDarkMode}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentTab={currentTab}
        setTab={(tab: NavTab) => setCurrentTab(tab)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Government Authority Verified Badge Strip */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {lang === 'bn' ? 'বাংলাদেশ জাতীয় সঞ্চয় অধিদপ্তর' : 'National Savings Directorate of Bangladesh'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
              100 Tk. Official Bearer Bond Draws (111th to 118th Active)
            </span>
          </div>

          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span>{lang === 'bn' ? 'বাংলাদেশ ব্যাংক অনুমোদিত ডাটাবেজ' : 'Bangladesh Bank Verified Records'}</span>
          </div>
        </div>

        {/* Dynamic Tab Views */}
        {currentTab === 'single' && (
          <SingleChecker
            lang={lang}
            draws={draws}
            onOpenPortfolio={() => setCurrentTab('portfolio')}
          />
        )}

        {currentTab === 'batch' && (
          <BatchChecker
            lang={lang}
            draws={draws}
          />
        )}

        {currentTab === 'schedule' && (
          <DrawSchedule
            lang={lang}
            draws={draws}
          />
        )}

        {currentTab === 'portfolio' && (
          <PortfolioManager
            lang={lang}
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentTab === 'profile' && (
          <UserProfile
            user={user}
            lang={lang}
            onUpdateUser={handleUpdateUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'guide' && (
          <ClaimGuide
            lang={lang}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-6 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {t.app_title}
              </p>
              <p className="text-[11px] text-slate-400">
                © {new Date().getFullYear()} {t.app_title}. All rights reserved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setCurrentTab('portfolio')}
              className="hover:text-emerald-600 transition font-medium"
            >
              {t.nav_portfolio}
            </button>
            {user && (
              <button
                onClick={() => setCurrentTab('profile')}
                className="hover:text-emerald-600 transition font-medium"
              >
                {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
              </button>
            )}
            <button
              onClick={() => setCurrentTab('guide')}
              className="hover:text-emerald-600 transition font-medium"
            >
              {t.nav_guide}
            </button>
          </div>
        </div>
      </footer>

      {/* Global Auth Modal */}
      <AuthModal
        lang={lang}
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          loadNotifications();
        }}
      />

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        lang={lang}
        user={user}
        notifications={notifications}
        onRefreshNotifications={loadNotifications}
        onNavigateToTab={(tab) => setCurrentTab(tab)}
      />

    </div>
  );
}


