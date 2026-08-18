import {
  SingleCheckResult,
  BatchCheckResponse,
  DrawScheduleItem,
  WinnerItem,
  User,
  PortfolioBond,
  PortfolioStats,
  NotificationItem,
  AdminAnalytics
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('bd_prizebond_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Check single bond
  async checkSingleBond(data: {
    bond_series?: string;
    bond_number: string;
    draw_number?: number | null;
    check_all_active?: boolean;
  }): Promise<SingleCheckResult> {
    const res = await fetch(`${API_BASE}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to check bond');
    }
    return res.json();
  },

  // Check batch bonds
  async checkBatchBonds(data: {
    bonds: (string | { series?: string; number: string })[];
    draw_number?: number | null;
    check_all_active?: boolean;
  }): Promise<BatchCheckResponse> {
    const res = await fetch(`${API_BASE}/check/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to batch check bonds');
    }
    return res.json();
  },

  // Draws
  async getDraws(): Promise<{ success: boolean; draws: DrawScheduleItem[] }> {
    const res = await fetch(`${API_BASE}/draws`);
    return res.json();
  },

  async getLatestDraw(): Promise<{ success: boolean; draw: DrawScheduleItem; winners: WinnerItem[]; total_winners: number }> {
    const res = await fetch(`${API_BASE}/draws/latest`);
    return res.json();
  },

  async getDrawResults(drawNo: number): Promise<{
    success: boolean;
    draw: DrawScheduleItem;
    winners: WinnerItem[];
    categorized: Record<string, WinnerItem[]>;
    total_winners: number;
  }> {
    const res = await fetch(`${API_BASE}/results/${drawNo}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch draw #${drawNo}`);
    }
    return res.json();
  },

  async getUpcomingDraws(): Promise<{ success: boolean; upcoming: DrawScheduleItem[] }> {
    const res = await fetch(`${API_BASE}/draws/upcoming`);
    return res.json();
  },

  // Auth
  async register(data: { name: string; email?: string; phone?: string; password: string; language?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    localStorage.setItem('bd_prizebond_token', result.token);
    return result;
  },

  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');
    localStorage.setItem('bd_prizebond_token', result.token);
    return result;
  },

  async googleAuth(profile: { email: string; name: string; avatar?: string; googleId?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Google sign-in failed');
    localStorage.setItem('bd_prizebond_token', result.token);
    return result;
  },

  async getProfile(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(data: Partial<User>): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  logout(): void {
    localStorage.removeItem('bd_prizebond_token');
  },

  // Portfolio
  async getPortfolio(): Promise<{ success: boolean; stats: PortfolioStats; bonds: PortfolioBond[] }> {
    const res = await fetch(`${API_BASE}/portfolio`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch portfolio');
    return res.json();
  },

  async addPortfolioBond(data: { bond_series?: string; bond_number: string; purchase_date?: string; notes?: string } | { bonds: any[] }): Promise<any> {
    const res = await fetch(`${API_BASE}/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add bond');
    return res.json();
  },

  async deletePortfolioBond(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/portfolio/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async checkAllPortfolio(): Promise<{ success: boolean; summary: any; results: any[] }> {
    const res = await fetch(`${API_BASE}/portfolio/check-all`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to auto check portfolio');
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<{ success: boolean; notifications: NotificationItem[] }> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async checkPortfolioAlerts(): Promise<{ success: boolean; message: string; new_alerts: number }> {
    const res = await fetch(`${API_BASE}/notifications/check-portfolio-alerts`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async markNotificationRead(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async deleteNotification(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Admin
  async getAdminAnalytics(): Promise<{ success: boolean; analytics: AdminAnalytics }> {
    const res = await fetch(`${API_BASE}/admin/analytics`);
    return res.json();
  },

  async uploadDrawResults(data: { draw_number: number; draw_date: string; location?: string; winners: any[] }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/results/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload draw results');
    }
    return res.json();
  },

  async broadcastNotification(data: { title: string; title_bn?: string; message: string; message_bn?: string; type?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/notify/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // PHP PDO reference
  async getPhpPdoReference(): Promise<{ success: boolean; php_architecture: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/php-pdo-reference`);
    return res.json();
  }
};
