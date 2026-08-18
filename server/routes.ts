import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bd-prizebond-secure-secret-key-2025';

export const apiRouter = Router();

// Middleware for JWT auth
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

const authenticateJwt = (req: AuthRequest, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return next();
  }
};

const requireAuth = (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
};

apiRouter.use(authenticateJwt);

// Helper for prize descriptions
const PRIZE_DETAILS: Record<number, { name_en: string; name_bn: string; amount: number }> = {
  1: { name_en: '1st Prize', name_bn: '১ম পুরস্কার', amount: 600000 },
  2: { name_en: '2nd Prize', name_bn: '২য় পুরস্কার', amount: 325000 },
  3: { name_en: '3rd Prize', name_bn: '৩য় পুরস্কার', amount: 100000 },
  4: { name_en: '4th Prize', name_bn: '৪র্থ পুরস্কার', amount: 50000 },
  5: { name_en: '5th Prize', name_bn: '৫ম পুরস্কার', amount: 10000 }
};

// ==========================================
// 1. RESULT CHECKING (Single & Batch)
// ==========================================

// POST /api/v1/check - Single bond check
apiRouter.post('/check', async (req: AuthRequest, res: Response) => {
  try {
    const { bond_series, bond_number, draw_number, check_all_active } = req.body;
    if (!bond_number) {
      return res.status(400).json({ error: 'Bond number is required' });
    }

    const cleanNumber = bond_number.toString().trim().padStart(7, '0');
    const cleanSeries = (bond_series || '').toString().trim().toUpperCase();
    const db = await getDb();

    let winningRecord: any = null;
    let checkedDraws: number[] = [];

    if (check_all_active || !draw_number) {
      // Check across all completed draws within the last 2 years (8 draws)
      const drawsStmt = db.prepare(`
        SELECT draw_number, scheduled_date FROM draw_schedule 
        WHERE status = 'completed' 
        ORDER BY draw_number DESC LIMIT 8
      `);
      
      const activeDraws: any[] = [];
      while (drawsStmt.step()) {
        activeDraws.push(drawsStmt.getAsObject());
      }
      drawsStmt.free();

      checkedDraws = activeDraws.map(d => d.draw_number);

      // Query prepared statement against SQLite using safe parameterized values
      const stmt = db.prepare(`
        SELECT r.*, s.scheduled_date, s.location 
        FROM draw_results r
        JOIN draw_schedule s ON r.draw_number = s.draw_number
        WHERE r.bond_number = ? AND r.draw_number IN (${checkedDraws.map(() => '?').join(',')})
        ORDER BY r.prize_category ASC, r.draw_number DESC
        LIMIT 1
      `);
      
      const params = [cleanNumber, ...checkedDraws];
      stmt.bind(params);
      
      if (stmt.step()) {
        winningRecord = stmt.getAsObject();
      }
      stmt.free();
    } else {
      checkedDraws = [Number(draw_number)];
      const stmt = db.prepare(`
        SELECT r.*, s.scheduled_date, s.location 
        FROM draw_results r
        JOIN draw_schedule s ON r.draw_number = s.draw_number
        WHERE r.bond_number = ? AND r.draw_number = ?
        LIMIT 1
      `);
      stmt.bind([cleanNumber, Number(draw_number)]);
      if (stmt.step()) {
        winningRecord = stmt.getAsObject();
      }
      stmt.free();
    }

    const isWin = !!winningRecord;
    const prizeAmount = isWin ? Number(winningRecord.prize_amount) : 0;
    const taxDeduction = isWin ? prizeAmount * 0.20 : 0; // 20% Bangladesh Govt Source Tax
    const netAmount = isWin ? prizeAmount - taxDeduction : 0;

    // Save to check_history
    const userId = req.user ? req.user.id : null;
    const histStmt = db.prepare(`
      INSERT INTO check_history (user_id, bond_series, bond_number, draw_number, result, prize_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    histStmt.run([
      userId,
      cleanSeries,
      cleanNumber,
      winningRecord ? winningRecord.draw_number : (draw_number || checkedDraws[0] || null),
      isWin ? 'WIN' : 'LOSE',
      prizeAmount
    ]);
    histStmt.free();

    return res.json({
      success: true,
      bond_series: cleanSeries,
      bond_number: cleanNumber,
      full_bond: cleanSeries ? `${cleanSeries} ${cleanNumber}` : cleanNumber,
      result: isWin ? 'WIN' : 'LOSE',
      checked_draws: checkedDraws,
      winning_info: isWin ? {
        draw_number: winningRecord.draw_number,
        draw_date: winningRecord.draw_date || winningRecord.scheduled_date,
        location: winningRecord.location,
        prize_category: winningRecord.prize_category,
        prize_title_en: PRIZE_DETAILS[winningRecord.prize_category]?.name_en || `${winningRecord.prize_category}th Prize`,
        prize_title_bn: PRIZE_DETAILS[winningRecord.prize_category]?.name_bn || `${winningRecord.prize_category}ম পুরস্কার`,
        gross_prize_amount: prizeAmount,
        source_tax_20_pct: taxDeduction,
        net_payable_amount: netAmount,
        claim_deadline: new Date(new Date(winningRecord.draw_date || winningRecord.scheduled_date).getTime() + (2 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
      } : null
    });
  } catch (err: any) {
    console.error('Check error:', err);
    return res.status(500).json({ error: 'Internal server error during bond check', details: err.message });
  }
});

// POST /api/v1/check/batch - Batch bond check
apiRouter.post('/check/batch', async (req: AuthRequest, res: Response) => {
  try {
    const { bonds, draw_number, check_all_active } = req.body;
    if (!bonds || !Array.isArray(bonds) || bonds.length === 0) {
      return res.status(400).json({ error: 'Bonds array is required' });
    }

    const db = await getDb();

    // Get draws to check
    let checkedDraws: number[] = [];
    if (check_all_active || !draw_number) {
      const drawsStmt = db.prepare(`
        SELECT draw_number FROM draw_schedule 
        WHERE status = 'completed' 
        ORDER BY draw_number DESC LIMIT 8
      `);
      while (drawsStmt.step()) {
        checkedDraws.push((drawsStmt.getAsObject() as any).draw_number);
      }
      drawsStmt.free();
    } else {
      checkedDraws = [Number(draw_number)];
    }

    // Fetch all winning records for these draws
    const winnersStmt = db.prepare(`
      SELECT r.*, s.scheduled_date, s.location
      FROM draw_results r
      JOIN draw_schedule s ON r.draw_number = s.draw_number
      WHERE r.draw_number IN (${checkedDraws.map(() => '?').join(',')})
    `);
    winnersStmt.bind(checkedDraws);

    const winningMap = new Map<string, any[]>();
    while (winnersStmt.step()) {
      const row = winnersStmt.getAsObject() as any;
      const num = row.bond_number;
      if (!winningMap.has(num)) {
        winningMap.set(num, []);
      }
      winningMap.get(num)!.push(row);
    }
    winnersStmt.free();

    const results: any[] = [];
    let totalWinners = 0;
    let totalGrossPrize = 0;

    for (const item of bonds) {
      let series = '';
      let number = '';
      if (typeof item === 'string') {
        const parts = item.trim().split(/\s+/);
        if (parts.length > 1) {
          series = parts[0].toUpperCase();
          number = parts[1].padStart(7, '0');
        } else {
          number = parts[0].padStart(7, '0');
        }
      } else if (typeof item === 'object') {
        series = (item.series || item.bond_series || '').toString().trim().toUpperCase();
        number = (item.number || item.bond_number || '').toString().trim().padStart(7, '0');
      }

      if (!number || number.length < 5) continue;

      const wins = winningMap.get(number);
      if (wins && wins.length > 0) {
        // Sort highest prize first
        wins.sort((a, b) => a.prize_category - b.prize_category);
        const topWin = wins[0];
        const grossPrize = Number(topWin.prize_amount);
        const tax = grossPrize * 0.20;
        const net = grossPrize - tax;

        totalWinners++;
        totalGrossPrize += grossPrize;

        results.push({
          series,
          number,
          full_bond: series ? `${series} ${number}` : number,
          result: 'WIN',
          winning_info: {
            draw_number: topWin.draw_number,
            draw_date: topWin.draw_date || topWin.scheduled_date,
            prize_category: topWin.prize_category,
            prize_title_en: PRIZE_DETAILS[topWin.prize_category]?.name_en || `${topWin.prize_category}th Prize`,
            prize_title_bn: PRIZE_DETAILS[topWin.prize_category]?.name_bn || `${topWin.prize_category}ম পুরস্কার`,
            gross_prize_amount: grossPrize,
            source_tax_20_pct: tax,
            net_payable_amount: net,
            claim_deadline: new Date(new Date(topWin.draw_date || topWin.scheduled_date).getTime() + (2 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
          }
        });
      } else {
        results.push({
          series,
          number,
          full_bond: series ? `${series} ${number}` : number,
          result: 'LOSE',
          winning_info: null
        });
      }
    }

    return res.json({
      success: true,
      summary: {
        total_checked: results.length,
        total_winners: totalWinners,
        total_loses: results.length - totalWinners,
        total_gross_prize: totalGrossPrize,
        total_tax_20_pct: totalGrossPrize * 0.20,
        total_net_prize: totalGrossPrize * 0.80,
        win_percentage: results.length > 0 ? ((totalWinners / results.length) * 100).toFixed(1) : '0'
      },
      checked_draws: checkedDraws,
      results
    });
  } catch (err: any) {
    console.error('Batch check error:', err);
    return res.status(500).json({ error: 'Batch check failed', details: err.message });
  }
});

// ==========================================
// 2. DRAW SCHEDULE & HISTORY
// ==========================================

// GET /api/v1/draws - Get all draws
apiRouter.get('/draws', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT * FROM draw_schedule 
      ORDER BY draw_number DESC
    `);
    const list: any[] = [];
    while (stmt.step()) {
      list.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json({ success: true, draws: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch draws', details: err.message });
  }
});

// GET /api/v1/draws/latest - Get latest draw with winners
apiRouter.get('/draws/latest', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const schedStmt = db.prepare(`
      SELECT * FROM draw_schedule 
      WHERE status = 'completed' 
      ORDER BY draw_number DESC LIMIT 1
    `);
    
    let latestDraw: any = null;
    if (schedStmt.step()) {
      latestDraw = schedStmt.getAsObject();
    }
    schedStmt.free();

    if (!latestDraw) {
      return res.status(404).json({ error: 'No completed draws found' });
    }

    const winStmt = db.prepare(`
      SELECT * FROM draw_results 
      WHERE draw_number = ? 
      ORDER BY prize_category ASC, id ASC
    `);
    winStmt.bind([latestDraw.draw_number]);
    
    const winners: any[] = [];
    while (winStmt.step()) {
      const w = winStmt.getAsObject() as any;
      winners.push({
        ...w,
        prize_title_en: PRIZE_DETAILS[w.prize_category]?.name_en || `${w.prize_category}th Prize`,
        prize_title_bn: PRIZE_DETAILS[w.prize_category]?.name_bn || `${w.prize_category}ম পুরস্কার`
      });
    }
    winStmt.free();

    return res.json({
      success: true,
      draw: latestDraw,
      winners,
      total_winners: winners.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch latest draw', details: err.message });
  }
});

// GET /api/v1/results/:drawNo - Get full winners for a specific draw
apiRouter.get('/results/:drawNo', async (req: Request, res: Response) => {
  try {
    const drawNo = Number(req.params.drawNo);
    const db = await getDb();

    const schedStmt = db.prepare(`SELECT * FROM draw_schedule WHERE draw_number = ?`);
    schedStmt.bind([drawNo]);
    let drawInfo: any = null;
    if (schedStmt.step()) {
      drawInfo = schedStmt.getAsObject();
    }
    schedStmt.free();

    if (!drawInfo) {
      return res.status(404).json({ error: `Draw #${drawNo} not found` });
    }

    const winStmt = db.prepare(`
      SELECT * FROM draw_results 
      WHERE draw_number = ? 
      ORDER BY prize_category ASC, id ASC
    `);
    winStmt.bind([drawNo]);
    const winners: any[] = [];
    while (winStmt.step()) {
      const w = winStmt.getAsObject() as any;
      winners.push({
        ...w,
        prize_title_en: PRIZE_DETAILS[w.prize_category]?.name_en || `${w.prize_category}th Prize`,
        prize_title_bn: PRIZE_DETAILS[w.prize_category]?.name_bn || `${w.prize_category}ম পুরস্কার`
      });
    }
    winStmt.free();

    // Group winners by category
    const categorized = {
      first_prize: winners.filter(w => w.prize_category === 1),
      second_prize: winners.filter(w => w.prize_category === 2),
      third_prize: winners.filter(w => w.prize_category === 3),
      fourth_prize: winners.filter(w => w.prize_category === 4),
      fifth_prize: winners.filter(w => w.prize_category === 5)
    };

    return res.json({
      success: true,
      draw: drawInfo,
      winners,
      categorized,
      total_winners: winners.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch draw results', details: err.message });
  }
});

// GET /api/v1/draws/upcoming - Get upcoming draws
apiRouter.get('/draws/upcoming', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT * FROM draw_schedule 
      WHERE status = 'upcoming' 
      ORDER BY scheduled_date ASC
    `);
    const upcoming: any[] = [];
    while (stmt.step()) {
      upcoming.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json({ success: true, upcoming });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch upcoming draws', details: err.message });
  }
});

// ==========================================
// 3. USER AUTHENTICATION & MANAGEMENT
// ==========================================

// POST /api/v1/auth/register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, language } = req.body;
    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({ error: 'Name, password, and email or phone are required.' });
    }

    const db = await getDb();

    // Check existing
    if (email) {
      const checkStmt = db.prepare(`SELECT id FROM users WHERE email = ?`);
      checkStmt.bind([email.toLowerCase().trim()]);
      if (checkStmt.step()) {
        checkStmt.free();
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      checkStmt.free();
    }

    const password_hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, language, role, is_premium)
      VALUES (?, ?, ?, ?, ?, 'user', 0)
    `);
    stmt.run([
      name.trim(),
      email ? email.toLowerCase().trim() : null,
      phone ? phone.trim() : null,
      password_hash,
      language || 'bn'
    ]);
    stmt.free();

    // Fetch newly created user
    const userStmt = db.prepare(`SELECT id, name, email, phone, role, language, is_premium, created_at FROM users WHERE email = ? OR phone = ? ORDER BY id DESC LIMIT 1`);
    userStmt.bind([email ? email.toLowerCase().trim() : '', phone ? phone.trim() : '']);
    let user: any = null;
    if (userStmt.step()) {
      user = userStmt.getAsObject();
    }
    userStmt.free();

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// POST /api/v1/auth/login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // email or phone
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required.' });
    }

    const db = await getDb();
    const cleanId = identifier.trim().toLowerCase();

    const stmt = db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(email) = ? OR phone = ?
      LIMIT 1
    `);
    stmt.bind([cleanId, identifier.trim()]);
    
    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    delete user.password_hash;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// POST /api/v1/auth/google - Google sign-in / signup
apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google email is required' });
    }

    const db = await getDb();
    const cleanEmail = email.toLowerCase().trim();

    const stmt = db.prepare(`SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1`);
    stmt.bind([cleanEmail]);
    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      // Create new user for google
      const dummyPass = await bcrypt.hash(`google_${googleId || Date.now()}`, 10);
      const insStmt = db.prepare(`
        INSERT INTO users (name, email, password_hash, avatar, role, language, is_premium)
        VALUES (?, ?, ?, ?, 'user', 'bn', 0)
      `);
      insStmt.run([name || cleanEmail.split('@')[0], cleanEmail, dummyPass, avatar || '']);
      insStmt.free();

      const fetchStmt = db.prepare(`SELECT id, name, email, phone, avatar, role, language, is_premium, created_at FROM users WHERE email = ? LIMIT 1`);
      fetchStmt.bind([cleanEmail]);
      if (fetchStmt.step()) {
        user = fetchStmt.getAsObject();
      }
      fetchStmt.free();
    } else {
      delete user.password_hash;
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      success: true,
      message: 'Signed in via Google',
      token,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Google authentication failed', details: err.message });
  }
});

// GET /api/v1/user/profile
apiRouter.get('/user/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT id, name, email, phone, avatar, role, language, is_premium, notify_email, notify_sms, notify_draw_alerts, created_at 
      FROM users WHERE id = ?
    `);
    stmt.bind([req.user!.id]);
    let user: any = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
});

// PUT /api/v1/user/profile
apiRouter.put('/user/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, avatar, language, is_premium, notify_email, notify_sms, notify_draw_alerts } = req.body;
    const db = await getDb();

    const stmt = db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          avatar = COALESCE(?, avatar),
          language = COALESCE(?, language),
          is_premium = COALESCE(?, is_premium),
          notify_email = COALESCE(?, notify_email),
          notify_sms = COALESCE(?, notify_sms),
          notify_draw_alerts = COALESCE(?, notify_draw_alerts)
      WHERE id = ?
    `);
    stmt.run([
      name !== undefined ? name : null,
      email !== undefined ? email : null,
      phone !== undefined ? phone : null,
      avatar !== undefined ? avatar : null,
      language !== undefined ? language : null,
      is_premium !== undefined ? (is_premium ? 1 : 0) : null,
      notify_email !== undefined ? (notify_email ? 1 : 0) : null,
      notify_sms !== undefined ? (notify_sms ? 1 : 0) : null,
      notify_draw_alerts !== undefined ? (notify_draw_alerts ? 1 : 0) : null,
      req.user!.id
    ]);
    stmt.free();

    const fetchStmt = db.prepare(`SELECT id, name, email, phone, avatar, role, language, is_premium, notify_email, notify_sms, notify_draw_alerts, created_at FROM users WHERE id = ?`);
    fetchStmt.bind([req.user!.id]);
    let user: any = null;
    if (fetchStmt.step()) {
      user = fetchStmt.getAsObject();
    }
    fetchStmt.free();

    return res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// ==========================================
// 4. BOND PORTFOLIO MANAGER
// ==========================================

// GET /api/v1/portfolio
apiRouter.get('/portfolio', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT * FROM user_bonds 
      WHERE user_id = ? 
      ORDER BY id DESC
    `);
    stmt.bind([req.user!.id]);
    const bonds: any[] = [];
    while (stmt.step()) {
      bonds.push(stmt.getAsObject());
    }
    stmt.free();

    // Get active 2-year draws to evaluate win statuses
    const drawsStmt = db.prepare(`
      SELECT draw_number, scheduled_date FROM draw_schedule 
      WHERE status = 'completed' 
      ORDER BY draw_number DESC LIMIT 8
    `);
    const activeDraws: number[] = [];
    while (drawsStmt.step()) {
      activeDraws.push((drawsStmt.getAsObject() as any).draw_number);
    }
    drawsStmt.free();

    // Fetch all winning records in active draws
    const winStmt = db.prepare(`
      SELECT * FROM draw_results 
      WHERE draw_number IN (${activeDraws.map(() => '?').join(',')})
    `);
    winStmt.bind(activeDraws);
    const winMap = new Map<string, any>();
    while (winStmt.step()) {
      const row = winStmt.getAsObject() as any;
      if (!winMap.has(row.bond_number) || winMap.get(row.bond_number).prize_category > row.prize_category) {
        winMap.set(row.bond_number, row);
      }
    }
    winStmt.free();

    let totalWinnings = 0;
    const enrichedBonds = bonds.map(b => {
      const win = winMap.get(b.bond_number);
      if (win) {
        totalWinnings += Number(win.prize_amount);
      }
      return {
        ...b,
        is_winner: !!win,
        winning_info: win ? {
          draw_number: win.draw_number,
          draw_date: win.draw_date,
          prize_category: win.prize_category,
          prize_title_en: PRIZE_DETAILS[win.prize_category]?.name_en || `${win.prize_category}th Prize`,
          prize_title_bn: PRIZE_DETAILS[win.prize_category]?.name_bn || `${win.prize_category}ম পুরস্কার`,
          prize_amount: Number(win.prize_amount)
        } : null
      };
    });

    const totalInvestment = bonds.length * 100; // Tk 100 per bond face value

    return res.json({
      success: true,
      stats: {
        total_bonds: bonds.length,
        total_investment: totalInvestment,
        total_winnings: totalWinnings,
        net_profit: totalWinnings - totalInvestment,
        total_winners: enrichedBonds.filter(b => b.is_winner).length
      },
      bonds: enrichedBonds
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch portfolio', details: err.message });
  }
});

