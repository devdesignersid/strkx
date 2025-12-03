import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Code2, Settings, Zap, PanelLeftClose, PanelLeftOpen, List, Brain, Boxes } from 'lucide-react';
import { useState } from 'react';
import FloatingTimer from '../features/study-timer/components/FloatingTimer';
import ReminderSystem from '../features/study-timer/components/ReminderSystem';

export default function Layout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/mock-interview', icon: Brain, label: 'Mock Interview' },
    { path: '/problems', icon: Code2, label: 'Coding Problems' },
    { path: '/system-design', icon: Boxes, label: 'System Design' },
    { path: '/lists', icon: List, label: 'Problem Lists' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`border-r border-border bg-card flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-border ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg text-foreground whitespace-nowrap">Strkx</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-3 h-3" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    flex items-center rounded-md text-sm font-medium transition-colors overflow-hidden
                    ${isCollapsed ? 'justify-center px-3 py-2' : 'gap-3 px-3 py-2'}
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Settings at bottom */}
        <div className="p-3 border-t border-border">
          <Link
            to="/settings"
            title={isCollapsed ? 'Settings' : undefined}
            className={`
              flex items-center rounded-md text-sm font-medium transition-colors overflow-hidden
              ${isCollapsed ? 'justify-center px-3 py-2' : 'gap-3 px-3 py-2'}
              ${location.pathname === '/settings'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }
            `}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <FloatingTimer />
      <ReminderSystem />
    </div>
  );
}
