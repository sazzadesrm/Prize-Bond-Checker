import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Bell,
  Globe,
  Wallet,
  Trophy,
  Sparkles,
  Lock,
  ArrowLeft,
  Smartphone
} from 'lucide-react';
import { User, Language, PortfolioStats } from '../types';
import { TRANSLATIONS, formatBnNumber, formatCurrency } from '../i18n/translations';
import { api } from '../lib/api';
import { SearchActivityChart } from './SearchActivityChart';

interface UserProfileProps {
  user: User | null;
  lang: Language;
  onUpdateUser: (updatedUser: User) => void;
  onOpenAuth: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  lang,
  onUpdateUser,
  onOpenAuth,
  onNavigateToTab
}) => {
  const t = TRANSLATIONS[lang];

  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [prefLang, setPrefLang] = useState<Language>(user?.language || 'bn');
  const [notifyEmail, setNotifyEmail] = useState<boolean>(user?.notify_email !== 0);
  const [notifySms, setNotifySms] = useState<boolean>(user?.notify_sms !== 0);
  const [notifyDrawAlerts, setNotifyDrawAlerts] = useState<boolean>(user?.notify_draw_alerts !== 0);

  const [loading, setLoading] = useState<boolean>(false);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setPrefLang(user.language || 'bn');
      setNotifyEmail(user.notify_email !== 0);
      setNotifySms(user.notify_sms !== 0);
      setNotifyDrawAlerts(user.notify_draw_alerts !== 0);

      // Fetch portfolio stats for overview card
      api.getPortfolio().then(res => {
        if (res?.stats) {
          setPortfolioStats(res.stats);
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setFeedback({
        message: lang === 'bn' ? 'অনুগ্রহ করে আপনার পুরো নাম প্রদান করুন।' : 'Please enter your full name.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        language: prefLang,
        notify_email: notifyEmail ? 1 : 0,
        notify_sms: notifySms ? 1 : 0,
        notify_draw_alerts: notifyDrawAlerts ? 1 : 0
      });

      if (res?.user) {
        onUpdateUser(res.user);
        setFeedback({
          message: lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' : 'Profile details saved successfully!',
          type: 'success'
        });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err: any) {
      setFeedback({
        message: err.message || (lang === 'bn' ? 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।' : 'Failed to update profile details.'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#006A4E] dark:text-emerald-400 flex items-center justify-center mb-4 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {lang === 'bn' ? 'প্রোফাইল অ্যাক্সেস করতে লগইন করুন' : 'Sign in to access your profile'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          {lang === 'bn' 
            ? 'আপনার প্রোফাইল বিবরণ সম্পাদনা, পোর্টফোলিও পরিচালনা ও ড্র নোটিফিকেশন সেটিংস কাস্টমাইজ করতে সাইন ইন করুন।' 
            : 'Sign in to customize your profile, manage personal bond alerts, and update notification preferences.'}
        </p>
        <button
          id="profile-signin-btn"
          onClick={onOpenAuth}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-[#006A4E] text-white hover:bg-[#00543D] transition shadow-md"
        >
          <UserIcon className="w-4 h-4" />
          <span>{t.signin}</span>
        </button>
      </div>
    );
  }

  const roleLabel = user.role === 'admin' ? 'Super Administrator' : (user.is_premium ? 'Premium Investor' : 'Standard Member');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? 'ব্যবহারকারী প্রোফাইল' : 'User Account Profile'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn' ? 'আপনার ব্যক্তিগত তথ্য ও ড্র অ্যালার্ট প্রেফারেন্স পরিচালনা করুন' : 'Manage your personal investor profile and notification settings'}
          </p>
        </div>

        <button
          onClick={() => onNavigateToTab('portfolio')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-xs"
        >
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'bn' ? 'আমার পোর্টফোলিও' : 'Go to Portfolio'}</span>
        </button>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* User Card */}
        <div className="md:col-span-1 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-[#006A4E] to-emerald-500 text-white flex items-center justify-center font-black text-3xl shadow-md">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {user.role === 'admin' && (
              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-white rounded-full shadow-sm" title="Super Administrator">
                <ShieldCheck className="w-4 h-4" />
              </span>
            )}
          </div>

          <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-3.5">
            {user.name}
          </h3>

          <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${
            user.role === 'admin' 
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}>
            {roleLabel}
          </span>

          <div className="w-full mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2 text-left text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">{lang === 'bn' ? 'ইমেইল' : 'Email'}:</span>
              <span className="font-semibold truncate max-w-[140px]">{user.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">{lang === 'bn' ? 'মোবাইল' : 'Phone'}:</span>
              <span className="font-semibold">{user.phone || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">{lang === 'bn' ? 'সদস্যপদ' : 'Member Since'}:</span>
              <span className="font-semibold">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '2025'}</span>
            </div>
          </div>
        </div>

        {/* Portfolio Stats Preview */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {lang === 'bn' ? 'ট্র্যাক করা বন্ড' : 'Tracked Bonds'}
                </span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-[#006A4E] dark:text-emerald-400 mt-2">
                {lang === 'bn' ? formatBnNumber(portfolioStats?.total_bonds || 0) : (portfolioStats?.total_bonds || 0)}
              </p>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-3">
              {lang === 'bn' ? `বিনিয়োগ: ${formatCurrency(portfolioStats?.total_investment || 0, lang)}` : `Face Value: Tk. ${(portfolioStats?.total_investment || 0).toLocaleString()}`}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {lang === 'bn' ? 'মোট প্রাপ্ত পুরস্কার' : 'Total Prize Winnings'}
                </span>
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {formatCurrency(portfolioStats?.total_winnings || 0, lang)}
              </p>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-3">
              {portfolioStats?.total_winners || 0} {lang === 'bn' ? 'টি বিজয়ী বন্ড' : 'winning unit(s)'}
            </p>
          </div>

          <div className="sm:col-span-2 p-5 rounded-3xl bg-slate-900 text-white shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">{lang === 'bn' ? 'ড্র সতর্কবার্তা সক্রিয়' : 'Active Draw Alert System'}</span>
              </div>
              <p className="text-xs text-slate-300 max-w-md">
                {lang === 'bn' 
                  ? 'আপনার পোর্টফোলিওতে নতুন কোনো বন্ড যুক্ত থাকলে সরকারি ড্র প্রকাশের সাথে সাথে অটো-নোটিফিকেশন পাঠানো হবে।' 
                  : 'Tracked bonds are automatically matched against government gazette draws on publish.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Search Activity Chart */}
      <SearchActivityChart lang={lang} />

      {/* Edit Profile Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        
        <div className="flex items-center gap-2.5 pb-5 border-b border-slate-100 dark:border-slate-700">
          <UserIcon className="w-5 h-5 text-[#006A4E] dark:text-emerald-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'প্রোফাইল তথ্য সম্পাদনা করুন' : 'Edit Profile Information'}
          </h3>
        </div>

        {feedback && (
          <div className={`mt-5 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-semibold ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300' 
              : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'পুরো নাম *' : 'Full Name *'}
              </label>
              <div className="relative">
                <input
                  id="profile-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Rahim Chowdhury"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#006A4E] focus:outline-hidden"
                />
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  id="profile-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahim@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#006A4E] focus:outline-hidden"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Mobile Phone Number'}
              </label>
              <div className="relative">
                <input
                  id="profile-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#006A4E] focus:outline-hidden"
                />
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Default Language Preference */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'পছন্দের ভাষা' : 'Preferred Language'}
              </label>
              <div className="relative">
                <select
                  id="profile-lang-select"
                  value={prefLang}
                  onChange={(e) => setPrefLang(e.target.value as Language)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-[#006A4E] focus:outline-hidden"
                >
                  <option value="bn">বাংলা (Bengali - Default)</option>
                  <option value="en">English (English)</option>
                </select>
                <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Notification Preferences Section */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'বিজ্ঞপ্তি ও ড্র অ্যালার্ট প্রেফারেন্স' : 'Notification & Draw Alert Preferences'}</span>
            </h4>

            <div className="space-y-3.5">
              
              {/* Draw alert for tracked bonds */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition">
                <input
                  id="toggle-draw-alerts"
                  type="checkbox"
                  checked={notifyDrawAlerts}
                  onChange={(e) => setNotifyDrawAlerts(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#006A4E] focus:ring-[#006A4E]"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'পোর্টফোলিও বন্ড বিজয়ী হলে তাৎক্ষণিক ইন-অ্যাপ অ্যালার্ট' : 'Instant In-App Alerts for Tracked Bond Winnings'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'নতুন কোনো ড্র অনুষ্ঠিত হলে পোর্টফোলিওতে থাকা বিজয়ী বন্ডের নোটিফিকেশন দেখাবে।' : 'Alerts you instantly when a newly published draw matches any bond in your portfolio.'}
                  </p>
                </div>
              </label>

              {/* Email Notifications */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition">
                <input
                  id="toggle-email-alerts"
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#006A4E] focus:ring-[#006A4E]"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ইমেইল ড্র সামারি ও গেজেট নোটিফিকেশন' : 'Email Draw Gazette Summary'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'ত্রৈমাসিক ড্র এর ফলাফল ঘোষণার পর ইমেইলে রিপোর্ট প্রেরণ।' : 'Receive official draw summary and winning notifications via email.'}
                  </p>
                </div>
              </label>

              {/* SMS Reminders */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition">
                <input
                  id="toggle-sms-alerts"
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#006A4E] focus:ring-[#006A4E]"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'আসন্ন ড্র এর এসএমএস অনুস্মারক' : 'Upcoming Draw SMS Reminders'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'ড্র তারিখের ২ দিন আগে মোবাইল নম্বরে রিমাইন্ডার এসএমএস পাঠানো হবে।' : 'Get SMS notifications 2 days prior to scheduled national draw dates.'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button
              id="save-profile-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-[#006A4E] text-white hover:bg-[#00543D] disabled:opacity-60 transition shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? (lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving changes...') : (lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Profile Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
