import React, { useState } from 'react';
import {
  Calculator,
  DollarSign,
  ShieldCheck,
  Info,
  X,
  FileText,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, formatBnNumber, formatCurrency } from '../i18n/translations';

interface PrizeValueCalculatorProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  initialTier?: number;
  initialSeries?: string;
  initialBondNumber?: string;
}

const PRIZE_TIERS = [
  {
    tier: 1,
    title_en: '1st Prize',
    title_bn: '১ম পুরস্কার',
    gross: 600000,
    countPerSeries: 1,
    description_en: 'Single 1st prize winner per series',
    description_bn: 'প্রতি সিরিজে ১টি প্রথম পুরস্কার'
  },
  {
    tier: 2,
    title_en: '2nd Prize',
    title_bn: '২য় পুরস্কার',
    gross: 325000,
    countPerSeries: 1,
    description_en: 'Single 2nd prize winner per series',
    description_bn: 'প্রতি সিরিজে ১টি দ্বিতীয় পুরস্কার'
  },
  {
    tier: 3,
    title_en: '3rd Prize',
    title_bn: '৩য় পুরস্কার',
    gross: 100000,
    countPerSeries: 2,
    description_en: 'Two 3rd prizes of 100,000 Tk per series',
    description_bn: 'প্রতি সিরিজে ২টি তৃতীয় পুরস্কার (১ লাখ করে)'
  },
  {
    tier: 4,
    title_en: '4th Prize',
    title_bn: '৪র্থ পুরস্কার',
    gross: 50000,
    countPerSeries: 2,
    description_en: 'Two 4th prizes of 50,000 Tk per series',
    description_bn: 'প্রতি সিরিজে ২টি চতুর্থ পুরস্কার (৫০ হাজার করে)'
  },
  {
    tier: 5,
    title_en: '5th Prize',
    title_bn: '৫ম পুরস্কার',
    gross: 10000,
    countPerSeries: 40,
    description_en: 'Forty 5th prizes of 10,000 Tk per series',
    description_bn: 'প্রতি সিরিজে ৪০টি পঞ্চম পুরস্কার (১০ হাজার করে)'
  }
];

const TAX_RATE = 0.20; // 20% Source Tax under Bangladesh Income Tax Act (Section 55)

