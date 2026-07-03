import express, { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import multiparty from 'multiparty';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const router = Router();

router.get('/projects/:userId', (req, res) => {
  const projects = db.prepare('SELECT * FROM portfolio_projects WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
  projects.forEach(p => { p.tags = JSON.parse(p.tags || '[]'); });
  res.json({ projects });
});

router.post('/projects', authenticateToken, (req, res) => {
  const { title, description, project_type, media_url, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO portfolio_projects (id, user_id, title, description, project_type, media_url, tags) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, title, description || '', project_type || 'other', media_url || '', JSON.stringify(tags || []));
  res.status(201).json({ id });
});

router.delete('/projects/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM portfolio_projects WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

router.post('/badges', authenticateToken, (req, res) => {
  const { skill, level, challenge_score } = req.body;
  if (!skill) return res.status(400).json({ error: 'Skill required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO skill_badges (id, user_id, skill, level, verified, challenge_score) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, skill, level || 'basic', 1, challenge_score || 0);
  res.status(201).json({ id });
});

router.get('/badges/:userId', (req, res) => {
  const badges = db.prepare('SELECT * FROM skill_badges WHERE user_id = ?').all(req.params.userId);
  res.json({ badges });
});

router.post('/endorsements', authenticateToken, (req, res) => {
  const { user_id, skill, message, relationship } = req.body;
  if (!user_id || !skill) return res.status(400).json({ error: 'User and skill required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO endorsements (id, user_id, endorser_id, skill, message, relationship) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, user_id, req.user.id, skill, message || '', relationship || 'peer');
  res.status(201).json({ id });
});

router.post('/journey', authenticateToken, (req, res) => {
  const { title, description, entry_type, date, icon } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
  const id = uuidv4();
  db.prepare(`INSERT INTO journey_entries (id, user_id, title, description, entry_type, date, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.user.id, title, description || '', entry_type || 'milestone', date, icon || '');
  res.status(201).json({ id });
});

router.get('/journey/:userId', (req, res) => {
  const entries = db.prepare('SELECT * FROM journey_entries WHERE user_id = ? ORDER BY date DESC').all(req.params.userId);
  res.json({ entries });
});

// ─── File Upload (local filesystem; swap to S3/Cloudinary in production) ───
router.post('/upload', authenticateToken, (req, res) => {
  const form = new multiparty.Form({ maxFilesSize: 50 * 1024 * 1024 });
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(400).json({ error: err.message });
    const fileField = Object.keys(files)[0];
    if (!fileField) return res.status(400).json({ error: 'No file uploaded' });
    const file = files[fileField][0];
    const ext = path.extname(file.originalFilename) || '.bin';
    const fileName = `${uuidv4()}${ext}`;
    const destPath = path.join(UPLOAD_DIR, fileName);
    fs.copyFileSync(file.path, destPath);
    fs.unlinkSync(file.path);
    const url = `/uploads/${fileName}`;
    res.json({ url, fileName: file.originalFilename, size: file.size });
  });
});

// Serve uploaded files
router.use('/uploads', express.static(UPLOAD_DIR));

export default router;
