import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Rocket, LayoutDashboard, Globe, User, Briefcase, GraduationCap,
  MessageSquare, Users, Calendar, Trophy, Coins, Award, LogOut, Flame, FileCode, CheckSquare,
  Sparkles, Menu, X
} from 'lucide-react';
import { useAuth } from '../App.jsx';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Feed', path: '/feed', icon: Globe },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Portfolio', path: '/portfolio', icon: FileCode },
  { name: 'Mentorship', path: '/mentorship', icon: GraduationCap },
  { name: 'Uni Planning', path: '/university', icon: Award },
  { name: 'Work', path: '/work', icon: Briefcase },
  { name: 'Freelance', path: '/freelance', icon: Coins },
  { name: 'Groups', path: '/groups', icon: Users },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Messages', path: '/messages', icon: MessageSquare },
  { name: 'Skills Hub', path: '/skills', icon: CheckSquare },
  { name: 'Rewards', path: '/rewards', icon: Trophy },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#09090B] text-zinc-50 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-[#09090B] border-r border-zinc-800 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-black shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            L
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            LaunchPad
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                  active
                    ? 'bg-zinc-900 border border-zinc-800 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 text-sm font-medium text-pink-500/80 hover:bg-pink-500/10 hover:text-pink-400 border border-transparent hover:border-pink-500/20">
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Floating Glass Header */}
        <header className="sticky top-4 z-50 flex items-center justify-between border border-zinc-800 bg-zinc-900/75 mx-4 mt-4 px-6 py-3 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-zinc-400 hover:text-zinc-200" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="md:hidden h-8 w-8 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              L
            </div>
            <h1 className="font-semibold text-lg hidden sm:block tracking-tight text-zinc-100">
              {NAV_ITEMS.find(n => n.path === location.pathname)?.name || 'LaunchPad'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-orange-400 text-sm font-medium shadow-[0_0_15px_rgba(249,115,22,0.05)]">
              <Flame className="w-4 h-4 fill-orange-500/20" />
              <span className="hidden sm:inline">{user?.streak || 0} Day Streak</span>
              <span className="sm:hidden">{user?.streak || 0}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>{user?.coins || 0}</span>
            </div>

            <button onClick={() => navigate('/profile')} className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 cursor-pointer hover:border-indigo-400 transition-colors flex items-center justify-center text-sm font-bold text-indigo-400">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-64 bg-[#09090B] h-full border-r border-zinc-800 p-4 pt-20 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
                        active
                          ? 'bg-zinc-900 border border-zinc-800 text-indigo-400'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      {item.name}
                    </Link>
                  );
                })}
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-pink-500/80 hover:bg-pink-500/10 border border-transparent hover:border-pink-500/20 mt-4">
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
          <div className="max-w-7xl mx-auto pt-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