// POST /api/v1/portfolio - Add single or multiple bonds
apiRouter.post('/portfolio', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { bonds, bond_series, bond_number, purchase_date, notes } = req.body;
    const db = await getDb();
    const userId = req.user!.id;

    if (bonds && Array.isArray(bonds)) {
      // Bulk add
      const stmt = db.prepare(`
        INSERT INTO user_bonds (user_id, bond_series, bond_number, purchase_date, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const item of bonds) {
        const s = (item.series || item.bond_series || '').toString().trim().toUpperCase();
        const n = (item.number || item.bond_number || '').toString().trim().padStart(7, '0');
        if (n.length >= 5) {
          stmt.run([userId, s, n, item.purchase_date || null, item.notes || '']);
        }
      }
      stmt.free();
    } else {
      // Single add
      if (!bond_number) {
        return res.status(400).json({ error: 'Bond number is required' });
      }
      const s = (bond_series || '').toString().trim().toUpperCase();
      const n = bond_number.toString().trim().padStart(7, '0');
      const stmt = db.prepare(`
        INSERT INTO user_bonds (user_id, bond_series, bond_number, purchase_date, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run([userId, s, n, purchase_date || null, notes || '']);
      stmt.free();
    }

    return res.json({ success: true, message: 'Bonds saved to portfolio' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add bond', details: err.message });
  }
});

// DELETE /api/v1/portfolio/:id - Remove bond
apiRouter.delete('/portfolio/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();
    const stmt = db.prepare(`DELETE FROM user_bonds WHERE id = ? AND user_id = ?`);
    stmt.run([id, req.user!.id]);
    stmt.free();

    return res.json({ success: true, message: 'Bond removed from portfolio' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete bond', details: err.message });
  }
});

// POST /api/v1/portfolio/check-all - Auto check all user's bonds
apiRouter.post('/portfolio/check-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`SELECT * FROM user_bonds WHERE user_id = ?`);
    stmt.bind([req.user!.id]);
    const bonds: any[] = [];
    while (stmt.step()) {
      bonds.push(stmt.getAsObject());
    }
    stmt.free();

    if (bonds.length === 0) {
      return res.json({
        success: true,
        message: 'No bonds in portfolio to check',
        summary: { total_checked: 0, total_winners: 0, total_gross_prize: 0 },
        results: []
      });
    }

    // Get active draws
    const drawsStmt = db.prepare(`
      SELECT draw_number FROM draw_schedule 
      WHERE status = 'completed' 
      ORDER BY draw_number DESC LIMIT 8
    `);
    const checkedDraws: number[] = [];
    while (drawsStmt.step()) {
      checkedDraws.push((drawsStmt.getAsObject() as any).draw_number);
    }
    drawsStmt.free();

    // Query winning numbers
    const winnersStmt = db.prepare(`
      SELECT r.*, s.scheduled_date, s.location
      FROM draw_results r
      JOIN draw_schedule s ON r.draw_number = s.draw_number
      WHERE r.draw_number IN (${checkedDraws.map(() => '?').join(',')})
    `);
    winnersStmt.bind(checkedDraws);

    const winningMap = new Map<string, any[]>();
    while (winnersStmt.step()) {
      const row = winnersStmt.getAsObject() as any;
      const num = row.bond_number;
      if (!winningMap.has(num)) {
        winningMap.set(num, []);
      }
      winningMap.get(num)!.push(row);
    }
    winnersStmt.free();

    const results: any[] = [];
    let totalWinners = 0;
    let totalGrossPrize = 0;

    for (const b of bonds) {
      const wins = winningMap.get(b.bond_number);
      if (wins && wins.length > 0) {
        wins.sort((a, b) => a.prize_category - b.prize_category);
        const topWin = wins[0];
        const grossPrize = Number(topWin.prize_amount);
        totalWinners++;
        totalGrossPrize += grossPrize;

        results.push({
          id: b.id,
          series: b.bond_series,
          number: b.bond_number,
          full_bond: b.bond_series ? `${b.bond_series} ${b.bond_number}` : b.bond_number,
          result: 'WIN',
          winning_info: {
            draw_number: topWin.draw_number,
            draw_date: topWin.draw_date || topWin.scheduled_date,
            prize_category: topWin.prize_category,
            prize_title_en: PRIZE_DETAILS[topWin.prize_category]?.name_en || `${topWin.prize_category}th Prize`,
            prize_title_bn: PRIZE_DETAILS[topWin.prize_category]?.name_bn || `${topWin.prize_category}ম পুরস্কার`,
            gross_prize_amount: grossPrize
          }
        });
      } else {
        results.push({
          id: b.id,
          series: b.bond_series,
          number: b.bond_number,
          full_bond: b.bond_series ? `${b.bond_series} ${b.bond_number}` : b.bond_number,
          result: 'LOSE',
          winning_info: null
        });
      }
    }

    return res.json({
      success: true,
      summary: {
        total_checked: results.length,
        total_winners: totalWinners,
        total_investment: results.length * 100,
        total_gross_prize: totalGrossPrize,
        total_net_prize: totalGrossPrize * 0.80
      },
      results
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Portfolio check failed', details: err.message });
  }
});

// ==========================================
// 5. NOTIFICATIONS & ALERTS
// ==========================================

// GET /api/v1/notifications
apiRouter.get('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user ? req.user.id : null;

    // If user is logged in, check if any of their portfolio bonds won in recent draws and ensure alert exists
    if (userId) {
      const userBondsStmt = db.prepare(`SELECT bond_series, bond_number FROM user_bonds WHERE user_id = ?`);
      userBondsStmt.bind([userId]);
      const bondsList: { bond_series: string; bond_number: string }[] = [];
      while (userBondsStmt.step()) {
        bondsList.push(userBondsStmt.getAsObject() as any);
      }
      userBondsStmt.free();

      if (bondsList.length > 0) {
        const bondNumbers = bondsList.map(b => b.bond_number);
        const winStmt = db.prepare(`
          SELECT r.*, s.scheduled_date, s.location
          FROM draw_results r
          JOIN draw_schedule s ON r.draw_number = s.draw_number
          WHERE r.bond_number IN (${bondNumbers.map(() => '?').join(',')})
        `);
        winStmt.bind(bondNumbers);
        
        while (winStmt.step()) {
          const win = winStmt.getAsObject() as any;
          const matchBond = bondsList.find(b => b.bond_number === win.bond_number);
          const fullBond = matchBond?.bond_series ? `${matchBond.bond_series} ${win.bond_number}` : win.bond_number;
          const prizeName = PRIZE_DETAILS[win.prize_category]?.name_en || `${win.prize_category}th Prize`;
          const prizeNameBn = PRIZE_DETAILS[win.prize_category]?.name_bn || `${win.prize_category}ম পুরস্কার`;

          // Check if notification already exists for this user and win
          const checkStmt = db.prepare(`
            SELECT id FROM notifications 
            WHERE user_id = ? AND title LIKE ? LIMIT 1
          `);
          checkStmt.bind([userId, `%${win.bond_number}%${win.draw_number}%`]);
          let exists = false;
          if (checkStmt.step()) {
            exists = true;
          }
          checkStmt.free();

          if (!exists) {
            const insStmt = db.prepare(`
              INSERT INTO notifications (user_id, title, title_bn, message, message_bn, type, is_read)
              VALUES (?, ?, ?, ?, ?, 'portfolio_win', 0)
            `);
            insStmt.run([
              userId,
              `🎉 Winning Alert: Bond ${fullBond} Won in Draw #${win.draw_number}!`,
              `🎉 অভিনন্দন: আপনার বন্ড ${fullBond} ${win.draw_number}তম ড্র-তে পুরস্কার জিতেছে!`,
              `Your tracked portfolio bond ${fullBond} has won ${prizeName} of Tk. ${Number(win.prize_amount).toLocaleString()} in Draw #${win.draw_number}!`,
              `আপনার পোর্টফোলিওতে থাকা ${fullBond} বন্ডটি ${win.draw_number}তম ড্র-তে ${prizeNameBn} (টাকা ${Number(win.prize_amount).toLocaleString()}) জিতেছে!`,
            ]);
            insStmt.free();
          }
        }
        winStmt.free();
      }
    }

    const stmt = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id IS NULL OR user_id = ?
      ORDER BY created_at DESC LIMIT 30
    `);
    stmt.bind([userId || 0]);
    const notifications: any[] = [];
    while (stmt.step()) {
      notifications.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json({ success: true, notifications });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// POST /api/v1/notifications/check-portfolio-alerts - Force check & generate alerts
apiRouter.post('/notifications/check-portfolio-alerts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;

    const userBondsStmt = db.prepare(`SELECT bond_series, bond_number FROM user_bonds WHERE user_id = ?`);
    userBondsStmt.bind([userId]);
    const bondsList: { bond_series: string; bond_number: string }[] = [];
    while (userBondsStmt.step()) {
      bondsList.push(userBondsStmt.getAsObject() as any);
    }
    userBondsStmt.free();

    let newAlertsCount = 0;
    if (bondsList.length > 0) {
      const bondNumbers = bondsList.map(b => b.bond_number);
      const winStmt = db.prepare(`
        SELECT r.*, s.scheduled_date
        FROM draw_results r
        JOIN draw_schedule s ON r.draw_number = s.draw_number
        WHERE r.bond_number IN (${bondNumbers.map(() => '?').join(',')})
      `);
      winStmt.bind(bondNumbers);
      
      while (winStmt.step()) {
        const win = winStmt.getAsObject() as any;
        const matchBond = bondsList.find(b => b.bond_number === win.bond_number);
        const fullBond = matchBond?.bond_series ? `${matchBond.bond_series} ${win.bond_number}` : win.bond_number;
        const prizeName = PRIZE_DETAILS[win.prize_category]?.name_en || `${win.prize_category}th Prize`;
        const prizeNameBn = PRIZE_DETAILS[win.prize_category]?.name_bn || `${win.prize_category}ম পুরস্কার`;

        const checkStmt = db.prepare(`
          SELECT id FROM notifications 
          WHERE user_id = ? AND title LIKE ? LIMIT 1
        `);
        checkStmt.bind([userId, `%${win.bond_number}%${win.draw_number}%`]);
        let exists = false;
        if (checkStmt.step()) {
          exists = true;
        }
        checkStmt.free();

        if (!exists) {
          const insStmt = db.prepare(`
            INSERT INTO notifications (user_id, title, title_bn, message, message_bn, type, is_read)
            VALUES (?, ?, ?, ?, ?, 'portfolio_win', 0)
          `);
          insStmt.run([
            userId,
            `🎉 Winning Alert: Bond ${fullBond} Won in Draw #${win.draw_number}!`,
            `🎉 অভিনন্দন: আপনার বন্ড ${fullBond} ${win.draw_number}তম ড্র-তে পুরস্কার জিতেছে!`,
            `Your tracked portfolio bond ${fullBond} has won ${prizeName} of Tk. ${Number(win.prize_amount).toLocaleString()} in Draw #${win.draw_number}!`,
            `আপনার পোর্টফোলিওতে থাকা ${fullBond} বন্ডটি ${win.draw_number}তম ড্র-তে ${prizeNameBn} (টাকা ${Number(win.prize_amount).toLocaleString()}) জিতেছে!`,
          ]);
          insStmt.free();
          newAlertsCount++;
        }
      }
      winStmt.free();
    }

    return res.json({
      success: true,
      message: newAlertsCount > 0 
        ? `Found ${newAlertsCount} winning draw alert(s) for your portfolio!` 
        : 'Portfolio checked. No new winning alerts at this time.',
      new_alerts: newAlertsCount
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to evaluate draw alerts', details: err.message });
  }
});

