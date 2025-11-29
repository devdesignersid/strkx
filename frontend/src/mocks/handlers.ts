import { http, HttpResponse } from 'msw';
import { API_URL } from '@/config';

export const handlers = [
  // Study Stats
  http.get(`${API_URL}/study-stats/today`, () => {
    return HttpResponse.json({ totalStudySeconds: 3600 });
  }),

  http.post(`${API_URL}/study-stats/sync`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${API_URL}/study-stats/reset`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Auth
  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json({
      id: 'user1',
      email: 'demo@example.com',
      name: 'Demo User',
    });
  }),

  // Dashboard
  http.get(`${API_URL}/dashboard/stats`, () => {
    return HttpResponse.json({
      easy: 0,
      medium: 0,
      hard: 0,
      solved: 0,
      ranking: 0,
      weeklyChange: 0,
    });
  }),
  http.get(`${API_URL}/dashboard/activity`, () => {
    return HttpResponse.json([]);
  }),
  http.get(`${API_URL}/dashboard/heatmap`, () => {
    return HttpResponse.json([]);
  }),

  // Example handler
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
