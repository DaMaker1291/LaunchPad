import { Router } from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { addXP, addCoins, updateStreak, checkDailyQuest, completeDailyQuest } from '../services/gamification.js';

const router = Router();

router.get('/stats', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT xp, level, coins, streak FROM users WHERE id = ?').get(req.user.id);
  const xpTxns = db.prepare('SELECT * FROM xp_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  const coinTxns = db.prepare('SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  const nextLevelXp = (req.user.level) * 100;
  res.json({ xp: user.xp, level: user.level, coins: user.coins, streak: user.streak, nextLevelXp, xpTxns, coinTxns });
});

router.post('/checkin', authenticateToken, (req, res) => {
  const streakResult = updateStreak(req.user.id);
  checkDailyQuest(req.user.id);
  const xpResult = addXP(req.user.id, 5, 'daily_checkin', 'Daily check-in');
  const coinResult = addCoins(req.user.id, 2, 'daily_checkin', 'Daily check-in bonus');
  res.json({ ...streakResult, ...xpResult, ...coinResult });
});

router.get('/quests', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  checkDailyQuest(req.user.id);
  const quests = db.prepare('SELECT * FROM daily_quests WHERE user_id = ? AND date = ?').all(req.user.id, today);
  res.json({ quests });
});

router.post('/quests/:type/complete', authenticateToken, (req, res) => {
  const result = completeDailyQuest(req.user.id, req.params.type);
  if (!result) return res.status(400).json({ error: 'Quest not found or already completed' });
  res.json(result);
});

export default router;
