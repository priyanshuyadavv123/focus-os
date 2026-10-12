export type RouteId =
  | 'overview'
  | 'timer'
  | 'roadmap'
  | 'projects'
  | 'revenue'
  | 'research'
  | 'analytics'
  | 'settings';

export interface RouteConfig {
  id: RouteId;
  hash: string;
  label: string;
}

export const ROUTES: Record<RouteId, RouteConfig> = {
  overview: { id: 'overview', hash: '#/overview', label: 'Overview' },
  timer: { id: 'timer', hash: '#/timer', label: 'Timer' },
  roadmap: { id: 'roadmap', hash: '#/roadmap', label: 'Roadmap' },
  projects: { id: 'projects', hash: '#/projects', label: 'Projects' },
  revenue: { id: 'revenue', hash: '#/revenue', label: 'Revenue' },
  research: { id: 'research', hash: '#/research', label: 'Research' },
  analytics: { id: 'analytics', hash: '#/analytics', label: 'Analytics' },
  settings: { id: 'settings', hash: '#/settings', label: 'Settings' },
};

export const ROUTE_LIST: RouteConfig[] = [
  ROUTES.overview,
  ROUTES.timer,
  ROUTES.roadmap,
  ROUTES.projects,
  ROUTES.revenue,
  ROUTES.research,
  ROUTES.analytics,
  ROUTES.settings,
];

export function parseHash(hash: string): RouteId | '404' {
  const clean = hash.trim().toLowerCase();
  if (clean === '' || clean === '#' || clean === '#/' || clean === '#/overview') {
    return 'overview';
  }
  if (clean === '#/timer') return 'timer';
  if (clean === '#/roadmap') return 'roadmap';
  if (clean === '#/projects') return 'projects';
  if (clean === '#/revenue') return 'revenue';
  if (clean === '#/research') return 'research';
  if (clean === '#/analytics') return 'analytics';
  if (clean === '#/settings') return 'settings';
  return '404';
}
