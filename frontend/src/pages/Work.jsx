import React, { useState, useEffect } from 'react';
import { useAuth, API } from '../App.jsx';
import { useNavigate } from 'react-router-dom';
import { shareCertificate } from '../services/mobile.js';

export default function Work() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [tab, setTab] = useState('modules');
  const [modules, setModules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [submissionText, setSubmissionText] = useState('');

  useEffect(() => {
    fetch(`${API}/work/modules`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setModules(d.modules || [])).catch(() => {});
    fetch(`${API}/work/enrollments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setEnrollments(d.enrollments || [])).catch(() => {});
    fetch(`${API}/work/certificates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCertificates(d.certificates || [])).catch(() => {});
    fetch(`${API}/work/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  const enrollModule = async (id) => {
    const r = await fetch(`${API}/work/modules/${id}/enroll`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) { const e = await r.json(); alert(e.error); return; }
    const data = await r.json();
    const es = await fetch(`${API}/work/enrollments`, { headers: { Authorization: `Bearer ${token}` } });
    setEnrollments((await es.json()).enrollments || []);
    setSelected({ id: data.id });
  };

  const openEnrollment = async (eId) => {
    const r = await fetch(`${API}/work/enrollments/${eId}`, { headers: { Authorization: `Bearer ${token}` } });
    setSelected(await r.json());
  };

  const submitStep = async (stepIdx) => {
    if (!submissionText.trim()) return alert('Write your submission first');
    const eId = selected.id;
    await fetch(`${API}/work/enrollments/${eId}/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ step_index: stepIdx, content: submissionText, notes: '' })
    });
    await fetch(`${API}/work/enrollments/${eId}/step`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ step_index: stepIdx, action: 'complete' })
    });
    setSubmissionText('');
    openEnrollment(eId);
    const es = await fetch(`${API}/work/enrollments`, { headers: { Authorization: `Bearer ${token}` } });
    setEnrollments((await es.json()).enrollments || []);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>💼 Work Experience Hub</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 16, background: '#1e1b4b' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#a78bfa' }}>{stats.total_enrolled || 0}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Enrolled</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 16, background: '#0f3b1e' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>{stats.total_completed || 0}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Completed</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 16, background: '#1e1b4b' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#facc15' }}>{stats.total_certificates || 0}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Certificates</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 120, textAlign: 'center', padding: 16, background: '#1b1f3e' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#60a5fa' }}>{stats.total_hours || 0}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Hours Earned</div>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'modules' ? 'active' : ''} onClick={() => { setTab('modules'); setSelected(null); }}>Browse Modules</button>
        <button className={tab === 'enrolled' ? 'active' : ''} onClick={() => { setTab('enrolled'); setSelected(null); }}>My Work ({enrollments.length})</button>
        <button className={tab === 'certs' ? 'active' : ''} onClick={() => { setTab('certs'); setSelected(null); }}>Certificates ({certificates.length})</button>
      </div>

      {selected && tab === 'enrolled' && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="flex-between">
            <div>
              <h3>{selected.title}</h3>
              <p style={{ color: '#a78bfa', fontWeight: 600, fontSize: 14 }}>{selected.company}</p>
            </div>
            <span className={`badge ${selected.status === 'completed' ? 'badge-green' : selected.status === 'in_progress' ? 'badge-blue' : selected.status === 'submitted' ? 'badge-orange' : 'badge-purple'}`}>{selected.status}</span>
          </div>
          <div className="mt-16">
            <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${selected.progress}%` }} /></div>
            <span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>{selected.progress}% · Step {selected.current_step}/{selected.steps?.length || 0}</span>
          </div>

          {selected.certificate && (
            <div className="mt-16" style={{ background: '#0f3b1e', border: '1px solid #4ade8033', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>🎓</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#4ade80' }}>Certificate Earned!</strong>
                  <p style={{ fontSize: 13, color: '#888' }}>{selected.certificate.title}</p>
                </div>
                <a href={`${API}/work/certificates/${selected.certificate.id}/render`} target="_blank" className="btn btn-primary btn-small">View Certificate</a>
              </div>
            </div>
          )}

          <div className="mt-16">
            <h4 style={{ marginBottom: 12, color: '#ccc' }}>Module Steps</h4>
            {selected.steps?.map((step, i) => {
              const sub = selected.submissions?.find(s => s.step_index === i);
              return (
                <div key={i} className="card" style={{ marginBottom: 8, padding: 12, borderLeft: `3px solid ${sub?.status === 'approved' ? '#4ade80' : sub?.status === 'submitted' ? '#facc15' : '#333'}` }}>
                  <div className="flex-between">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="badge badge-blue">Step {i + 1}</span>
                        {sub?.status && <span className={`badge ${sub.status === 'approved' ? 'badge-green' : sub.status === 'submission' ? 'badge-orange' : 'badge-purple'}`}>{sub.status}</span>}
                        {selected.current_step > i && !sub && <span className="badge badge-green">✓ Done</span>}
                      </div>
                      <strong style={{ display: 'block', marginTop: 4 }}>{step.title || `Step ${i + 1}`}</strong>
                      <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{step.description || ''}</p>
                      {step.deliverable && <p style={{ fontSize: 12, color: '#a78bfa', marginTop: 4 }}>📦 {step.deliverable}</p>}
                      {sub?.review_notes && <p style={{ fontSize: 12, color: '#facc15', marginTop: 4 }}>Review: {sub.review_notes}</p>}
                    </div>
                    {i === selected.current_step && selected.status !== 'completed' && !sub?.status === 'approved' && (
                      <div style={{ minWidth: 240, marginLeft: 16 }}>
                        <textarea className="input textarea" style={{ height: 60, fontSize: 12 }} placeholder="Your work submission..." value={submissionText} onChange={e => setSubmissionText(e.target.value)} />
                        <button className="btn btn-primary btn-small mt-4 btn-block" onClick={() => submitStep(i)}>Submit</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-secondary btn-small mt-8" onClick={() => setSelected(null)}>← Back to list</button>
        </div>
      )}

      {tab === 'modules' && !selected && <div className="grid-2 mt-16">
        {modules.map(m => (
          <div key={m.id} className="card">
            <div className="flex-between">
              <span className={`badge ${m.difficulty === 'beginner' ? 'badge-green' : m.difficulty === 'intermediate' ? 'badge-orange' : 'badge-red'}`}>{m.difficulty}</span>
              <span className="badge badge-purple">{m.duration_hours}hr</span>
            </div>
            <h3 className="mt-8">{m.title}</h3>
            <p style={{ color: '#a78bfa', fontWeight: 600, fontSize: 14 }}>{m.company}</p>
            <p style={{ fontSize: 13, color: '#888', marginTop: 8, lineHeight: 1.5 }}>{m.description?.substring(0, 150)}</p>
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
              {(m.skills || []).map(s => <span key={s} className="badge badge-blue">{s}</span>)}
            </div>
            <div className="flex-between mt-8">
              <span style={{ fontSize: 12, color: '#888' }}>📋 {(m.steps || []).length} steps · 🎯 {m.spots_available - m.spots_filled} spots</span>
              {m.compensation && <span style={{ fontSize: 12, color: '#34d399' }}>🏆 {m.compensation}</span>}
            </div>
            <button className="btn btn-primary btn-small mt-8 btn-block" onClick={() => enrollModule(m.id)} disabled={m.spots_filled >= m.spots_available}>Enroll Now</button>
          </div>
        ))}
        {modules.length === 0 && <div className="card text-center" style={{ gridColumn: '1/-1' }}><p style={{ color: '#666' }}>No work modules available. Check back soon!</p></div>}
      </div>}

      {tab === 'enrolled' && !selected && <div className="grid-2 mt-16">
        {enrollments.map(e => (
          <div key={e.id} className="card card-hover" onClick={() => openEnrollment(e.id)} style={{ cursor: 'pointer' }}>
            <div className="flex-between">
              <span className={`badge ${e.status === 'completed' ? 'badge-green' : e.status === 'in_progress' ? 'badge-blue' : 'badge-purple'}`}>{e.status}</span>
              <span className="badge badge-purple">{e.difficulty}</span>
            </div>
            <h4 className="mt-8">{e.title}</h4>
            <p style={{ color: '#888', fontSize: 13 }}>{e.company} · {e.category}</p>
            <div className="mt-8"><div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${e.progress}%` }} /></div><span style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'block' }}>{e.progress}% · Step {e.current_step}/{e.steps?.length || 0}</span></div>
          </div>
        ))}
        {enrollments.length === 0 && <div className="card text-center" style={{ gridColumn: '1/-1' }}><p style={{ color: '#666' }}>No enrollments yet. Browse modules to start!</p></div>}
      </div>}

      {tab === 'certs' && <div className="mt-16">
        <div className="grid-2">
          {certificates.map(c => (
            <div key={c.id} className="card" style={{ border: `1px solid ${c.grade === 'excellence' ? '#facc15' : c.grade === 'distinction' ? '#a78bfa' : c.grade === 'merit' ? '#60a5fa' : '#4ade80'}33` }}>
              <div className="flex-between">
                <span style={{ fontSize: 28 }}>🎓</span>
                <span className={`badge ${c.grade === 'excellence' ? 'badge-gold' : c.grade === 'distinction' ? 'badge-purple' : c.grade === 'merit' ? 'badge-blue' : 'badge-green'}`}>{c.grade}</span>
              </div>
              <h4 className="mt-8">{c.title}</h4>
              <p style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>{c.company}</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{new Date(c.issued_at).toLocaleDateString()}</p>
              <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>{(c.skills || []).map(s => <span key={s} className="badge badge-blue">{s}</span>)}</div>
              <div className="flex-between mt-8" style={{ gap: 6 }}>
                <a href={`${API}/work/certificates/${c.id}/render`} target="_blank" className="btn btn-primary btn-small" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>View</a>
                <a href={`${API}/work/certificates/${c.id}/verify`} target="_blank" className="btn btn-secondary btn-small" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>Verify</a>
                <button className="btn btn-secondary btn-small" style={{ flex: 1 }} onClick={() => shareCertificate(c.id, c.title)}>Share</button>
              </div>
            </div>
          ))}
        </div>
        {certificates.length === 0 && <div className="card text-center"><p style={{ color: '#666' }}>Complete a work module to earn your first certificate!</p></div>}
      </div>}
    </div>
  );
}
