import React, { useState } from 'react';
import {
  BookOpen,
  CheckSquare,
  Square,
  Building2,
  Phone,
  Clock,
  Calculator,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileCheck,
  CreditCard,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, formatBnNumber, formatCurrency } from '../i18n/translations';

interface ClaimGuideProps {
  lang: Language;
}

const CLAIM_OFFICES = [
  {
    division: 'Dhaka',
    division_bn: 'ঢাকা বিভাগ',
    name: 'Bangladesh Bank Motijheel Office & National Savings Bureau',
    name_bn: 'বাংলাদেশ ব্যাংক মতিঝিল অফিস ও জাতীয় সঞ্চয় ব্যুরো',
    address: 'Motijheel Commercial Area, Dhaka-1000',
    address_bn: 'মতিঝিল বাণিজ্যিক এলাকা, ঢাকা-১০০০',
    phone: '+880 2-9530430',
    hours: '10:00 AM - 4:00 PM (Sun - Thu)'
  },
  {
    division: 'Chattogram',
    division_bn: 'চট্টগ্রাম বিভাগ',
    name: 'Bangladesh Bank Chattogram Branch',
    name_bn: 'বাংলাদেশ ব্যাংক চট্টগ্রাম শাখা',
    address: 'Kotwali, Sadarghat Road, Chattogram-4000',
    address_bn: 'কোতোয়ালী, সদরঘাট রোড, চট্টগ্রাম-৪০০০',
    phone: '+880 31-610111',
    hours: '10:00 AM - 4:00 PM (Sun - Thu)'
  },
  {
    division: 'Rajshahi',
    division_bn: 'রাজশাহী বিভাগ',
    name: 'Bangladesh Bank Rajshahi Branch',
    name_bn: 'বাংলাদেশ ব্যাংক রাজশাহী শাখা',
    address: 'Natore Road, Kazihata, Rajshahi-6000',
    address_bn: 'নাটোর রোড, কাজীহাটা, রাজশাহী-৬০০০',
    phone: '+880 721-772181',
    hours: '10:00 AM - 4:00 PM (Sun - Thu)'
  },
  {
    division: 'Khulna',
    division_bn: 'খুলনা বিভাগ',
    name: 'Bangladesh Bank Khulna Office',
    name_bn: 'বাংলাদেশ ব্যাংক খুলনা অফিস',
    address: 'Lower Jessore Road, Khulna-9100',
    address_bn: 'লোয়ার যশোর রোড, খুলনা-৯১০০',
    phone: '+880 41-720183',
    hours: '10:00 AM - 4:00 PM (Sun - Thu)'
  },
  {
    division: 'Sylhet',
    division_bn: 'সিলেট বিভাগ',
    name: 'Bangladesh Bank Sylhet Office',
    name_bn: 'বাংলাদেশ ব্যাংক সিলেট অফিস',
    address: 'Subidbazar, Sylhet-3100',
    address_bn: 'সুবিদবাজার, সিলেট-৩১০০',
    phone: '+880 821-714011',
    hours: '10:00 AM - 4:00 PM (Sun - Thu)'
  },
  {
    division: 'Barishal',
    division_bn: 'বরিশাল বিভাগ',
    name: 'Bangladesh Bank Barishal Branch',
    name_bn: 'বাংলাদেশ ব্যাংক বরিশাল শাখা',
    address: 'Band Road, Barishal-8200',
    address_bn: 'ব্যান্ড রোড, বরিশাল-৮২০০',
    phone: '+880 431-2174240',
    hours: '10:00 AM - 4:00 PM (Sun - Thu)'
  },
  {
    division: 'Rangpur',
    division_bn: 'রংপুর বিভাগ',
    name: 'Bangladesh Bank Rangpur Office',
    name_bn: 'বাংলাদেশ ব্যাংক রংপুর অফিস',
    address: 'Dhap, Jail Road, Rangpur-5400',
    address_bn: 'ধাপ, জেল রোড, রংপুর-৫৪০০',
    phone: '+880 521-63801',
    hours: '10:00 AM - 4:00 PM (Sun - Thu)'
  },
  {
    division: 'Mymensingh',
    division_bn: 'ময়মনসিংহ বিভাগ',
    name: 'Bangladesh Bank Mymensingh Branch',
    name_bn: 'বাংলাদেশ ব্যাংক ময়মনসিংহ শাখা',
    address: 'Town Hall Circle, Mymensingh-2200',
    address_bn: 'টাউন হল মোড়, ময়মনসিংহ-২২০০',
    phone: '+880 91-65431',
    hours: '10:00 AM - 4:00 PM (Sun - Thu)'
  }
];

