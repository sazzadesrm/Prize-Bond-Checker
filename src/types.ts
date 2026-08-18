export type Language = 'en' | 'bn';

export type NavTab = 'single' | 'batch' | 'schedule' | 'portfolio' | 'guide' | 'profile' | 'admin';

export interface RecentSearchItem {
  series: string;
  bondNumber: string;
  draw: string;
  timestamp: number;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatar?: string;
  role: 'user' | 'admin';
  language: Language;
  is_premium: boolean | number;
  notify_email?: boolean | number;
  notify_sms?: boolean | number;
  notify_draw_alerts?: boolean | number;
  created_at?: string;
}

export interface DrawScheduleItem {
  id: number;
  draw_number: number;
  scheduled_date: string;
  location: string;
  status: 'completed' | 'upcoming';
}

export interface WinnerItem {
  id?: number;
  draw_number: number;
  draw_date?: string;
  bond_series?: string;
  bond_number: string;
  prize_category: number;
  prize_amount: number;
  prize_title_en?: string;
  prize_title_bn?: string;
}

export interface WinningInfo {
  draw_number: number;
  draw_date: string;
  location?: string;
  prize_category: number;
  prize_title_en: string;
  prize_title_bn: string;
  gross_prize_amount: number;
  source_tax_20_pct: number;
  net_payable_amount: number;
  claim_deadline: string;
}

export interface SingleCheckResult {
  success: boolean;
  bond_series: string;
  bond_number: string;
  full_bond: string;
  result: 'WIN' | 'LOSE';
  checked_draws: number[];
  winning_info: WinningInfo | null;
}

export interface BatchCheckItemResult {
  series: string;
  number: string;
  full_bond: string;
  result: 'WIN' | 'LOSE';
  winning_info: WinningInfo | null;
}

export interface BatchCheckResponse {
  success: boolean;
  summary: {
    total_checked: number;
    total_winners: number;
    total_loses: number;
    total_gross_prize: number;
    total_tax_20_pct: number;
    total_net_prize: number;
    win_percentage: string;
  };
  checked_draws: number[];
  results: BatchCheckItemResult[];
}

export interface PortfolioBond {
  id: number;
  user_id: number;
  bond_series: string;
  bond_number: string;
  purchase_date?: string;
  notes?: string;
  is_winner?: boolean;
  winning_info?: {
    draw_number: number;
    draw_date: string;
    prize_category: number;
    prize_title_en: string;
    prize_title_bn: string;
    prize_amount: number;
  } | null;
  created_at?: string;
}

export interface PortfolioStats {
  total_bonds: number;
  total_investment: number;
  total_winnings: number;
  net_profit: number;
  total_winners: number;
}

export interface NotificationItem {
  id: number;
  user_id: number | null;
  title: string;
  title_bn: string;
  message: string;
  message_bn: string;
  type: string;
  is_read: number;
  created_at: string;
}

export interface AdminAnalytics {
  total_draws_completed: number;
  total_users: number;
  total_bonds_managed: number;
  total_checks_run: number;
  total_winning_checks: number;
  total_prize_value_checked: number;
}
