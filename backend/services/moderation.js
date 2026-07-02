import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

const BLOCKED_PATTERNS = [
  /\b\d{10}\b/, /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  /\b[\w.-]+@[\w.-]+\.\w+\b/,
  /\b(?:kill|die|murder|suicide|hurt yourself|self-harm)\b/i,
  /\b(?:fuck|shit|bitch|asshole|dick)\b/i,
];

const SUSPICIOUS_PATTERNS = [
  /\b(?:meet|come over|private|secret|only us|don't tell)\b/i,
];

export function moderateContent(content, type) {
  const flags = [];
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      flags.push({ pattern: pattern.source, severity: 'high' });
    }
  }
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      flags.push({ pattern: pattern.source, severity: 'low' });
    }
  }
  return {
    approved: flags.filter(f => f.severity === 'high').length === 0,
    flags,
    requiresReview: flags.length > 0,
  };
}

export function logModeration(targetType, targetId, action, reason, flaggedBy = 'system') {
  db.prepare('INSERT INTO moderation_log (id, target_type, target_id, action, reason, flagged_by) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), targetType, targetId, action, reason, flaggedBy);
}

export function checkAdultDM(senderId, receiverId) {
  const sender = db.prepare('SELECT role, cohort FROM users WHERE id = ?').get(senderId);
  const receiver = db.prepare('SELECT role, cohort FROM users WHERE id = ?').get(receiverId);
  if (!sender || !receiver) return { allowed: false };
  if (sender.role === 'mentor' && receiver.cohort.startsWith('12')) return { allowed: false, reason: 'Adults cannot DM minors directly' };
  if (receiver.role === 'mentor' && sender.cohort.startsWith('12')) return { allowed: false, reason: 'Adults cannot DM minors directly' };
  return { allowed: true };
}

export function createVettedSpace(participantA, participantB, type = 'chat') {
  const id = uuidv4();
  db.prepare('INSERT INTO vetted_spaces (id, participant_a, participant_b, type) VALUES (?, ?, ?, ?)')
    .run(id, participantA, participantB, type);
  return id;
}
