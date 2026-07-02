import { Router } from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/cohort-info', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT cohort, verified, role FROM users WHERE id = ?').get(req.user.id);
  res.json({ cohort: user.cohort, verified: !!user.verified, role: user.role });
});

router.get('/moderation-logs', authenticateToken, (req, res) => {
  const logs = db.prepare('SELECT * FROM moderation_log ORDER BY created_at DESC LIMIT 50').all();
  res.json({ logs });
});

router.get('/vetted-spaces', authenticateToken, (req, res) => {
  const spaces = db.prepare(`SELECT * FROM vetted_spaces WHERE participant_a = ? OR participant_b = ? AND active = 1`).all(req.user.id, req.user.id);
  res.json({ spaces });
});

router.get('/users/search', (req, res) => {
  const { q, cohort } = req.query;
  let query = 'SELECT id, name, avatar, role, cohort, school, bio FROM users WHERE 1=1';
  const params = [];
  if (q) { query += ' AND (name LIKE ? OR school LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (cohort) { query += ' AND cohort = ?'; params.push(cohort); }
  query += ' LIMIT 20';
  const users = db.prepare(query).all(...params);
  res.json({ users });
});

export default router;
