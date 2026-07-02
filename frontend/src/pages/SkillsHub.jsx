import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function SkillsHub() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [tab, setTab] = useState('badges');
  const [badges, setBadges] = useState([]);
  const [resources, setResources] = useState([]);
  const [showBadge, setShowBadge] = useState(false);
  const [badgeForm, setBadgeForm] = useState({ skill: '', level: 'basic' });
  const [showResource, setShowResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', url: '', type: 'article', category: '' });

  useEffect(() => {
    fetch(`${API}/portfolio/badges/${user.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setBadges(d.badges || [])).catch(() => {});
    fetch(`${API}/social/resources`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setResources(d.resources || [])).catch(() => {});
  }, []);

  const addBadge = async () => {
    if (!badgeForm.skill) return;
    await fetch(`${API}/portfolio/badges`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(badgeForm)
    });
    setShowBadge(false); setBadgeForm({ skill: '', level: 'basic' });
    const d = await fetch(`${API}/portfolio/badges/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
    setBadges((await d.json()).badges || []);
  };

  const addResource = async () => {
    if (!resourceForm.title) return;
    await fetch(`${API}/social/resources`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(resourceForm)
    });
    setShowResource(false); setResourceForm({ title: '', description: '', url: '', type: 'article', category: '' });
    const d = await fetch(`${API}/skills/resources`, { headers: { Authorization: `Bearer ${token}` } });
    setResources((await d.json()).resources || []);
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <h2 style={{ fontSize: 24 }}>⚡ Skills & Badges</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowResource(true)}>+ Share Resource</button>
          <button className="btn btn-primary" onClick={() => setShowBadge(true)}>+ Earn Badge</button>
        </div>
      </div>
      {showBadge && <div className="modal-overlay" onClick={() => setShowBadge(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Verify a Skill</h2>
        <div className="form-group"><label>Skill</label><input className="input" value={badgeForm.skill} onChange={e => setBadgeForm({...badgeForm, skill: e.target.value})} placeholder="e.g. Python, Public Speaking" /></div>
        <div className="form-group"><label>Level</label><select className="input select" value={badgeForm.level} onChange={e => setBadgeForm({...badgeForm, level: e.target.value})}><option value="basic">Basic</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowBadge(false)}>Cancel</button><button className="btn btn-primary" onClick={addBadge}>Add Badge</button></div>
      </div></div>}
      {showResource && <div className="modal-overlay" onClick={() => setShowResource(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Share Resource</h2>
        <div className="form-group"><label>Title</label><input className="input" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} /></div>
        <div className="form-group"><label>URL</label><input className="input" value={resourceForm.url} onChange={e => setResourceForm({...resourceForm, url: e.target.value})} /></div>
        <div className="form-group"><label>Description</label><textarea className="input textarea" value={resourceForm.description} onChange={e => setResourceForm({...resourceForm, description: e.target.value})} /></div>
        <div className="grid-2 gap-8"><div className="form-group"><label>Type</label><select className="input select" value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value})}><option value="article">Article</option><option value="video">Video</option><option value="course">Course</option><option value="tool">Tool</option></select></div><div className="form-group"><label>Category</label><input className="input" value={resourceForm.category} onChange={e => setResourceForm({...resourceForm, category: e.target.value})} /></div></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowResource(false)}>Cancel</button><button className="btn btn-primary" onClick={addResource}>Share</button></div>
      </div></div>}
      <div className="tabs">
        <button className={tab === 'badges' ? 'active' : ''} onClick={() => setTab('badges')}>My Badges ({badges.length})</button>
        <button className={tab === 'resources' ? 'active' : ''} onClick={() => setTab('resources')}>Resources ({resources.length})</button>
      </div>
      {tab === 'badges' && <div className="badge-showcase" style={{ gap: 16 }}>{badges.map(b => <div key={b.id} className="badge-item" style={{ minWidth: 130 }}>
        <div className="badge-icon">🏅</div><div className="badge-name" style={{ fontWeight: 600 }}>{b.skill}</div>
        <span className={`badge ${b.level === 'expert' ? 'badge-gold' : b.level === 'advanced' ? 'badge-purple' : b.level === 'intermediate' ? 'badge-blue' : 'badge-green'}`}>{b.level}</span>
        {b.verified && <span className="badge badge-green" style={{ fontSize: 10, marginTop: 4 }}>✓ Verified</span>}
        <span style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Score: {b.challenge_score}/100</span>
      </div>)}</div>}
      {tab === 'resources' && <div className="grid-2">{resources.map(r => <div key={r.id} className="resource-card">
        <div className="resource-icon">{r.type === 'video' ? '🎬' : r.type === 'course' ? '📚' : r.type === 'tool' ? '🛠️' : '📄'}</div>
        <div style={{ flex: 1 }}><h4>{r.title}</h4><p style={{ fontSize: 13, color: '#888' }}>{r.description}</p><div style={{ display: 'flex', gap: 6, marginTop: 6 }}><span className="badge badge-purple">{r.type}</span>{r.category && <span className="badge badge-blue">{r.category}</span>}</div>{r.url && <a href={r.url} target="_blank" className="btn btn-outline btn-small mt-8" style={{ display: 'inline-block' }}>Open</a>}</div>
      </div>)}</div>}
    </div>
  );
}
