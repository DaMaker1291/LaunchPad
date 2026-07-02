import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/mentors', (req, res) => {
  const mentors = db.prepare(`SELECT m.*, u.name, u.avatar, u.bio, u.school, u.cohort FROM mentors m JOIN users u ON m.user_id = u.id`).all();
  mentors.forEach(m => { m.expertise = JSON.parse(m.expertise || '[]'); m.availability = JSON.parse(m.availability || '{}'); });
  res.json({ mentors });
});

router.post('/mentors', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM mentors WHERE user_id = ?').get(req.user.id);
  if (existing) return res.status(409).json({ error: 'Already a mentor' });
  const { expertise, company, job_title, bio } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO mentors (id, user_id, expertise, company, job_title, bio) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, JSON.stringify(expertise || []), company || '', job_title || '', bio || '');
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run('mentor', req.user.id);
  res.status(201).json({ id });
});

router.post('/requests', authenticateToken, (req, res) => {
  const { mentor_id, message } = req.body;
  if (!mentor_id) return res.status(400).json({ error: 'Mentor ID required' });
  const existing = db.prepare('SELECT id FROM mentorship_requests WHERE student_id = ? AND mentor_id = ? AND status = ?').get(req.user.id, mentor_id, 'pending');
  if (existing) return res.status(409).json({ error: 'Request already sent' });
  const id = uuidv4();
  db.prepare('INSERT INTO mentorship_requests (id, student_id, mentor_id, message) VALUES (?, ?, ?, ?)').run(id, req.user.id, mentor_id, message || '');
  res.status(201).json({ id });
});

router.get('/requests', authenticateToken, (req, res) => {
  const sent = db.prepare(`SELECT mr.*, u.name, u.avatar FROM mentorship_requests mr JOIN users u ON mr.mentor_id = u.id WHERE mr.student_id = ?`).all(req.user.id);
  const received = db.prepare(`SELECT mr.*, u.name, u.avatar FROM mentorship_requests mr JOIN users u ON mr.student_id = u.id WHERE mr.mentor_id = ?`).all(req.user.id);
  res.json({ sent, received });
});

router.put('/requests/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE mentorship_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  if (status === 'accepted') {
    db.prepare('UPDATE mentors SET sessions_count = sessions_count + 1 WHERE user_id = (SELECT mentor_id FROM mentorship_requests WHERE id = ?)').run(req.params.id);
  }
  res.json({ success: true });
});

router.get('/cohorts', (req, res) => {
  const cohorts = db.prepare('SELECT * FROM peer_cohorts WHERE status != ? ORDER BY created_at DESC').all('completed');
  res.json({ cohorts });
});

router.post('/cohorts', authenticateToken, (req, res) => {
  const { name, description, skill_focus, size } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = uuidv4();
  db.prepare('INSERT INTO peer_cohorts (id, name, description, skill_focus, size, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, description || '', skill_focus || '', size || 5, req.user.id);
  db.prepare('INSERT INTO cohort_members (id, cohort_id, user_id, role) VALUES (?, ?, ?, ?)').run(uuidv4(), id, req.user.id, 'lead');
  res.status(201).json({ id });
});

router.post('/cohorts/:id/join', authenticateToken, (req, res) => {
  const cohort = db.prepare('SELECT * FROM peer_cohorts WHERE id = ?').get(req.params.id);
  if (!cohort || cohort.member_count >= cohort.size) return res.status(400).json({ error: 'Cohort full or not found' });
  const existing = db.prepare('SELECT id FROM cohort_members WHERE cohort_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already a member' });
  db.prepare('INSERT INTO cohort_members (id, cohort_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
  db.prepare('UPDATE peer_cohorts SET member_count = member_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/cohorts/:id/members', (req, res) => {
  const members = db.prepare(`SELECT cm.*, u.name, u.avatar, u.school FROM cohort_members cm JOIN users u ON cm.user_id = u.id WHERE cm.cohort_id = ?`).all(req.params.id);
  res.json({ members });
});

export default router;
