import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const profileId = id || user?.id;
  const isOwn = profileId === user?.id;
  const token = localStorage.getItem('token');
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', location: '', school: '', grade: '', interests: '', skills: '', goals: '' });
  const [tab, setTab] = useState('about');

  useEffect(() => {
    fetch(`${API}/profiles/${profileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setData(d);
        if (isOwn && d.user) setForm({
          bio: d.user.bio || '', location: d.user.location || '', school: d.user.school || '',
          grade: d.user.grade || '', interests: (d.user.interests || []).join(', '),
          skills: (d.user.skills || []).join(', '), goals: (d.user.goals || []).join(', ')
        });
      }).catch(() => {});
  }, [profileId]);

  const handleSave = async () => {
    const interestsArr = form.interests.split(',').map(s => s.trim()).filter(Boolean);
    const skillsArr = form.skills.split(',').map(s => s.trim()).filter(Boolean);
    const goalsArr = form.goals.split(',').map(s => s.trim()).filter(Boolean);
    const res = await fetch(`${API}/profiles/${profileId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, interests: interestsArr, skills: skillsArr, goals: goalsArr })
    });
    if (res.ok) { updateUser({ ...form, interests: interestsArr, skills: skillsArr, goals: goalsArr }); setEditing(false); }
  };

  if (!data) return <div className="text-center" style={{ padding: 60, color: '#666' }}>Loading profile...</div>;
  const { user: profile, projects, badges, endorsements, journey, academics, extracurriculars } = data;

  return (
    <div>
      <div className="profile-header mb-24">
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div className="profile-avatar">{profile.name?.charAt(0)?.toUpperCase()}</div>
          <div className="profile-info" style={{ flex: 1 }}>
            <div className="flex-between">
              <div>
                <h2>{profile.name} {profile.verified && <span style={{ fontSize: 16 }}>✓</span>}</h2>
                <p className="bio">{profile.bio || 'No bio yet'}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {profile.school && <span className="badge" style={{ background: 'rgba(255,255,255,0.12)' }}>🏫 {profile.school}</span>}
                  {profile.grade && <span className="badge" style={{ background: 'rgba(255,255,255,0.12)' }}>Grade {profile.grade}</span>}
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', textTransform: 'capitalize' }}>{profile.role}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.12)' }}>Lv.{profile.level}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isOwn && <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={() => navigate('/portfolio')}>My Portfolio</button>}
                {isOwn && <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }} onClick={() => editing ? handleSave() : setEditing(true)}>{editing ? 'Save' : 'Edit'}</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {['about', 'academics', 'projects', 'badges', 'journey'].map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'about' && (
        <div className="grid-2">
          <div className="card"><div className="card-header">📋 About</div>
            {editing ? <>
              <div className="form-group"><label>Bio</label><textarea className="input textarea" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></div>
              <div className="form-group"><label>Location</label><input className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
              <div className="form-group"><label>School</label><input className="input" value={form.school} onChange={e => setForm({...form, school: e.target.value})} /></div>
              <div className="form-group"><label>Grade</label><input className="input" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} /></div>
            </> : <>
              <p><strong>School:</strong> {profile.school || 'Not set'}</p>
              <p><strong>Grade:</strong> {profile.grade || 'Not set'}</p>
              <p><strong>Location:</strong> {profile.location || 'Not set'}</p>
              <p><strong>Level:</strong> {profile.level} · <strong>XP:</strong> {profile.xp} · <strong>Streak:</strong> {profile.streak} days</p>
              <p><strong>Joined:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
            </>}
          </div>
          <div className="card"><div className="card-header">🎯 Interests & Skills</div>
            {editing ? <>
              <div className="form-group"><label>Interests (comma separated)</label><textarea className="input textarea" value={form.interests} onChange={e => setForm({...form, interests: e.target.value})} /></div>
              <div className="form-group"><label>Skills</label><textarea className="input textarea" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} /></div>
              <div className="form-group"><label>Goals</label><textarea className="input textarea" value={form.goals} onChange={e => setForm({...form, goals: e.target.value})} /></div>
            </> : <>
              <p style={{ fontWeight: 600, marginBottom: 8, color: '#a78bfa' }}>Interests</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>{(profile.interests || []).map(i => <span key={i} className="badge badge-purple">{i}</span>)}</div>
              <p style={{ fontWeight: 600, marginBottom: 8, color: '#a78bfa' }}>Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>{(profile.skills || []).map(s => <span key={s} className="badge badge-green">{s}</span>)}</div>
              <p style={{ fontWeight: 600, marginBottom: 8, color: '#a78bfa' }}>Goals</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{(profile.goals || []).map(g => <span key={g} className="badge badge-blue">{g}</span>)}</div>
            </>}
          </div>
        </div>
      )}

      {tab === 'academics' && (
        <div className="grid-2">
          <div className="card"><div className="card-header">📚 Grades</div>
            {academics?.map(a => <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2a2a4a' }}><span>{a.subject} {a.ap_class ? '(AP)' : ''}</span><span style={{ color: a.score >= 90 ? '#34d399' : a.score >= 80 ? '#facc15' : '#f87171', fontWeight: 700 }}>{a.grade} ({a.score}%)</span></div>)}
          </div>
          <div className="card"><div className="card-header">🏅 Extracurriculars</div>
            {extracurriculars?.map(e => <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid #2a2a4a' }}><strong>{e.activity}</strong><br /><span style={{ fontSize: 13, color: '#888' }}>{e.role} · {e.hours_per_week} hrs/week</span></div>)}
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="portfolio-grid">
          {projects?.map(p => <div key={p.id} className="card"><div style={{ fontSize: 28, marginBottom: 8 }}>{p.project_type === 'code' ? '💻' : p.project_type === 'art' ? '🎨' : p.project_type === 'essay' ? '📝' : p.project_type === 'speech' ? '🎤' : '📁'}</div><h4>{p.title}</h4><p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{p.description}</p><div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>{(p.tags || []).map(t => <span key={t} className="badge badge-purple">{t}</span>)}</div></div>)}
          {(!projects || projects.length === 0) && <div className="card text-center" style={{ gridColumn: '1/-1' }}><p style={{ color: '#666' }}>No projects yet.</p></div>}
        </div>
      )}

      {tab === 'badges' && (
        <div className="badge-showcase" style={{ gap: 16 }}>
          {badges?.map(b => <div key={b.id} className="badge-item" style={{ minWidth: 120 }}><div className="badge-icon">🏅</div><div className="badge-name" style={{ fontWeight: 600 }}>{b.skill}</div><span className={`badge ${b.level === 'expert' ? 'badge-gold' : b.level === 'advanced' ? 'badge-purple' : b.level === 'intermediate' ? 'badge-blue' : 'badge-green'}`}>{b.level}</span></div>)}
          {(!badges || badges.length === 0) && <p style={{ color: '#666' }}>No badges earned yet.</p>}
        </div>
      )}

      {tab === 'journey' && (
        <div className="planning-timeline">
          {journey?.map(j => <div key={j.id} className="timeline-item card"><h4>{j.icon} {j.title}</h4><p style={{ fontSize: 13, color: '#888' }}>{j.description}</p><span className="badge badge-purple mt-8" style={{ display: 'inline-block' }}>{j.entry_type}</span></div>)}
          {(!journey || journey.length === 0) && <div className="card text-center"><p style={{ color: '#666' }}>No journey entries yet.</p></div>}
        </div>
      )}
    </div>
  );
}
