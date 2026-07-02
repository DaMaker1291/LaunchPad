import { Router } from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/:id', (req, res) => {
  const user = db.prepare(`SELECT id, name, email, age, role, cohort, avatar, bio, location,
    school, grade, interests, skills, goals, xp, level, coins, streak, verified, alumni, created_at
    FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  ['interests', 'skills', 'goals'].forEach(k => { user[k] = JSON.parse(user[k] || '[]'); });
  const projects = db.prepare('SELECT * FROM portfolio_projects WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id);
  const badges = db.prepare('SELECT * FROM skill_badges WHERE user_id = ?').all(req.params.id);
  const endorsements = db.prepare(`SELECT e.*, u.name AS endorser_name FROM endorsements e JOIN users u ON e.endorser_id = u.id WHERE e.user_id = ?`).all(req.params.id);
  const journey = db.prepare('SELECT * FROM journey_entries WHERE user_id = ? ORDER BY date DESC').all(req.params.id);
  const academics = db.prepare('SELECT * FROM student_academics WHERE user_id = ?').all(req.params.id);
  const extracurriculars = db.prepare('SELECT * FROM extracurriculars WHERE user_id = ?').all(req.params.id);
  res.json({ user, projects, badges, endorsements, journey, academics, extracurriculars });
});

router.put('/:id', authenticateToken, (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Unauthorized' });
  const { name, bio, location, school, grade, interests, skills, goals } = req.body;
  const updates = []; const vals = [];
  if (name !== undefined) { updates.push('name = ?'); vals.push(name); }
  if (bio !== undefined) { updates.push('bio = ?'); vals.push(bio); }
  if (location !== undefined) { updates.push('location = ?'); vals.push(location); }
  if (school !== undefined) { updates.push('school = ?'); vals.push(school); }
  if (grade !== undefined) { updates.push('grade = ?'); vals.push(grade); }
  if (interests !== undefined) { updates.push('interests = ?'); vals.push(JSON.stringify(interests)); }
  if (skills !== undefined) { updates.push('skills = ?'); vals.push(JSON.stringify(skills)); }
  if (goals !== undefined) { updates.push('goals = ?'); vals.push(JSON.stringify(goals)); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields' });
  vals.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ success: true });
});

router.put('/:id/verify', authenticateToken, (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Unauthorized' });
  const { docType } = req.body;
  db.prepare('UPDATE users SET verification_doc = ?, verified = 1 WHERE id = ?').run(docType || 'school_id', req.params.id);
  res.json({ success: true, verified: true });
});

export default router;
