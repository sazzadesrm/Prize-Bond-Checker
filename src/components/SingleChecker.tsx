import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Download,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  PlusCircle,
  Clock,
  RotateCcw,
  Trash2,
  X,
  History,
  FileDown,
  FileSpreadsheet,
  FileText,
  Printer,
  GitCompare,
  ArrowUpDown,
  TrendingUp,
  Calculator,
  Info,
  Layers
} from 'lucide-react';
import { Language, SingleCheckResult, DrawScheduleItem, RecentSearchItem } from '../types';
import { TRANSLATIONS, formatBnNumber, formatCurrency } from '../i18n/translations';
import { api } from '../lib/api';
import { exportSingleWinSlipPdf } from '../lib/pdfExport';
import { PrizeValueCalculator } from './PrizeValueCalculator';
import { PrizeCategoryInfoModal } from './PrizeCategoryInfoModal';

interface SingleCheckerProps {
  lang: Language;
  draws: DrawScheduleItem[];
  onSaveToPortfolio?: (series: string, number: string) => void;
  onNavigateToGuide?: () => void;
}

const RECENT_SEARCHES_KEY = 'bd_prizebond_recent_searches';
const MAX_RECENT_SEARCHES = 5;

const POPULAR_SERIES_BN = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ট', 'ঠ', 'ড', 'ঢ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'স', 'হ'];
const POPULAR_SERIES_EN = ['KA', 'KHA', 'GA', 'GHA', 'UMO', 'CHA', 'CHHA', 'JA', 'JHA', 'TA', 'THA', 'DA', 'DHA', 'TO', 'THO', 'DO', 'DHO', 'NO', 'PO', 'FO', 'BO', 'BHO', 'MO', 'A', 'B', 'C', 'D', 'E'];

