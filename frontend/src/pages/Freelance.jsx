import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function Freelance() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [tab, setTab] = useState('browse');
  const [gigs, setGigs] = useState([]);
  const [myGigs, setMyGigs] = useState({ posted: [], applied: [] });
  const [showPost, setShowPost] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', budget: '', duration: '', skills_needed: '' });

  useEffect(() => {
    fetch(`${API}/freelance/gigs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setGigs(d.gigs || [])).catch(() => {});
    fetch(`${API}/freelance/my-gigs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMyGigs(d)).catch(() => {});
  }, []);

  const postGig = async () => {
    if (!form.title) return;
    await fetch(`${API}/freelance/gigs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, skills_needed: form.skills_needed.split(',').map(s => s.trim()).filter(Boolean) })
    });
    setShowPost(false); setForm({ title: '', description: '', category: '', budget: '', duration: '', skills_needed: '' });
    const d = await fetch(`${API}/freelance/gigs`, { headers: { Authorization: `Bearer ${token}` } });
    setGigs((await d.json()).gigs || []);
  };

  const applyGig = async (gigId) => {
    await fetch(`${API}/freelance/gigs/${gigId}/apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: 'I can do this!', bid: '' })
    });
    const d = await fetch(`${API}/freelance/my-gigs`, { headers: { Authorization: `Bearer ${token}` } });
    setMyGigs(await d.json());
  };

  return (
    <div>
      <div className="flex-between mb-24">
        <h2 style={{ fontSize: 24 }}>💻 Teen Freelance Board</h2>
        <button className="btn btn-primary" onClick={() => setShowPost(true)}>+ Post a Gig</button>
      </div>

      {showPost && <div className="modal-overlay" onClick={() => setShowPost(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Post a Freelance Gig</h2>
        <div className="form-group"><label>Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
        <div className="form-group"><label>Description</label><textarea className="input textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        <div className="grid-2 gap-8">
          <div className="form-group"><label>Category</label><input className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Design, Coding, Tutoring..." /></div>
          <div className="form-group"><label>Budget</label><input className="input" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="$20" /></div>
          <div className="form-group"><label>Duration</label><input className="input" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="1 week" /></div>
          <div className="form-group"><label>Skills Needed</label><input className="input" value={form.skills_needed} onChange={e => setForm({...form, skills_needed: e.target.value})} placeholder="comma separated" /></div>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowPost(false)}>Cancel</button><button className="btn btn-primary" onClick={postGig}>Post Gig</button></div>
      </div></div>}

      <div className="tabs">
        <button className={tab === 'browse' ? 'active' : ''} onClick={() => setTab('browse')}>Browse Gigs ({gigs.length})</button>
        <button className={tab === 'posted' ? 'active' : ''} onClick={() => setTab('posted')}>My Posted ({myGigs.posted?.length || 0})</button>
        <button className={tab === 'applied' ? 'active' : ''} onClick={() => setTab('applied')}>My Applications ({myGigs.applied?.length || 0})</button>
      </div>

      {tab === 'browse' && <div className="grid-2">
        {gigs.map(g => <div key={g.id} className="card"><div className="flex-between"><span className="badge badge-purple">{g.category}</span><span className="badge badge-blue">{g.budget}</span></div>
          <h4 className="mt-8">{g.title}</h4><p style={{ fontSize: 13, color: '#888' }}>{g.description?.substring(0, 100)}</p>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>{(g.skills_needed || []).map(s => <span key={s} className="badge badge-blue">{s}</span>)}</div>
          <div className="flex-between mt-8"><span style={{ fontSize: 12, color: '#666' }}>Posted by {g.poster_name}</span><button className="btn btn-primary btn-small" onClick={() => applyGig(g.id)}>Apply</button></div>
        </div>)}
      </div>}

      {tab === 'posted' && <div>{myGigs.posted?.map(g => <div key={g.id} className="card mb-16"><h4>{g.title}</h4><p style={{ fontSize: 13, color: '#888' }}>{g.category} · {g.budget} · {g.applicants} applicants</p><span className={`badge ${g.status === 'open' ? 'badge-green' : 'badge-orange'}`}>{g.status}</span></div>)}</div>}

      {tab === 'applied' && <div>{myGigs.applied?.map(a => <div key={a.id} className="card mb-16"><h4>{a.title}</h4><p style={{ fontSize: 13, color: '#888' }}>{a.category} · {a.budget}</p><span className={`badge ${a.app_status === 'accepted' ? 'badge-green' : a.app_status === 'rejected' ? 'badge-red' : 'badge-orange'}`}>{a.app_status}</span></div>)}</div>}
    </div>
  );
}