const FAQS = [
  {
    q_en: 'What is the prize claim deadline for Bangladesh Prize Bonds?',
    q_bn: 'প্রাইজবন্ডের পুরস্কারের টাকা কতদিনের মধ্যে দাবি করতে হয়?',
    a_en: 'Prizes must be claimed within exactly 2 (two) years from the date of the relevant draw. If not claimed within 2 years, the prize money is legally forfeited to the Government of Bangladesh.',
    a_bn: 'ড্র অনুষ্ঠিত হওয়ার তারিখ থেকে ঠিক ২ (দুই) বছরের মধ্যে পুরস্কারের অর্থ দাবি করতে হবে। ২ বছরের মধ্যে দাবি না করলে পুরস্কারের অর্থ সরকারি কোষাগারে বাজেয়াপ্ত হয়ে যায়।'
  },
  {
    q_en: 'How much tax is deducted from prize bond winnings in Bangladesh?',
    q_bn: 'প্রাইজবন্ড জয়ের ওপর কত শতাংশ সরকারি কর কর্তন করা হয়?',
    a_en: 'As per the Income Tax Ordinance of Bangladesh, a mandatory 20% source tax (উৎসে কর) is deducted at source from all winning prize categories before payment.',
    a_bn: 'বাংলাদেশ আয়কর অধ্যাদেশ অনুসারে প্রাইজবন্ডের যে কোনো পুরস্কারের ওপর বাধ্যতামূলকভাবে ২০% উৎসে কর কর্তন করে অবশিষ্ট নিট অর্থ পরিশোধ করা হয়।'
  },
  {
    q_en: 'How is the prize money disbursed to the winner?',
    q_bn: 'পুরস্কারের টাকা কিভাবে বিজয়ীকে প্রদান করা হয়?',
    a_en: 'The prize amount is credited directly to the winner’s bank account via BEFTN (Bangladesh Electronic Funds Transfer Network) or issued via Bangladesh Bank account payee cheque within 2-7 working days.',
    a_bn: 'আবেদন অনুমোদনের পর সাধারণত ২ থেকে ৭ কার্যদিবসের মধ্যে BEFTN-এর মাধ্যমে বিজয়ীর ব্যাংক হিসাবে সরাসরি টাকা পৌঁছে যায় অথবা একাউন্ট পেয়ী চেক প্রদান করা হয়।'
  },
  {
    q_en: 'Can a single prize bond win prizes in multiple draws?',
    q_bn: 'একটি প্রাইজবন্ড কি একাধিক ড্র-তে পুরস্কার জিততে পারে?',
    a_en: 'Yes! A prize bond is an ongoing government bearer security. Even if it wins a prize in one draw, you still retain the bond and it remains eligible for all future quarterly draws as long as you hold it.',
    a_bn: 'হ্যাঁ! প্রাইজবন্ড একটি ধারাবাহিক সরকারি লটারি বন্ড। একবার পুরস্কার জিতলেও বন্ডটি ভাঙিয়ে না নিলে তা পরবর্তী সকল ত্রৈমাসিক ড্র-তে সমানভাবে অংশ নিতে থাকবে।'
  },
  {
    q_en: 'Where can I submit my prize claim application?',
    q_bn: 'পুরস্কার দাবির আবেদন কোথায় জমা দিতে হবে?',
    a_en: 'You can submit the claim application at any Bangladesh Bank counter, National Savings Bureau, or authorized branches of Commercial Banks and Post Offices.',
    a_bn: 'বাংলাদেশ ব্যাংকের যে কোনো শাখা, জাতীয় সঞ্চয় ব্যুরো, অনুমোদিত তফসিলি ব্যাংকের শাখা অথবা ডাকঘরে পুরস্কারের দাবি পত্র দাখিল করা যায়।'
  }
];

