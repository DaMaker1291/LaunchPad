import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App.jsx';

const quickLinks = [
  { to: '/feed', icon: '📱', title: 'Feed', desc: 'See what others share', color: '#7c3aed' },
  { to: '/portfolio', icon: '🎨', title: 'My Portfolio', desc: 'Showcase your work', color: '#4f46e5' },
  { to: '/mentorship', icon: '🧑‍🏫', title: 'Mentors', desc: 'Find guidance', color: '#059669' },
  { to: '/university', icon: '🎓', title: 'Uni Planning', desc: 'Plan your future', color: '#3b82f6' },
  { to: '/work', icon: '💼', title: 'Micro-Internships', desc: 'Earn experience', color: '#d97706' },
  { to: '/freelance', icon: '💻', title: 'Freelance', desc: 'Find paid gigs', color: '#dc2626' },
  { to: '/skills', icon: '⚡', title: 'Skill Badges', desc: 'Get verified', color: '#7c3aed' },
  { to: '/rewards', icon: '🏆', title: 'Rewards', desc: 'Redeem coins', color: '#facc15' },
];

const greetings = ['Ready to level up today?', 'Your future starts now!', 'Small steps lead to big wins.', 'Another day to grow!'];

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [stats, setStats] = useState({ xp: 0, level: 1, coins: 0, streak: 0, nextLevelXp: 100 });
  const [quests, setQuests] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [greeting] = useState(() => greetings[Math.floor(Math.random() * greetings.length)]);

  useEffect(() => {
    fetch(`${API}/gamification/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {});
    fetch(`${API}/gamification/quests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setQuests(d.quests || [])).catch(() => {});
  }, []);

  const handleCheckin = async () => {
    const res = await fetch(`${API}/gamification/checkin`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setCheckedIn(true);
      if (data.xp !== undefined) {
        setStats(prev => ({ ...prev, xp: data.xp, level: data.level, coins: data.coins, streak: data.streak }));
        updateUser({ xp: data.xp, level: data.level, coins: data.coins, streak: data.streak });
      }
    }
  };

  const completeQuest = async (type) => {
    const res = await fetch(`${API}/gamification/quests/${type}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setStats(prev => ({ ...prev, xp: (prev.xp || 0) + (data.xp || 0), coins: (prev.coins || 0) + (data.coins || 0) }));
      setQuests(prev => prev.map(q => q.quest_type === type ? { ...q, completed: 1 } : q));
    }
  };

  const levelClass = stats.level >= 10 ? 'level-master' : stats.level >= 7 ? 'level-expert' : stats.level >= 5 ? 'level-advanced' : stats.level >= 3 ? 'level-intermediate' : 'level-novice';

  return (
    <div>
      <div className="profile-header mb-24">
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
          <div className="profile-info" style={{ flex: 1 }}>
            <div className="flex-between">
              <div>
                <h2>Welcome back, {user?.name?.split(' ')[0]}!</h2>
                <p className="bio">{greeting}</p>
              </div>
              <div className="text-center">
                <span className={`level-badge ${levelClass}`} style={{ fontSize: 16, padding: '4px 16px' }}>Level {stats.level}</span>
                <div className="mt-8">
                  <span className="streak-flame" style={{ fontSize: 18 }}>🔥 {stats.streak} day streak</span>
                </div>
              </div>
            </div>
            <div className="xp-bar mt-16" style={{ maxWidth: 400 }}>
              <div className="xp-bar-fill" style={{ width: `${Math.min(100, (stats.xp % stats.nextLevelXp) / stats.nextLevelXp * 100)}%` }} />
            </div>
            <div className="flex-between" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              <span>{stats.xp} XP</span>
              <span>{stats.nextLevelXp} XP to next level</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="card stat-card"><div className="stat-number">{stats.xp}</div><div className="stat-label">Total XP</div></div>
        <div className="card stat-card"><div className="stat-number">{stats.coins}</div><div className="stat-label">LaunchPad Coins</div></div>
        <div className="card stat-card"><div className="stat-number">{quests.filter(q => q.completed).length}/{quests.length}</div><div className="stat-label">Daily Quests</div></div>
        <div className="card stat-card"><div className="stat-number">{stats.streak}</div><div className="stat-label">Day Streak 🔥</div></div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header">🎯 Today's Quests</div>
          {quests.map(q => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #2a2a4a' }}>
              <span style={{ fontSize: 20 }}>{q.completed ? '✅' : '⬜'}</span>
              <div style={{ flex: 1 }}>
                <span style={{ textDecoration: q.completed ? 'line-through' : 'none', opacity: q.completed ? 0.6 : 1 }}>{q.description}</span>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>+{q.xp_reward} XP · +{q.coin_reward} coins</div>
              </div>
              {!q.completed && <button className="btn btn-primary btn-small" onClick={() => completeQuest(q.quest_type)}>Complete</button>}
            </div>
          ))}
          {quests.length === 0 && <p style={{ color: '#666' }}>Check in to get your daily quests!</p>}
        </div>

        <div className="card">
          <div className="card-header">🚀 Quick Launch</div>
          <div className="quick-grid">
            {quickLinks.map(link => (
              <div key={link.to} className="card card-hover" style={{ cursor: 'pointer', padding: '16px', textAlign: 'center', borderTop: `3px solid ${link.color}` }} onClick={() => navigate(link.to)}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{link.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{link.title}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{link.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!checkedIn && (
        <div className="card mb-24" style={{ background: 'linear-gradient(135deg, #1a1a2e, #1e1e3a)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="flex-between">
            <div>
              <div className="card-header">📅 Daily Check-in</div>
              <p style={{ color: '#888', fontSize: 14 }}>Check in daily to maintain your streak and earn rewards!</p>
            </div>
            <button className="btn btn-primary btn-large btn-glow" onClick={handleCheckin}>Check In 🎯</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">🏆 Your Badges</div>
        <div className="badge-showcase">
          {[{ icon: '🐍', name: 'Python' }, { icon: '⚛️', name: 'React' }, { icon: '🔬', name: 'Research' }].map(b => (
            <div key={b.name} className="badge-item">
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-name">{b.name}</div>
              <span className="badge badge-purple" style={{ fontSize: 10, marginTop: 4 }}>Verified</span>
            </div>
          ))}
          <div className="badge-item" style={{ border: '2px dashed rgba(124,58,237,0.2)', cursor: 'pointer' }} onClick={() => navigate('/skills')}>
            <div className="badge-icon" style={{ opacity: 0.5 }}>+</div>
            <div className="badge-name" style={{ color: '#666' }}>Add Skill</div>
          </div>
        </div>
      </div>
    </div>
  );
}
