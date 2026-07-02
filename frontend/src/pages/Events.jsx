import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function Events() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', date: '', duration: 60, type: 'webinar', max_attendees: 100, location: '', online: true, link: '', tags: '' });

  useEffect(() => {
    fetch(`${API}/social/events`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setEvents(d.events || [])).catch(() => {});
  }, []);

  const createEvent = async () => {
    if (!form.title || !form.date) return;
    await fetch(`${API}/social/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, tags: form.tags.split(',').map(s => s.trim()).filter(Boolean) })
    });
    setShowCreate(false);
    const d = await fetch(`${API}/social/events`, { headers: { Authorization: `Bearer ${token}` } });
    setEvents((await d.json()).events || []);
  };

  const register = async (id) => {
    await fetch(`${API}/social/events/${id}/register`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await fetch(`${API}/social/events`, { headers: { Authorization: `Bearer ${token}` } });
    setEvents((await d.json()).events || []);
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  return (
    <div>
      <div className="flex-between mb-24">
        <h2 style={{ fontSize: 24 }}>📅 Events & Webinars</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Event</button>
      </div>
      {showCreate && <div className="modal-overlay" onClick={() => setShowCreate(false)}><div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create Event</h2>
        <div className="form-group"><label>Title</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
        <div className="form-group"><label>Description</label><textarea className="input textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        <div className="grid-2 gap-8">
          <div className="form-group"><label>Date/Time</label><input className="input" type="datetime-local" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
          <div className="form-group"><label>Type</label><select className="input select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="webinar">Webinar</option><option value="workshop">Workshop</option><option value="live_stream">Live Stream</option><option value="career_talk">Career Talk</option></select></div>
        </div>
        <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={createEvent}>Create</button></div>
      </div></div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['all', 'webinar', 'workshop', 'live_stream', 'career_talk'].map(f => <button key={f} className={`btn btn-${filter === f ? 'primary' : 'secondary'} btn-small`} onClick={() => setFilter(f)}>{f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}</button>)}
      </div>
      <div className="grid-2">{filtered.map(e => <div key={e.id} className="card">
        <div className="flex-between"><span className="badge badge-purple">{e.type.replace('_', ' ')}</span>{e.online ? <span className="badge badge-green">Online</span> : <span className="badge badge-blue">{e.location}</span>}</div>
        <h3 className="mt-8">{e.title}</h3><p style={{ color: '#888', fontSize: 14 }}>by {e.host_name}</p>
        <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{e.description?.substring(0, 100)}</p>
        <div className="flex-between mt-8">
          <span style={{ fontSize: 12, color: '#888' }}>📅 {new Date(e.date).toLocaleDateString()} · {e.duration}min</span>
          <span style={{ fontSize: 12, color: '#888' }}>👥 {e.attendees_count}/{e.max_attendees}</span>
        </div>
        <button className="btn btn-primary btn-small mt-8 btn-block" onClick={() => register(e.id)}>Register</button>
      </div>)}</div>
    </div>
  );
}
