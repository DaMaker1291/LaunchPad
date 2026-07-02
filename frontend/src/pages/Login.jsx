import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      login(data.token, data.user);
      navigate('/');
    } catch { setError('Connection error. Ensure the server is running on port 3001.'); }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="text-center mb-24">
          <div className="logo-text">🚀 LaunchPad</div>
          <p style={{ marginTop: 8 }}>Login to continue your journey</p>
        </div>
        {error && <div className="badge badge-red" style={{ marginBottom: 16, padding: '8px 16px', width: '100%' }}>{error}</div>}
        <div className="form-group"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required /></div>
        <div className="form-group"><label>Password</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required /></div>
        <button className="btn btn-primary btn-large btn-block mt-16" type="submit">Sign In</button>
        <p className="text-center mt-16" style={{ color: '#888' }}>New here? <Link to="/register" style={{ color: '#a78bfa', fontWeight: 600 }}>Create Account</Link></p>
        <div className="mt-16" style={{ padding: 12, background: 'rgba(124,58,237,0.08)', borderRadius: 10, fontSize: 12, color: '#888' }}>
          <strong style={{ color: '#a78bfa' }}>Demo:</strong> alex@example.com / password123
        </div>
      </form>
    </div>
  );
}
