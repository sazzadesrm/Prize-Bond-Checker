import React from 'react';
import {
  Trophy,
  X,
  ShieldCheck,
  Sparkles,
  Info,
  Layers,
  DollarSign
} from 'lucide-react';
import { Language } from '../types';
import { formatBnNumber, formatCurrency } from '../i18n/translations';

interface PrizeCategoryInfoModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  highlightTier?: number;
}

export const PrizeCategoryInfoModal: React.FC<PrizeCategoryInfoModalProps> = ({
  lang,
  isOpen,
  onClose,
  highlightTier
}) => {
  if (!isOpen) return null;

  const PRIZE_CATEGORIES = [
    {
      tier: 1,
      rank_en: '1st Prize',
      rank_bn: '১ম পুরস্কার',
      gross_bdt: 600000,
      tax_20_pct: 120000,
      net_bdt: 480000,
      count_per_series: 1,
      total_prizes_72_series: 72,
      note_en: '1 prize per series (600,000 BDT each)',
      note_bn: 'প্রতি সিরিজে ১টি (৬,০০,০০০ টাকা করে)'
    },
    {
      tier: 2,
      rank_en: '2nd Prize',
      rank_bn: '২য় পুরস্কার',
      gross_bdt: 325000,
      tax_20_pct: 65000,
      net_bdt: 260000,
      count_per_series: 1,
      total_prizes_72_series: 72,
      note_en: '1 prize per series (325,000 BDT each)',
      note_bn: 'প্রতি সিরিজে ১টি (৩,২৫,০০০ টাকা করে)'
    },
    {
      tier: 3,
      rank_en: '3rd Prize',
      rank_bn: '৩য় পুরস্কার',
      gross_bdt: 100000,
      tax_20_pct: 20000,
      net_bdt: 80000,
      count_per_series: 2,
      total_prizes_72_series: 144,
      note_en: '2 prizes per series (100,000 BDT each)',
      note_bn: 'প্রতি সিরিজে ২টি (১,০০,০০০ টাকা করে)'
    },
    {
      tier: 4,
      rank_en: '4th Prize',
      rank_bn: '৪র্থ পুরস্কার',
      gross_bdt: 50000,
      tax_20_pct: 10000,
      net_bdt: 40000,
      count_per_series: 2,
      total_prizes_72_series: 144,
      note_en: '2 prizes per series (50,000 BDT each)',
      note_bn: 'প্রতি সিরিজে ২টি (৫০,০০০ টাকা করে)'
    },
    {
      tier: 5,
      rank_en: '5th Prize',
      rank_bn: '৫ম পুরস্কার',
      gross_bdt: 10000,
      tax_20_pct: 2000,
      net_bdt: 8000,
      count_per_series: 40,
      total_prizes_72_series: 2880,
      note_en: '40 prizes per series (10,000 BDT each)',
      note_bn: 'প্রতি সিরিজে ৪০টি (১০,০০০ টাকা করে)'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {lang === 'bn' ? 'প্রাইজবন্ড পুরস্কারের তালিকা ও ক্যাটাগরি' : 'Prize Categories & Rank Breakdown'}
              </h3>
              <p className="text-xs text-emerald-200">
                {lang === 'bn' ? '১০০ টাকা মূল্যমানের প্রতি ড্র-এর মোট ৪৬টি পুরস্কার (প্রতি সিরিজে)' : 'Official 46 prizes per series in each quarterly draw'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 gap-3">
            {PRIZE_CATEGORIES.map((cat) => {
              const isHighlighted = highlightTier === cat.tier;
              return (
                <div
                  key={cat.tier}
                  className={`p-4 rounded-2xl border transition-all ${
                    isHighlighted
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                        cat.tier === 1 ? 'bg-amber-500 text-white' :
                        cat.tier === 2 ? 'bg-slate-700 text-white' :
                        cat.tier === 3 ? 'bg-amber-700 text-white' :
                        'bg-emerald-600 text-white'
                      }`}>
                        {lang === 'bn' ? cat.rank_bn : cat.rank_en}
                      </span>
                      <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                        {formatCurrency(cat.gross_bdt, lang)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {lang === 'bn' ? 'নিট প্রাপ্তব্য: ' : 'Net Payout: '}
                        {formatCurrency(cat.net_bdt, lang)}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        (-{formatCurrency(cat.tax_20_pct, lang)} {lang === 'bn' ? '২০% কর' : '20% Tax'})
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{lang === 'bn' ? cat.note_bn : cat.note_en}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? `৭২ সিরিজে মোট: ${formatBnNumber(cat.total_prizes_72_series)}টি` : `Across 72 series: ${cat.total_prizes_72_series} prizes`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aggregate Summary */}
          <div className="p-4 rounded-2xl bg-linear-to-r from-[#006A4E]/10 via-emerald-500/10 to-emerald-700/10 border border-emerald-300 dark:border-emerald-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-white text-sm">
              <span>{lang === 'bn' ? 'প্রতি ড্র-এ মোট বিতরণকৃত অর্থ (৭২ সিরিজে):' : 'Total Prize Purse per Draw (72 Series):'}</span>
              <span className="text-[#006A4E] dark:text-emerald-400">৳ ১১,৭০,০০,০০০ (11.7 Crore BDT)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {lang === 'bn'
                ? 'প্রতি ত্রৈমাসিকে (জানুয়ারি, এপ্রিল, জুলাই, অক্টোবর) বাংলাদেশ ব্যাংকের ড্র কমিটির তত্ত্বাবধানে ড্র অনুষ্ঠিত হয়।'
                : 'Draws are conducted quarterly under the supervision of Bangladesh Bank Draw Committee.'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#006A4E] text-white text-xs font-bold hover:bg-[#00543D] transition cursor-pointer"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