export const ClaimGuide: React.FC<ClaimGuideProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];

  // Document checklist local state
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({
    orig_bond: false,
    nid: false,
    photos: false,
    bank: false,
    tin: false
  });

  // Tax calculator local state
  const [calcAmount, setCalcAmount] = useState<number>(600000);
  const taxDeduction = calcAmount * 0.20;
  const netAmount = calcAmount - taxDeduction;

  // FAQ accordion open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleDoc = (key: string) => {
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedDocsCount = Object.values(checkedDocs).filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Banner */}
      <div className="rounded-2xl bg-linear-to-r from-[#006A4E] to-[#044c38] p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-500/40 text-emerald-200 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সরকারি পুরস্কার দাবি নির্দেশিকা' : 'Official Prize Claim Guide'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.guide_title}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            {t.guide_desc}
          </p>
        </div>
      </div>

      {/* 5-Step Visual Claim Process */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <span>{lang === 'bn' ? '৫-ধাপের পুরস্কার দাবি প্রক্রিয়া' : '5-Step Step-by-Step Claim Workflow'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t.step1_title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{t.step1_desc}</p>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-3">Accuracy 100%</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t.step2_title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{t.step2_desc}</p>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-3">Originals Required</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t.step3_title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{t.step3_desc}</p>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-3">Form PB-1</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center mb-3">
                4
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t.step4_title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{t.step4_desc}</p>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-3">20% Tax Cut</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-full bg-[#006A4E] text-white font-black text-xs flex items-center justify-center mb-3">
                5
              </div>
              <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">{t.step5_title}</h3>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400 mt-1.5 leading-relaxed">{t.step5_desc}</p>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-3">2-7 Working Days</span>
          </div>

        </div>

        {/* 2-Year Deadline Alert Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">
              {lang === 'bn' ? 'গুরুত্বপূর্ণ সতর্কতা (২ বছরের নিয়ম):' : 'Critical Rule (2-Year Claim Window):'}
            </span>{' '}
            {lang === 'bn'
              ? 'ড্র অনুষ্ঠিত হওয়ার ২ বছরের মধ্যে পুরস্কারের টাকা দাবি করতে হয়। ২ বছর পার হয়ে গেলে কোনো অবস্থাতেই আর টাকা দাবি করা যাবে না।'
              : 'Prize money must be claimed strictly within 2 years from the draw date. Unclaimed winnings are permanently returned to the National Treasury.'}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Document Checklist & 20% Tax Calculator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Document Checklist Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>{t.doc_checklist}</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
              {completedDocsCount}/5 Ready
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'orig_bond', label: t.doc_orig_bond },
              { id: 'nid', label: t.doc_nid },
              { id: 'photos', label: t.doc_photos },
              { id: 'bank', label: t.doc_bank },
              { id: 'tin', label: t.doc_tin }
            ].map((doc) => (
              <div
                key={doc.id}
                onClick={() => toggleDoc(doc.id)}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer select-none transition ${
                  checkedDocs[doc.id]
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {checkedDocs[doc.id] ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs font-medium">{doc.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 20% Source Tax Calculator Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>{t.tax_calc_title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.tax_calc_desc}
          </p>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {[600000, 325000, 100000, 50000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCalcAmount(amt)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                    calcAmount === amt
                      ? 'bg-[#006A4E] text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {formatCurrency(amt, lang)}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Custom Winning Amount (Tk.)
              </label>
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-base"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.lbl_gross_prize}:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(calcAmount, lang)}</span>
              </div>
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>{t.lbl_tax}:</span>
                <span className="font-semibold">-{formatCurrency(taxDeduction, lang)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-black text-sm text-[#006A4E] dark:text-emerald-400">
                <span>{t.lbl_net_amount}:</span>
                <span>{formatCurrency(netAmount, lang)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Claim Offices Across Bangladesh */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>{t.claim_offices_title}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CLAIM_OFFICES.map((office, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2"
            >
              <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {lang === 'bn' ? office.division_bn : office.division}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? office.name_bn : office.name}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? office.address_bn : office.address}
              </p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{office.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>{office.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'bn' ? 'সাধারণ জিজ্ঞাসাসমূহ (FAQ)' : 'Frequently Asked Questions'}</span>
        </h3>

        <div className="space-y-2.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 flex items-center justify-between gap-3"
                >
                  <span>{lang === 'bn' ? faq.q_bn : faq.q_en}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-4 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700">
                    {lang === 'bn' ? faq.a_bn : faq.a_en}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
