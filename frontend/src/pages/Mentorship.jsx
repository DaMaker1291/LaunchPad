import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function Mentorship() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [tab, setTab] = useState('browse');
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [cohorts, setCohorts] = useState([]);

  useEffect(() => {
    fetch(`${API}/mentorship/mentors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setMentors(d.mentors || [])).catch(() => {});
    fetch(`${API}/mentorship/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setRequests(d)).catch(() => {});
    fetch(`${API}/mentorship/cohorts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCohorts(d.cohorts || [])).catch(() => {});
  }, []);

  const sendRequest = async (mentorId) => {
    await fetch(`${API}/mentorship/requests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mentor_id: mentorId, message: 'I would love to learn from you!' })
    });
    const d = await fetch(`${API}/mentorship/requests`, { headers: { Authorization: `Bearer ${token}` } });
    setRequests(await d.json());
  };

  const respondRequest = async (id, status) => {
    await fetch(`${API}/mentorship/requests/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    const d = await fetch(`${API}/mentorship/requests`, { headers: { Authorization: `Bearer ${token}` } });
    setRequests(await d.json());
  };

  const joinCohort = async (id) => {
    await fetch(`${API}/mentorship/cohorts/${id}/join`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const d = await fetch(`${API}/mentorship/cohorts`, { headers: { Authorization: `Bearer ${token}` } });
    setCohorts((await d.json()).cohorts || []);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 24 }}>🧑‍🏫 Global Mentorship Matrix</h2>
      <div className="tabs">
        <button className={tab === 'browse' ? 'active' : ''} onClick={() => setTab('browse')}>Find Mentors</button>
        <button className={tab === 'requests' ? 'active' : ''} onClick={() => setTab('requests')}>Requests ({requests.sent.length + requests.received.length})</button>
        <button className={tab === 'cohorts' ? 'active' : ''} onClick={() => setTab('cohorts')}>Peer Cohorts ({cohorts.length})</button>
      </div>

      {tab === 'browse' && <div className="grid-3">
        {mentors.filter(m => m.user_id !== user?.id).map(m => <div key={m.id} className="mentor-card">
          <div className="mentor-avatar">{m.name?.charAt(0)?.toUpperCase()}</div>
          <h3>{m.name}</h3>
          <p style={{ color: '#888', fontSize: 14 }}>{m.job_title} {m.company && `at ${m.company}`}</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{m.bio?.substring(0, 80)}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', margin: '12px 0' }}>
            {(m.expertise || []).slice(0, 3).map(e => <span key={e} className="badge badge-purple">{e}</span>)}
          </div>
          <button className="btn btn-primary btn-small" onClick={() => sendRequest(m.user_id)}>Request Mentorship</button>
        </div>)}
      </div>}

      {tab === 'requests' && <div className="grid-2">
        <div className="card"><div className="card-header">📤 Sent</div>
          {requests.sent.map(r => <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between' }}>
            <div><strong>{r.name}</strong><span className={`badge ml-8 ${r.status === 'pending' ? 'badge-orange' : r.status === 'accepted' ? 'badge-green' : 'badge-red'}`} style={{ marginLeft: 8 }}>{r.status}</span></div>
          </div>)}
        </div>
        <div className="card"><div className="card-header">📥 Received</div>
          {requests.received.map(r => <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid #2a2a4a' }}>
            <div className="flex-between"><div><strong>{r.name}</strong></div>
              {r.status === 'pending' && <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-success btn-small" onClick={() => respondRequest(r.id, 'accepted')}>Accept</button><button className="btn btn-danger btn-small" onClick={() => respondRequest(r.id, 'rejected')}>Decline</button></div>}</div>
            <span className={`badge ${r.status === 'pending' ? 'badge-orange' : r.status === 'accepted' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
          </div>)}
        </div>
      </div>}

      {tab === 'cohorts' && <div className="grid-3">
        {cohorts.map(c => <div key={c.id} className="card card-hover">
          <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
          <h3>{c.name || 'Peer Cohort'}</h3>
          <p style={{ fontSize: 13, color: '#888' }}>{c.description}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span className="badge badge-purple">{c.skill_focus || 'General'}</span>
            <span className="badge badge-blue">{c.member_count}/{c.size} members</span>
          </div>
          <button className="btn btn-primary btn-small mt-8" onClick={() => joinCohort(c.id)} disabled={c.member_count >= c.size}>Join Cohort</button>
        </div>)}
      </div>}
    </div>
  );
}
