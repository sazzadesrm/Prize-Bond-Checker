import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Eye,
  FileText,
  AlertCircle,
  Printer
} from 'lucide-react';
import { Language, DrawScheduleItem, WinnerItem } from '../types';
import { TRANSLATIONS, formatBnNumber, formatCurrency } from '../i18n/translations';
import { api } from '../lib/api';

interface DrawScheduleProps {
  lang: Language;
  draws: DrawScheduleItem[];
}

export const DrawSchedule: React.FC<DrawScheduleProps> = ({ lang, draws }) => {
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedDrawNo, setSelectedDrawNo] = useState<number | null>(118);
  const [drawDetails, setDrawDetails] = useState<{
    draw: DrawScheduleItem;
    winners: WinnerItem[];
    categorized: Record<string, WinnerItem[]>;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Countdown timer for next draw (July 31, 2025)
  const targetDate = new Date('2025-07-31T10:00:00+06:00').getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  useEffect(() => {
    if (selectedDrawNo) {
      loadDrawDetails(selectedDrawNo);
    }
  }, [selectedDrawNo]);

  const loadDrawDetails = async (drawNo: number) => {
    setLoadingDetails(true);
    try {
      const res = await api.getDrawResults(drawNo);
      setDrawDetails(res);
    } catch (err) {
      console.error('Failed to load draw details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const upcomingDraws = (draws || []).filter((d) => d && d.status === 'upcoming');
  const pastDraws = (draws || []).filter((d) => d && d.status === 'completed');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-linear-to-r from-[#006A4E] to-[#044c38] p-6 sm:p-8 text-white shadow-lg no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-500/40 text-emerald-200 text-xs font-semibold mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'জাতীয় সঞ্চয় অধিদপ্তর ক্যালেন্ডার' : 'National Savings Calendar'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.schedule_title}
            </h1>
            <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
              {t.schedule_desc}
            </p>
          </div>

          <div className="shrink-0">
            <button
              id="print-schedule-btn"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-[#006A4E] hover:bg-emerald-50 active:scale-95 transition shadow-md cursor-pointer"
              title="Print official schedule table"
            >
              <Printer className="w-4 h-4 text-[#006A4E]" />
              <span>{lang === 'bn' ? 'ক্যালেন্ডার প্রিন্ট করুন' : 'Print Schedule Table'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Schedule Clean Document (Active exclusively on window.print) */}
      <div className="print-only text-black bg-white p-4 font-sans">
        <div className="text-center border-b-2 border-emerald-800 pb-3 mb-4">
          <p className="text-xs uppercase font-extrabold tracking-widest text-slate-600">
            Government of the People's Republic of Bangladesh
          </p>
          <h1 className="text-lg font-black text-emerald-900 uppercase mt-0.5">
            Internal Resources Division • Ministry of Finance
          </h1>
          <h2 className="text-base font-bold text-slate-800 mt-0.5">
            National Savings Directorate — 100 Tk. Bangladesh Prize Bond Official Draw Schedule & Gazette
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official Publication Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} • Verified with Bangladesh Bank
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            1. Official Draw Schedule & Status (Quarterly Cycle)
          </h3>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Draw #</th>
                <th className="p-2 border-r border-slate-300">Scheduled Date</th>
                <th className="p-2 border-r border-slate-300">Location / City</th>
                <th className="p-2 border-r border-slate-300">Status</th>
                <th className="p-2 border-r border-slate-300">1st Prize (Tk. 6 Lac)</th>
                <th className="p-2">Claim Validity (2 Years)</th>
              </tr>
            </thead>
            <tbody>
              {(draws || []).map((d) => (
                <tr key={d.draw_number} className="border-b border-slate-200">
                  <td className="p-2 font-bold font-mono border-r border-slate-200">
                    Draw #{d.draw_number}
                  </td>
                  <td className="p-2 font-mono border-r border-slate-200">
                    {d.scheduled_date}
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    {d.location}
                  </td>
                  <td className="p-2 font-bold border-r border-slate-200">
                    {d.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED'}
                  </td>
                  <td className="p-2 font-mono border-r border-slate-200">
                    {d.draw_number === 118 ? '0528419' : (d.draw_number === 117 ? '0834921' : (d.status === 'upcoming' ? 'Scheduled' : 'Published'))}
                  </td>
                  <td className="p-2 text-[11px]">
                    {d.status === 'upcoming' ? '2 yrs from draw' : `Valid until ${new Date(new Date(d.scheduled_date).setFullYear(new Date(d.scheduled_date).getFullYear() + 2)).toISOString().split('T')[0]}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            2. Statutory Prize Breakdown Structure (Per 100 Tk. Bond Series)
          </h3>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300">
                <th className="p-1.5 border-r border-slate-300">Prize Tier</th>
                <th className="p-1.5 border-r border-slate-300">Winners Per Series</th>
                <th className="p-1.5 border-r border-slate-300">Gross Amount (BDT)</th>
                <th className="p-1.5 border-r border-slate-300">20% Source Tax</th>
                <th className="p-1.5">Net Payable Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-1.5 font-bold border-r border-slate-200">1st Prize</td>
                <td className="p-1.5 border-r border-slate-200">1 Winner</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 6,00,000/-</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 1,20,000/-</td>
                <td className="p-1.5 font-mono font-bold">Tk. 4,80,000/-</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1.5 font-bold border-r border-slate-200">2nd Prize</td>
                <td className="p-1.5 border-r border-slate-200">1 Winner</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 3,25,000/-</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 65,000/-</td>
                <td className="p-1.5 font-mono font-bold">Tk. 2,60,000/-</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1.5 font-bold border-r border-slate-200">3rd Prize</td>
                <td className="p-1.5 border-r border-slate-200">2 Winners</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 1,00,000/- each</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 20,000/-</td>
                <td className="p-1.5 font-mono font-bold">Tk. 80,000/- each</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1.5 font-bold border-r border-slate-200">4th Prize</td>
                <td className="p-1.5 border-r border-slate-200">2 Winners</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 50,000/- each</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 10,000/-</td>
                <td className="p-1.5 font-mono font-bold">Tk. 40,000/- each</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-1.5 font-bold border-r border-slate-200">5th Prize</td>
                <td className="p-1.5 border-r border-slate-200">20 Winners</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 10,000/- each</td>
                <td className="p-1.5 font-mono border-r border-slate-200">Tk. 2,000/-</td>
                <td className="p-1.5 font-mono font-bold">Tk. 8,000/- each</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-600 space-y-1">
          <p><strong>Note & Legal Guidelines:</strong> Prize money claims must be submitted to Bangladesh Bank, National Savings Bureau, or authorized scheduled commercial banks within 2 years from the draw date using prescribed Form 'Ka' along with original bond certificates and NID photocopy.</p>
          <p className="font-mono text-[9px] text-slate-400">Official Computer-Generated Document • National Savings Directorate, Dhaka • {new Date().toISOString()}</p>
        </div>
      </div>

      {/* Countdown Timer Widget (Screen Only) */}
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden no-print">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{t.next_draw_countdown}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {lang === 'bn' ? '১১৯তম প্রাইজবন্ড ড্র - ৩১ জুলাই ২০২৫' : '119th Prize Bond Draw - July 31, 2025'}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>Divisional Commissioner Office, Barishal</span>
            </p>
          </div>

          {/* Countdown Digit Blocks */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 text-center">
            <div className="p-3 sm:p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 min-w-[65px] sm:min-w-[75px]">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {lang === 'bn' ? formatBnNumber(timeLeft.days) : timeLeft.days}
              </span>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{t.days}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 min-w-[65px] sm:min-w-[75px]">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {lang === 'bn' ? formatBnNumber(timeLeft.hours) : timeLeft.hours}
              </span>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{t.hours}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 min-w-[65px] sm:min-w-[75px]">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {lang === 'bn' ? formatBnNumber(timeLeft.minutes) : timeLeft.minutes}
              </span>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{t.minutes}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 min-w-[65px] sm:min-w-[75px]">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {lang === 'bn' ? formatBnNumber(timeLeft.seconds) : timeLeft.seconds}
              </span>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{t.seconds}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Schedule vs Historical Gazettes (Screen Only) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6 no-print">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-2">
            <button
              id="tab-upcoming-draws-btn"
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'upcoming'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006A4E] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t.tab_upcoming} ({upcomingDraws.length})
            </button>
            <button
              id="tab-past-history-btn"
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === 'past'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006A4E] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t.tab_past_history} ({pastDraws.length})
            </button>
          </div>

          <button
            id="print-schedule-inline-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Print Schedule"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'bn' ? 'প্রিন্ট' : 'Print'}</span>
          </button>
        </div>

        {activeTab === 'upcoming' ? (
          /* Upcoming Schedule List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingDraws.map((d) => (
              <div
                key={d.draw_number}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 space-y-3 hover:border-emerald-500 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {lang === 'bn' ? `${formatBnNumber(d.draw_number)}তম ড্র` : `Draw #${d.draw_number}`}
                  </span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {d.scheduled_date}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ত্রৈমাসিক ড্র অনুষ্ঠান' : 'Quarterly Official Draw Event'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {d.location}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">26 Winning Prizes</span>
                  <span className="text-slate-400">10:00 AM BD Time</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Historical Gazettes & Winner Inspector */
          <div className="space-y-6">
            
            {/* Draw selector pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {pastDraws.map((d) => (
                <button
                  key={d.draw_number}
                  id={`draw-pill-${d.draw_number}`}
                  onClick={() => setSelectedDrawNo(d.draw_number)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedDrawNo === d.draw_number
                      ? 'bg-[#006A4E] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'bn' ? `${formatBnNumber(d.draw_number)}তম ড্র` : `Draw #${d.draw_number}`} ({d.scheduled_date})
                </button>
              ))}
            </div>

            {/* Selected Draw Full Winners View */}
            {loadingDetails ? (
              <div className="py-12 text-center text-slate-500">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">{t.loading}</p>
              </div>
            ) : drawDetails ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Draw Info Bar */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {lang === 'bn' ? `${formatBnNumber(drawDetails.draw.draw_number)}তম প্রাইজবন্ড ড্র এর সম্পূর্ণ ফলাফল` : `Draw #${drawDetails.draw.draw_number} Official Winning Results`}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {drawDetails.draw.scheduled_date} • {drawDetails.draw.location}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full">
                    {drawDetails.winners.length} Winning Numbers Registered
                  </div>
                </div>

                {/* 1st to 5th Prize Cards */}
                <div className="space-y-4">
                  
                  {/* 1st Prize */}
                  {drawDetails.categorized?.first_prize?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-600" />
                          1st Prize (1 Winner): Tk. 6,00,000/-
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {drawDetails.categorized.first_prize.map((w, idx) => (
                          <span key={idx} className="font-mono text-xl font-black px-4 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs">
                            {w.bond_number}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2nd Prize */}
                  {drawDetails.categorized?.second_prize?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                          2nd Prize (1 Winner): Tk. 3,25,000/-
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {drawDetails.categorized.second_prize.map((w, idx) => (
                          <span key={idx} className="font-mono text-lg font-bold px-3.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600">
                            {w.bond_number}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3rd & 4th Prize */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {drawDetails.categorized?.third_prize?.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 block mb-2">
                          3rd Prize (2 Winners): Tk. 1,00,000 each
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {drawDetails.categorized.third_prize.map((w, idx) => (
                            <span key={idx} className="font-mono text-base font-bold px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600">
                              {w.bond_number}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {drawDetails.categorized?.fourth_prize?.length > 0 && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 block mb-2">
                          4th Prize (2 Winners): Tk. 50,000 each
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {drawDetails.categorized.fourth_prize.map((w, idx) => (
                            <span key={idx} className="font-mono text-base font-bold px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600">
                              {w.bond_number}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5th Prize (20 Winners) */}
                  {drawDetails.categorized?.fifth_prize?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 block mb-2.5">
                        5th Prize (20 Winners): Tk. 10,000 each
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                        {drawDetails.categorized.fifth_prize.map((w, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                            {w.bond_number}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : null}

          </div>
        )}

      </div>
    </div>
  );
};