// PUT /api/v1/notifications/:id/read - Mark single notification as read
apiRouter.put('/notifications/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const db = await getDb();
    const stmt = db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`);
    stmt.run([notifId]);
    stmt.free();

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notification', details: err.message });
  }
});

// DELETE /api/v1/notifications/:id - Delete single notification
apiRouter.delete('/notifications/:id', async (req: AuthRequest, res: Response) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const db = await getDb();
    const stmt = db.prepare(`DELETE FROM notifications WHERE id = ?`);
    stmt.run([notifId]);
    stmt.free();

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete notification', details: err.message });
  }
});

// PUT /api/v1/notifications/read-all
apiRouter.put('/notifications/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user ? req.user.id : null;
    const stmt = db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id IS NULL OR user_id = ?
    `);
    stmt.run([userId || 0]);
    stmt.free();

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update notifications', details: err.message });
  }
});

// ==========================================
// 6. ADMIN & ANALYTICS
// ==========================================

// GET /api/admin/analytics
apiRouter.get('/admin/analytics', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // Total draws
    let totalDraws = 0;
    const drawStmt = db.prepare(`SELECT COUNT(*) as count FROM draw_schedule WHERE status = 'completed'`);
    if (drawStmt.step()) totalDraws = (drawStmt.getAsObject() as any).count;
    drawStmt.free();

    // Total users
    let totalUsers = 0;
    const userStmt = db.prepare(`SELECT COUNT(*) as count FROM users`);
    if (userStmt.step()) totalUsers = (userStmt.getAsObject() as any).count;
    userStmt.free();

    // Total bonds in portfolio
    let totalPortfolioBonds = 0;
    const bondStmt = db.prepare(`SELECT COUNT(*) as count FROM user_bonds`);
    if (bondStmt.step()) totalPortfolioBonds = (bondStmt.getAsObject() as any).count;
    bondStmt.free();

    // Total checks done
    let totalChecks = 0;
    let totalWinningChecks = 0;
    let totalPrizeAwarded = 0;
    const checkStmt = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) as wins, SUM(prize_amount) as total_amount FROM check_history`);
    if (checkStmt.step()) {
      const obj = checkStmt.getAsObject() as any;
      totalChecks = obj.total || 0;
      totalWinningChecks = obj.wins || 0;
      totalPrizeAwarded = obj.total_amount || 0;
    }
    checkStmt.free();

    return res.json({
      success: true,
      analytics: {
        total_draws_completed: totalDraws,
        total_users: totalUsers,
        total_bonds_managed: totalPortfolioBonds,
        total_checks_run: totalChecks,
        total_winning_checks: totalWinningChecks,
        total_prize_value_checked: totalPrizeAwarded
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
});

// POST /api/admin/results/upload - Upload new draw results
apiRouter.post('/admin/results/upload', async (req: Request, res: Response) => {
  try {
    const { draw_number, draw_date, location, winners } = req.body;
    if (!draw_number || !draw_date || !winners || !Array.isArray(winners)) {
      return res.status(400).json({ error: 'draw_number, draw_date, and winners array are required' });
    }

    const db = await getDb();

    // Insert or replace draw schedule
    const schedStmt = db.prepare(`
      INSERT OR REPLACE INTO draw_schedule (draw_number, scheduled_date, location, status)
      VALUES (?, ?, ?, 'completed')
    `);
    schedStmt.run([draw_number, draw_date, location || 'National Savings Directorate, Dhaka']);
    schedStmt.free();

    // Delete existing results if any
    const delStmt = db.prepare(`DELETE FROM draw_results WHERE draw_number = ?`);
    delStmt.run([draw_number]);
    delStmt.free();

    // Insert winners
    const winStmt = db.prepare(`
      INSERT INTO draw_results (draw_number, draw_date, bond_series, bond_number, prize_category, prize_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const w of winners) {
      const num = (w.bond_number || w.number || '').toString().trim().padStart(7, '0');
      const cat = Number(w.prize_category || w.category || 5);
      const amt = Number(w.prize_amount || w.amount || (PRIZE_DETAILS[cat]?.amount || 10000));
      winStmt.run([draw_number, draw_date, w.bond_series || '', num, cat, amt]);
    }
    winStmt.free();

    // Add broadcast notification
    const notifStmt = db.prepare(`
      INSERT INTO notifications (title, title_bn, message, message_bn, type)
      VALUES (?, ?, ?, ?, 'result_alert')
    `);
    notifStmt.run([
      `Draw #${draw_number} Results Published!`,
      `${draw_number}তম ড্র এর ফলাফল আপলোড হয়েছে!`,
      `Official results for Draw #${draw_number} (${draw_date}) have been uploaded to the database.`,
      `${draw_number}তম ড্র (${draw_date}) এর সরকারি ফলাফল ডাটাবেজে যুক্ত করা হয়েছে। আপনার বন্ড মিলিয়ে নিন।`
    ]);
    notifStmt.free();

    return res.json({ success: true, message: `Draw #${draw_number} uploaded with ${winners.length} winning numbers.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to upload draw results', details: err.message });
  }
});

// POST /api/admin/notify/all - Broadcast announcement
apiRouter.post('/admin/notify/all', async (req: Request, res: Response) => {
  try {
    const { title, title_bn, message, message_bn, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const db = await getDb();
    const stmt = db.prepare(`
      INSERT INTO notifications (title, title_bn, message, message_bn, type)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([title, title_bn || title, message, message_bn || message, type || 'system_alert']);
    stmt.free();

    return res.json({ success: true, message: 'Broadcast notification dispatched.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to send broadcast', details: err.message });
  }
});

