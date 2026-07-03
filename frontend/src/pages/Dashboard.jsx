import { useState, useEffect } from 'react';
import { Sparkles, Flame, GraduationCap, Briefcase, Award, ArrowUpRight, CheckCircle2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App.jsx';

export default function VibecodedDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({ xp: 0, level: 1, coins: 0, streak: 0, nextLevelXp: 100 });
  const [quests, setQuests] = useState([]);
  const [internships, setInternships] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);

  useEffect(() => {
    fetch(`${API}/gamification/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setStats(d); updateUser({ xp: d.xp, level: d.level, coins: d.coins, streak: d.streak }); }).catch(() => {});
    fetch(`${API}/gamification/quests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setQuests(d.quests || [])).catch(() => {});
    fetch(`${API}/work/modules`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setInternships((d.modules || d || []).slice(0, 2))).catch(() => {});
  }, []);

  const completeQuest = async (type) => {
    const res = await fetch(`${API}/gamification/quests/${type}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setStats(prev => ({ ...prev, xp: (prev.xp || 0) + (data.xp || 0), coins: (prev.coins || 0) + (data.coins || 0) }));
      setQuests(prev => prev.map(q => q.quest_type === type ? { ...q, completed: 1 } : q));
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00F5D4', '#6366F1', '#FF007A'] });
    }
  };

  const xpPct = stats.nextLevelXp > 0 ? Math.min(100, ((stats.xp % stats.nextLevelXp) / stats.nextLevelXp) * 100) : 0;

  return (
    <div className="min-h-screen text-zinc-100 p-0 sm:p-0 font-sans selection:bg-indigo-500/30">

      {/* ─── MAIN BENTO GRID ─── */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]">

        {/* HERO CARD: LEVEL & XP */}
        <section className="md:col-span-2 row-span-1 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_40px_rgba(255,255,255,0.02)]">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />
          <div>
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Status Engine</span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">Welcome back, {user?.name?.split(' ')[0] || 'Explorer'}.</h1>
            <p className="text-zinc-400 text-sm mt-1">You're pacing top {Math.max(1, 20 - stats.level)}% of your cohort.</p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-zinc-300">Level {stats.level}</span>
              <span className="text-xs text-zinc-500">{stats.xp % stats.nextLevelXp}/{stats.nextLevelXp} XP to Level {stats.level + 1}</span>
            </div>
            <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden p-[2px] border border-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-1000 animate-pulse"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* AI ADMISSIONS TICKET */}
        <section onClick={() => navigate('/university')} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">AI Admissions Copilot</h3>
            <p className="text-zinc-400 text-xs mt-1">Profile strength calculated from your activity.</p>
            <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {Math.min(100, (stats.xp / Math.max(1, stats.nextLevelXp * stats.level) * 50) + 50)}% Strength
            </div>
          </div>
        </section>

        {/* DAILY QUESTS (vertical span 2) */}
        <section className="row-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between group transition-all duration-300 hover:border-zinc-700">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold tracking-tight">Daily Quests</h3>
              {!checkedIn && quests.length === 0 && (
                <button onClick={async () => {
                  const res = await fetch(`${API}/gamification/checkin`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                  if (res.ok) {
                    const data = await res.json();
                    setCheckedIn(true);
                    setStats(prev => ({ ...prev, xp: data.xp, level: data.level, coins: data.coins, streak: data.streak }));
                    updateUser({ xp: data.xp, level: data.level, coins: data.coins, streak: data.streak });
                    fetch(`${API}/gamification/quests`, { headers: { Authorization: `Bearer ${token}` } })
                      .then(r => r.json()).then(d => setQuests(d.quests || [])).catch(() => {});
                  }
                }} className="text-xs bg-zinc-850 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all cursor-pointer">
                  Check In
                </button>
              )}
              {checkedIn && <span className="text-xs bg-zinc-850 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-400">Active</span>}
            </div>

            <div className="space-y-4">
              {(quests.length > 0 ? quests : []).map((quest) => (
                <div key={quest.id || quest.quest_type} className="flex gap-3 items-start p-3 rounded-2xl bg-zinc-950/40 border border-zinc-850/60 hover:bg-zinc-950 transition-colors">
                  <button
                    onClick={() => !quest.completed && completeQuest(quest.quest_type)}
                    className={`mt-0.5 rounded-md focus:outline-none transition-colors ${quest.completed ? 'text-emerald-400' : 'text-zinc-700 hover:text-zinc-500'}`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <div className="space-y-0.5">
                    <p className={`text-sm leading-tight ${quest.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                      {quest.description || quest.title}
                    </p>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold">+{quest.xp_reward || 0} XP</span>
                  </div>
                </div>
              ))}
              {quests.length === 0 && (
                <p className="text-zinc-500 text-sm text-center py-4">Check in to unlock daily quests!</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-850 text-center text-xs text-zinc-500">
            🔥 {stats.streak} day streak
          </div>
        </section>

        {/* MICRO-INTERNSHIPS PORTAL */}
        <section className="md:col-span-2 row-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:border-zinc-700">
          <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-pink-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-pink-500" />
                Live Micro-Internships
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">Bite-sized real experience from global partners.</p>
            </div>
            <button onClick={() => navigate('/work')} className="text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950 px-4 py-2 rounded-xl transition-all cursor-pointer">
              Browse All
            </button>
          </div>

          <div className="space-y-3 my-4">
            {(internships.length > 0 ? internships : [
              { id: '1', title: 'Frontend Dev Simulation', company: 'TechStart', estimated_hours: 5, category: 'Engineering' },
              { id: '2', title: 'Market Research Sprint', company: 'GreenEarth', estimated_hours: 4, category: 'Business' },
            ]).map((item, i) => (
              <div key={item.id || i} onClick={() => navigate('/work')} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/50 border border-zinc-850 hover:border-pink-500/30 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center font-bold text-xs text-zinc-400">
                    {item.company?.charAt(0).toUpperCase() || 'W'}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{item.title || item.role}</h4>
                    <p className="text-xs text-zinc-500">{item.company} • {item.estimated_hours || item.duration || '5'} hrs</p>
                  </div>
                </div>
                <span className="text-xs bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-xl text-pink-400 font-medium">Earn Coins</span>
              </div>
            ))}
          </div>
        </section>

        {/* VERIFIED SKILLS */}
        <section onClick={() => navigate('/skills')} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:border-pink-500/40 hover:shadow-[0_0_30px_rgba(244,63,94,0.08)]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-400">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs text-zinc-500 font-mono tracking-wider">{user?.level || 1} Level</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="text-center p-2 bg-zinc-950/60 rounded-xl border border-zinc-800">
                <div className="text-lg font-bold text-indigo-400">{stats.xp}</div>
                <div className="text-[10px] text-zinc-500">XP</div>
              </div>
              <div className="text-center p-2 bg-zinc-950/60 rounded-xl border border-zinc-800">
                <div className="text-lg font-bold text-amber-400">{stats.coins}</div>
                <div className="text-[10px] text-zinc-500">Coins</div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
