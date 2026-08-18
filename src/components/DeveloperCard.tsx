import React, { useState } from 'react';
import { Mail, Phone, UserCheck, Copy, Check, ExternalLink, Code2, GraduationCap, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface DeveloperCardProps {
  lang: Language;
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ lang }) => {
  const [copiedType, setCopiedType] = useState<'email' | 'phone' | null>(null);

  const copyToClipboard = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  return (
    <div
      id="portfolio-developer-info-card"
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden space-y-4"
    >
      {/* Decorative Accent Gradient */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

      {/* Header with Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-[#006A4E] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সফটওয়্যার ডেভেলপার পরিচিতি' : 'Developer Information'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'সিস্টেম আর্কিটেক্ট ও প্রকৌশলী' : 'System Architect & Engineer'}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
          <UserCheck className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'স্বত্বাধিকারী ও নির্মাতা' : 'Creator & Lead Dev'}</span>
        </div>
      </div>

      {/* Developer Profile Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
        
        {/* Name Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/70 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {lang === 'bn' ? 'ডেভেলপারের নাম' : 'Developer'}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Sazzad Kabir
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>MBSTU Alumnus</span>
          </div>
        </div>

        {/* Email Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/70 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
            </span>
            <button
              id="copy-dev-email-btn"
              onClick={() => copyToClipboard('sazzadmbstu@gmail.com', 'email')}
              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Copy email"
            >
              {copiedType === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <a
            href="mailto:sazzadmbstu@gmail.com"
            className="font-bold text-xs sm:text-sm text-[#006A4E] dark:text-emerald-400 hover:underline flex items-center gap-1.5 truncate group"
          >
            <Mail className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">sazzadmbstu@gmail.com</span>
          </a>
          <p className="text-[10px] text-slate-400">
            {copiedType === 'email' ? (
              <span className="text-emerald-600 font-semibold">{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied to clipboard!'}</span>
            ) : (
              lang === 'bn' ? 'সরাসরি যোগাযোগ করুন' : 'Click to compose mail'
            )}
          </p>
        </div>

        {/* Phone Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/70 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {lang === 'bn' ? 'ফোন নম্বর' : 'Phone / Contact'}
            </span>
            <button
              id="copy-dev-phone-btn"
              onClick={() => copyToClipboard('+88-01810-076761', 'phone')}
              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Copy phone number"
            >
              {copiedType === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <a
            href="tel:+8801810076761"
            className="font-mono font-bold text-xs sm:text-sm text-[#006A4E] dark:text-emerald-400 hover:underline flex items-center gap-1.5 group"
          >
            <Phone className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
            <span>+88-01810-076761</span>
          </a>
          <p className="text-[10px] text-slate-400">
            {copiedType === 'phone' ? (
              <span className="text-emerald-600 font-semibold">{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied to clipboard!'}</span>
            ) : (
              lang === 'bn' ? 'সরাসরি কল বা হোয়াটসঅ্যাপ' : 'Click to call / WhatsApp'
            )}
          </p>
        </div>

      </div>

      {/* PHP & MySQL Deployment Package Notice */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {lang === 'bn'
              ? 'সম্পূর্ণ পিএইচপি (PHP) ও মাইএসকিউএল (MySQL) সোর্স কোড এবং ডাটাবেজ রেডি (cPanel/GitHub হোস্টিংয়ের জন্য)।'
              : 'Full PHP & MySQL production backend ready for deployment on cPanel, custom domain, and GitHub.'}
          </span>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300">
          PHP + MySQL (PDO)
        </span>
      </div>
    </div>
  );
};
