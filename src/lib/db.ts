// Simple in-memory user store (replace with real DB in production)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: number;
  usage_count: number;
  max_usage: number; // Free tier limit
  last_reset_date: string; // UTC date string YYYY-MM-DD for daily reset
}

export interface ProcessHistory {
  id: string;
  user_id: string;
  original_name: string;
  processed_at: number;
}

// In-memory stores (use Redis/PostgreSQL in production)
const users = new Map<string, User>();
const history = new Map<string, ProcessHistory[]>();

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export const db = {
  getUser: (email: string) => users.get(email),

  createUser: (email: string, name: string, avatar_url: string): User => {
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      avatar_url,
      created_at: Date.now(),
      usage_count: 0,
      max_usage: 10, // Free tier: 10 images/day
      last_reset_date: getTodayUTC(),
    };
    users.set(email, user);
    return user;
  },

  updateUsage: (email: string) => {
    const user = users.get(email);
    if (user) {
      const today = getTodayUTC();
      if (user.last_reset_date !== today) {
        // New day — reset counter
        user.usage_count = 0;
        user.last_reset_date = today;
      }
      user.usage_count++;
      users.set(email, user);
    }
  },

  canUseService: (email: string): { allowed: boolean; remaining: number; limit: number } => {
    const user = users.get(email);
    if (!user) {
      return { allowed: false, remaining: 0, limit: 10 };
    }
    const today = getTodayUTC();
    const usageCount = user.last_reset_date !== today ? 0 : user.usage_count;
    const remaining = Math.max(0, user.max_usage - usageCount);
    return {
      allowed: remaining > 0,
      remaining,
      limit: user.max_usage,
    };
  },

  addHistory: (user_id: string, original_name: string) => {
    const record: ProcessHistory = {
      id: `hist_${Date.now()}`,
      user_id,
      original_name,
      processed_at: Date.now(),
    };
    const userHistory = history.get(user_id) || [];
    userHistory.unshift(record);
    history.set(user_id, userHistory.slice(0, 50)); // Keep last 50
  },

  getHistory: (user_id: string) => history.get(user_id) || [],
};
