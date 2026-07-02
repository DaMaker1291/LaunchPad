import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

export function addXP(userId, amount, source, description) {
  const user = db.prepare('SELECT xp, level FROM users WHERE id = ?').get(userId);
  if (!user) return;
  const newXp = user.xp + amount;
  const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
  const leveledUp = newLevel > user.level;
  db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(newXp, newLevel, userId);
  db.prepare('INSERT INTO xp_transactions (id, user_id, amount, source, description) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), userId, amount, source, description);
  return { xp: newXp, level: newLevel, leveledUp };
}

export function addCoins(userId, amount, source, description) {
  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId);
  if (!user) return;
  db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(amount, userId);
  db.prepare('INSERT INTO coin_transactions (id, user_id, amount, source, description) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), userId, amount, source, description);
  return { coins: user.coins + amount };
}

export function updateStreak(userId) {
  const user = db.prepare('SELECT streak, last_active FROM users WHERE id = ?').get(userId);
  if (!user) return;
  const today = new Date().toISOString().split('T')[0];
  if (user.last_active === today) return { streak: user.streak };
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = user.last_active === yesterday ? user.streak + 1 : 1;
  db.prepare('UPDATE users SET streak = ?, last_active = ? WHERE id = ?').run(newStreak, today, userId);
  if (newStreak % 7 === 0) addCoins(userId, 50, 'streak_bonus', `7-day streak bonus!`);
  return { streak: newStreak };
}

export function checkDailyQuest(userId) {
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT id FROM daily_quests WHERE user_id = ? AND date = ?').get(userId, today);
  if (existing) return;
  const quests = [
    { type: 'read_article', description: 'Read 1 career article', xp_reward: 10, coin_reward: 5, target: 1 },
    { type: 'review_university', description: 'Review 1 university requirement', xp_reward: 15, coin_reward: 5, target: 1 },
    { type: 'skill_challenge', description: 'Complete a skill challenge', xp_reward: 25, coin_reward: 10, target: 1 },
    { type: 'connect', description: 'Connect with 1 new person', xp_reward: 10, coin_reward: 5, target: 1 },
    { type: 'post_update', description: 'Share an update on your feed', xp_reward: 15, coin_reward: 5, target: 1 },
    { type: 'portfolio_update', description: 'Add 1 item to your portfolio', xp_reward: 20, coin_reward: 8, target: 1 },
  ];
  const quest = quests[Math.floor(Math.random() * quests.length)];
  db.prepare(`INSERT INTO daily_quests (id, user_id, quest_type, description, xp_reward, coin_reward, target, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(uuidv4(), userId, quest.type, quest.description, quest.xp_reward, quest.coin_reward, quest.target, today);
}

export function completeDailyQuest(userId, questType) {
  const today = new Date().toISOString().split('T')[0];
  const quest = db.prepare('SELECT * FROM daily_quests WHERE user_id = ? AND quest_type = ? AND date = ? AND completed = 0').get(userId, questType, today);
  if (!quest) return;
  db.prepare('UPDATE daily_quests SET completed = 1, progress = target WHERE id = ?').run(quest.id);
  addXP(userId, quest.xp_reward, 'daily_quest', quest.description);
  addCoins(userId, quest.coin_reward, 'daily_quest', quest.description);
  return { xp: quest.xp_reward, coins: quest.coin_reward };
}
