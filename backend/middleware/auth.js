import jwt from 'jsonwebtoken';
import db from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'launchpad-secret-key-2024';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, age, cohort, verified, xp, level, coins, streak, alumni FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(403).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch { res.status(403).json({ error: 'Invalid token' }); }
}

export function requireCohort(cohorts) {
  return (req, res, next) => {
    if (!cohorts.includes(req.user.cohort))
      return res.status(403).json({ error: 'Age-restricted content' });
    next();
  };
}

export function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// COPPA: if user is under 15, their profile is invisible to non-authenticated requests
export function coppaCheck(req, res, next) {
  const { id } = req.params;
  if (!id) return next();
  const target = db.prepare('SELECT id, age, cohort FROM users WHERE id = ?').get(id);
  if (target && target.cohort === '12-14') {
    if (!req.headers['authorization']) {
      return res.status(401).json({ error: 'Authentication required to view this profile' });
    }
  }
  next();
}

export default JWT_SECRET;
