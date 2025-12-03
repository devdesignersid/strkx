import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/api/dashboard.service';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  });
};

export const useDashboardActivity = () => {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: dashboardService.getActivity,
  });
};

export const useDashboardHeatmap = () => {
  return useQuery({
    queryKey: ['dashboard', 'heatmap'],
    queryFn: dashboardService.getHeatmap,
  });
};
