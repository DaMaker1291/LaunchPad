import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'parent' && req.user.role !== 'student') {
    const children = db.prepare(`SELECT id, name, email, age, school, grade, xp, level, coins, streak, verified FROM users WHERE parent_id = ?`).all(req.user.id);
    return res.json({ children });
  }
  res.json({ message: 'Parent account required' });
});

router.get('/child/:childId/progress', authenticateToken, (req, res) => {
  const { childId } = req.params;
  const child = db.prepare('SELECT id, name, school, grade, xp, level, coins, streak, verified FROM users WHERE id = ?').get(childId);
  if (!child) return res.status(404).json({ error: 'Child not found' });
  const academics = db.prepare('SELECT * FROM student_academics WHERE user_id = ?').all(childId);
  const extracurriculars = db.prepare('SELECT * FROM extracurriculars WHERE user_id = ?').all(childId);
  const achievements = db.prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY date_earned DESC LIMIT 5').all(childId);
  const coinTxns = db.prepare('SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(childId);
  const predictions = db.prepare(`SELECT p.*, u.name AS university_name FROM admission_predictions p JOIN universities u ON p.university_id = u.id WHERE p.user_id = ?`).all(childId);
  res.json({ child, academics, extracurriculars, achievements, coinTxns, predictions });
});

router.get('/child/:childId/wallet-pending', authenticateToken, (req, res) => {
  const pending = db.prepare("SELECT * FROM wallet_transactions WHERE user_id = ? AND parent_approved = 0 AND type IN ('payment', 'withdrawal')").all(req.params.childId);
  res.json({ pending });
});

router.post('/child/:childId/wallet-approve', authenticateToken, (req, res) => {
  const { txnId, approved } = req.body;
  if (!txnId) return res.status(400).json({ error: 'Transaction ID required' });
  db.prepare('UPDATE wallet_transactions SET parent_approved = ? WHERE id = ? AND user_id = ?').run(approved ? 1 : -1, txnId, req.params.childId);
  res.json({ success: true, approved });
});

export default router;
