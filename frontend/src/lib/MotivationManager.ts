import { toast } from 'sonner';

const STORAGE_KEYS = {
  STREAK: 'strkx_streak',
  LAST_SOLVED: 'strkx_last_solved',
  TOTAL_SOLVED: 'strkx_total_solved',
};

export const MotivationManager = {
  recordSolve: () => {
    const now = new Date();
    const today = now.toDateString();
    const lastSolved = localStorage.getItem(STORAGE_KEYS.LAST_SOLVED);

    let streak = parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0', 10);
    let total = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SOLVED) || '0', 10);

    // Update total
    total += 1;
    localStorage.setItem(STORAGE_KEYS.TOTAL_SOLVED, total.toString());

    // Update streak
    if (lastSolved !== today) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastSolved === yesterday.toDateString()) {
        streak += 1;
      } else {
        streak = 1; // Reset if broken, or start new
      }

      localStorage.setItem(STORAGE_KEYS.STREAK, streak.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_SOLVED, today);

      // Trigger streak toast
      if (streak > 1) {
        toast.success(`🔥 ${streak} Day Streak! Keep it up!`);
      } else {
        toast.success("🚀 First solve of the day!");
      }
    } else {
      // Already solved today
      const messages = [
        "Another one down! Great work.",
        "You're on a roll!",
        "Consistency is key 🔑",
        "Making progress!",
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      toast.success(randomMsg);
    }
  },

  getStats: () => {
    return {
      streak: parseInt(localStorage.getItem(STORAGE_KEYS.STREAK) || '0', 10),
      total: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SOLVED) || '0', 10),
    };
  }
};