// ==========================================
// 7. PHP & PDO ARCHITECTURAL REFERENCE
// ==========================================

apiRouter.get('/php-pdo-reference', (req: Request, res: Response) => {
  const phpFiles = {
    db_connect_php: `<?php
/**
 * Bangladesh Prize Bond Checker
 * Database Connection via PHP Data Objects (PDO)
 * Robust protection against SQL Injection via parameterized prepared statements
 */

define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('DB_NAME') ?: 'bd_prizebond');
define('DB_USER', getenv('DB_USER') ?: 'prizebond_user');
define('DB_PASS', getenv('DB_PASS') ?: 'secure_password_123');
define('DB_PORT', getenv('DB_PORT') ?: 5432); // or 3306 for MySQL

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";options='--client_encoding=UTF8'";
            // For MySQL: $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false, // Enforce real prepared statements to eliminate SQL injection
                PDO::ATTR_PERSISTENT         => true
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                error_log("Database connection failure: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed. Please try again later.']);
                exit;
            }
        }
        return self::$instance;
    }
}
`,
    check_bond_php: `<?php
/**
 * Single Bond Result Checker
 * Utilizes PDO Prepared Statements with bound parameters
 */
require_once __DIR__ . '/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$bond_number = isset($input['bond_number']) ? str_pad(trim($input['bond_number']), 7, '0', STR_PAD_LEFT) : null;
$bond_series = isset($input['bond_series']) ? strtoupper(trim($input['bond_series'])) : '';
$draw_number = isset($input['draw_number']) ? (int)$input['draw_number'] : null;

if (!$bond_number || !preg_match('/^[0-9]{7}$/', $bond_number)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid bond number. Must be 7 digits (e.g., 0123456).']);
    exit;
}

$pdo = Database::getConnection();

if ($draw_number) {
    // Check against a specific draw using prepared statement
    $stmt = $pdo->prepare("
        SELECT r.id, r.draw_number, r.draw_date, r.bond_number, r.prize_category, r.prize_amount,
               s.location, s.scheduled_date
        FROM draw_results r
        JOIN draw_schedule s ON r.draw_number = s.draw_number
        WHERE r.bond_number = :bond_number AND r.draw_number = :draw_number
        LIMIT 1
    ");
    $stmt->bindValue(':bond_number', $bond_number, PDO::PARAM_STR);
    $stmt->bindValue(':draw_number', $draw_number, PDO::PARAM_INT);
    $stmt->execute();
} else {
    // Check against all active draws in the last 2 years (8 quarters)
    $stmt = $pdo->prepare("
        SELECT r.id, r.draw_number, r.draw_date, r.bond_number, r.prize_category, r.prize_amount,
               s.location, s.scheduled_date
        FROM draw_results r
        JOIN draw_schedule s ON r.draw_number = s.draw_number
        WHERE r.bond_number = :bond_number 
          AND r.draw_number IN (
              SELECT draw_number FROM draw_schedule 
              WHERE status = 'completed' 
              ORDER BY draw_number DESC LIMIT 8
          )
        ORDER BY r.prize_category ASC, r.draw_number DESC
        LIMIT 1
    ");
    $stmt->bindValue(':bond_number', $bond_number, PDO::PARAM_STR);
    $stmt->execute();
}

$winner = $stmt->fetch();
$is_win = (bool)$winner;

$gross_amount = $is_win ? (float)$winner['prize_amount'] : 0;
$tax_deduction = $is_win ? ($gross_amount * 0.20) : 0; // 20% Bangladesh source tax
$net_amount = $gross_amount - $tax_deduction;

echo json_encode([
    'success' => true,
    'bond_number' => $bond_number,
    'bond_series' => $bond_series,
    'result' => $is_win ? 'WIN' : 'LOSE',
    'winning_info' => $is_win ? [
        'draw_number' => (int)$winner['draw_number'],
        'draw_date' => $winner['draw_date'],
        'prize_category' => (int)$winner['prize_category'],
        'gross_prize_amount' => $gross_amount,
        'source_tax_20_pct' => $tax_deduction,
        'net_payable_amount' => $net_amount,
        'claim_deadline' => date('Y-m-d', strtotime($winner['draw_date'] . ' + 2 years'))
    ] : null
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
`,
    batch_check_php: `<?php
/**
 * Batch Prize Bond Checker with PDO
 * Processes multiple bonds efficiently using PDO parameterized query arrays
 */
require_once __DIR__ . '/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$bonds = $input['bonds'] ?? [];

if (!is_array($bonds) || empty($bonds)) {
    http_response_code(400);
    echo json_encode(['error' => 'Bonds list array is required.']);
    exit;
}

$pdo = Database::getConnection();

// Prepare in-list placeholders safely
$sanitized_numbers = [];
foreach ($bonds as $b) {
    $num = is_array($b) ? ($b['number'] ?? '') : $b;
    $num = str_pad(trim($num), 7, '0', STR_PAD_LEFT);
    if (preg_match('/^[0-9]{7}$/', $num)) {
        $sanitized_numbers[] = $num;
    }
}

if (empty($sanitized_numbers)) {
    echo json_encode(['success' => true, 'results' => [], 'summary' => ['total_checked' => 0, 'total_winners' => 0]]);
    exit;
}

// Generate parameterized placeholders (?, ?, ?)
$placeholders = implode(',', array_fill(0, count($sanitized_numbers), '?'));

$stmt = $pdo->prepare("
    SELECT r.draw_number, r.draw_date, r.bond_number, r.prize_category, r.prize_amount
    FROM draw_results r
    WHERE r.bond_number IN ($placeholders)
      AND r.draw_number IN (
          SELECT draw_number FROM draw_schedule 
          WHERE status = 'completed' 
          ORDER BY draw_number DESC LIMIT 8
      )
");

$stmt->execute($sanitized_numbers);
$winners_rows = $stmt->fetchAll();

// Map and return structured JSON
echo json_encode([
    'success' => true,
    'total_checked' => count($sanitized_numbers),
    'winners_found' => count($winners_rows),
    'winners' => $winners_rows
]);
`,
    schema_sql: `-- =========================================================
-- BANGLADESH PRIZE BOND CHECKER - SQL DATABASE SCHEMA
-- PostgreSQL / MySQL Compatible with Foreign Keys & Indexes
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    language VARCHAR(10) DEFAULT 'bn',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS draw_schedule (
    id SERIAL PRIMARY KEY,
    draw_number INTEGER UNIQUE NOT NULL,
    scheduled_date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming'
);

CREATE TABLE IF NOT EXISTS draw_results (
    id SERIAL PRIMARY KEY,
    draw_number INTEGER NOT NULL REFERENCES draw_schedule(draw_number) ON DELETE CASCADE,
    draw_date DATE NOT NULL,
    bond_series VARCHAR(5) DEFAULT '',
    bond_number VARCHAR(10) NOT NULL,
    prize_category INTEGER NOT NULL CHECK (prize_category BETWEEN 1 AND 5),
    prize_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_bonds (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bond_series VARCHAR(5) NOT NULL,
    bond_number VARCHAR(10) NOT NULL,
    purchase_date DATE,
    notes VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS check_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    bond_series VARCHAR(5),
    bond_number VARCHAR(10) NOT NULL,
    draw_number INTEGER,
    result VARCHAR(10) NOT NULL,
    prize_amount DECIMAL(10,2) DEFAULT 0,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes for sub-millisecond lookups
CREATE INDEX IF NOT EXISTS idx_draw_results_bond_num ON draw_results(bond_number);
CREATE INDEX IF NOT EXISTS idx_draw_results_draw_num ON draw_results(draw_number);
CREATE INDEX IF NOT EXISTS idx_user_bonds_user_id ON user_bonds(user_id);
CREATE INDEX IF NOT EXISTS idx_check_history_user_id ON check_history(user_id);
`
  };

  return res.json({ success: true, php_architecture: phpFiles });
});
