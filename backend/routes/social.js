import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { moderateContent, logModeration } from '../services/moderation.js';
import { addXP, addCoins } from '../services/gamification.js';

const router = Router();

router.get('/feed', (req, res) => {
  const posts = db.prepare(`SELECT p.*, u.name, u.avatar FROM posts p JOIN users u ON p.user_id = u.id WHERE p.moderated = 0 ORDER BY p.created_at DESC LIMIT 50`).all();
  posts.forEach(p => { p.tags = JSON.parse(p.tags || '[]'); });
  res.json({ posts });
});

router.post('/posts', authenticateToken, (req, res) => {
  const { content, image, type, tags } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const modResult = moderateContent(content, 'post');
  if (!modResult.approved) {
    logModeration('post', 'pending', 'blocked', 'Inappropriate content', 'system');
    return res.status(400).json({ error: 'Content violates community guidelines', flags: modResult.flags });
  }
  const id = uuidv4();
  db.prepare(`INSERT INTO posts (id, user_id, content, image, type, tags, moderated) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, content, image || '', type || 'post', JSON.stringify(tags || []), modResult.requiresReview ? 2 : 0);
  addXP(req.user.id, 10, 'post', 'Created a post');
  addCoins(req.user.id, 3, 'post', 'Post reward');
  res.status(201).json({ id, moderated: modResult.requiresReview ? 2 : 0 });
});

router.post('/posts/:id/like', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) {
    db.prepare('DELETE FROM post_likes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(req.params.id);
    return res.json({ liked: false });
  }
  const id = uuidv4();
  db.prepare('INSERT INTO post_likes (id, post_id, user_id) VALUES (?, ?, ?)').run(id, req.params.id, req.user.id);
  db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ liked: true });
});

router.get('/posts/:id/comments', (req, res) => {
  const comments = db.prepare(`SELECT c.*, u.name, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? AND c.moderated = 0 ORDER BY c.created_at ASC`).all(req.params.id);
  res.json({ comments });
});

router.post('/posts/:id/comments', authenticateToken, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const modResult = moderateContent(content, 'comment');
  if (!modResult.approved) return res.status(400).json({ error: 'Comment violates guidelines' });
  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, post_id, user_id, content, moderated) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, req.user.id, content, modResult.requiresReview ? 2 : 0);
  db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(req.params.id);
  addXP(req.user.id, 5, 'comment', 'Left a comment');
  res.status(201).json({ id });
});

router.get('/groups', (req, res) => {
  const groups = db.prepare('SELECT * FROM groups_table ORDER BY member_count DESC').all();
  res.json({ groups });
});

router.post('/groups', authenticateToken, (req, res) => {
  const { name, description, category, age_restricted } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = uuidv4();
  db.prepare('INSERT INTO groups_table (id, name, description, category, age_restricted, created_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, description || '', category || '', age_restricted || 0, req.user.id);
  db.prepare('INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)').run(uuidv4(), id, req.user.id, 'admin');
  res.status(201).json({ id });
});

router.post('/groups/:id/join', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already a member' });
  db.prepare('INSERT INTO group_members (id, group_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
  db.prepare('UPDATE groups_table SET member_count = member_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/events', (req, res) => {
  const events = db.prepare(`SELECT e.*, u.name AS host_name FROM events e JOIN users u ON e.host_id = u.id WHERE e.date >= datetime('now') ORDER BY e.date ASC`).all();
  events.forEach(e => { e.tags = JSON.parse(e.tags || '[]'); });
  res.json({ events });
});

router.post('/events', authenticateToken, (req, res) => {
  const { title, description, date, duration, type, max_attendees, location, online, link, tags, age_restricted } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO events (id, title, description, date, duration, type, host_id, max_attendees, location, online, link, tags, age_restricted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, title, description || '', date, duration || 60, type || 'webinar', req.user.id, max_attendees || 100, location || '', online || 1, link || '', JSON.stringify(tags || []), age_restricted || '');
  res.status(201).json({ id });
});

router.post('/events/:id/register', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM event_attendees WHERE event_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already registered' });
  const id = uuidv4();
  db.prepare('INSERT INTO event_attendees (id, event_id, user_id) VALUES (?, ?, ?)').run(id, req.params.id, req.user.id);
  db.prepare('UPDATE events SET attendees_count = attendees_count + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/resources', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT r.*, u.name AS poster_name FROM resources r JOIN users u ON r.posted_by = u.id';
  const params = [];
  if (category) { query += ' WHERE r.category = ?'; params.push(category); }
  query += ' ORDER BY r.created_at DESC';
  const resources = db.prepare(query).all(...params);
  res.json({ resources });
});

router.post('/resources', authenticateToken, (req, res) => {
  const { title, description, url, type, category } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO resources (id, title, description, url, type, category, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, title, description || '', url || '', type || 'article', category || '', req.user.id);
  res.status(201).json({ id });
});

export default router;
