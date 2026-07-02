import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'launchpad-secret-key-2024';
const router = Router();

router.post('/register', (req, res) => {
  const { email, password, name, age, role } = req.body;
  if (!email || !password || !name || !age) return res.status(400).json({ error: 'Missing required fields' });
  const userRole = role || 'student';
  if (userRole === 'student' && (age < 12 || age > 18)) return res.status(400).json({ error: 'Students must be 12-18' });
  if (userRole === 'mentor' && age < 16) return res.status(400).json({ error: 'Mentors must be at least 16' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const cohort = age >= 12 && age <= 14 ? '12-14' : age >= 15 && age <= 18 ? '15-18' : 'adult';
  const hashed = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare(`INSERT INTO users (id, email, password, name, age, role, cohort) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, email, hashed, name, age, userRole, cohort);
  const token = jwt.sign({ id, email, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id, email, name, age, role: userRole, cohort } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, age: user.age, role: user.role, cohort: user.cohort, avatar: user.avatar, bio: user.bio, school: user.school, grade: user.grade, xp: user.xp, level: user.level, coins: user.coins, streak: user.streak, verified: user.verified } });
});

export default router;
