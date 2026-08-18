import { jsPDF } from 'jspdf';
import { SingleCheckResult, BatchCheckResponse, PortfolioBond, PortfolioStats, User } from '../types';

export function exportPortfolioPdf(
  bonds: PortfolioBond[],
  stats: PortfolioStats,
  user?: User | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const totalPagesExp = '{total_pages_count_string}';
  let pageNum = 1;

  const drawHeader = () => {
    // Header Bar
    doc.setFillColor(0, 106, 78);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFillColor(244, 42, 65);
    doc.rect(0, 32, 210, 3, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BANGLADESH 100 TK. PRIZE BOND PORTFOLIO RECORD', 105, 14, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Internal Directorate of National Savings - Asset Valuation & Holding Statement', 105, 22, { align: 'center' });
    doc.text(`Official Export Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString()}`, 105, 28, { align: 'center' });
  };

  const drawFooter = (currentPg: number) => {
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 282, 195, 282);
    doc.text('Official Document | BD Prize Bond Platform | Validated with Bangladesh Bank Draw Gazette', 15, 287);
    doc.text(`Page ${currentPg}`, 195, 287, { align: 'right' });
  };

  drawHeader();

  // Investor Profile Details Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 40, 180, 22, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ACCOUNT HOLDER DETAILS', 20, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Investor Name: ${user?.name || 'Authorized Bondholder'}`, 20, 52);
  doc.text(`Email: ${user?.email || 'N/A'}`, 20, 57);

  doc.text(`Account Tier: ${user?.role === 'admin' ? 'Super Administrator' : (user?.is_premium ? 'Premium Investor' : 'Standard Member')}`, 110, 52);
  doc.text(`Registered Mobile: ${user?.phone || 'N/A'}`, 110, 57);

  // Financial Stats Summary Card (4 metrics)
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, 66, 180, 24, 2, 2, 'FD');

  doc.setTextColor(22, 101, 52);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PORTFOLIO FINANCIAL VALUATION & SUMMARY', 20, 72);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Bonds Tracked: ${stats.total_bonds} pcs`, 20, 78);
  doc.text(`Face Value Investment: Tk. ${new Intl.NumberFormat('en-IN').format(stats.total_investment)}/-`, 20, 84);

  doc.text(`Total Prize Winnings: Tk. ${new Intl.NumberFormat('en-IN').format(stats.total_winnings)}/-`, 85, 78);
  doc.text(`Winning Bonds: ${stats.total_winners} winning units`, 85, 84);

  const isProfitable = stats.net_profit >= 0;
  doc.setTextColor(isProfitable ? 22 : 220, isProfitable ? 101 : 38, isProfitable ? 52 : 38);
  doc.setFont('helvetica', 'bold');
  doc.text(`Net Return / Profit:`, 145, 78);
  doc.text(`${isProfitable ? '+' : ''}Tk. ${new Intl.NumberFormat('en-IN').format(stats.net_profit)}/-`, 145, 84);

  // Bonds Table
  let y = 96;
  doc.setFillColor(0, 106, 78);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('#', 18, y + 5.5);
  doc.text('Series', 28, y + 5.5);
  doc.text('Bond Number', 45, y + 5.5);
  doc.text('Purchase Date', 75, y + 5.5);
  doc.text('Notes / Branch', 105, y + 5.5);
  doc.text('Draw Status', 145, y + 5.5);
  doc.text('Prize (Tk)', 175, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  if (bonds.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.rect(15, y, 180, 10, 'F');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text('No prize bonds currently tracked in this portfolio.', 105, y + 6.5, { align: 'center' });
    y += 10;
  } else {
    bonds.forEach((b, idx) => {
      if (y > 270) {
        drawFooter(pageNum);
        doc.addPage();
        pageNum++;
        drawHeader();
        y = 42;

        // Redraw Table Header on new page
        doc.setFillColor(0, 106, 78);
        doc.rect(15, y, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('#', 18, y + 5.5);
        doc.text('Series', 28, y + 5.5);
        doc.text('Bond Number', 45, y + 5.5);
        doc.text('Purchase Date', 75, y + 5.5);
        doc.text('Notes / Branch', 105, y + 5.5);
        doc.text('Draw Status', 145, y + 5.5);
        doc.text('Prize (Tk)', 175, y + 5.5);

        y += 8;
        doc.setFont('helvetica', 'normal');
      }

      const isEven = idx % 2 === 0;
      if (b.is_winner) {
        doc.setFillColor(236, 253, 245); // light green
        doc.rect(15, y, 180, 7.5, 'F');
      } else if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 7.5, 'F');
      }

      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text((idx + 1).toString(), 18, y + 5);
      doc.text(b.bond_series || '-', 28, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(b.bond_number, 45, y + 5);
      doc.setFont('helvetica', 'normal');

      doc.text(b.purchase_date || '-', 75, y + 5);
      
      const noteStr = b.notes ? (b.notes.length > 20 ? b.notes.substring(0, 18) + '..' : b.notes) : '-';
      doc.text(noteStr, 105, y + 5);

      if (b.is_winner && b.winning_info) {
        doc.setTextColor(22, 101, 52);
        doc.setFont('helvetica', 'bold');
        doc.text(`WIN: Draw #${b.winning_info.draw_number}`, 145, y + 5);
        doc.text(`Tk. ${new Intl.NumberFormat('en-IN').format(b.winning_info.prize_amount)}`, 175, y + 5);
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text('Active / No Win', 145, y + 5);
        doc.text('0', 175, y + 5);
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 7.5, 195, y + 7.5);

      y += 7.5;
    });
  }

  // Claim instructions & disclaimer block
  if (y > 240) {
    drawFooter(pageNum);
    doc.addPage();
    pageNum++;
    drawHeader();
    y = 42;
  }

  y += 6;
  doc.setFillColor(254, 252, 232); // Amber light box
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(15, y, 180, 24, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(133, 77, 14);
  doc.text('BANGLADESH BANK OFFICIAL PRIZE CLAIM REGULATIONS', 20, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.text('• Winning prize bonds must be submitted with Claim Form PB-1 within 2 calendar years from the draw date.', 20, y + 11);
  doc.text('• 20% Tax Deduction at Source is applied on all prize categories in accordance with Income Tax Ordinance.', 20, y + 16);
  doc.text('• For inquiries, visit Bangladesh Bank Motijheel Head Office or any National Savings Bureau Office.', 20, y + 21);

  drawFooter(pageNum);

  const cleanUserName = (user?.name || 'portfolio').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`BD_PrizeBond_Portfolio_${cleanUserName}_${Date.now()}.pdf`);
}

export function exportSingleWinSlipPdf(result: SingleCheckResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const win = result.winning_info;
  if (!win) return;

  // Header Box - Bangladesh Green
  doc.setFillColor(0, 106, 78);
  doc.rect(0, 0, 210, 38, 'F');

  // Red accent line
  doc.setFillColor(244, 42, 65);
  doc.rect(0, 38, 210, 4, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('BANGLADESH PRIZE BOND WIN CERTIFICATE', 105, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Result Verification Slip - 100 Taka Prize Bond', 105, 28, { align: 'center' });

  // Body content
  doc.setTextColor(33, 37, 41);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('WINNING DETAILS', 20, 56);

  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const rows = [
    ['Bond Number & Series:', result.full_bond],
    ['Winning Draw Number:', `Draw #${win.draw_number}`],
    ['Draw Date:', win.draw_date],
    ['Draw Location:', win.location || 'Dhaka'],
    ['Prize Tier:', `${win.prize_title_en} (${win.prize_title_bn})`],
    ['Gross Prize Amount:', `Tk. ${new Intl.NumberFormat('en-IN').format(win.gross_prize_amount)}/-`],
    ['Govt. Source Tax (20%):', `Tk. ${new Intl.NumberFormat('en-IN').format(win.source_tax_20_pct)}/-`],
    ['Net Payout Amount:', `Tk. ${new Intl.NumberFormat('en-IN').format(win.net_payable_amount)}/-`],
    ['Claim Deadline (2 Years):', `${win.claim_deadline} (Valid 2 years from draw date)`],
    ['Verification Timestamp:', new Date().toLocaleString()]
  ];

  let y = 70;
  for (const [label, val] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(val, 90, y);
    y += 9;
  }

  // Claim instructions box
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(20, 170, 170, 60, 3, 3, 'FD');
  doc.setDrawColor(0, 106, 78);
  doc.rect(20, 170, 4, 60, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 106, 78);
  doc.text('HOW TO CLAIM YOUR PRIZE MONEY', 30, 180);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text('1. Submit original prize bond and Claim Form-PB-1 at Bangladesh Bank / National Savings Office.', 30, 190);
  doc.text('2. Attach attested NID photocopy, 2 passport size photos, and Bank Cheque Leaf.', 30, 198);
  doc.text('3. 20% source tax is deducted at source under Bangladesh Income Tax rules.', 30, 206);
  doc.text('4. Funds will be directly disbursed via BEFTN into your bank account within 2-7 working days.', 30, 214);
  doc.text('5. Note: Prizes must be claimed within 2 years from draw date to prevent forfeiture.', 30, 222);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text('Generated by BD Prize Bond Checker | Data synchronized with Bangladesh Bank Draw Gazette', 105, 280, { align: 'center' });

  doc.save(`PrizeBond_Win_${result.full_bond.replace(/\s+/g, '_')}.pdf`);
}

export function exportBatchReportPdf(data: BatchCheckResponse): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFillColor(0, 106, 78);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setFillColor(244, 42, 65);
  doc.rect(0, 34, 210, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BD PRIZE BOND - BATCH CHECK REPORT', 105, 16, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 26, { align: 'center' });

  // Summary box
  doc.setFillColor(248, 249, 250);
  doc.rect(15, 44, 180, 28, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, 44, 180, 28, 'S');

  doc.setTextColor(33, 37, 41);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Bonds Checked: ${data.summary.total_checked}`, 20, 53);
  doc.text(`Winning Bonds Found: ${data.summary.total_winners}`, 80, 53);
  doc.text(`Win Ratio: ${data.summary.win_percentage}%`, 145, 53);

  doc.text(`Gross Prize: Tk. ${new Intl.NumberFormat('en-IN').format(data.summary.total_gross_prize)}/-`, 20, 64);
  doc.text(`Govt Tax (20%): Tk. ${new Intl.NumberFormat('en-IN').format(data.summary.total_tax_20_pct)}/-`, 80, 64);
  doc.text(`Net Payout: Tk. ${new Intl.NumberFormat('en-IN').format(data.summary.total_net_prize)}/-`, 145, 64);

  // Table header
  let y = 82;
  doc.setFillColor(0, 106, 78);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('#', 18, y + 5.5);
  doc.text('Bond Number', 28, y + 5.5);
  doc.text('Status', 70, y + 5.5);
  doc.text('Draw Info', 95, y + 5.5);
  doc.text('Prize Tier', 130, y + 5.5);
  doc.text('Net Prize (Tk)', 165, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(33, 37, 41);

  data.results.forEach((item, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (item.result === 'WIN') {
      doc.setFillColor(235, 247, 238);
      doc.rect(15, y, 180, 7, 'F');
    }

    doc.setFontSize(8.5);
    doc.text((index + 1).toString(), 18, y + 5);
    doc.text(item.full_bond, 28, y + 5);
    
    if (item.result === 'WIN') {
      doc.setTextColor(0, 130, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('WINNER', 70, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 37, 41);
      doc.text(`Draw #${item.winning_info?.draw_number}`, 95, y + 5);
      doc.text(item.winning_info?.prize_title_en || 'Prize', 130, y + 5);
      doc.text(`Tk. ${new Intl.NumberFormat('en-IN').format(item.winning_info?.net_payable_amount || 0)}`, 165, y + 5);
    } else {
      doc.setTextColor(120, 120, 120);
      doc.text('No Win', 70, y + 5);
      doc.text('-', 95, y + 5);
      doc.text('-', 130, y + 5);
      doc.text('0', 165, y + 5);
      doc.setTextColor(33, 37, 41);
    }

    y += 7;
  });

  doc.save(`PrizeBond_Batch_Report_${Date.now()}.pdf`);
}
