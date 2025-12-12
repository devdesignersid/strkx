export interface DashboardStatsDto {
  solved: number;
  attempted: number;
  accuracy: number;
  streak: number;
  easy: number;
  medium: number;
  hard: number;
  weeklyChange: number;
  systemDesignSolved: number;
  totalHours: number;
  studyTime?: string; // Today's study time formatted as "Xh Ym" or "Xm"
}

export interface DashboardActivityDto {
  id: string;
  problemTitle: string;
  problemSlug: string;
  difficulty: string;
  status: string;
  timestamp: Date;
  type: 'coding' | 'system-design';
}

export interface DashboardHeatmapDto {
  date: string;
  count: number;
}
