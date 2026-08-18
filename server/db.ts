import initSqlJs, { Database } from 'sql.js';
import bcrypt from 'bcryptjs';

let dbInstance: Database | null = null;

// Initial Draw Results Seed Data
export const INITIAL_DRAWS = [
  {
    draw_number: 118,
    draw_date: '2025-04-30',
    location: 'National Savings Directorate, Dhaka',
    status: 'completed',
    winners: [
      { prize_category: 1, prize_amount: 600000, bond_number: '0528419' },
      { prize_category: 2, prize_amount: 325000, bond_number: '0834921' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0129482' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0743198' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0384721' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0912435' },
      // 5th prize (20 winners)
      { prize_category: 5, prize_amount: 10000, bond_number: '0014829' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0089234' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0148291' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0219482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0294817' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0341982' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0398412' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0459182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0512839' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0582914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0629481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0693821' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0738491' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0794821' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0829147' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0874912' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0918273' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0948291' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0973824' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0994821' },
    ]
  },
  {
    draw_number: 117,
    draw_date: '2025-01-31',
    location: 'Divisional Commissioner Office, Chattogram',
    status: 'completed',
    winners: [
      { prize_category: 1, prize_amount: 600000, bond_number: '0194827' },
      { prize_category: 2, prize_amount: 325000, bond_number: '0629481' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0348291' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0849201' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0294812' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0784912' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0029481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0073918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0164829' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0238491' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0319482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0382914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0429481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0491823' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0538492' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0619482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0674918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0718294' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0782914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0834918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0872914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0928419' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0958291' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0984912' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0991823' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0123456' }, // Demo winning bond number
    ]
  },
  {
    draw_number: 116,
    draw_date: '2024-10-31',
    location: 'Divisional Commissioner Office, Rajshahi',
    status: 'completed',
    winners: [
      { prize_category: 1, prize_amount: 600000, bond_number: '0738291' },
      { prize_category: 2, prize_amount: 325000, bond_number: '0419284' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0182941' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0928412' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0348291' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0819482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0049182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0129481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0194823' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0284918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0372914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0449182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0519482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0582914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0649182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0719482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0782914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0849182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0894812' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0938491' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0972914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0994823' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0329481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0618294' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0754918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0829147' },
    ]
  },
  {
    draw_number: 115,
    draw_date: '2024-07-31',
    location: 'Divisional Commissioner Office, Sylhet',
    status: 'completed',
    winners: [
      { prize_category: 1, prize_amount: 600000, bond_number: '0812948' },
      { prize_category: 2, prize_amount: 325000, bond_number: '0294819' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0482914' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0719482' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0194827' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0638491' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0064918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0139482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0228491' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0318294' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0394812' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0472914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0549182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0628491' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0694821' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0762914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0839481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0884912' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0928419' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0964918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0989234' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0148291' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0284918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0519482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0743198' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0894812' },
    ]
  },
  {
    draw_number: 114,
    draw_date: '2024-04-30',
    location: 'National Savings Office, Dhaka',
    status: 'completed',
    winners: [
      { prize_category: 1, prize_amount: 600000, bond_number: '0349182' },
      { prize_category: 2, prize_amount: 325000, bond_number: '0782914' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0128491' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0619482' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0482917' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0928419' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0058291' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0174918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0249182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0328491' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0419482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0492814' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0564918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0639481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0712849' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0774918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0849201' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0891824' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0934918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0974912' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0098412' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0219482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0429481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0674918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0872914' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0958291' },
    ]
  },
  {
    draw_number: 113,
    draw_date: '2024-01-31',
    location: 'Divisional Commissioner Office, Khulna',
    status: 'completed',
    winners: [
      { prize_category: 1, prize_amount: 600000, bond_number: '0629481' },
      { prize_category: 2, prize_amount: 325000, bond_number: '0184912' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0394812' },
      { prize_category: 3, prize_amount: 100000, bond_number: '0829147' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0274918' },
      { prize_category: 4, prize_amount: 50000, bond_number: '0719482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0039481' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0112849' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0194827' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0284918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0364918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0449182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0528419' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0594812' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0674918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0743198' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0819482' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0864918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0912435' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0964918' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0089234' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0294817' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0459182' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0693821' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0874912' },
      { prize_category: 5, prize_amount: 10000, bond_number: '0973824' },
    ]
  }
];

export const UPCOMING_DRAWS = [
  { draw_number: 119, scheduled_date: '2025-07-31', location: 'Divisional Commissioner Office, Barishal', status: 'upcoming' },
  { draw_number: 120, scheduled_date: '2025-10-31', location: 'Divisional Commissioner Office, Rangpur', status: 'upcoming' },
  { draw_number: 121, scheduled_date: '2026-01-31', location: 'Divisional Commissioner Office, Mymensingh', status: 'upcoming' },
  { draw_number: 122, scheduled_date: '2026-04-30', location: 'National Savings Directorate, Dhaka', status: 'upcoming' }
];

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create tables according to PRD 7.3 with standard SQL DDL
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(20) UNIQUE,
      email VARCHAR(100) UNIQUE,
      password_hash VARCHAR(255),
      name VARCHAR(100) NOT NULL,
      avatar VARCHAR(255),
      role VARCHAR(20) DEFAULT 'user',
      language VARCHAR(10) DEFAULT 'bn',
      is_premium INTEGER DEFAULT 0,
      notify_email INTEGER DEFAULT 1,
      notify_sms INTEGER DEFAULT 1,
      notify_draw_alerts INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS draw_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_number INTEGER UNIQUE NOT NULL,
      scheduled_date DATE NOT NULL,
      location VARCHAR(200) NOT NULL,
      status VARCHAR(20) DEFAULT 'upcoming'
    );

    CREATE TABLE IF NOT EXISTS draw_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_number INTEGER NOT NULL,
      draw_date DATE NOT NULL,
      bond_series VARCHAR(5) DEFAULT '',
      bond_number VARCHAR(10) NOT NULL,
      prize_category INTEGER NOT NULL,
      prize_amount DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_bonds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bond_series VARCHAR(5) NOT NULL,
      bond_number VARCHAR(10) NOT NULL,
      purchase_date DATE,
      notes VARCHAR(200),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS check_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      bond_series VARCHAR(5),
      bond_number VARCHAR(10) NOT NULL,
      draw_number INTEGER,
      result VARCHAR(10) NOT NULL,
      prize_amount DECIMAL(10,2) DEFAULT 0,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title VARCHAR(150) NOT NULL,
      title_bn VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      message_bn TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin and demo user
  const adminPass = await bcrypt.hash('admin123', 10);
  const demoPass = await bcrypt.hash('demo123', 10);

  const stmtUser = db.prepare(`
    INSERT INTO users (phone, email, password_hash, name, role, language, is_premium)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmtUser.run(['01711000000', 'admin@prizebond.gov.bd', adminPass, 'System Administrator', 'admin', 'en', 1]);
  stmtUser.run(['01812345678', 'scmwaltonbd@gmail.com', demoPass, 'Rahim Chowdhury', 'user', 'bn', 0]);
  stmtUser.free();

  // Seed draw schedule
  const stmtSched = db.prepare(`
    INSERT INTO draw_schedule (draw_number, scheduled_date, location, status)
    VALUES (?, ?, ?, ?)
  `);
  for (const draw of INITIAL_DRAWS) {
    stmtSched.run([draw.draw_number, draw.draw_date, draw.location, 'completed']);
  }
  for (const up of UPCOMING_DRAWS) {
    stmtSched.run([up.draw_number, up.scheduled_date, up.location, 'upcoming']);
  }
  stmtSched.free();

  // Seed draw results
  const stmtRes = db.prepare(`
    INSERT INTO draw_results (draw_number, draw_date, bond_series, bond_number, prize_category, prize_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const draw of INITIAL_DRAWS) {
    for (const w of draw.winners) {
      stmtRes.run([draw.draw_number, draw.draw_date, '', w.bond_number, w.prize_category, w.prize_amount]);
    }
  }
  stmtRes.free();

  // Seed sample user bonds for the demo user (id: 2)
  const stmtBonds = db.prepare(`
    INSERT INTO user_bonds (user_id, bond_series, bond_number, purchase_date, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmtBonds.run([2, 'KA', '0123456', '2024-01-15', 'Gift from grandfather']); // Winner in draw 117
  stmtBonds.run([2, 'KHA', '0528419', '2024-06-20', 'Bank purchase at Motijheel']); // 1st Prize Winner in Draw 118
  stmtBonds.run([2, 'GA', '0834921', '2024-08-10', 'Savings bond series']); // 2nd Prize Winner in Draw 118
  stmtBonds.run([2, 'GHA', '0014829', '2024-11-05', 'Post office counter']); // 5th prize winner in Draw 118
  stmtBonds.run([2, 'UMO', '0451239', '2024-12-01', 'Portfolio batch #1']);
  stmtBonds.run([2, 'CHA', '0789123', '2025-01-10', 'Agrani Bank Branch']);
  stmtBonds.free();

  // Seed sample notifications
  const stmtNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, title_bn, message, message_bn, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmtNotif.run([
    2,
    '🎉 Winning Alert: Bond KHA 0528419 Won 1st Prize!',
    '🎉 অভিনন্দন: আপনার বন্ড খ 0528419 ১ম পুরস্কার জিতেছে!',
    'Your tracked portfolio bond KHA 0528419 has won 1st Prize of Tk. 6,00,000 in Draw #118!',
    'আপনার পোর্টফোলিওতে থাকা খ 0528419 বন্ডটি ১১৮তম ড্র-তে ১ম পুরস্কার ৬,০০,০০০ টাকা জিতেছে!',
    'portfolio_win'
  ]);
  stmtNotif.run([
    2,
    '🎉 Winning Alert: Bond GA 0834921 Won 2nd Prize!',
    '🎉 অভিনন্দন: আপনার বন্ড গ 0834921 ২য় পুরস্কার জিতেছে!',
    'Your tracked portfolio bond GA 0834921 has won 2nd Prize of Tk. 3,25,000 in Draw #118!',
    'আপনার পোর্টফোলিওতে থাকা গ 0834921 বন্ডটি ১১৮তম ড্র-তে ২য় পুরস্কার ৩,২৫,০০০ টাকা জিতেছে!',
    'portfolio_win'
  ]);
  stmtNotif.run([
    null,
    'Draw #118 Results Published!',
    '১১৮তম ড্র এর ফলাফল প্রকাশিত হয়েছে!',
    'The 118th Prize Bond draw results are now live. Check your bonds now to see if you have won.',
    '১১৮তম প্রাইজবন্ড ড্র এর ফলাফল প্রকাশিত হয়েছে। আপনার বন্ডগুলো এখনই যাচাই করুন।',
    'result_alert'
  ]);
  stmtNotif.run([
    null,
    'Upcoming Draw #119 Reminder',
    'আসন্ন ১১৯তম ড্র এর অনুস্মারক',
    'Draw #119 will be held in Barishal on July 31, 2025. Ensure your bonds are registered.',
    '১১৯তম ড্র আগামী ৩১ জুলাই ২০২৫ বরিশালে অনুষ্ঠিত হবে। ড্র এর জন্য প্রস্তুত থাকুন।',
    'draw_reminder'
  ]);
  stmtNotif.run([
    null,
    '2-Year Prize Claim Policy',
    '২ বছরের মধ্যে পুরস্কার দাবি সংক্রান্ত তথ্য',
    'Remember that prizes must be claimed within 2 years from the draw date to avoid forfeiture.',
    'মনে রাখবেন, ড্র অনুষ্ঠিত হওয়ার ২ বছরের মধ্যে পুরস্কারের অর্থ দাবি করতে হয়।',
    'claim_deadline'
  ]);
  stmtNotif.free();

  dbInstance = db;
  return db;
}
