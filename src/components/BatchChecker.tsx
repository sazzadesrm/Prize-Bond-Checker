import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Layers,
  UploadCloud,
  FileText,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Trophy,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Language, BatchCheckResponse, DrawScheduleItem } from '../types';
import { TRANSLATIONS, formatBnNumber, formatCurrency } from '../i18n/translations';
import { api } from '../lib/api';
import { exportBatchReportPdf } from '../lib/pdfExport';
import { exportBatchToExcel, parseFileForBonds } from '../lib/excelExport';
import { PrefixDistributionChart } from './PrefixDistributionChart';

interface BatchCheckerProps {
  lang: Language;
  draws: DrawScheduleItem[];
}

export const BatchChecker: React.FC<BatchCheckerProps> = ({ lang, draws }) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'manual' | 'upload'>('manual');
  const [rawText, setRawText] = useState<string>(
    "KA 0528419\nGA 0834921\nKHA 0123456\nCHA 0014829\nTA 0912435\nPA 0789123\nBA 0451239\nMA 0341982"
  );
  const [selectedDraw, setSelectedDraw] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [batchResponse, setBatchResponse] = useState<BatchCheckResponse | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'winners' | 'loses'>('all');

  // Range generator state
  const [rangeSeries, setRangeSeries] = useState<string>('KA');
  const [rangeStart, setRangeStart] = useState<string>('0120000');
  const [rangeCount, setRangeCount] = useState<number>(20);
  const [showRangeModal, setShowRangeModal] = useState<boolean>(false);

  const completedDraws = (draws || []).filter((d) => d && d.status === 'completed');

  const handleGenerateRange = () => {
    const startInt = parseInt(rangeStart, 10);
    if (isNaN(startInt)) {
      alert('Please enter a valid numeric start number');
      return;
    }

    const count = Math.min(Math.max(1, rangeCount), 100);
    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      const numStr = (startInt + i).toString().padStart(7, '0');
      lines.push(rangeSeries ? `${rangeSeries} ${numStr}` : numStr);
    }

    setRawText((prev) => (prev ? `${prev.trim()}\n${lines.join('\n')}` : lines.join('\n')));
    setShowRangeModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const parsed = await parseFileForBonds(file);
      if (parsed.length === 0) {
        setError(lang === 'bn' ? 'ফাইল থেকে কোনো বৈধ বন্ড নম্বর পাওয়া যায়নি।' : 'No valid bond numbers found in file.');
        return;
      }

      const lines = parsed.map((p) => (p.series ? `${p.series} ${p.number}` : p.number));
      setRawText(lines.join('\n'));
      setInputMode('manual');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to read file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBatchCheck = async () => {
    setError(null);
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি বন্ড নম্বর লিখুন।' : 'Please enter at least one bond number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.checkBatchBonds({
        bonds: lines,
        draw_number: selectedDraw === 'all' ? null : Number(selectedDraw),
        check_all_active: selectedDraw === 'all'
      });

      setBatchResponse(res);

      if (res.summary.total_winners > 0) {
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Batch verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = 'Series,Number\nKA,0528419\nGA,0834921\nKHA,0123456\nCHA,0014829\nTA,0789123\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_prizebonds.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = (batchResponse?.results || []).filter((item) => {
    if (filterType === 'winners') return item?.result === 'WIN';
    if (filterType === 'loses') return item?.result === 'LOSE';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-linear-to-r from-[#006A4E] to-[#044c38] p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-500/40 text-emerald-200 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'একাধিক বন্ড একসাথে যাচাই' : 'Bulk Verification Engine'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.batch_title}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            {t.batch_desc}
          </p>
        </div>
      </div>

      {/* Input Options Card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-2">
            <button
              id="batch-tab-manual-btn"
              onClick={() => setInputMode('manual')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                inputMode === 'manual'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006A4E] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t.tab_manual_input}
            </button>
            <button
              id="batch-tab-upload-btn"
              onClick={() => setInputMode('upload')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                inputMode === 'upload'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006A4E] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {t.tab_file_upload}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="open-range-modal-btn"
              onClick={() => setShowRangeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.btn_generate_range}</span>
            </button>
            <button
              id="clear-batch-input-btn"
              onClick={() => setRawText('')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              title="Clear text"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Manual Textarea View */}
        {inputMode === 'manual' ? (
          <div className="space-y-3">
            <label htmlFor="batch-textarea" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t.label_batch_textarea}
            </label>
            <textarea
              id="batch-textarea"
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={t.placeholder_batch_textarea}
              className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
              <span>
                {lang === 'bn'
                  ? `মোট প্রদেয় বন্ড লাইন: ${formatBnNumber(rawText.split(/\r?\n/).filter(l => l.trim()).length)}`
                  : `Total bond lines: ${rawText.split(/\r?\n/).filter(l => l.trim()).length}`}
              </span>
              <span>{lang === 'bn' ? 'সর্বোচ্চ ১০০টি বন্ড সমর্থিত' : 'Up to 100 bonds supported'}</span>
            </div>
          </div>
        ) : (
          /* File Upload Drop Area */
          <div className="space-y-4">
            <div
              id="batch-file-dropzone"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 rounded-2xl p-8 sm:p-12 text-center bg-slate-50 dark:bg-slate-900/50 cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#006A4E] dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {t.drop_file_here}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supported formats: .CSV, .TXT, .XLSX (Excel)
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                id="download-sample-csv-btn"
                onClick={downloadSampleCsv}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{t.sample_file_download}</span>
              </button>
            </div>
          </div>
        )}

        {/* Draw Selector for Batch */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-8">
            <label htmlFor="batch-draw-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.label_draw}
            </label>
            <select
              id="batch-draw-select"
              value={selectedDraw}
              onChange={(e) => setSelectedDraw(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">🌟 {t.opt_all_active_draws}</option>
              {completedDraws.map((d) => (
                <option key={d.draw_number} value={d.draw_number.toString()}>
                  {lang === 'bn'
                    ? `${formatBnNumber(d.draw_number)}তম ড্র (${d.scheduled_date}) - ${d.location}`
                    : `Draw #${d.draw_number} (${d.scheduled_date}) - ${d.location}`}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 pt-4 sm:pt-6">
            <button
              id="submit-batch-check-btn"
              onClick={handleBatchCheck}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm text-white bg-[#006A4E] hover:bg-[#00543D] active:scale-[0.99] transition shadow-md disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.checking}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.btn_check_batch}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Batch Results & Summary Dashboard */}
      {batchResponse && (
        <div id="batch-results-section" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Top Summary Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.stat_total_checked}</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {lang === 'bn' ? formatBnNumber(batchResponse.summary.total_checked) : batchResponse.summary.total_checked}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">100 Tk. denomination</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">{t.stat_winners}</p>
              <p className="text-2xl sm:text-3xl font-black text-[#006A4E] dark:text-emerald-400 mt-1">
                {lang === 'bn' ? formatBnNumber(batchResponse.summary.total_winners) : batchResponse.summary.total_winners}
              </p>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                Win Rate: {batchResponse.summary.win_percentage}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.lbl_gross_prize}</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(batchResponse.summary.total_gross_prize, lang)}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Before 20% source tax</span>
            </div>

            <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-600 to-[#006A4E] text-white shadow-md">
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{t.lbl_net_amount}</p>
              <p className="text-xl sm:text-2xl font-black mt-1">
                {formatCurrency(batchResponse.summary.total_net_prize, lang)}
              </p>
              <span className="text-[11px] text-emerald-100 font-medium">After tax disbursement</span>
            </div>
          </div>

          {/* D3 Winning Prefix Distribution Chart */}
          <PrefixDistributionChart results={batchResponse.results} lang={lang} />

          {/* Results Table Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            
            {/* Table Action Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  id="filter-all-btn"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterType === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t.filter_all} ({batchResponse.results.length})
                </button>
                <button
                  id="filter-winners-btn"
                  onClick={() => setFilterType('winners')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterType === 'winners'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  🏆 {t.filter_winners_only} ({batchResponse.summary.total_winners})
                </button>
                <button
                  id="filter-loses-btn"
                  onClick={() => setFilterType('loses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterType === 'loses'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.filter_loses_only} ({batchResponse.summary.total_loses})
                </button>
              </div>

              {/* Export Actions */}
              <div className="flex items-center gap-2">
                <button
                  id="batch-export-pdf-btn"
                  onClick={() => exportBatchReportPdf(batchResponse)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#006A4E] text-white hover:bg-[#00543D] transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.btn_export_pdf}</span>
                </button>
                <button
                  id="batch-export-excel-btn"
                  onClick={() => exportBatchToExcel(batchResponse)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.btn_export_excel}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">{t.bond_series_th}</th>
                    <th className="py-3 px-4">{t.bond_number_th}</th>
                    <th className="py-3 px-4">{t.status_th}</th>
                    <th className="py-3 px-4">{t.lbl_draw_info}</th>
                    <th className="py-3 px-4">Prize Tier</th>
                    <th className="py-3 px-4 text-right">Net Prize (Tk)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredResults && filteredResults.length > 0 ? (
                    filteredResults.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`transition ${
                          item.result === 'WIN'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                          {item.series || '-'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {item.number}
                        </td>
                        <td className="py-3 px-4">
                          {item.result === 'WIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                              <Trophy className="w-3 h-3" />
                              WINNER
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                              No Win
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {item.winning_info ? `Draw #${item.winning_info.draw_number} (${item.winning_info.draw_date})` : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {item.winning_info ? (lang === 'bn' ? item.winning_info.prize_title_bn : item.winning_info.prize_title_en) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#006A4E] dark:text-emerald-400">
                          {item.winning_info ? formatCurrency(item.winning_info.net_payable_amount, lang) : '৳ 0'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No bonds match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Range Generator Modal */}
      {showRangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.btn_generate_range}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate sequential bond numbers automatically (e.g. KA 0120000 to 0120020).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {t.range_series}
                </label>
                <input
                  type="text"
                  value={rangeSeries}
                  onChange={(e) => setRangeSeries(e.target.value.toUpperCase())}
                  placeholder="e.g. KA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {t.range_start} (7 Digits)
                </label>
                <input
                  type="text"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                  placeholder="0120000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {t.range_count} (Max 100)
                </label>
                <input
                  type="number"
                  value={rangeCount}
                  min={1}
                  max={100}
                  onChange={(e) => setRangeCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowRangeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleGenerateRange}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006A4E] text-white hover:bg-[#00543D]"
              >
                {t.btn_add_range}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
