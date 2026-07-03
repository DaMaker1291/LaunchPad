import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, Briefcase, MessageSquare, User } from 'lucide-react';

const TABS = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/feed', icon: Globe, label: 'Feed' },
  { path: '/work', icon: Briefcase, label: 'Work' },
  { path: '/messages', icon: MessageSquare, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-800 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {TABS.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 relative ${
                active ? 'text-neon-cyan' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {active && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-cyan shadow-[0_0_6px_rgba(0,245,212,0.8)]" />
              )}
              <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_8px_rgba(0,245,212,0.5)]' : ''}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-neon-cyan' : 'text-zinc-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
