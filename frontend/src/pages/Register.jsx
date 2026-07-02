import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', age: 13, role: 'student' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      login(data.token, data.user);
      navigate('/profile');
    } catch { setError('Connection error.'); }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="text-center mb-24">
          <div className="logo-text">🚀 LaunchPad</div>
          <p style={{ marginTop: 8 }}>Join the ultimate teen growth platform</p>
        </div>
        {error && <div className="badge badge-red" style={{ marginBottom: 16, width: '100%', padding: '8px 16px' }}>{error}</div>}
        <div className="form-group"><label>Full Name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" required /></div>
        <div className="form-group"><label>Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your@email.com" required /></div>
        <div className="form-group"><label>Password</label><input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters" minLength={6} required /></div>
        <div className="grid-2 gap-8">
          <div className="form-group"><label>Age</label><input className="input" type="number" min={12} max={100} value={form.age} onChange={e => setForm({...form, age: Number(e.target.value)})} required /></div>
          <div className="form-group"><label>I am a</label><select className="input select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}><option value="student">Student</option><option value="mentor">Mentor</option></select></div>
        </div>
        <button className="btn btn-primary btn-large btn-block mt-8" type="submit">Launch My Account 🚀</button>
        <p className="text-center mt-16" style={{ color: '#888' }}>Already have an account? <Link to="/login" style={{ color: '#a78bfa', fontWeight: 600 }}>Sign In</Link></p>
      </form>
    </div>
  );
}
