import React, { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
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

const API = 'http://localhost:3001/api';
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export { API };

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading) return <div className="flex-center" style={{ height: '100vh', background: '#0f0f1a', color: '#a78bfa', fontSize: 20 }}>🚀 LaunchPad loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {user && <Navbar />}
      <div className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" />} />
          <Route path="/profile/:id?" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/portfolio/:id?" element={user ? <PortfolioPage /> : <Navigate to="/login" />} />
          <Route path="/mentorship" element={user ? <Mentorship /> : <Navigate to="/login" />} />
          <Route path="/university" element={user ? <UniPlanning /> : <Navigate to="/login" />} />
          <Route path="/work" element={user ? <Work /> : <Navigate to="/login" />} />
          <Route path="/freelance" element={user ? <Freelance /> : <Navigate to="/login" />} />
          <Route path="/groups" element={user ? <Groups /> : <Navigate to="/login" />} />
          <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
          <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
          <Route path="/skills" element={user ? <SkillsHub /> : <Navigate to="/login" />} />
          <Route path="/rewards" element={user ? <Rewards /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}
