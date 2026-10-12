import { useState, type ReactNode } from 'react';
import { RouteId, ROUTE_LIST, ROUTES } from './routes';
import {
  OverviewIcon,
  TimerIcon,
  RoadmapIcon,
  ProjectsIcon,
  RevenueIcon,
  ResearchIcon,
  AnalyticsIcon,
  SettingsIcon,
  MoreIcon,
  CloseIcon,
} from '@/design/icons';
import { MiniTimerBar } from '@/features/timer/MiniTimerBar';
import '@/design/layout.css';

interface ShellProps {
  currentRoute: RouteId | '404';
  children: ReactNode;
}

function getRouteIcon(id: RouteId) {
  switch (id) {
    case 'overview':
      return <OverviewIcon />;
    case 'timer':
      return <TimerIcon />;
    case 'roadmap':
      return <RoadmapIcon />;
    case 'projects':
      return <ProjectsIcon />;
    case 'revenue':
      return <RevenueIcon />;
    case 'research':
      return <ResearchIcon />;
    case 'analytics':
      return <AnalyticsIcon />;
    case 'settings':
      return <SettingsIcon />;
  }
}

export function Shell({ currentRoute, children }: ShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const mainBottomRoutes = [
    ROUTES.overview,
    ROUTES.timer,
    ROUTES.roadmap,
    ROUTES.projects,
    ROUTES.revenue,
  ];

  const moreRoutes = [ROUTES.research, ROUTES.analytics, ROUTES.settings];

  return (
    <div className="app-layout">
      {/* Desktop Sidebar (>= 1024px) */}
      <nav className="sidebar" aria-label="Main Navigation">
        <a href="#/overview" className="sidebar-brand">
          <span className="sidebar-brand-title">FOCUS OS</span>
        </a>

        <div className="sidebar-nav">
          {ROUTE_LIST.map((route) => {
            const isActive = currentRoute === route.id;
            return (
              <a
                key={route.id}
                href={route.hash}
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {getRouteIcon(route.id)}
                <span>{route.label}</span>
              </a>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <span>v1.0 · Local-first</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <MiniTimerBar currentRoute={currentRoute} />
        <div className="content-area">{children}</div>
      </div>

      {/* Mobile Bottom Bar (< 1024px) */}
      <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
        {mainBottomRoutes.map((route) => {
          const isActive = currentRoute === route.id;
          return (
            <a
              key={route.id}
              href={route.hash}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {getRouteIcon(route.id)}
              <span>{route.label}</span>
            </a>
          );
        })}

        <button
          type="button"
          className={`bottom-nav-item ${moreRoutes.some((r) => r.id === currentRoute) ? 'active' : ''}`}
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-label="More navigation items"
        >
          <MoreIcon />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More Popover */}
      {moreOpen && (
        <div
          className="more-popover-backdrop"
          onClick={() => setMoreOpen(false)}
          role="presentation"
        >
          <div
            className="more-popover"
            role="dialog"
            aria-modal="true"
            aria-label="Additional Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="more-popover-header">
              <span className="more-popover-title">More Views</span>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                style={{ padding: '4px', minWidth: '36px', minHeight: '36px' }}
              >
                <CloseIcon size={18} />
              </button>
            </div>
            {moreRoutes.map((route) => {
              const isActive = currentRoute === route.id;
              return (
                <a
                  key={route.id}
                  href={route.hash}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {getRouteIcon(route.id)}
                  <span>{route.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
