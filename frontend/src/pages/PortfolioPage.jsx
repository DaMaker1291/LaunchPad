import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function PortfolioPage() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [projects, setProjects] = useState([]);
  const [badges, setBadges] = useState([]);
  const [journey, setJourney] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [credentials, setCredentials] = useState([]);
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
    fetch(`${API}/work/experiences`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setExperiences(d.experiences || [])).catch(() => {});
    fetch(`${API}/work/certificates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCertificates(d.certificates || [])).catch(() => {});
    fetch(`${API}/profiles/credentials`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCredentials(d.credentials || [])).catch(() => {}).catch(() => {});
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

      <div className="tabs" style={{ flexWrap: 'wrap' }}>
        <button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>Projects ({projects.length})</button>
        <button className={tab === 'badges' ? 'active' : ''} onClick={() => setTab('badges')}>Badges ({badges.length})</button>
        <button className={tab === 'work' ? 'active' : ''} onClick={() => setTab('work')}>Work ({experiences.length})</button>
        <button className={tab === 'certs' ? 'active' : ''} onClick={() => setTab('certs')}>Certificates ({certificates.length})</button>
        <button className={tab === 'credentials' ? 'active' : ''} onClick={() => setTab('credentials')}>Credentials ({credentials.length})</button>
        <button className={tab === 'journey' ? 'active' : ''} onClick={() => setTab('journey')}>Journey</button>
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

      {tab === 'work' && <div>
        {experiences.length === 0 && <div className="card text-center"><p style={{ color: '#666' }}>No work experiences yet. Complete a work module to build your resume!</p></div>}
        {experiences.map(e => (
          <div key={e.id} className="card mb-16" style={{ borderLeft: `3px solid ${e.certificate_id ? '#4ade80' : '#888'}` }}>
            <div className="flex-between">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 24 }}>💼</span>
                  <h4>{e.position}</h4>
                </div>
                <p style={{ color: '#a78bfa', fontWeight: 600, fontSize: 14, marginTop: 4 }}>{e.company}</p>
                <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  {new Date(e.start_date).toLocaleDateString()} — {e.end_date ? new Date(e.end_date).toLocaleDateString() : 'Present'}
                  <span className={`badge ${e.type === 'micro_internship' ? 'badge-blue' : 'badge-purple'}`} style={{ marginLeft: 8 }}>{e.type}</span>
                </p>
                {e.description && <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{e.description}</p>}
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {(e.skills_learned || []).map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {e.certificate_id && <a href={`${API}/work/certificates/${e.certificate_id}/render`} target="_blank" className="btn btn-primary btn-small">🎓 View Certificate</a>}
              </div>
            </div>
          </div>
        ))}
      </div>}

      {tab === 'certs' && <div className="grid-2">
        {certificates.map(c => (
          <div key={c.id} className="card" style={{ border: `1px solid ${c.grade === 'excellence' ? '#facc15' : c.grade === 'distinction' ? '#a78bfa' : c.grade === 'merit' ? '#60a5fa' : '#4ade80'}33` }}>
            <div className="flex-between"><span style={{ fontSize: 28 }}>🎓</span>
              <span className={`badge ${c.grade === 'excellence' ? 'badge-gold' : c.grade === 'distinction' ? 'badge-purple' : c.grade === 'merit' ? 'badge-blue' : 'badge-green'}`}>{c.grade}</span>
            </div>
            <h4 className="mt-8">{c.title}</h4>
            <p style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>{c.company}</p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{new Date(c.issued_at).toLocaleDateString()}</p>
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>{(c.skills || []).map(s => <span key={s} className="badge badge-blue">{s}</span>)}</div>
            <div className="flex-between mt-8" style={{ gap: 8 }}>
              <a href={`${API}/work/certificates/${c.id}/render`} target="_blank" className="btn btn-primary btn-small" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>🎨 View</a>
              <a href={`${API}/work/certificates/${c.id}/verify`} target="_blank" className="btn btn-secondary btn-small" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>🔗 Verify</a>
            </div>
          </div>
        ))}
        {certificates.length === 0 && <div className="card text-center" style={{ gridColumn: '1/-1' }}><p style={{ color: '#666' }}>No certificates yet.</p></div>}
      </div>}

      {tab === 'credentials' && <div className="badge-showcase" style={{ gap: 12 }}>
        {credentials.map(c => (
          <div key={c.id} className="badge-item" style={{ border: c.verified ? '1px solid #4ade8033' : '1px solid #333' }}>
            <div className="badge-icon">{c.verified ? '✅' : '⏳'}</div>
            <div className="badge-name" style={{ fontWeight: 600 }}>{c.skill}</div>
            <span className={`badge ${c.level === 'expert' ? 'badge-gold' : c.level === 'advanced' ? 'badge-purple' : c.level === 'intermediate' ? 'badge-blue' : 'badge-green'}`}>{c.level}</span>
            <span style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{c.source}</span>
            {c.verified && <span className="badge badge-green" style={{ fontSize: 10, marginTop: 2 }}>✓ Verified</span>}
          </div>
        ))}
        {credentials.length === 0 && <div className="card text-center" style={{ gridColumn: '1/-1' }}><p style={{ color: '#666' }}>Complete work modules to earn verified skill credentials.</p></div>}
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
