import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const levelClass = user?.level >= 10 ? 'level-master' : user?.level >= 7 ? 'level-expert' : user?.level >= 5 ? 'level-advanced' : user?.level >= 3 ? 'level-intermediate' : 'level-novice';

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        🚀 LaunchPad <span>v2</span>
      </div>
      <div className={`nav-links ${open ? 'open' : ''}`}>
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/feed">Feed</NavLink>
        <NavLink to="/portfolio">Portfolio</NavLink>
        <NavLink to="/mentorship">Mentors</NavLink>
        <NavLink to="/university">Uni Plan</NavLink>
        <NavLink to="/work">Work</NavLink>
        <NavLink to="/freelance">Freelance</NavLink>
        <NavLink to="/skills">Skills</NavLink>
        <NavLink to="/rewards">🎮 {user?.coins || 0}</NavLink>
        <NavLink to="/messages">Messages</NavLink>
        <button onClick={() => { logout(); }}>Logout</button>
      </div>
      <div className="profile-section">
        <span className={`level-badge ${levelClass}`}>Lv.{user?.level}</span>
        <span className="streak-flame">🔥{user?.streak || 0}</span>
        <div className="avatar-small" onClick={() => navigate('/profile')}>
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <button className="btn btn-small" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '6px 10px' }} onClick={() => setOpen(!open)}>☰</button>
      </div>
    </nav>
  );
}
