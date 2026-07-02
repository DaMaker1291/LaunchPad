import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/universities', (req, res) => {
  const universities = db.prepare('SELECT * FROM universities').all();
  universities.forEach(u => { u.programs = JSON.parse(u.programs || '[]'); u.requirements = JSON.parse(u.requirements || '{}'); });
  res.json({ universities });
});

router.post('/academics', authenticateToken, (req, res) => {
  const { subject, grade, score, ap_class, semester, year } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO student_academics (id, user_id, subject, grade, score, ap_class, semester, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, subject, grade || '', score || 0, ap_class || 0, semester || '', year || new Date().getFullYear());
  res.status(201).json({ id });
});

router.get('/academics', authenticateToken, (req, res) => {
  const academics = db.prepare('SELECT * FROM student_academics WHERE user_id = ?').all(req.user.id);
  res.json({ academics });
});

router.post('/extracurriculars', authenticateToken, (req, res) => {
  const { activity, role, hours_per_week, description, start_date, end_date } = req.body;
  if (!activity) return res.status(400).json({ error: 'Activity required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO extracurriculars (id, user_id, activity, role, hours_per_week, description, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, activity, role || '', hours_per_week || 0, description || '', start_date || null, end_date || null);
  res.status(201).json({ id });
});

router.get('/extracurriculars', authenticateToken, (req, res) => {
  const items = db.prepare('SELECT * FROM extracurriculars WHERE user_id = ?').all(req.user.id);
  res.json({ extracurriculars: items });
});

router.post('/predict', authenticateToken, (req, res) => {
  const { university_id } = req.body;
  if (!university_id) return res.status(400).json({ error: 'University ID required' });
  const uni = db.prepare('SELECT * FROM universities WHERE id = ?').get(university_id);
  if (!uni) return res.status(404).json({ error: 'University not found' });
  const academics = db.prepare('SELECT * FROM student_academics WHERE user_id = ?').all(req.user.id);
  const extracurriculars = db.prepare('SELECT * FROM extracurriculars WHERE user_id = ?').all(req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const avgScore = academics.length ? academics.reduce((s, a) => s + a.score, 0) / academics.length : 0;
  const apCount = academics.filter(a => a.ap_class).length;
  const ecCount = extracurriculars.length;
  const baseProb = Math.min(95, Math.max(5, (avgScore / 100) * 40 + apCount * 8 + ecCount * 3 + (user.verified ? 10 : 0)));
  const recommendations = [];
  if (avgScore < 85) recommendations.push('Focus on improving your GPA — aim for 85%+');
  if (apCount < 2) recommendations.push(`Take ${2 - apCount} more AP or honors classes`);
  if (ecCount < 2) recommendations.push('Join 1-2 more extracurricular activities');
  if (!user.verified) recommendations.push('Verify your profile to boost admission credibility');
  const factors = { gpa: avgScore, apCourses: apCount, extracurriculars: ecCount, verified: user.verified };
  const existing = db.prepare('SELECT id FROM admission_predictions WHERE user_id = ? AND university_id = ?').get(req.user.id, university_id);
  if (existing) {
    db.prepare('UPDATE admission_predictions SET probability = ?, recommendations = ?, factors = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?')
      .run(baseProb, JSON.stringify(recommendations), JSON.stringify(factors), existing.id);
  } else {
    const id = uuidv4();
    db.prepare('INSERT INTO admission_predictions (id, user_id, university_id, probability, recommendations, factors) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.user.id, university_id, baseProb, JSON.stringify(recommendations), JSON.stringify(factors));
  }
  res.json({ probability: Math.round(baseProb), recommendations, factors });
});

router.get('/predictions', authenticateToken, (req, res) => {
  const predictions = db.prepare(`SELECT p.*, u.name AS university_name FROM admission_predictions p JOIN universities u ON p.university_id = u.id WHERE p.user_id = ? ORDER BY p.probability DESC`).all(req.user.id);
  predictions.forEach(p => { p.recommendations = JSON.parse(p.recommendations || '[]'); p.factors = JSON.parse(p.factors || '{}'); });
  res.json({ predictions });
});

router.get('/scholarships', (req, res) => {
  const scholarships = db.prepare('SELECT * FROM scholarship_opportunities WHERE deadline IS NULL OR deadline >= date() ORDER BY deadline ASC').all();
  scholarships.forEach(s => { s.requirements = JSON.parse(s.requirements || '[]'); s.eligibility = JSON.parse(s.eligibility || '{}'); });
  res.json({ scholarships });
});

router.get('/hubs', (req, res) => {
  const hubs = db.prepare(`SELECT h.*, u.name AS university_name FROM campus_hubs h JOIN universities u ON h.university_id = u.id ORDER BY h.member_count DESC`).all();
  res.json({ hubs });
});

router.post('/hubs', authenticateToken, (req, res) => {
  const { university_id, name, description } = req.body;
  if (!university_id) return res.status(400).json({ error: 'University ID required' });
  const id = uuidv4();
  db.prepare('INSERT INTO campus_hubs (id, university_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)').run(id, university_id, name || '', description || '', req.user.id);
  db.prepare('INSERT INTO hub_members (id, hub_id, user_id, role) VALUES (?, ?, ?, ?)').run(uuidv4(), id, req.user.id, 'admin');
  res.status(201).json({ id });
});

router.post('/hubs/:id/join', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM hub_members WHERE hub_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already a member' });
  db.prepare('INSERT INTO hub_members (id, hub_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
  db.prepare('UPDATE campus_hubs SET member_count = member_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
