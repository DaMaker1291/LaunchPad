import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { moderateContent, checkAdultDM, createVettedSpace } from '../services/moderation.js';

const router = Router();

router.get('/conversations', authenticateToken, (req, res) => {
  const conversations = db.prepare(`
    SELECT DISTINCT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id,
      u.name, u.avatar, u.cohort, u.role,
      (SELECT content FROM messages WHERE (sender_id = ? AND receiver_id = other_user_id) OR (sender_id = other_user_id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages WHERE (sender_id = ? AND receiver_id = other_user_id) OR (sender_id = other_user_id AND receiver_id = ?) ORDER BY created_at DESC LIMIT 1) AS last_message_time,
      (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND sender_id = other_user_id AND read = 0) AS unread
    FROM messages JOIN users u ON u.id = CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
    WHERE sender_id = ? OR receiver_id = ? ORDER BY last_message_time DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
  res.json({ conversations });
});

router.get('/:userId', authenticateToken, (req, res) => {
  const messages = db.prepare(`SELECT * FROM messages WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND moderated = 0 ORDER BY created_at ASC`)
    .all(req.user.id, req.params.userId, req.params.userId, req.user.id);
  db.prepare('UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ? AND read = 0').run(req.params.userId, req.user.id);
  res.json({ messages });
});

router.post('/', authenticateToken, (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content) return res.status(400).json({ error: 'Receiver and content required' });
  const dmCheck = checkAdultDM(req.user.id, receiver_id);
  if (!dmCheck.allowed) return res.status(403).json({ error: dmCheck.reason });
  const modResult = moderateContent(content, 'message');
  if (!modResult.approved) return res.status(400).json({ error: 'Message blocked by safety filter' });
  const needsVetted = modResult.requiresReview || (req.user.role === 'mentor' || db.prepare('SELECT role FROM users WHERE id = ?').get(receiver_id)?.role === 'mentor');
  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content, moderated, in_vetted_space) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, receiver_id, content, modResult.requiresReview ? 2 : 0, needsVetted ? 1 : 0);
  if (needsVetted) createVettedSpace(req.user.id, receiver_id);
  res.status(201).json({ id });
});

router.get('/unread/count', authenticateToken, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND read = 0 AND moderated = 0').get(req.user.id);
  res.json({ unread: count.count });
});

export default router;
