import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function PortfolioPage() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [projects, setProjects] = useState([]);
  const [badges, setBadges] = useState([]);
  const [journey, setJourney] = useState([]);
  const [tab, setTab] = useState('projects');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', project_type: 'code', media_url: '', tags: '' });

  useEffect(() => {
    fetch(`${API}/portfolio/projects/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setProjects(d.projects || [])).catch(() => {});
    fetch(`${API}/portfolio/badges/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setBadges(d.badges || [])).catch(() => {});
    fetch(`${API}/portfolio/journey/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setJourney(d.entries || [])).catch(() => {});
  }, []);

  const addProject = async () => {
    if (!form.title) return;
    await fetch(`${API}/portfolio/projects`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) })
    });
    setShowAdd(false); setForm({ title: '', description: '', project_type: 'code', media_url: '', tags: '' });
    const d = await fetch(`${API}/portfolio/projects/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
    setProjects((await d.json()).projects || []);
  };

  const addJourney = async () => {
    const title = prompt('What milestone would you like to add?');
    if (!title) return;
    await fetch(`${API}/portfolio/journey`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, date: new Date().toISOString().split('T')[0], entry_type: 'milestone' })
    });
    const d = await fetch(`${API}/portfolio/journey/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
    setJourney((await d.json()).entries || []);
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <h2 style={{ fontSize: 24 }}>🎨 My Living Portfolio</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={addJourney}>+ Add Timeline Entry</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Project</button>
        </div>
      </div>

      {showAdd && <div className="modal-overlay" onClick={() => setShowAdd(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Portfolio Project</h2>
        <div className="form-group"><label>Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
        <div className="form-group"><label>Description</label><textarea className="input textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        <div className="grid-2 gap-8">
          <div className="form-group"><label>Type</label><select className="input select" value={form.project_type} onChange={e => setForm({...form, project_type: e.target.value})}>
            <option value="code">Code</option><option value="art">Art</option><option value="essay">Essay</option><option value="robotics">Robotics</option><option value="speech">Speech</option><option value="video">Video</option><option value="other">Other</option></select></div>
          <div className="form-group"><label>Media URL</label><input className="input" value={form.media_url} onChange={e => setForm({...form, media_url: e.target.value})} /></div>
        </div>
        <div className="form-group"><label>Tags (comma separated)</label><input className="input" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} /></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={addProject}>Add</button></div>
      </div></div>}

      <div className="tabs">
        <button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>Projects ({projects.length})</button>
        <button className={tab === 'badges' ? 'active' : ''} onClick={() => setTab('badges')}>Badges ({badges.length})</button>
        <button className={tab === 'journey' ? 'active' : ''} onClick={() => setTab('journey')}>My Journey</button>
      </div>

      {tab === 'projects' && <div className="portfolio-grid">
        {projects.map(p => <div key={p.id} className="card card-hover">
          <div style={{ fontSize: 32, marginBottom: 8 }}>{p.project_type === 'code' ? '💻' : p.project_type === 'art' ? '🎨' : p.project_type === 'essay' ? '📝' : p.project_type === 'robotics' ? '🤖' : p.project_type === 'speech' ? '🎤' : '📁'}</div>
          <h4>{p.title}</h4><p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{p.description}</p>
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>{(p.tags || []).map(t => <span key={t} className="badge badge-purple">{t}</span>)}</div>
        </div>)}
      </div>}

      {tab === 'badges' && <div className="badge-showcase" style={{ gap: 16 }}>
        {badges.map(b => <div key={b.id} className="badge-item" style={{ minWidth: 130 }}>
          <div className="badge-icon">🏅</div>
          <div className="badge-name" style={{ fontWeight: 600 }}>{b.skill}</div>
          <span className={`badge ${b.level === 'expert' ? 'badge-gold' : b.level === 'advanced' ? 'badge-purple' : b.level === 'intermediate' ? 'badge-blue' : 'badge-green'}`}>{b.level}</span>
          {b.verified && <span className="badge badge-green" style={{ fontSize: 10, marginTop: 4 }}>✓ Verified</span>}
        </div>)}
      </div>}

      {tab === 'journey' && <div className="planning-timeline">
        {journey.map(j => <div key={j.id} className="timeline-item card">
          <h4>{j.icon || '⭐'} {j.title}</h4>
          {j.description && <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{j.description}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className="badge badge-purple">{j.entry_type}</span>
            <span className="badge badge-blue">{new Date(j.date).toLocaleDateString()}</span>
          </div>
        </div>)}
      </div>}
    </div>
  );
}
