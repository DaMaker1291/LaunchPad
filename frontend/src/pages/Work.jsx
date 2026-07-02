import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function Work() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [tab, setTab] = useState('micro');
  const [micros, setMicros] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetch(`${API}/freelance/micro-internships`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMicros(d.internships || [])).catch(() => {});
    fetch(`${API}/freelance/enrollments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setEnrollments(d.enrollments || [])).catch(() => {});
    fetch(`${API}/freelance/apprenticeships`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPrograms(d.programs || [])).catch(() => {});
  }, []);

  const enrollMicro = async (id) => {
    await fetch(`${API}/freelance/micro-internships/${id}/enroll`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await fetch(`${API}/freelance/micro-internships`, { headers: { Authorization: `Bearer ${token}` } });
    setMicros((await d.json()).internships || []);
    const e = await fetch(`${API}/freelance/enrollments`, { headers: { Authorization: `Bearer ${token}` } });
    setEnrollments((await e.json()).enrollments || []);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 24 }}>💼 Work & Micro-Internships</h2>
      <div className="tabs">
        <button className={tab === 'micro' ? 'active' : ''} onClick={() => setTab('micro')}>Micro-Internships</button>
        <button className={tab === 'enrolled' ? 'active' : ''} onClick={() => setTab('enrolled')}>My Enrollments ({enrollments.length})</button>
        <button className={tab === 'apprenticeships' ? 'active' : ''} onClick={() => setTab('apprenticeships')}>Apprenticeships</button>
      </div>

      {tab === 'micro' && <div className="grid-2">
        {micros.map(m => <div key={m.id} className="card">
          <div className="flex-between">
            <span className="badge badge-purple">{m.category}</span>
            {m.sponsored ? <span className="badge badge-gold">Sponsored</span> : <span className="badge badge-blue">{m.duration_hours}hr</span>}
          </div>
          <h3 className="mt-8">{m.title}</h3>
          <p style={{ color: '#a78bfa', fontWeight: 600, fontSize: 14 }}>{m.company}</p>
          <p style={{ fontSize: 13, color: '#888', marginTop: 8, lineHeight: 1.5 }}>{m.description}</p>
          <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>{(m.skills || []).map(s => <span key={s} className="badge badge-blue">{s}</span>)}</div>
          <div className="flex-between mt-8">
            <span style={{ fontSize: 12, color: '#888' }}>🎯 {(m.spots_available || 0) - (m.spots_filled || 0)} spots left</span>
            {m.compensation && <span style={{ fontSize: 12, color: '#34d399' }}>🏆 {m.compensation}</span>}
          </div>
          <button className="btn btn-primary btn-small mt-8 btn-block" onClick={() => enrollMicro(m.id)} disabled={m.spots_filled >= m.spots_available}>Enroll Now</button>
        </div>)}
        {micros.length === 0 && <div className="card text-center" style={{ gridColumn: '1/-1' }}><p style={{ color: '#666' }}>No micro-internships available right now.</p></div>}
      </div>}

      {tab === 'enrolled' && <div className="grid-2">
        {enrollments.map(e => <div key={e.id} className="card">
          <h4>{e.title}</h4>
          <p style={{ color: '#888', fontSize: 14 }}>{e.company} · {e.category}</p>
          <div className="mt-8"><div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${e.progress}%` }} /></div><span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>{e.progress}% complete</span></div>
          <span className={`badge mt-8 ${e.status === 'completed' ? 'badge-green' : e.status === 'in_progress' ? 'badge-blue' : 'badge-orange'}`}>{e.status}</span>
        </div>)}
      </div>}

      {tab === 'apprenticeships' && <div className="grid-2">
        {programs.map(p => <div key={p.id} className="card">
          <h4>{p.title}</h4>
          <p style={{ color: '#a78bfa', fontWeight: 600 }}>{p.company}</p>
          <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{p.field} · {p.duration_months} months · {p.paid ? '💰 Paid' : 'Unpaid'}</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>{p.description}</p>
          <div className="flex-between mt-8"><span className="badge badge-purple">Min age: {p.age_min}</span><span className="badge badge-blue">{p.location || 'Various'}</span></div>
        </div>)}
      </div>}
    </div>
  );
}
