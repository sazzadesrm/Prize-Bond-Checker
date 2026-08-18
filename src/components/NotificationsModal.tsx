import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Bell,
  CheckCircle2,
  Trophy,
  Calendar,
  AlertCircle,
  Trash2,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { NotificationItem, Language, User } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { api } from '../lib/api';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  user: User | null;
  notifications: NotificationItem[];
  onRefreshNotifications: () => Promise<void>;
  onNavigateToTab: (tab: any) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  lang,
  user,
  notifications,
  onRefreshNotifications,
  onNavigateToTab
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'wins'>('all');
  const [scanningAlerts, setScanningAlerts] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await onRefreshNotifications();
      setActionMessage({ text: lang === 'bn' ? 'সকল বিজ্ঞপ্তি পঠিত হিসেবে চিহ্নিত করা হয়েছে' : 'All notifications marked as read', type: 'success' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkSingleRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      await onRefreshNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await api.deleteNotification(id);
      await onRefreshNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleCheckPortfolioDrawAlerts = async () => {
    if (!user) return;
    setScanningAlerts(true);
    try {
      const res = await api.checkPortfolioAlerts();
      await onRefreshNotifications();
      if (res.new_alerts > 0) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
        setActionMessage({
          text: lang === 'bn' ? `🎉 ${res.new_alerts}টি নতুন পুরস্কার বিজয়ী বিজ্ঞপ্তি পাওয়া গেছে!` : `🎉 Found ${res.new_alerts} new winning draw alert(s)!`,
          type: 'success'
        });
      } else {
        setActionMessage({
          text: lang === 'bn' ? 'পোর্টফোলিওতে নতুন কোনো বিজয়ী ড্র নেই।' : 'No new winning alerts for your portfolio.',
          type: 'info'
        });
      }
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error('Check alerts error:', err);
    } finally {
      setScanningAlerts(false);
    }
  };

  const filteredList = (notifications || []).filter(item => {
    if (!item) return false;
    if (filter === 'unread') return !item.is_read;
    if (filter === 'wins') return item.type === 'portfolio_win' || item.title.includes('Win') || item.title.includes('জিতেছে');
    return true;
  });

  const unreadTotal = (notifications || []).filter(n => n && !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#006A4E] dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'বিজ্ঞপ্তি ও ড্র অ্যালার্ট' : 'Notifications & Draw Alerts'}
                </h3>
                {unreadTotal > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#F42A41] text-white">
                    {unreadTotal} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'পোর্টফোলিওতে সংরক্ষিত বন্ডের ড্র ফলাফল সতর্কতা' : 'Draw result alerts for your tracked portfolio bonds'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portfolio Scan Trigger & Quick Actions */}
        <div className="px-5 py-3 bg-emerald-50/60 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-2">
          {user ? (
            <button
              onClick={handleCheckPortfolioDrawAlerts}
              disabled={scanningAlerts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#006A4E] text-white hover:bg-[#00543D] disabled:opacity-60 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanningAlerts ? 'animate-spin' : ''}`} />
              <span>{scanningAlerts ? (lang === 'bn' ? 'স্ক্যান করা হচ্ছে...' : 'Scanning draws...') : (lang === 'bn' ? 'পোর্টফোলিও ড্র অ্যালার্ট স্ক্যান করুন' : 'Scan Portfolio For Draw Alerts')}</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              {lang === 'bn' ? 'পোর্টফোলিও ভিত্তিক সতর্কতার জন্য লগইন করুন' : 'Sign in to receive tracked portfolio draw alerts'}
            </span>
          )}

          {unreadTotal > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#006A4E] dark:hover:text-emerald-400"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সব পঠিত করুন' : 'Mark all as read'}</span>
            </button>
          )}
        </div>

        {/* Action message banner */}
        {actionMessage && (
          <div className={`px-5 py-2 text-xs font-semibold flex items-center gap-2 ${
            actionMessage.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/40 dark:bg-slate-900/40">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'bn' ? 'সকল' : 'All'} ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === 'unread'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'bn' ? 'অপঠিত' : 'Unread'} ({unreadTotal})
          </button>
          <button
            onClick={() => setFilter('wins')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === 'wins'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>{lang === 'bn' ? 'পুরস্কার সতর্কতা' : 'Winning Alerts'}</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">{lang === 'bn' ? 'কোনো বিজ্ঞপ্তি পাওয়া যায়নি' : 'No notifications found'}</p>
              <p className="text-xs mt-1">
                {lang === 'bn' 
                  ? 'নতুন ড্র অনুষ্ঠিত হলে বা পোর্টফোলিও বন্ড বিজয়ী হলে এখানে অ্যালার্ট আসবে।' 
                  : 'Alerts will appear here when new draw results match your tracked bonds.'}
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isWin = item.type === 'portfolio_win' || item.title.includes('Win') || item.title.includes('জিতেছে');
              const displayTitle = lang === 'bn' ? (item.title_bn || item.title) : item.title;
              const displayMessage = lang === 'bn' ? (item.message_bn || item.message) : item.message;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition relative group ${
                    !item.is_read
                      ? isWin 
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isWin 
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400' 
                        : 'bg-emerald-100 dark:bg-emerald-950 text-[#006A4E] dark:text-emerald-400'
                    }`}>
                      {isWin ? <Trophy className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 pr-14">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs sm:text-sm font-bold ${
                          isWin ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-900 dark:text-white'
                        }`}>
                          {displayTitle}
                        </h4>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-[#F42A41] shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {displayMessage}
                      </p>

                      <div className="flex items-center gap-3 mt-2.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </span>

                        {isWin && (
                          <button
                            onClick={() => {
                              onClose();
                              onNavigateToTab('portfolio');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006A4E] dark:text-emerald-400 hover:underline"
                          >
                            <span>{lang === 'bn' ? 'পোর্টফোলিওতে দেখুন' : 'View in Portfolio'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (Read / Delete) */}
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {!item.is_read && (
                        <button
                          onClick={() => handleMarkSingleRead(item.id)}
                          title="Mark as read"
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(item.id)}
                        title="Delete notification"
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'bn' 
              ? 'জাতীয় সঞ্চয় অধিদপ্তর এর প্রতি ত্রৈমাসিক ড্র এর সাথে স্বয়ংক্রিয়ভাবে নোটিফিকেশন সিঙ্ক হয়।' 
              : 'Notifications automatically synchronize with Bangladesh Bank quarterly draw releases.'}
          </p>
        </div>
      </div>
    </div>
  );
};
