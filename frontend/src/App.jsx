import React, { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Feed from './pages/Feed.jsx';
import Profile from './pages/Profile.jsx';
import PortfolioPage from './pages/PortfolioPage.jsx';
import Mentorship from './pages/Mentorship.jsx';
import UniPlanning from './pages/UniPlanning.jsx';
import Work from './pages/Work.jsx';
import Freelance from './pages/Freelance.jsx';
import Groups from './pages/Groups.jsx';
import Events from './pages/Events.jsx';
import Messages from './pages/Messages.jsx';
import SkillsHub from './pages/SkillsHub.jsx';
import Rewards from './pages/Rewards.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Onboarding from './pages/Onboarding.jsx';
import { setupPushNotifications } from './services/mobile.js';

const ONBOARDING_KEY = 'lp_onboarding_done';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export { API };

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { setupPushNotifications(); }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch { localStorage.clear(); setLoading(false); return; }
      fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: JSON.parse(saved).email, password: 'revalidate' })
      }).then(r => r.json()).then(d => {
        if (d.token) { login(d.token, d.user); }
      }).catch(() => {}).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setUser(null); navigate('/login');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated); localStorage.setItem('user', JSON.stringify(updated));
  };

  if (loading) return <div className="flex items-center justify-center" style={{ height: '100vh', background: '#09090B', color: '#00F5D4', fontSize: 20 }}>LaunchPad loading...</div>;

  const onboarded = localStorage.getItem(ONBOARDING_KEY);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={onboarded ? '/' : '/onboarding'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={onboarded ? '/' : '/onboarding'} /> : <Register />} />
        <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={onboarded ? <Dashboard /> : <Navigate to="/onboarding" />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile/:id?" element={<Profile />} />
          <Route path="/portfolio/:id?" element={<PortfolioPage />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/university" element={<UniPlanning />} />
          <Route path="/work" element={<Work />} />
          <Route path="/freelance" element={<Freelance />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/events" element={<Events />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/skills" element={<SkillsHub />} />
          <Route path="/rewards" element={<Rewards />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}
