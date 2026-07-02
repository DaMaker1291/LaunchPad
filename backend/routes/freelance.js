import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/gigs', (req, res) => {
  const gigs = db.prepare(`SELECT g.*, u.name AS poster_name FROM freelance_gigs g JOIN users u ON g.poster_id = u.id WHERE g.status = 'open' ORDER BY g.created_at DESC`).all();
  gigs.forEach(g => { g.skills_needed = JSON.parse(g.skills_needed || '[]'); });
  res.json({ gigs });
});

router.post('/gigs', authenticateToken, (req, res) => {
  const { title, description, category, budget, duration, skills_needed } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO freelance_gigs (id, poster_id, title, description, category, budget, duration, skills_needed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, title, description || '', category || '', budget || '', duration || '', JSON.stringify(skills_needed || []));
  res.status(201).json({ id });
});

router.post('/gigs/:id/apply', authenticateToken, (req, res) => {
  const { message, bid } = req.body;
  const existing = db.prepare('SELECT id FROM freelance_applications WHERE gig_id = ? AND freelancer_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already applied' });
  const id = uuidv4();
  db.prepare('INSERT INTO freelance_applications (id, gig_id, freelancer_id, message, bid) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, req.user.id, message || '', bid || '');
  res.status(201).json({ id });
});

router.get('/my-gigs', authenticateToken, (req, res) => {
  const posted = db.prepare(`SELECT g.*, (SELECT COUNT(*) FROM freelance_applications WHERE gig_id = g.id) AS applicants FROM freelance_gigs g WHERE g.poster_id = ? ORDER BY g.created_at DESC`).all(req.user.id);
  const applied = db.prepare(`SELECT g.*, fa.status AS app_status FROM freelance_applications fa JOIN freelance_gigs g ON fa.gig_id = g.id WHERE fa.freelancer_id = ?`).all(req.user.id);
  res.json({ posted, applied });
});

router.get('/micro-internships', (req, res) => {
  const internships = db.prepare('SELECT * FROM micro_internships WHERE spots_filled < spots_available ORDER BY created_at DESC').all();
  internships.forEach(i => { i.skills = JSON.parse(i.skills || '[]'); });
  res.json({ internships });
});

router.post('/micro-internships', authenticateToken, (req, res) => {
  const { company, title, description, duration_hours, category, skills, compensation, age_min, age_max, sponsored, spots_available } = req.body;
  if (!company || !title) return res.status(400).json({ error: 'Company and title required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO micro_internships (id, company, title, description, duration_hours, category, skills, compensation, age_min, age_max, sponsored, spots_available, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, company, title, description || '', duration_hours || 5, category || '', JSON.stringify(skills || []), compensation || '', age_min || 12, age_max || 18, sponsored || 0, spots_available || 10, req.user.id);
  res.status(201).json({ id });
});

router.post('/micro-internships/:id/enroll', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM micro_internship_enrollments WHERE micro_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already enrolled' });
  const id = uuidv4();
  db.prepare('INSERT INTO micro_internship_enrollments (id, micro_id, user_id) VALUES (?, ?, ?)').run(id, req.params.id, req.user.id);
  db.prepare('UPDATE micro_internships SET spots_filled = spots_filled + 1 WHERE id = ?').run(req.params.id);
  res.status(201).json({ id });
});

router.get('/enrollments', authenticateToken, (req, res) => {
  const enrollments = db.prepare(`SELECT e.*, m.company, m.title, m.duration_hours, m.category FROM micro_internship_enrollments e JOIN micro_internships m ON e.micro_id = m.id WHERE e.user_id = ?`).all(req.user.id);
  res.json({ enrollments });
});

router.put('/enrollments/:id/progress', authenticateToken, (req, res) => {
  const { progress } = req.body;
  const completed = progress >= 100 ? 1 : 0;
  db.prepare('UPDATE micro_internship_enrollments SET progress = ?, status = CASE WHEN ? THEN ? ELSE status END, completed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ? AND user_id = ?')
    .run(progress, completed ? 'completed' : 'in_progress', req.params.id, req.user.id);
  res.json({ success: true });
});

router.get('/apprenticeships', (req, res) => {
  const programs = db.prepare('SELECT * FROM apprenticeship_programs ORDER BY created_at DESC').all();
  programs.forEach(p => { p.requirements = JSON.parse(p.requirements || '[]'); });
  res.json({ programs });
});

router.get('/wallet', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.user.id);
  const txns = db.prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  const coinTxns = db.prepare('SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  const rewards = db.prepare('SELECT * FROM redeemable_rewards WHERE active = 1').all();
  res.json({ coins: user?.coins || 0, transactions: txns, coinTxns, rewards });
});

router.post('/wallet/redeem', authenticateToken, (req, res) => {
  const { reward_id } = req.body;
  if (!reward_id) return res.status(400).json({ error: 'Reward ID required' });
  const reward = db.prepare('SELECT * FROM redeemable_rewards WHERE id = ? AND active = 1').get(reward_id);
  if (!reward) return res.status(404).json({ error: 'Reward not found' });
  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.user.id);
  if (user.coins < reward.coin_cost) return res.status(400).json({ error: 'Not enough coins' });
  db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(reward.coin_cost, req.user.id);
  const id = uuidv4();
  db.prepare('INSERT INTO reward_redemptions (id, reward_id, user_id) VALUES (?, ?, ?)').run(id, reward_id, req.user.id);
  db.prepare('UPDATE redeemable_rewards SET stock = stock - 1 WHERE id = ?').run(reward_id);
  res.json({ id, success: true });
});

export default router;
