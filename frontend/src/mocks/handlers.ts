import { http, HttpResponse } from 'msw';

export const handlers = [
  // Study Stats
  http.get('http://localhost:3000/study-stats/today', () => {
    return HttpResponse.json({ totalStudySeconds: 3600 });
  }),

  http.post('http://localhost:3000/study-stats/sync', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('http://localhost:3000/study-stats/reset', () => {
    return HttpResponse.json({ success: true });
  }),

  // Dashboard
  http.get('http://localhost:3000/dashboard/stats', () => {
    return HttpResponse.json({
      easy: 0,
      medium: 0,
      hard: 0,
      solved: 0,
      ranking: 0,
      weeklyChange: 0,
    });
  }),
  http.get('http://localhost:3000/dashboard/activity', () => {
    return HttpResponse.json([]);
  }),
  http.get('http://localhost:3000/dashboard/heatmap', () => {
    return HttpResponse.json([]);
  }),

  // Example handler
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
