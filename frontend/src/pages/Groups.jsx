import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function Groups() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '' });

  useEffect(() => {
    fetch(`${API}/social/groups`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setGroups(d.groups || [])).catch(() => {});
  }, []);

  const createGroup = async () => {
    if (!form.name) return;
    await fetch(`${API}/social/groups`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    setShowCreate(false); setForm({ name: '', description: '', category: '' });
    const d = await fetch(`${API}/social/groups`, { headers: { Authorization: `Bearer ${token}` } });
    setGroups((await d.json()).groups || []);
  };

  const joinGroup = async (id) => {
    await fetch(`${API}/social/groups/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await fetch(`${API}/social/groups`, { headers: { Authorization: `Bearer ${token}` } });
    setGroups((await d.json()).groups || []);
  };

  const categories = [...new Set(groups.map(g => g.category).filter(Boolean))];

  return (
    <div>
      <div className="flex-between mb-24">
        <h2 style={{ fontSize: 24 }}>👥 Groups</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Group</button>
      </div>
      {showCreate && <div className="modal-overlay" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create Group</h2>
        <div className="form-group"><label>Name</label><input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
        <div className="form-group"><label>Description</label><textarea className="input textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        <div className="form-group"><label>Category</label><input className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="STEM, Arts, Sports..." /></div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={createGroup}>Create</button></div>
      </div></div>}
      {categories.length > 0 && <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>{categories.map(c => <span key={c} className="badge badge-blue" style={{ cursor: 'pointer', padding: '6px 14px' }}>{c}</span>)}</div>}
      <div className="grid-3">{groups.map(g => <div key={g.id} className="card card-hover">
        <div style={{ fontSize: 36, marginBottom: 8 }}>{g.category === 'STEM' ? '🔬' : g.category === 'Arts' ? '🎨' : g.category === 'Business' ? '💼' : '👥'}</div>
        <h3>{g.name}</h3>
        {g.description && <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{g.description.substring(0, 80)}</p>}
        <div className="flex-between mt-12"><span style={{ fontSize: 13, color: '#888' }}>{g.member_count} members</span><button className="btn btn-primary btn-small" onClick={() => joinGroup(g.id)}>Join</button></div>
        {g.category && <span className="badge badge-purple mt-8" style={{ display: 'inline-block' }}>{g.category}</span>}
      </div>)}</div>
    </div>
  );
}
