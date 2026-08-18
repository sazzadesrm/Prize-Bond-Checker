import * as XLSX from 'xlsx';
import { BatchCheckResponse, PortfolioBond, WinnerItem } from '../types';

export function exportBatchToExcel(data: BatchCheckResponse): void {
  const rows = data.results.map((r, i) => ({
    'SL No': i + 1,
    'Series': r.series || '-',
    'Bond Number': r.number,
    'Full Bond ID': r.full_bond,
    'Result': r.result,
    'Winning Draw': r.winning_info ? `Draw #${r.winning_info.draw_number}` : '-',
    'Draw Date': r.winning_info?.draw_date || '-',
    'Prize Tier': r.winning_info?.prize_title_en || '-',
    'Gross Prize (Tk)': r.winning_info?.gross_prize_amount || 0,
    'Source Tax 20% (Tk)': r.winning_info?.source_tax_20_pct || 0,
    'Net Payout (Tk)': r.winning_info?.net_payable_amount || 0,
    'Claim Deadline': r.winning_info?.claim_deadline || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch Results');

  XLSX.writeFile(workbook, `BD_PrizeBond_BatchResults_${Date.now()}.xlsx`);
}

export function exportPortfolioToExcel(bonds: PortfolioBond[]): void {
  const rows = bonds.map((b, i) => ({
    'SL No': i + 1,
    'Series': b.bond_series || '-',
    'Bond Number': b.bond_number,
    'Face Value (Tk)': 100,
    'Purchase Date': b.purchase_date || '-',
    'Notes / Branch': b.notes || '-',
    'Status': b.is_winner ? 'WINNER' : 'Active / No Win',
    'Winning Draw': b.winning_info ? `Draw #${b.winning_info.draw_number}` : '-',
    'Prize Tier': b.winning_info?.prize_title_en || '-',
    'Prize Amount (Tk)': b.winning_info?.prize_amount || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'My Portfolio');

  XLSX.writeFile(workbook, `BD_PrizeBond_Portfolio_${Date.now()}.xlsx`);
}

export async function parseFileForBonds(file: File): Promise<{ series: string; number: string }[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'txt' || ext === 'csv') {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const parsed: { series: string; number: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.toLowerCase().includes('number') || trimmed.toLowerCase().includes('bond')) continue;
      
      const parts = trimmed.split(/[,;\t\s]+/);
      if (parts.length >= 2 && isNaN(Number(parts[0]))) {
        const series = parts[0].toUpperCase();
        const num = parts[1].replace(/[^0-9]/g, '').padStart(7, '0');
        if (num.length >= 5) parsed.push({ series, number: num });
      } else {
        const num = parts[0].replace(/[^0-9]/g, '').padStart(7, '0');
        if (num.length >= 5) parsed.push({ series: '', number: num });
      }
    }
    return parsed;
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json: any[] = XLSX.utils.sheet_to_json(sheet);

    const parsed: { series: string; number: string }[] = [];
    for (const row of json) {
      const series = (row.Series || row.series || row['বন্ড সিরিজ'] || '').toString().trim().toUpperCase();
      const rawNum = (row.Number || row.number || row['Bond Number'] || row['বন্ড নম্বর'] || Object.values(row)[0] || '').toString();
      const num = rawNum.replace(/[^0-9]/g, '').padStart(7, '0');
      if (num.length >= 5) {
        parsed.push({ series, number: num });
      }
    }
    return parsed;
  }
  return [];
}
