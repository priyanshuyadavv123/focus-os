import { useState, useEffect } from 'react';
import { parseHash, RouteId } from './routes';
import { Shell } from './Shell';
import { NotFound } from './NotFound';

import { OverviewView } from '@/features/dashboard/OverviewView';
import { TimerView } from '@/features/timer/TimerView';
import { RoadmapView } from '@/features/roadmap/RoadmapView';
import { ProjectsView } from '@/features/projects/ProjectsView';
import { RevenueView } from '@/features/revenue/RevenueView';
import { ResearchView } from '@/features/research/ResearchView';
import { AnalyticsView } from '@/features/analytics/AnalyticsView';
import { SettingsView } from '@/features/settings/SettingsView';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<RouteId | '404'>(() => {
    return parseHash(typeof window !== 'undefined' ? window.location.hash : '');
  });

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderView = () => {
    switch (currentRoute) {
      case 'overview':
        return <OverviewView />;
      case 'timer':
        return <TimerView />;
      case 'roadmap':
        return <RoadmapView />;
      case 'projects':
        return <ProjectsView />;
      case 'revenue':
        return <RevenueView />;
      case 'research':
        return <ResearchView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      case '404':
      default:
        return <NotFound />;
    }
  };

  return <Shell currentRoute={currentRoute}>{renderView()}</Shell>;
}