export const SingleChecker: React.FC<SingleCheckerProps> = ({
  lang,
  draws,
  onSaveToPortfolio,
  onNavigateToGuide
}) => {
  const t = TRANSLATIONS[lang];

  const [series, setSeries] = useState<string>('KA');
  const [bondNumber, setBondNumber] = useState<string>('');
  const [selectedDraw, setSelectedDraw] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SingleCheckResult | null>(null);
  const [savedToPortSuccess, setSavedToPortSuccess] = useState<boolean>(false);

  // Local storage recent searches state (max 5)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_RECENT_SEARCHES);
        }
      }
    } catch (e) {
      console.warn('Failed to parse recent searches from localStorage:', e);
    }
    return [];
  });

  // Recent searches sorting
  const [recentSort, setRecentSort] = useState<'date_desc' | 'date_asc' | 'num_asc' | 'num_desc'>('date_desc');

  // Previous draw comparison state
  const [compareWithPrevious, setCompareWithPrevious] = useState<boolean>(false);
  const [previousDrawResult, setPreviousDrawResult] = useState<SingleCheckResult | null>(null);
  const [previousDrawLoading, setPreviousDrawLoading] = useState<boolean>(false);

  // Prize Calculator and Categories Modal State
  const [showCalculatorModal, setShowCalculatorModal] = useState<boolean>(false);
  const [calcInitialTier, setCalcInitialTier] = useState<number>(1);
  const [calcInitialSeries, setCalcInitialSeries] = useState<string>('KA');
  const [calcInitialBondNumber, setCalcInitialBondNumber] = useState<string>('');
  const [showCategoryInfoModal, setShowCategoryInfoModal] = useState<boolean>(false);
  const [highlightCategoryTier, setHighlightCategoryTier] = useState<number | undefined>(undefined);

  const completedDraws = (draws || []).filter((d) => d && d.status === 'completed');

  const sortedRecentSearches = React.useMemo(() => {
    return [...recentSearches].sort((a, b) => {
      if (recentSort === 'date_desc') return (b.timestamp || 0) - (a.timestamp || 0);
      if (recentSort === 'date_asc') return (a.timestamp || 0) - (b.timestamp || 0);
      if (recentSort === 'num_asc') return (a.bondNumber || '').localeCompare(b.bondNumber || '');
      if (recentSort === 'num_desc') return (b.bondNumber || '').localeCompare(a.bondNumber || '');
      return 0;
    });
  }, [recentSearches, recentSort]);

  const getPreviousDrawInfo = () => {
    if (!completedDraws || completedDraws.length === 0) return null;
    if (selectedDraw === 'all') {
      return completedDraws.length > 1 ? completedDraws[1] : null;
    }
    const curNum = Number(selectedDraw);
    const idx = completedDraws.findIndex((d) => d.draw_number === curNum);
    if (idx !== -1 && idx + 1 < completedDraws.length) {
      return completedDraws[idx + 1];
    }
    if (curNum > 1) {
      return {
        id: 0,
        draw_number: curNum - 1,
        scheduled_date: 'Prior Quarterly Cycle',
        location: 'Official Draw',
        status: 'completed' as const
      };
    }
    return null;
  };

  const handleTogglePreviousCompare = async () => {
    const nextState = !compareWithPrevious;
    setCompareWithPrevious(nextState);

    if (nextState && !previousDrawResult && result) {
      const prevDraw = getPreviousDrawInfo();
      if (!prevDraw) return;

      setPreviousDrawLoading(true);
      try {
        const prevRes = await api.checkSingleBond({
          bond_series: result.bond_series,
          bond_number: result.bond_number,
          draw_number: prevDraw.draw_number,
          check_all_active: false
        });
        setPreviousDrawResult(prevRes);
      } catch (e) {
        console.warn('Failed to load previous draw comparison:', e);
      } finally {
        setPreviousDrawLoading(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const saveSearchToRecent = (searchSeries: string, searchNum: string, searchDraw: string) => {
    try {
      const newItem: RecentSearchItem = {
        series: searchSeries,
        bondNumber: searchNum,
        draw: searchDraw,
        timestamp: Date.now()
      };

      // Filter out duplicate bond numbers and prepend newest
      const updated = [
        newItem,
        ...recentSearches.filter(
          item => !(item.bondNumber === searchNum && item.series === searchSeries)
        )
      ].slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent search to localStorage:', e);
    }
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.warn('Failed to clear recent searches:', e);
    }
  };

  const removeSingleRecentSearch = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const updated = recentSearches.filter((_, idx) => idx !== indexToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update recent searches in localStorage:', e);
    }
  };

  const executeCheck = async (targetSeries: string, targetNumber: string, targetDraw: string) => {
    setError(null);
    setSavedToPortSuccess(false);
    setCompareWithPrevious(false);
    setPreviousDrawResult(null);

    const cleanNum = targetNumber.replace(/[^0-9]/g, '');
    if (!cleanNum || cleanNum.length < 5) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে সঠিক ৭ ডিজিটের বন্ড নম্বর দিন।' : 'Please enter a valid 7-digit bond number.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.checkSingleBond({
        bond_series: targetSeries,
        bond_number: cleanNum,
        draw_number: targetDraw === 'all' ? null : Number(targetDraw),
        check_all_active: targetDraw === 'all'
      });

      setResult(response);

      // Save to recent searches on successful check
      saveSearchToRecent(targetSeries, cleanNum, targetDraw);

      if (response.result === 'WIN') {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeCheck(series, bondNumber, selectedDraw);
  };

  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    setSeries(item.series);
    setBondNumber(item.bondNumber);
    setSelectedDraw(item.draw || 'all');
    executeCheck(item.series, item.bondNumber, item.draw || 'all');
  };

  const handleQuickSample = (sampleNum: string, sampleSeries: string = 'KA', drawChoice: string = 'all') => {
    setBondNumber(sampleNum);
    setSeries(sampleSeries);
    setSelectedDraw(drawChoice);
    setError(null);
    setResult(null);
  };

  const handleSavePortfolio = () => {
    if (!result) return;
    if (onSaveToPortfolio) {
      onSaveToPortfolio(result.bond_series, result.bond_number);
      setSavedToPortSuccess(true);
      setTimeout(() => setSavedToPortSuccess(false), 3500);
    }
  };

  const exportResultAsCsv = (res: SingleCheckResult) => {
    const isWin = res.result === 'WIN';
    const headers = [
      'Full Bond',
      'Series',
      'Number',
      'Result Status',
      'Draw Details',
      'Draw Date',
      'Draw Location',
      'Prize Category (EN)',
      'Prize Category (BN)',
      'Gross Prize (BDT)',
      'Source Tax 20% (BDT)',
      'Net Payable Amount (BDT)',
      'Claim Deadline',
      'Verification Date'
    ];

    const row = [
      `"${res.full_bond}"`,
      `"${res.bond_series || ''}"`,
      `"${res.bond_number}"`,
      `"${isWin ? 'WINNER' : 'NO_WIN'}"`,
      `"${res.winning_info ? `Draw #${res.winning_info.draw_number}` : (selectedDraw === 'all' ? 'All Active Draws (Last 2 Years)' : `Draw #${selectedDraw}`)}"`,
      `"${res.winning_info?.draw_date || 'N/A'}"`,
      `"${res.winning_info?.location || 'N/A'}"`,
      `"${res.winning_info?.prize_title_en || 'N/A'}"`,
      `"${res.winning_info?.prize_title_bn || 'N/A'}"`,
      res.winning_info?.gross_prize_amount || 0,
      res.winning_info?.source_tax_20_pct || 0,
      res.winning_info?.net_payable_amount || 0,
      `"${res.winning_info?.claim_deadline || 'N/A'}"`,
      `"${new Date().toISOString()}"`
    ];

    const csvContent = '\uFEFF' + [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prizebond_${res.bond_number}_result.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportResultAsTxt = (res: SingleCheckResult) => {
    const isWin = res.result === 'WIN';
    const lines = [
      '================================================================',
      '      BANGLADESH 100 TK. PRIZE BOND VERIFICATION RESULT         ',
      '        Government of Bangladesh • National Savings Dept.       ',
      '================================================================',
      `Bond Number        : ${res.full_bond}`,
      `Series             : ${res.bond_series || 'N/A'}`,
      `Serial Number      : ${res.bond_number}`,
      `Verification Result : ${isWin ? '★ WINNER ★' : 'No Winning Match (Checked in last 2 years / selected draw)'}`,
      '----------------------------------------------------------------',
      ...(isWin && res.winning_info
        ? [
            `Prize Category     : ${res.winning_info.prize_title_en} (${res.winning_info.prize_title_bn})`,
            `Official Draw      : Draw #${res.winning_info.draw_number} (${res.winning_info.draw_date})`,
            `Draw Location      : ${res.winning_info.location || 'Official Draw Location'}`,
            `Gross Prize Money  : Tk. ${res.winning_info.gross_prize_amount.toLocaleString('en-US')}/-`,
            `Source Tax (20%)   : Tk. ${res.winning_info.source_tax_20_pct.toLocaleString('en-US')}/-`,
            `Net Payable Amount : Tk. ${res.winning_info.net_payable_amount.toLocaleString('en-US')}/- (BDT)`,
            `Claim Deadline     : ${res.winning_info.claim_deadline} (2 Years from Draw Date)`,
          ]
        : [
            `Draw Range Checked : ${selectedDraw === 'all' ? 'All Active Draws (8 Most Recent Official Draws)' : `Draw #${selectedDraw}`}`,
            'Note               : Bonds remain eligible for subsequent upcoming quarterly draws.'
          ]),
      '----------------------------------------------------------------',
      `Generated On       : ${new Date().toLocaleString()}`,
      `Verification Engine: Bangladesh Prize Bond Digital Registry`,
      '================================================================'
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `prizebond_${res.bond_number}_result.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (!result) return;
    const text = result.result === 'WIN'
      ? `🎉 I just won ${result.winning_info?.prize_title_en} on my Prize Bond ${result.full_bond}! Checked on BD Prize Bond Checker.`
      : `Checked Prize Bond ${result.full_bond} on BD Prize Bond Checker.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'BD Prize Bond Checker Result',
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert(lang === 'bn' ? 'ফলাফলের বিবরণ ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Result copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Hero Welcome Banner (Hidden in Print) */}
      <div className="no-print relative overflow-hidden rounded-2xl bg-linear-to-r from-[#006A4E] via-[#005a42] to-[#044c38] p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-[#F42A41]/25 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'bn' ? '১০০ টাকা মূল্যমানের সরকারি প্রাইজবন্ড' : 'Government 100 Tk. Prize Bond'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.check_single_title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            {t.check_single_desc}
          </p>

          {/* Quick Tools Launch Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-4 border-t border-emerald-600/40">
            <button
              type="button"
              id="hero-open-calculator-btn"
              onClick={() => {
                setCalcInitialTier(1);
                setCalcInitialSeries(series || 'KA');
                setShowCalculatorModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-amber-300" />
              <span>{lang === 'bn' ? 'প্রাইজ ভ্যালু ক্যালকুলেটর' : 'Prize Value Calculator'}</span>
            </button>

            <button
              type="button"
              id="hero-open-prize-info-btn"
              onClick={() => {
                setHighlightCategoryTier(undefined);
                setShowCategoryInfoModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-400/30 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-emerald-300" />
              <span>{lang === 'bn' ? 'পুরস্কারের তালিকা ও ক্যাটাগরি' : 'Prize Rank Breakdown'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Checker Card (Hidden in Print) */}
      <div className="no-print bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleCheck} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            
            {/* Series Input / Selector */}
            <div className="sm:col-span-4">
              <label htmlFor="bond-series-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.label_series}
              </label>
              <div className="relative">
                <input
                  id="bond-series-input"
                  type="text"
                  value={series}
                  onChange={(e) => setSeries(e.target.value.toUpperCase())}
                  placeholder={t.placeholder_series}
                  maxLength={5}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
              {/* Quick series pills */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(lang === 'bn' ? POPULAR_SERIES_BN.slice(0, 7) : POPULAR_SERIES_EN.slice(0, 7)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeries(s)}
                    className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold transition ${
                      series === s
                        ? 'bg-[#006A4E] text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 7-digit Bond Number */}
            <div className="sm:col-span-8">
              <label htmlFor="bond-number-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.label_number} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="bond-number-input"
                  type="text"
                  value={bondNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
                    setBondNumber(clean);
                  }}
                  placeholder={t.placeholder_number}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xl font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  required
                />
                <div className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">
                  {bondNumber.length}/7
                </div>
              </div>
            </div>
          </div>

          {/* Draw Selector */}
          <div>
            <label htmlFor="draw-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.label_draw}
            </label>
            <div className="relative">
              <select
                id="draw-select"
                value={selectedDraw}
                onChange={(e) => setSelectedDraw(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                <option value="all">
                  🌟 {t.opt_all_active_draws}
                </option>
                {completedDraws.map((d) => (
                  <option key={d.draw_number} value={d.draw_number.toString()}>
                    {lang === 'bn' 
                      ? `${formatBnNumber(d.draw_number)}তম ড্র (${d.scheduled_date}) - ${d.location}`
                      : `Draw #${d.draw_number} (${d.scheduled_date}) - ${d.location}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div id="check-error-notice" className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Submit Button */}
          <div className="pt-2">
            <button
              id="submit-check-btn"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base text-white bg-[#006A4E] hover:bg-[#00543D] active:scale-[0.99] transition shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.checking}</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>{t.btn_check_now}</span>
                </>
              )}
            </button>
          </div>

          {/* Recent Searches (Last 5 Checks from Local Storage) with Sorting & Clear */}
          {recentSearches.length > 0 && (
            <div className="pt-3 pb-1 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'bn' ? 'সাম্প্রতিক অনুসন্ধান (সর্বশেষ ৫টি)' : 'Recent Searches (Last 5)'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort Recent Searches Control */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <select
                      id="recent-searches-sort-select"
                      value={recentSort}
                      onChange={(e) => setRecentSort(e.target.value as any)}
                      aria-label="Sort recent searches"
                      className="text-[11px] font-semibold py-0.5 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="date_desc">{lang === 'bn' ? 'তারিখ (নতুন আগে)' : 'Date (Newest)'}</option>
                      <option value="date_asc">{lang === 'bn' ? 'তারিখ (পুরনো আগে)' : 'Date (Oldest)'}</option>
                      <option value="num_asc">{lang === 'bn' ? 'বন্ড নম্বর (০-৯)' : 'Bond No. (0-9)'}</option>
                      <option value="num_desc">{lang === 'bn' ? 'বন্ড নম্বর (৯-০)' : 'Bond No. (9-0)'}</option>
                    </select>
                  </div>

                  {/* Clear History Button */}
                  <button
                    type="button"
                    id="clear-history-btn"
                    onClick={clearAllRecentSearches}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition cursor-pointer"
                    title="Clear all recent search history"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'হিস্ট্রি মুছুন' : 'Clear History'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {sortedRecentSearches.map((item, idx) => (
                  <div
                    key={`${item.series}-${item.bondNumber}-${item.timestamp}-${idx}`}
                    className="inline-flex items-center group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:border-emerald-300 dark:hover:border-emerald-800 transition shadow-2xs overflow-hidden"
                  >
                    <button
                      type="button"
                      id={`recent-search-${idx}`}
                      onClick={() => handleSelectRecentSearch(item)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#006A4E] dark:group-hover:text-emerald-400 cursor-pointer"
                    >
                      <span className="px-1 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-[10px] font-sans font-extrabold text-[#006A4E] dark:text-emerald-300">
                        {item.series || 'KA'}
                      </span>
                      <span>{item.bondNumber}</span>
                      {item.draw && item.draw !== 'all' && (
                        <span className="text-[10px] font-sans font-normal text-slate-400">
                          (#{item.draw})
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      id={`remove-recent-search-${idx}`}
                      onClick={(e) => removeSingleRecentSearch(e, idx)}
                      className="px-1.5 py-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Remove from history"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Demo Test Samples */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              💡 {lang === 'bn' ? 'দ্রুত পরীক্ষামূলক বিজয়ী নম্বর ট্রাই করুন:' : 'Try instant test winning numbers:'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                id="sample-1st-prize-btn"
                onClick={() => handleQuickSample('0528419', 'KA', '118')}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-medium transition"
              >
                🏆 0528419 (1st Prize - 6 Lakh Tk)
              </button>
              <button
                type="button"
                id="sample-2nd-prize-btn"
                onClick={() => handleQuickSample('0834921', 'GA', '118')}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-medium transition"
              >
                🥈 0834921 (2nd Prize - 3.25 Lakh Tk)
              </button>
              <button
                type="button"
                id="sample-5th-prize-btn"
                onClick={() => handleQuickSample('0123456', 'KHA', 'all')}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-medium transition"
              >
                🥉 0123456 (Draw 117 Winner)
              </button>
              <button
                type="button"
                id="sample-nowin-btn"
                onClick={() => handleQuickSample('7777777', 'PA', 'all')}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium transition"
              >
                7777777 (Non-winner test)
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Result Display Section */}
      {result && (
        <div id="check-result-container" className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {result.result === 'WIN' && result.winning_info ? (
            /* WIN Screen Card */
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-linear-to-b from-emerald-50/90 via-white to-emerald-50/40 dark:from-emerald-950/50 dark:via-slate-800 dark:to-emerald-950/20 p-6 sm:p-8 shadow-xl">
              
              {/* Top Banner with Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 dark:border-emerald-800 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Trophy className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-300">
                      {t.win_title}
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      {t.win_sub}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-600 text-white tracking-wider">
                      {lang === 'bn' ? result.winning_info.prize_title_bn : result.winning_info.prize_title_en}
                    </span>
                    <button
                      type="button"
                      id="winning-prize-info-btn"
                      onClick={() => {
                        setHighlightCategoryTier(result.winning_info?.prize_tier);
                        setShowCategoryInfoModal(true);
                      }}
                      className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 transition cursor-pointer"
                      title={lang === 'bn' ? 'পুরস্কারের বিস্তারিত তথ্য দেখুন' : 'View Prize Category Details'}
                      aria-label="Prize Quick Info"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                    {lang === 'bn' ? `ড্র #${formatBnNumber(result.winning_info.draw_number)}` : `Draw #${result.winning_info.draw_number}`}
                  </p>
                </div>
              </div>

              {/* Winning Amount Spotlight */}
              <div className="my-6 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t.lbl_net_amount}
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-[#006A4E] dark:text-emerald-400 mt-1">
                    {formatCurrency(result.winning_info.net_payable_amount, lang)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ({lang === 'bn' ? '২০% সরকারি কর কর্তনের পর' : 'After 20% Source Tax Deduction'})
                  </p>
                </div>

                <div className="w-full sm:w-auto text-left sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-6 space-y-1">
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">{t.lbl_gross_prize}:</span>{' '}
                    <span className="font-semibold">{formatCurrency(result.winning_info.gross_prize_amount, lang)}</span>
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">
                    <span className="text-slate-400">{t.lbl_tax}:</span>{' '}
                    <span className="font-semibold">-{formatCurrency(result.winning_info.source_tax_20_pct, lang)}</span>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{t.bond_number_th}</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">{result.full_bond}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{t.lbl_draw_info}</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {lang === 'bn' ? `${formatBnNumber(result.winning_info.draw_number)}তম ড্র` : `Draw #${result.winning_info.draw_number}`}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{t.lbl_draw_date}</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{result.winning_info.draw_date}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{t.lbl_claim_deadline}</p>
                  <p className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5">{result.winning_info.claim_deadline}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="download-slip-pdf-btn"
                  onClick={() => exportSingleWinSlipPdf(result)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#006A4E] text-white hover:bg-[#00543D] transition shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.btn_download_slip}</span>
                </button>

                {/* Export Results as CSV / TXT */}
                <button
                  id="export-single-result-btn"
                  onClick={() => exportResultAsCsv(result)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                  title="Export results as CSV file"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'bn' ? 'এক্সপোর্ট রেজাল্ট (CSV)' : 'Export Results (CSV)'}</span>
                </button>

                <button
                  id="export-single-result-txt-btn"
                  onClick={() => exportResultAsTxt(result)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                  title="Export results as Text file"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>{lang === 'bn' ? 'টেক্সট (TXT)' : 'Text (TXT)'}</span>
                </button>

                {/* Prize Value Calculator Button */}
                <button
                  id="win-prize-calculator-btn"
                  onClick={() => {
                    setCalcInitialTier(result.winning_info?.prize_tier || 1);
                    setCalcInitialSeries(result.series || 'KA');
                    setCalcInitialBondNumber(result.bond_number || '');
                    setShowCalculatorModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                  title={lang === 'bn' ? 'ট্যাক্স কর্তন ও নিট পুরস্কার হিসাব' : 'Net Prize Value Calculator'}
                >
                  <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'bn' ? 'ট্যাক্স ও নিট হিসাব' : 'Value Calculator'}</span>
                </button>

                {/* Previous Draw Comparison Toggle Button */}
                <button
                  id="toggle-compare-previous-draw-btn"
                  onClick={handleTogglePreviousCompare}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition shadow-xs cursor-pointer ${
                    compareWithPrevious
                      ? 'bg-emerald-800 text-white border-emerald-700 dark:bg-emerald-700'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                  title="Compare bond status in the preceding quarterly draw cycle"
                >
                  <GitCompare className="w-4 h-4 text-emerald-500" />
                  <span>
                    {compareWithPrevious
                      ? (lang === 'bn' ? 'আগের ড্র তুলনা বন্ধ' : 'Hide Comparison')
                      : (lang === 'bn' ? 'আগের ড্র-এর সাথে তুলনা' : 'Compare with Previous Draw')}
                  </span>
                </button>

                {/* Print Button */}
                <button
                  id="print-single-result-btn"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                  title="Print verification summary"
                >
                  <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                </button>

                <button
                  id="save-win-to-portfolio-btn"
                  onClick={handleSavePortfolio}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{savedToPortSuccess ? (lang === 'bn' ? 'সংরক্ষিত হয়েছে!' : 'Saved!') : t.btn_add_to_portfolio}</span>
                </button>

                {onNavigateToGuide && (
                  <button
                    id="navigate-claim-guide-btn"
                    onClick={onNavigateToGuide}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 text-white hover:bg-amber-600 transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? 'দাবি করার নিয়ম দেখুন' : 'How to Claim Prize'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  id="share-result-btn"
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition ml-auto"
                  title={t.share_result}
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Previous Draw Comparison Section */}
              {compareWithPrevious && (
                <div className="mt-6 pt-5 border-t border-emerald-200 dark:border-emerald-800 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#006A4E] dark:text-emerald-400">
                        <GitCompare className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {lang === 'bn' ? 'পূর্ববর্তী ড্র তুলনা পর্যালোচনা' : 'Preceding Draw Cycle Comparison'}
                      </h4>
                    </div>
                    {getPreviousDrawInfo() && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Draw #{getPreviousDrawInfo()?.draw_number}
                      </span>
                    )}
                  </div>

                  {previousDrawLoading ? (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>{lang === 'bn' ? 'পূর্ববর্তী ড্র ডেটা লোড হচ্ছে...' : 'Fetching preceding draw status...'}</span>
                    </div>
                  ) : previousDrawResult ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Current Draw Status */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {lang === 'bn' ? 'বর্তমান চেককৃত ড্র' : 'Current Checked Cycle'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {result.winning_info ? `★ ${result.winning_info.prize_title_en}` : 'No Match'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {result.winning_info ? `Draw #${result.winning_info.draw_number} (${result.winning_info.draw_date})` : 'Active Draw Pool'}
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          Net: {result.winning_info ? formatCurrency(result.winning_info.net_payable_amount, lang) : 'Tk. 0'}
                        </p>
                      </div>

                      {/* Previous Draw Status */}
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {lang === 'bn'
                              ? `পূর্ববর্তী ড্র (#${getPreviousDrawInfo()?.draw_number || ''})`
                              : `Preceding Draw (#${getPreviousDrawInfo()?.draw_number || ''})`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            previousDrawResult.result === 'WIN'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {previousDrawResult.result === 'WIN' ? `★ ${previousDrawResult.winning_info?.prize_title_en}` : 'No Win'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {getPreviousDrawInfo() ? `${getPreviousDrawInfo()?.scheduled_date} • ${getPreviousDrawInfo()?.location}` : 'Prior cycle'}
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          Net: {previousDrawResult.winning_info ? formatCurrency(previousDrawResult.winning_info.net_payable_amount, lang) : 'Tk. 0'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                      {lang === 'bn' ? 'পূর্ববর্তী ড্র তথ্য পাওয়া যায়নি।' : 'Previous draw data unavailable.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* LOSE Screen Card */
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-slate-900 dark:text-white px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
                      {result.full_bond}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {t.lose_title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.lose_sub}
                  </p>
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
                    💡 <span className="font-semibold">{t.lose_tip}</span>
                  </div>
                  
                  <div className="pt-3 flex flex-wrap items-center gap-3">
                    <button
                      id="recheck-another-btn"
                      onClick={() => { setResult(null); setBondNumber(''); setCompareWithPrevious(false); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006A4E] text-white hover:bg-[#00543D] transition"
                    >
                      {t.btn_check_another}
                    </button>
                    <button
                      id="export-single-result-lose-btn"
                      onClick={() => exportResultAsCsv(result)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                      title="Export Result as CSV file"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'bn' ? 'এক্সপোর্ট (CSV)' : 'Export Results (CSV)'}</span>
                    </button>
                    <button
                      id="export-single-result-lose-txt-btn"
                      onClick={() => exportResultAsTxt(result)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                      title="Export Result as TXT file"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{lang === 'bn' ? 'টেক্সট (TXT)' : 'Text (TXT)'}</span>
                    </button>

                    {/* Compare with Previous Draw toggle on Lose */}
                    <button
                      id="toggle-compare-previous-draw-lose-btn"
                      onClick={handleTogglePreviousCompare}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        compareWithPrevious
                          ? 'bg-emerald-800 text-white border-emerald-700 dark:bg-emerald-700'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                      title="Compare bond status in the preceding quarterly draw cycle"
                    >
                      <GitCompare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {compareWithPrevious
                          ? (lang === 'bn' ? 'আগের ড্র তুলনা বন্ধ' : 'Hide Comparison')
                          : (lang === 'bn' ? 'আগের ড্র-এর সাথে তুলনা' : 'Compare with Previous Draw')}
                      </span>
                    </button>

                    {/* Print Button on Lose */}
                    <button
                      id="print-single-result-lose-btn"
                      onClick={handlePrint}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                      title="Print verification summary"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
                    </button>

                    <button
                      id="save-lose-to-portfolio-btn"
                      onClick={handleSavePortfolio}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
                    >
                      {savedToPortSuccess ? (lang === 'bn' ? 'পোর্টফোলিওতে সংরক্ষিত!' : 'Saved to Portfolio!') : t.btn_add_to_portfolio}
                    </button>
                  </div>

                  {/* Previous Draw Comparison in Lose Card */}
                  {compareWithPrevious && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {lang === 'bn' ? 'পূর্ববর্তী ড্র ফলাফল তুলনা' : 'Preceding Draw Cycle Result'}
                        </span>
                        {getPreviousDrawInfo() && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Draw #{getPreviousDrawInfo()?.draw_number}
                          </span>
                        )}
                      </div>

                      {previousDrawLoading ? (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center gap-2 text-xs text-slate-500">
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          <span>{lang === 'bn' ? 'পূর্ববর্তী ড্র ডেটা লোড হচ্ছে...' : 'Fetching preceding draw status...'}</span>
                        </div>
                      ) : previousDrawResult ? (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                              {getPreviousDrawInfo() ? `Draw #${getPreviousDrawInfo()?.draw_number} (${getPreviousDrawInfo()?.scheduled_date})` : 'Preceding Draw'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {previousDrawResult.result === 'WIN' && previousDrawResult.winning_info
                                ? `Won ${previousDrawResult.winning_info.prize_title_en}`
                                : 'No winning match found in preceding draw cycle'}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            previousDrawResult.result === 'WIN'
                              ? 'bg-emerald-100 text-[#006A4E] dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {previousDrawResult.result === 'WIN' ? 'WINNER' : 'NO WIN'}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prize Structure Reference Card (Hidden in Print) */}
      <div className="no-print bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-emerald-600" />
          <span>{t.prize_tier_title}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">1st Prize (1x)</span>
            <p className="font-black text-slate-900 dark:text-white mt-0.5">{lang === 'bn' ? '৬,০০,০০০ ৳' : 'Tk. 6,00,000'}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">2nd Prize (1x)</span>
            <p className="font-black text-slate-900 dark:text-white mt-0.5">{lang === 'bn' ? '৩,২৫,০০০ ৳' : 'Tk. 3,25,000'}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">3rd Prize (2x)</span>
            <p className="font-black text-slate-900 dark:text-white mt-0.5">{lang === 'bn' ? '১,০০,০০০ ৳' : 'Tk. 1,00,000'}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">4th Prize (2x)</span>
            <p className="font-black text-slate-900 dark:text-white mt-0.5">{lang === 'bn' ? '৫০,০০০ ৳' : 'Tk. 50,000'}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">5th Prize (20x)</span>
            <p className="font-black text-slate-900 dark:text-white mt-0.5">{lang === 'bn' ? '১০,০০০ ৳' : 'Tk. 10,000'}</p>
          </div>
        </div>
      </div>

      {/* Printable Concise Search Summary (Printer-friendly Paper Copy) */}
      {result && (
        <div id="printable-single-summary" className="print-only page-break-avoid p-6 text-black bg-white border-2 border-black space-y-4">
          <div className="text-center border-b-2 border-black pb-3">
            <h1 className="text-xl font-bold uppercase tracking-wide">Government of the People's Republic of Bangladesh</h1>
            <h2 className="text-sm font-bold text-gray-800">Internal Resources Division • National Savings Directorate</h2>
            <p className="text-xs text-gray-600 mt-1 font-semibold">100 Taka Prize Bond Official Draw Verification Certificate</p>
          </div>

          <div className="flex justify-between items-center text-xs py-1 border-b border-gray-400">
            <span><strong>Date of Verification:</strong> {new Date().toLocaleString()}</span>
            <span><strong>Verification Ref:</strong> BD-PB-{result.bond_number}-{new Date().getFullYear()}</span>
          </div>

          <table className="w-full text-xs border-collapse my-2">
            <tbody>
              <tr>
                <td className="font-bold w-2/5 bg-gray-100 p-2 border border-gray-400">Bond Serial & Series:</td>
                <td className="font-mono font-bold text-sm p-2 border border-gray-400">{result.full_bond}</td>
              </tr>
              <tr>
                <td className="font-bold bg-gray-100 p-2 border border-gray-400">Verification Result:</td>
                <td className="font-bold p-2 border border-gray-400">
                  {result.result === 'WIN' ? '★ WINNER - MATCH FOUND IN PRIZE POOL' : 'NO WINNING MATCH FOUND'}
                </td>
              </tr>
              <tr>
                <td className="font-bold bg-gray-100 p-2 border border-gray-400">Draw Scope Checked:</td>
                <td className="p-2 border border-gray-400">
                  {result.winning_info
                    ? `Draw #${result.winning_info.draw_number} (${result.winning_info.draw_date}) - ${result.winning_info.location || 'Official Location'}`
                    : (selectedDraw === 'all' ? 'All Active Draws (8 Quarterly Cycles / Last 2 Years)' : `Draw #${selectedDraw}`)}
                </td>
              </tr>
              {result.winning_info && (
                <>
                  <tr>
                    <td className="font-bold bg-gray-100 p-2 border border-gray-400">Prize Tier & Category:</td>
                    <td className="font-bold p-2 border border-gray-400">
                      {result.winning_info.prize_title_en} ({result.winning_info.prize_title_bn})
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold bg-gray-100 p-2 border border-gray-400">Gross Prize Money:</td>
                    <td className="font-bold p-2 border border-gray-400">
                      Tk. {result.winning_info.gross_prize_amount.toLocaleString('en-US')}/-
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold bg-gray-100 p-2 border border-gray-400">Statutory 20% Source Tax:</td>
                    <td className="p-2 border border-gray-400 text-red-700">
                      -Tk. {result.winning_info.source_tax_20_pct.toLocaleString('en-US')}/-
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold bg-gray-100 p-2 border border-gray-400">Net Payable Amount (BDT):</td>
                    <td className="font-bold text-base p-2 border border-gray-400 text-emerald-800">
                      Tk. {result.winning_info.net_payable_amount.toLocaleString('en-US')}/-
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold bg-gray-100 p-2 border border-gray-400">Claim Expiration Deadline:</td>
                    <td className="font-bold p-2 border border-gray-400 text-amber-800">
                      {result.winning_info.claim_deadline} (2 Years from Draw Date)
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          <div className="text-[10px] text-gray-700 border-t border-gray-400 pt-2 space-y-1">
            <p><strong>Claim Guidance:</strong> Prize money up to Tk. 10,000 can be claimed at any Bangladesh Bank office or scheduled commercial bank branches upon submission of the original bond. Prizes above Tk. 10,000 must be submitted with Form PB-1 and TIN/NID verification.</p>
            <p>This verification summary document was digitally generated from the National Savings Prize Bond Registry.</p>
          </div>
        </div>
      )}

      {/* Prize Value & Tax Deduction Calculator Modal */}
      <PrizeValueCalculator
        lang={lang}
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        initialTier={calcInitialTier}
        initialSeries={calcInitialSeries}
        initialBondNumber={calcInitialBondNumber}
      />

      {/* Prize Categories & Ranks Quick Info Modal */}
      <PrizeCategoryInfoModal
        lang={lang}
        isOpen={showCategoryInfoModal}
        onClose={() => setShowCategoryInfoModal(false)}
        highlightTier={highlightCategoryTier}
      />

    </div>
  );
};
