import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
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

// ─── Streak Repair (costs coins) ───
router.post('/streak/repair', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT coins, streak, last_active FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const repairCost = 25 + (user.streak * 5);
  if (user.coins < repairCost) return res.status(400).json({ error: `Not enough coins. Need ${repairCost}, have ${user.coins}` });

  const daysSince = Math.floor((Date.now() - new Date(user.last_active).getTime()) / 86400000);
  if (daysSince <= 1) return res.status(400).json({ error: 'Streak is still active, no repair needed' });

  db.prepare('UPDATE users SET coins = coins - ?, streak = streak + 1, last_active = CURRENT_DATE WHERE id = ?').run(repairCost, req.user.id);
  const tId = uuidv4();
  db.prepare('INSERT INTO coin_transactions (id, user_id, amount, source, description) VALUES (?, ?, ?, ?, ?)').run(tId, req.user.id, -repairCost, 'streak_repair', `Streak repair (${repairCost} coins)`);
  res.json({ coins: user.coins - repairCost, streak: user.streak + 1, repairCost });
});

// ─── Leaderboard ───
router.get('/leaderboard', (req, res) => {
  const leaders = db.prepare(`
    SELECT id, name, avatar, xp, level, streak, coins,
      RANK() OVER (ORDER BY xp DESC) AS rank
    FROM users WHERE role = 'student' ORDER BY xp DESC LIMIT 50
  `).all();
  res.json({ leaders });
});

// ─── Share Card (HTML badge card for social media) ───
router.get('/share-card/:userId', (req, res) => {
  const user = db.prepare('SELECT name, level, xp, streak, coins, school FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).send('User not found');
  const certCount = db.prepare('SELECT COUNT(*) as c FROM certificates WHERE user_id = ?').get(req.params.userId).c;
  const completedModules = db.prepare("SELECT COUNT(*) as c FROM work_enrollments WHERE user_id = ? AND status = 'completed'").get(req.params.userId).c;

  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${user.name} - LaunchPad Profile</title>
<meta property="og:title" content="${user.name} on LaunchPad" />
<meta property="og:description" content="Level ${user.level} Student | ${user.school || 'Future Leader'} | ${certCount} Certificates" />
<meta property="og:type" content="profile" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0f0f1a; }
  .card { width: 600px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 32px; padding: 48px; position: relative; overflow: hidden; border: 1px solid rgba(124,58,237,0.2); box-shadow: 0 0 80px rgba(124,58,237,0.15); }
  .card::before { content: ''; position: absolute; top: -60%; right: -30%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%); border-radius: 50%; }
  .header { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; }
  .avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #4f46e5); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; color: white; border: 3px solid rgba(124,58,237,0.4); }
  .title { flex: 1; }
  .title h1 { font-size: 28px; font-weight: 800; color: white; }
  .title .school { color: #888; font-size: 14px; margin-top: 2px; }
  .level-badge { display: inline-block; padding: 6px 20px; background: linear-gradient(135deg, #7c3aed, #4f46e5); border-radius: 50px; color: white; font-weight: 700; font-size: 14px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat { text-align: center; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); }
  .stat .num { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .stat .label { font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .footer { text-align: center; color: #555; font-size: 13px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); }
  .footer strong { color: #a78bfa; }
  .badge-row { display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
  .badge { padding: 4px 14px; border-radius: 50px; background: rgba(124,58,237,0.15); color: #a78bfa; font-size: 11px; font-weight: 600; }
</style></head><body>
<div class="card">
  <div class="header">
    <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
    <div class="title">
      <h1>${user.name}</h1>
      <div class="school">${user.school || 'Future Leader'} ${user.level >= 5 ? '| Honor Student' : ''}</div>
    </div>
    <div class="level-badge">Lv.${user.level}</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="num">${user.xp}</div><div class="label">XP</div></div>
    <div class="stat"><div class="num">${user.streak}🔥</div><div class="label">Day Streak</div></div>
    <div class="stat"><div class="num">${user.coins}</div><div class="label">Coins</div></div>
  </div>
  <div class="badge-row">
    <span class="badge">${certCount} Certificates</span>
    <span class="badge">${completedModules} Modules</span>
    <span class="badge">LaunchPad</span>
  </div>
  <div class="footer">🚀 <strong>LaunchPad</strong> — Level up your future</div>
</div></body></html>`);
});

export default router;
