import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';

export default function UniPlanning() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [tab, setTab] = useState('explore');
  const [unis, setUnis] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [search, setSearch] = useState('');
  const [predictResult, setPredictResult] = useState(null);
  const [selectedUni, setSelectedUni] = useState('');

  useEffect(() => {
    fetch(`${API}/admissions/universities`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setUnis(d.universities || [])).catch(() => {});
    fetch(`${API}/admissions/predictions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPredictions(d.predictions || [])).catch(() => {});
    fetch(`${API}/admissions/scholarships`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setScholarships(d.scholarships || [])).catch(() => {});
    fetch(`${API}/admissions/hubs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setHubs(d.hubs || [])).catch(() => {});
  }, []);

  const predictAdmission = async () => {
    if (!selectedUni) return;
    const res = await fetch(`${API}/admissions/predict`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ university_id: selectedUni })
    });
    const data = await res.json();
    setPredictResult(data);
  };

  const filtered = unis.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 24 }}>🎓 Next-Gen Uni Planning</h2>
      <div className="tabs">
        <button className={tab === 'explore' ? 'active' : ''} onClick={() => setTab('explore')}>Explore</button>
        <button className={tab === 'predict' ? 'active' : ''} onClick={() => setTab('predict')}>AI Admissions</button>
        <button className={tab === 'scholarships' ? 'active' : ''} onClick={() => setTab('scholarships')}>Scholarships</button>
        <button className={tab === 'hubs' ? 'active' : ''} onClick={() => setTab('hubs')}>Campus Hubs</button>
      </div>

      {tab === 'explore' && <>
        <div className="search-bar"><input className="input" placeholder="Search universities..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="grid-3">{filtered.map(u => <div key={u.id} className="card card-hover">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏛️</div>
          <h3>{u.name}</h3>
          <p style={{ color: '#888', fontSize: 14 }}>{u.city}, {u.country}</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.4 }}>{u.description?.substring(0, 100)}...</p>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(u.programs || []).slice(0, 3).map(p => <span key={p} className="badge badge-blue">{p}</span>)}</div>
          <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>💰 {u.tuition_fee}</p>
        </div>)}</div>
      </>}

      {tab === 'predict' && <div className="grid-2">
        <div className="card">
          <div className="card-header">🤖 AI Admissions Counselor</div>
          <div className="form-group"><label>Select University</label>
            <select className="input select" value={selectedUni} onChange={e => setSelectedUni(e.target.value)}>
              <option value="">Choose...</option>{unis.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary btn-glow" onClick={predictAdmission} disabled={!selectedUni}>Predict My Chances 🎯</button>
          {predictResult && <div className="mt-16" style={{ textAlign: 'center', padding: 20, background: 'rgba(124,58,237,0.08)', borderRadius: 12 }}>
            <div style={{ fontSize: 48, fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{predictResult.probability}%</div>
            <p style={{ color: '#888' }}>Admission Probability</p>
            <div className="xp-bar mt-16"><div className="xp-bar-fill" style={{ width: `${predictResult.probability}%` }} /></div>
          </div>}
          {predictResult?.recommendations?.length > 0 && <div className="mt-16">
            <p style={{ fontWeight: 600, color: '#a78bfa', marginBottom: 8 }}>📋 Recommendations</p>
            {predictResult.recommendations.map((r, i) => <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #2a2a4a', fontSize: 14 }}>• {r}</div>)}
          </div>}
        </div>
        <div className="card">
          <div className="card-header">📊 Your Predictions</div>
          {predictions.map(p => <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid #2a2a4a' }}>
            <div className="flex-between"><strong>{p.university_name}</strong><span style={{ fontSize: 20, fontWeight: 700, color: p.probability >= 70 ? '#34d399' : p.probability >= 40 ? '#facc15' : '#f87171' }}>{p.probability}%</span></div>
          </div>)}
          {predictions.length === 0 && <p style={{ color: '#666' }}>Run your first prediction!</p>}
        </div>
      </div>}

      {tab === 'scholarships' && <div className="grid-2">
        {scholarships.map(s => <div key={s.id} className="card">
          <h4>{s.name}</h4>
          <p style={{ color: '#a78bfa', fontWeight: 700, fontSize: 18 }}>{s.amount}</p>
          <p style={{ fontSize: 13, color: '#888' }}>{s.provider}</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{s.description}</p>
          <div className="flex-between mt-8"><span className="badge badge-purple">{s.category}</span><span className="badge badge-orange">Due: {new Date(s.deadline).toLocaleDateString()}</span></div>
        </div>)}
      </div>}

      {tab === 'hubs' && <div className="grid-3">
        {hubs.map(h => <div key={h.id} className="card card-hover">
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏛️</div>
          <h3>{h.name || h.university_name}</h3>
          <p style={{ fontSize: 13, color: '#888' }}>{h.description}</p>
          <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{h.member_count} members · {h.university_name}</p>
        </div>)}
      </div>}
    </div>
  );
}