export const PrizeValueCalculator: React.FC<PrizeValueCalculatorProps> = ({
  lang,
  isOpen,
  onClose,
  initialTier = 1,
  initialSeries = 'KA',
  initialBondNumber = ''
}) => {
  const t = TRANSLATIONS[lang];

  const [selectedTier, setSelectedTier] = useState<number>(initialTier);
  const [selectedSeries, setSelectedSeries] = useState<string>(initialSeries || 'KA');
  const [bondQuantity, setBondQuantity] = useState<number>(1);
  const [customGross, setCustomGross] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [hasTin, setHasTin] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentTierObj = PRIZE_TIERS.find((p) => p.tier === selectedTier) || PRIZE_TIERS[0];
  const unitGross = isCustom && customGross ? parseFloat(customGross) || 0 : currentTierObj.gross;
  const totalGross = unitGross * bondQuantity;
  const sourceTax = totalGross * TAX_RATE;
  const stampDuty = 0; // Stamp duty on government prize bonds in Bangladesh is 0 Tk.
  const netPayable = totalGross - sourceTax - stampDuty;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#006A4E] to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {lang === 'bn' ? 'প্রাইজবন্ড পুরস্কার ও কর হিসাব ক্যালকুলেটর' : 'Prize Value & Tax Calculator'}
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                {lang === 'bn' ? 'বাংলাদেশ আয়কর আইন ও বাংলাদেশ ব্যাংক বিধিমালা অনুযায়ী নিট হিসাব' : 'Official Net Payout Calculator under Bangladesh Tax Laws'}
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Legal Note Badge */}
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {lang === 'bn' ? 'আইনি বিধান (Income Tax Act):' : 'Legal Tax Provision:'}
              </span>{' '}
              {lang === 'bn'
                ? 'বাংলাদেশ আয়কর আইন ২০২৩ ও জাতীয় সঞ্চয় অধিদপ্তরের নিয়ম অনুযায়ী প্রাইজবন্ডের মোট পুরস্কারের উপর ২০% উৎসে কর (AIT) বাধ্যতামূলকভাবে কর্তন করা হয়। কোনো স্ট্যাম্প ডিউটি প্রযোজ্য নয়।'
                : 'Under Bangladesh Income Tax Laws & National Savings rules, a 20% flat Advance Income Tax (AIT) is deducted at source on all winning prize bond amounts. Stamp duty is 0 Tk.'}
            </div>
          </div>

          {/* Calculator Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Prize Tier Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'পুরস্কারের ক্যাটাগরি (র‌্যাঙ্ক)' : 'Prize Tier / Rank'}
              </label>
              <select
                value={isCustom ? 'custom' : selectedTier}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustom(true);
                  } else {
                    setIsCustom(false);
                    setSelectedTier(parseInt(e.target.value));
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              >
                {PRIZE_TIERS.map((tier) => (
                  <option key={tier.tier} value={tier.tier}>
                    {lang === 'bn' ? tier.title_bn : tier.title_en} — {formatCurrency(tier.gross, lang)}
                  </option>
                ))}
                <option value="custom">{lang === 'bn' ? 'কাস্টম পুরস্কারের পরিমাণ লিখুন' : 'Custom Prize Amount'}</option>
              </select>
            </div>

            {/* Bond Series */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'বন্ড সিরিজ' : 'Bond Series'}
              </label>
              <input
                type="text"
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value.toUpperCase())}
                placeholder="KA / ক"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* Custom Amount if custom mode */}
            {isCustom && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {lang === 'bn' ? 'মোট গ্রস পুরস্কারের অর্থ (টাকা)' : 'Gross Prize Amount (BDT)'}
                </label>
                <input
                  type="number"
                  value={customGross}
                  onChange={(e) => setCustomGross(e.target.value)}
                  placeholder="e.g. 600000"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            )}

            {/* Quantity of Winning Bonds */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'বিজয়ী বন্ডের সংখ্যা' : 'Winning Bond Units'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bondQuantity}
                  onChange={(e) => setBondQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Tax Rate Display */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'উৎসে করের হার (AIT)' : 'Govt Tax Rate'}
              </label>
              <div className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold flex items-center justify-between">
                <span>২০% (20% Flat Source Tax)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold">
                  SEC-55
                </span>
              </div>
            </div>

          </div>

          {/* Net Calculation Summary Spotlight Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {lang === 'bn' ? 'নিট প্রাপ্য পুরস্কারের পরিমাণ' : 'Net Receivable Prize Money'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {lang === 'bn' ? `${formatBnNumber(bondQuantity)}টি বন্ড` : `${bondQuantity} Unit(s)`}
              </span>
            </div>

            <div className="text-center sm:text-left">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                {formatCurrency(netPayable, lang)}
              </span>
              <p className="text-xs text-slate-300 mt-1">
                {lang === 'bn'
                  ? `মোট গ্রস ${formatCurrency(totalGross, lang)} থেকে ২০% কর কর্তনের পর প্রকৃত প্রাপ্য অর্থ`
                  : `Actual cash amount credited after statutory 20% source tax deduction`}
              </p>
            </div>

            {/* Financial Line Breakdown */}
            <div className="pt-3 border-t border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>{lang === 'bn' ? 'গ্রস মোট পুরস্কার (Gross Amount):' : 'Gross Prize Pool:'}</span>
                <span className="font-bold text-white font-mono">{formatCurrency(totalGross, lang)}</span>
              </div>
              <div className="flex items-center justify-between text-red-400">
                <span>{lang === 'bn' ? 'সরকারি উৎসে কর ২০% (Govt Tax Deducted):' : 'Govt Source Tax 20% (AIT):'}</span>
                <span className="font-bold font-mono">-{formatCurrency(sourceTax, lang)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{lang === 'bn' ? 'স্ট্যাম্প ডিউটি / প্রসেসিং ফি:' : 'Stamp Duty & Bank Fee:'}</span>
                <span className="font-bold text-emerald-400 font-mono">০ ৳ (Free)</span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 font-extrabold pt-2 border-t border-slate-700/80 text-sm">
                <span>{lang === 'bn' ? 'সর্বমোট নিট প্রাপ্তব্য (Net Payable):' : 'Final Net Payout:'}</span>
                <span className="font-mono">{formatCurrency(netPayable, lang)}</span>
              </div>
            </div>
          </div>

          {/* Step by Step Claim Guide Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'bn' ? 'পুরস্কারের অর্থ উত্তোলনের নির্দেশনা:' : 'Prize Claim Disbursement Guidelines:'}</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>{lang === 'bn' ? '১০,০০০ টাকা পর্যন্ত পুরস্কার যেকোনো বাণিজ্যিক ব্যাংক বা জাতীয় সঞ্চয় ব্যুরো থেকে সরাসরি নগদ/চেক গ্রহণ করা যায়।' : 'Prizes up to 10,000 Tk. can be claimed directly through authorized commercial bank branches or Savings Bureaus.'}</li>
              <li>{lang === 'bn' ? '৫০,০০০ টাকা বা তদূর্ধ্ব পুরস্কারের ক্ষেত্রে মূল বন্ড, এনআইডি এবং ব্যাংক একাউন্টের তথ্যসহ বাংলাদেশ ব্যাংকের যেকোনো শাখায় আবেদন করতে হয়।' : 'Prizes of 50,000 Tk. and above require claim submission with original bond and NID directly to Bangladesh Bank.'}</li>
              <li>{lang === 'bn' ? 'ড্র অনুষ্ঠানের তারিখ হতে সর্বোচ্চ ২ (দুই) বছরের মধ্যে দাবি পেশ করতে হবে।' : 'Claims must be submitted within 2 years from the official draw date.'}</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'bn' ? 'হিসাব প্রিন্ট' : 'Print Calculation'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#006A4E] text-white text-xs font-extrabold hover:bg-[#00543D] transition shadow-xs cursor-pointer"
          >
            {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
