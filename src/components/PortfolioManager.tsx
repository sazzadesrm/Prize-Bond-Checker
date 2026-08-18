import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Wallet,
  Plus,
  Trash2,
  Trophy,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Layers,
  Calendar,
  Sparkles,
  Lock,
  Tag
} from 'lucide-react';
import { Language, User, PortfolioBond, PortfolioStats } from '../types';
import { TRANSLATIONS, formatBnNumber, formatCurrency } from '../i18n/translations';
import { api } from '../lib/api';
import { exportPortfolioToExcel } from '../lib/excelExport';
import { exportPortfolioPdf } from '../lib/pdfExport';
import { DeveloperCard } from './DeveloperCard';

interface PortfolioManagerProps {
  lang: Language;
  user: User | null;
  onOpenAuth: () => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  lang,
  user,
  onOpenAuth
}) => {
  const t = TRANSLATIONS[lang];

  const [bonds, setBonds] = useState<PortfolioBond[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({
    total_bonds: 0,
    total_investment: 0,
    total_winnings: 0,
    net_profit: 0,
    total_winners: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingAll, setCheckingAll] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState<boolean>(false);

  // Single Add form
  const [newSeries, setNewSeries] = useState<string>('KA');
  const [newNumber, setNewNumber] = useState<string>('');
  const [newPurchaseDate, setNewPurchaseDate] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  // Bulk add textarea
  const [bulkText, setBulkText] = useState<string>('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadPortfolio();
    }
  }, [user]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const res = await api.getPortfolio();
      setBonds(res.bonds);
      setStats(res.stats);
    } catch (err: any) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newNumber.replace(/[^0-9]/g, '').padStart(7, '0');
    if (cleanNum.length < 5) {
      setNotification({ type: 'error', message: 'Please enter a valid 7-digit number' });
      return;
    }

    try {
      await api.addPortfolioBond({
        bond_series: newSeries.toUpperCase(),
        bond_number: cleanNum,
        purchase_date: newPurchaseDate || undefined,
        notes: newNotes || undefined
      });
      setShowAddModal(false);
      setNewNumber('');
      setNewNotes('');
      setNotification({ type: 'success', message: 'Bond saved to your portfolio!' });
      loadPortfolio();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save bond' });
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) {
      setNotification({ type: 'error', message: 'Please provide at least one bond' });
      return;
    }

    const items: any[] = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length > 1) {
        items.push({
          series: parts[0].toUpperCase(),
          number: parts[1].replace(/[^0-9]/g, '').padStart(7, '0'),
          purchase_date: new Date().toISOString().split('T')[0]
        });
      } else {
        items.push({
          series: '',
          number: parts[0].replace(/[^0-9]/g, '').padStart(7, '0'),
          purchase_date: new Date().toISOString().split('T')[0]
        });
      }
    }

    try {
      await api.addPortfolioBond({ bonds: items });
      setShowBulkAddModal(false);
      setBulkText('');
      setNotification({ type: 'success', message: `${items.length} bonds imported successfully!` });
      loadPortfolio();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to bulk import bonds' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this bond from your portfolio?')) return;
    try {
      await api.deletePortfolioBond(id);
      loadPortfolio();
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Failed to delete bond' });
    }
  };

  const handleAutoCheckAll = async () => {
    setCheckingAll(true);
    try {
      const res = await api.checkAllPortfolio();
      loadPortfolio();
      if (res.summary?.total_winners > 0) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        setNotification({
          type: 'success',
          message: `Awesome! Found ${res.summary.total_winners} winning bonds with Tk. ${new Intl.NumberFormat('en-IN').format(res.summary.total_gross_prize)} in total prizes!`
        });
      } else {
        setNotification({
          type: 'success',
          message: 'Portfolio check complete! All bonds verified against the last 2 years of official draws.'
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Auto check failed' });
    } finally {
      setCheckingAll(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#006A4E] dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {t.portfolio_title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Sign in or create an account to securely save and auto-track all your Bangladesh Prize Bonds in one place.
            </p>
          </div>
          <button
            id="portfolio-auth-prompt-btn"
            onClick={onOpenAuth}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#006A4E] hover:bg-[#00543D] transition shadow-md cursor-pointer"
          >
            {t.signin} / {t.signup}
          </button>
        </div>

        {/* Developer Contact Card in Portfolio Tab */}
        <div className="max-w-2xl mx-auto">
          <DeveloperCard lang={lang} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Banner */}
      <div className="rounded-2xl bg-linear-to-r from-[#006A4E] to-[#044c38] p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-500/40 text-emerald-200 text-xs font-semibold mb-3">
            <Wallet className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ব্যক্তিগত বন্ড পোর্টফোলিও ট্র্যাকার' : 'Personal Investment Portfolio'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.portfolio_title}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            {t.portfolio_desc}
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium animate-in fade-in duration-150 ${
          notification.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
            : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Portfolio Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.port_total_bonds}</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {lang === 'bn' ? formatBnNumber(stats.total_bonds) : stats.total_bonds}
          </p>
          <span className="text-[11px] text-slate-400">100 Tk. denomination</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.port_investment}</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(stats.total_investment, lang)}
          </p>
          <span className="text-[11px] text-slate-400">Face Value</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 shadow-xs">
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">{t.port_winnings}</p>
          <p className="text-2xl sm:text-3xl font-black text-[#006A4E] dark:text-emerald-400 mt-1">
            {formatCurrency(stats.total_winnings, lang)}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            {stats.total_winners} winning bond(s)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-600 to-[#006A4E] text-white shadow-md">
          <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{t.port_net_return}</p>
          <p className="text-2xl sm:text-3xl font-black mt-1">
            {formatCurrency(stats.net_profit, lang)}
          </p>
          <span className="text-[11px] text-emerald-100 font-medium">Profit & Returns</span>
        </div>
      </div>

      {/* Main Bonds Management Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* Table Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="portfolio-add-single-btn"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#006A4E] text-white hover:bg-[#00543D] transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.btn_add_bond}</span>
            </button>

            <button
              id="portfolio-bulk-add-btn"
              onClick={() => setShowBulkAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>{t.btn_bulk_add}</span>
            </button>

            <button
              id="portfolio-autocheck-btn"
              onClick={handleAutoCheckAll}
              disabled={checkingAll || bonds.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${checkingAll ? 'animate-spin' : ''}`} />
              <span>{checkingAll ? 'Checking Against All Draws...' : t.btn_autocheck_all}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="portfolio-export-pdf-btn"
              onClick={() => exportPortfolioPdf(bonds, stats, user)}
              disabled={bonds.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-[#006A4E] dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-50 transition shadow-xs"
              title="Download official PDF portfolio statement"
            >
              <FileText className="w-3.5 h-3.5 text-[#006A4E] dark:text-emerald-400" />
              <span>PDF Export</span>
            </button>

            <button
              id="portfolio-export-excel-btn"
              onClick={() => exportPortfolioToExcel(bonds)}
              disabled={bonds.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-50 transition"
              title="Download Excel spreadsheet record"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Export</span>
            </button>
          </div>
        </div>

        {/* Bonds Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">{t.bond_series_th}</th>
                <th className="py-3 px-4">{t.bond_number_th}</th>
                <th className="py-3 px-4">{t.purchase_date_th}</th>
                <th className="py-3 px-4">{t.notes_th}</th>
                <th className="py-3 px-4">{t.status_th}</th>
                <th className="py-3 px-4 text-right">{t.actions_th}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {bonds.length > 0 ? (
                bonds.map((b, idx) => (
                  <tr
                    key={b.id}
                    className={`transition ${
                      b.is_winner ? 'bg-emerald-50/70 dark:bg-emerald-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {b.bond_series || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {b.bond_number}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {b.purchase_date || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {b.notes || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {b.is_winner && b.winning_info ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'bn' ? b.winning_info.prize_title_bn : b.winning_info.prize_title_en} (Draw #{b.winning_info.draw_number})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Active (Checked)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete bond"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm">{t.no_bonds_yet}</p>
                    <p className="text-xs text-slate-400 mt-1">{t.add_first_bond}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer Contact Card */}
      <DeveloperCard lang={lang} />

      {/* Add Single Bond Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.btn_add_bond}
            </h3>

            <form onSubmit={handleAddSingle} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {t.label_series}
                  </label>
                  <input
                    type="text"
                    value={newSeries}
                    onChange={(e) => setNewSeries(e.target.value.toUpperCase())}
                    placeholder="e.g. KA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {t.bond_number_th} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
                    placeholder="0123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {t.purchase_date_th}
                </label>
                <input
                  type="date"
                  value={newPurchaseDate}
                  onChange={(e) => setNewPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {t.notes_th}
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Sonali Bank Motijheel, Gift"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006A4E] text-white hover:bg-[#00543D]"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.btn_bulk_add}
            </h3>
            <p className="text-xs text-slate-500">
              Paste multiple bonds (e.g. KA 0123456), one per line:
            </p>

            <form onSubmit={handleBulkAdd} className="space-y-3">
              <textarea
                rows={6}
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"KA 0123456\nGA 0528419\n0834921"}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowBulkAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006A4E] text-white hover:bg-[#00543D]"
                >
                  Import All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
