import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Activity, TrendingUp, Calendar, Zap, Search, Layers, Trophy } from 'lucide-react';
import { Language } from '../types';
import { formatBnNumber } from '../i18n/translations';

interface SearchActivityChartProps {
  lang: Language;
  darkMode?: boolean;
}

export const SearchActivityChart: React.FC<SearchActivityChartProps> = ({
  lang,
  darkMode = false
}) => {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  // Weekly search frequency data (Sunday through Saturday / BD business cycle)
  const weeklyData = [
    {
      day: lang === 'bn' ? 'শনিবার' : 'Sat',
      singleChecks: 8,
      batchChecks: 14,
      winsFound: 1,
      total: 22
    },
    {
      day: lang === 'bn' ? 'রবিবার' : 'Sun',
      singleChecks: 12,
      batchChecks: 25,
      winsFound: 0,
      total: 37
    },
    {
      day: lang === 'bn' ? 'সোমবার' : 'Mon',
      singleChecks: 15,
      batchChecks: 30,
      winsFound: 2,
      total: 45
    },
    {
      day: lang === 'bn' ? 'মঙ্গলবার' : 'Tue',
      singleChecks: 19,
      batchChecks: 22,
      winsFound: 1,
      total: 41
    },
    {
      day: lang === 'bn' ? 'বুধবার' : 'Wed',
      singleChecks: 24,
      batchChecks: 38,
      winsFound: 3,
      total: 62
    },
    {
      day: lang === 'bn' ? 'বৃহস্পতিবার' : 'Thu',
      singleChecks: 18,
      batchChecks: 28,
      winsFound: 1,
      total: 46
    },
    {
      day: lang === 'bn' ? 'শুক্রবার' : 'Fri',
      singleChecks: 10,
      batchChecks: 16,
      winsFound: 0,
      total: 26
    }
  ];

  const totalWeeklyChecks = weeklyData.reduce((acc, curr) => acc + curr.total, 0);
  const totalWeeklyWins = weeklyData.reduce((acc, curr) => acc + curr.winsFound, 0);
  const peakDay = [...weeklyData].sort((a, b) => b.total - a.total)[0];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl text-xs space-y-1 z-50">
          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
            <span>{lang === 'bn' ? 'একক যাচাই:' : 'Single Checks:'}</span>
            <span className="font-mono font-bold">{payload[0]?.value || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sky-600 dark:text-sky-400">
            <span>{lang === 'bn' ? 'ব্যাচ যাচাই:' : 'Batch Checks:'}</span>
            <span className="font-mono font-bold">{payload[1]?.value || 0}</span>
          </div>
          {payload[2] && (
            <div className="flex items-center justify-between gap-4 text-amber-600 dark:text-amber-400 font-bold">
              <span>{lang === 'bn' ? 'বিজয়ী বন্ড:' : 'Wins Found:'}</span>
              <span className="font-mono">{payload[2]?.value || 0}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="user-search-activity-section"
      className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-[#006A4E] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সাপ্তাহিক অনুসন্ধান ও যাচাই কার্যক্রম' : 'Weekly Search Activity & Frequency'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'বিগত ৭ দিনের বন্ড যাচাই ও ফলাফল অনুসন্ধানের রিয়েলটাইম গ্রাফ' : 'Realtime visualization of daily single & batch checking activity'}
            </p>
          </div>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-lg transition ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-800 text-[#006A4E] dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'বার চার্ট' : 'Bar Chart'}
          </button>
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`px-3 py-1.5 rounded-lg transition ${
              chartType === 'area'
                ? 'bg-white dark:bg-slate-800 text-[#006A4E] dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'এরিয়া চার্ট' : 'Area Trend'}
          </button>
        </div>
      </div>

      {/* Mini Stats Summary Pill Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold block">
              {lang === 'bn' ? 'সাপ্তাহিক মোট যাচাই' : 'Total Weekly Checks'}
            </span>
            <span className="text-xl font-black text-emerald-800 dark:text-emerald-300">
              {lang === 'bn' ? formatBnNumber(totalWeeklyChecks) : totalWeeklyChecks}
            </span>
          </div>
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-between">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold block">
              {lang === 'bn' ? 'সর্বোচ্চ ব্যস্ততম দিন' : 'Peak Search Day'}
            </span>
            <span className="text-lg font-black text-sky-800 dark:text-sky-300">
              {peakDay.day} ({lang === 'bn' ? formatBnNumber(peakDay.total) : peakDay.total})
            </span>
          </div>
          <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-bold block">
              {lang === 'bn' ? 'বিজয়ী ফলাফল ম্যাচ' : 'Winning Hits'}
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300">
              {lang === 'bn' ? `${formatBnNumber(totalWeeklyWins)}টি বিজয়ী` : `${totalWeeklyWins} Winners`}
            </span>
          </div>
          <Trophy className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }}
                axisLine={{ stroke: darkMode ? '#334155' : '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {value === 'singleChecks'
                      ? (lang === 'bn' ? 'একক যাচাই (Single)' : 'Single Checks')
                      : value === 'batchChecks'
                      ? (lang === 'bn' ? 'ব্যাচ যাচাই (Batch)' : 'Batch Checks')
                      : (lang === 'bn' ? 'বিজয়ী বন্ড (Wins)' : 'Wins Found')}
                  </span>
                )}
              />
              <Bar dataKey="singleChecks" fill="#006A4E" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="batchChecks" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="winsFound" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          ) : (
            <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSingle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006A4E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#006A4E" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBatch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }}
                axisLine={{ stroke: darkMode ? '#334155' : '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {value === 'singleChecks'
                      ? (lang === 'bn' ? 'একক যাচাই' : 'Single Checks')
                      : (lang === 'bn' ? 'ব্যাচ যাচাই' : 'Batch Checks')}
                  </span>
                )}
              />
              <Area type="monotone" dataKey="singleChecks" stroke="#006A4E" fillOpacity={1} fill="url(#colorSingle)" strokeWidth={2} />
              <Area type="monotone" dataKey="batchChecks" stroke="#0284c7" fillOpacity={1} fill="url(#colorBatch)" strokeWidth={2} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
