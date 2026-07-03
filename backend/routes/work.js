import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ─── Work Modules ───
router.get('/modules', (req, res) => {
  const modules = db.prepare(`
    SELECT wm.*, u.name AS poster_name
    FROM work_modules wm JOIN users u ON wm.posted_by = u.id
    WHERE wm.active = 1 AND wm.spots_filled < wm.spots_available
    ORDER BY wm.created_at DESC
  `).all();
  modules.forEach(m => {
    m.steps = JSON.parse(m.steps || '[]');
    m.skills = JSON.parse(m.skills || '[]');
    m.deliverables = JSON.parse(m.deliverables || '[]');
    m.rubric = JSON.parse(m.rubric || '{}');
  });
  res.json({ modules });
});

router.post('/modules', authenticateToken, (req, res) => {
  const { company, title, description, category, difficulty, duration_hours, steps, skills, deliverables, rubric, compensation, age_min, age_max, sponsored, spots_available } = req.body;
  if (!company || !title) return res.status(400).json({ error: 'Company and title required' });
  const id = uuidv4();
  db.prepare(`
    INSERT INTO work_modules (id, company, title, description, category, difficulty, duration_hours, steps, skills, deliverables, rubric, compensation, age_min, age_max, sponsored, spots_available, posted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, company, title, description || '', category || '', difficulty || 'beginner', duration_hours || 5,
    JSON.stringify(steps || []), JSON.stringify(skills || []), JSON.stringify(deliverables || []),
    JSON.stringify(rubric || {}), compensation || '', age_min || 12, age_max || 18, sponsored ? 1 : 0, spots_available || 100, req.user.id);
  res.status(201).json({ id });
});

router.get('/modules/:id', (req, res) => {
  const mod = db.prepare('SELECT * FROM work_modules WHERE id = ?').get(req.params.id);
  if (!mod) return res.status(404).json({ error: 'Not found' });
  mod.steps = JSON.parse(mod.steps || '[]');
  mod.skills = JSON.parse(mod.skills || '[]');
  mod.deliverables = JSON.parse(mod.deliverables || '[]');
  mod.rubric = JSON.parse(mod.rubric || '{}');
  res.json(mod);
});

// ─── Enrollment ───
router.post('/modules/:id/enroll', authenticateToken, (req, res) => {
  const mod = db.prepare('SELECT * FROM work_modules WHERE id = ? AND active = 1').get(req.params.id);
  if (!mod) return res.status(404).json({ error: 'Module not found' });
  if (mod.spots_filled >= mod.spots_available) return res.status(400).json({ error: 'No spots available' });

  const existing = db.prepare('SELECT id FROM work_enrollments WHERE module_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already enrolled' });

  const enrollmentId = uuidv4();
  db.prepare('INSERT INTO work_enrollments (id, module_id, user_id) VALUES (?, ?, ?)').run(enrollmentId, req.params.id, req.user.id);
  db.prepare('UPDATE work_modules SET spots_filled = spots_filled + 1 WHERE id = ?').run(req.params.id);
  res.status(201).json({ id: enrollmentId });
});

router.get('/enrollments', authenticateToken, (req, res) => {
  const enrollments = db.prepare(`
    SELECT we.*, wm.company, wm.title, wm.description, wm.category, wm.difficulty, wm.duration_hours,
           wm.steps, wm.skills, wm.deliverables, wm.rubric, wm.compensation, wm.sponsor_logo
    FROM work_enrollments we
    JOIN work_modules wm ON we.module_id = wm.id
    WHERE we.user_id = ?
    ORDER BY we.started_at DESC
  `).all(req.user.id);
  enrollments.forEach(e => {
    e.steps = JSON.parse(e.steps || '[]');
    e.skills = JSON.parse(e.skills || '[]');
    e.deliverables = JSON.parse(e.deliverables || '[]');
    e.rubric = JSON.parse(e.rubric || '{}');
  });
  res.json({ enrollments });
});

router.get('/enrollments/:id', authenticateToken, (req, res) => {
  const e = db.prepare(`
    SELECT we.*, wm.company, wm.title, wm.description, wm.category, wm.difficulty, wm.duration_hours,
           wm.steps, wm.skills, wm.deliverables, wm.rubric, wm.compensation, wm.sponsor_logo
    FROM work_enrollments we
    JOIN work_modules wm ON we.module_id = wm.id
    WHERE we.id = ? AND we.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  e.steps = JSON.parse(e.steps || '[]');
  e.skills = JSON.parse(e.skills || '[]');
  e.deliverables = JSON.parse(e.deliverables || '[]');
  e.rubric = JSON.parse(e.rubric || '{}');

  const submissions = db.prepare('SELECT * FROM work_submissions WHERE enrollment_id = ? ORDER BY step_index ASC').all(e.id);
  const certificate = db.prepare('SELECT * FROM certificates WHERE enrollment_id = ?').get(e.id);

  res.json({ ...e, submissions, certificate });
});

// ─── Step Progress & Submissions ───
router.put('/enrollments/:id/step', authenticateToken, (req, res) => {
  const { step_index, action } = req.body;
  const e = db.prepare('SELECT * FROM work_enrollments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!e) return res.status(404).json({ error: 'Enrollment not found' });

  const mod = db.prepare('SELECT * FROM work_modules WHERE id = ?').get(e.module_id);
  const steps = JSON.parse(mod.steps || '[]');

  if (action === 'complete') {
    const newStep = Math.min(step_index + 1, steps.length);
    const progress = Math.round((newStep / steps.length) * 100);
    const isComplete = newStep >= steps.length;
    db.prepare(`
      UPDATE work_enrollments SET current_step = ?, progress = ?, status = CASE WHEN ? THEN 'submitted' ELSE 'in_progress' END,
        submitted_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE id = ?
    `).run(newStep, progress, isComplete ? 1 : 0, isComplete ? 1 : 0, req.params.id);

    if (isComplete) {
      db.prepare("UPDATE work_enrollments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
      db.prepare('UPDATE work_modules SET spots_filled = spots_filled - 1 WHERE id = ?').run(mod.id);
      const certId = generateCertificate(req.user.id, mod, req.params.id);
      awardCompletionXP(req.user.id, mod.difficulty);
      res.json({ currentStep: newStep, progress, status: 'completed', certificateId: certId });
      return;
    }
    res.json({ currentStep: newStep, progress, status: 'in_progress' });
  }
});

router.post('/enrollments/:id/submit', authenticateToken, (req, res) => {
  const { step_index, content, file_urls, notes } = req.body;
  const e = db.prepare('SELECT * FROM work_enrollments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!e) return res.status(404).json({ error: 'Enrollment not found' });
  if (e.status === 'completed' || e.status === 'dropped') return res.status(400).json({ error: 'Enrollment is already closed' });

  const existing = db.prepare('SELECT id FROM work_submissions WHERE enrollment_id = ? AND step_index = ?').get(req.params.id, step_index);
  const subId = existing?.id || uuidv4();

  if (existing) {
    db.prepare('UPDATE work_submissions SET content = ?, file_urls = ?, notes = ?, status = ?, submitted_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(content || '', JSON.stringify(file_urls || []), notes || '', 'submitted', subId);
  } else {
    db.prepare('INSERT INTO work_submissions (id, enrollment_id, step_index, content, file_urls, notes, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
      .run(subId, req.params.id, step_index || 0, content || '', JSON.stringify(file_urls || []), notes || '', 'submitted');
  }

  if (e.status === 'enrolled') {
    db.prepare("UPDATE work_enrollments SET status = 'in_progress', current_step = ? WHERE id = ?").run(step_index || 0, req.params.id);
  }

  res.json({ id: subId, status: 'submitted' });
});

router.get('/submissions/:id', authenticateToken, (req, res) => {
  const sub = db.prepare('SELECT * FROM work_submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Not found' });
  sub.file_urls = JSON.parse(sub.file_urls || '[]');
  res.json(sub);
});

// ─── Mentor Review (for reviewers) ───
router.get('/review/pending', authenticateToken, (req, res) => {
  const pending = db.prepare(`
    SELECT ws.*, we.module_id, wm.title AS module_title, wm.company, u.name AS student_name, u.id AS student_id
    FROM work_submissions ws
    JOIN work_enrollments we ON ws.enrollment_id = we.id
    JOIN work_modules wm ON we.module_id = wm.id
    JOIN users u ON we.user_id = u.id
    WHERE ws.status = 'submitted' AND ws.reviewer_id IS NULL
    ORDER BY ws.submitted_at ASC
  `).all();
  res.json({ pending });
});

router.post('/submissions/:id/review', authenticateToken, (req, res) => {
  const { score, notes, status } = req.body;
  const sub = db.prepare('SELECT * FROM work_submissions WHERE id = ?').get(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });

  db.prepare('UPDATE work_submissions SET status = ?, reviewer_id = ?, review_notes = ?, review_score = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status || 'approved', req.user.id, notes || '', score || null, req.params.id);

  if (status === 'approved' || score >= 7) {
    const enrollment = db.prepare('SELECT * FROM work_enrollments WHERE id = ?').get(sub.enrollment_id);
    const mod = db.prepare('SELECT * FROM work_modules WHERE id = ?').get(enrollment.module_id);
    const steps = JSON.parse(mod.steps || '[]');

    if (sub.step_index >= steps.length - 1) {
      db.prepare("UPDATE work_enrollments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(sub.enrollment_id);
      db.prepare('UPDATE work_modules SET spots_filled = spots_filled - 1 WHERE id = ?').run(mod.id);
      generateCertificate(enrollment.user_id, mod, enrollment.id);
      awardCompletionXP(enrollment.user_id, mod.difficulty);
    }
  } else if (status === 'revision_needed' || score < 7) {
    db.prepare("UPDATE work_enrollments SET status = 'in_progress' WHERE id = ?").run(sub.enrollment_id);
  }

  res.json({ success: true });
});

// ─── Certificates ───
router.get('/certificates', authenticateToken, (req, res) => {
  const certs = db.prepare(`
    SELECT c.*, wm.company, wm.category, wm.sponsor_logo, cv.verification_token, cv.public_url
    FROM certificates c
    JOIN work_modules wm ON c.module_id = wm.id
    LEFT JOIN credential_verifications cv ON cv.certificate_id = c.id
    WHERE c.user_id = ?
    ORDER BY c.issued_at DESC
  `).all(req.user.id);
  certs.forEach(c => { c.skills = JSON.parse(c.skills || '[]'); });
  res.json({ certificates: certs });
});

router.get('/certificates/:id', (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, wm.company, wm.category, wm.sponsor_logo, u.name AS user_name,
           cv.verification_token, cv.public_url, cv.qr_data,
           (SELECT COUNT(*) FROM work_endorsements we WHERE we.certificate_id = c.id) AS endorsement_count
    FROM certificates c
    JOIN work_modules wm ON c.module_id = wm.id
    JOIN users u ON c.user_id = u.id
    LEFT JOIN credential_verifications cv ON cv.certificate_id = c.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Not found' });
  cert.skills = JSON.parse(cert.skills || '[]');

  const endorsements = db.prepare(`
    SELECT we.*, u.name AS endorser_name, u.avatar AS endorser_avatar
    FROM work_endorsements we JOIN users u ON we.endorser_id = u.id
    WHERE we.certificate_id = ?
  `).all(req.params.id);

  res.json({ ...cert, endorsements });
});

// ─── Certificate HTML render (public) ───
router.get('/certificates/:id/render', (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, wm.company, u.name AS user_name, wm.sponsor_logo
    FROM certificates c
    JOIN work_modules wm ON c.module_id = wm.id
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!cert) return res.status(404).send('Certificate not found');

  const gradeColors = { pass: '#4ade80', merit: '#60a5fa', distinction: '#a78bfa', excellence: '#facc15' };
  const gradeColor = gradeColors[cert.grade] || '#4ade80';

  res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${cert.title} - LaunchPad Certificate</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #0f0f1a; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 40px; }
  .certificate { max-width: 900px; width: 100%; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border: 2px solid ${gradeColor}; border-radius: 24px; padding: 60px; position: relative; overflow: hidden; box-shadow: 0 0 80px ${gradeColor}33; }
  .certificate::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, ${gradeColor}11 0%, transparent 70%); pointer-events: none; }
  .corner { position: absolute; width: 80px; height: 80px; border: 3px solid ${gradeColor}; opacity: 0.3; }
  .corner-tl { top: 20px; left: 20px; border-right: none; border-bottom: none; border-radius: 12px 0 0 0; }
  .corner-tr { top: 20px; right: 20px; border-left: none; border-bottom: none; border-radius: 0 12px 0 0; }
  .corner-bl { bottom: 20px; left: 20px; border-right: none; border-top: none; border-radius: 0 0 0 12px; }
  .corner-br { bottom: 20px; right: 20px; border-left: none; border-top: none; border-radius: 0 0 12px 0; }
  .seal { width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${gradeColor}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; background: ${gradeColor}22; }
  .header { text-align: center; margin-bottom: 40px; position: relative; z-index: 1; }
  .header h1 { font-size: 14px; letter-spacing: 4px; color: ${gradeColor}; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
  .header h2 { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 4px; }
  .header .issuer { color: #888; font-size: 14px; }
  .content { text-align: center; position: relative; z-index: 1; }
  .content .awarded { color: #888; font-size: 16px; margin-bottom: 8px; }
  .content .name { font-size: 42px; font-weight: 800; color: #fff; margin-bottom: 8px; background: linear-gradient(135deg, #fff 0%, ${gradeColor} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .content .for-text { color: #aaa; font-size: 18px; margin-bottom: 4px; }
  .content .title-text { font-size: 28px; font-weight: 700; color: ${gradeColor}; margin-bottom: 8px; }
  .content .company { color: #888; font-size: 16px; margin-bottom: 30px; }
  .grade-badge { display: inline-block; padding: 8px 24px; border: 2px solid ${gradeColor}; border-radius: 50px; color: ${gradeColor}; font-weight: 700; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
  .skills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 30px; }
  .skills span { padding: 6px 16px; background: #ffffff11; border: 1px solid #ffffff22; border-radius: 50px; font-size: 12px; color: #ccc; }
  .footer { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #ffffff22; position: relative; z-index: 1; }
  .footer .date { color: #666; font-size: 13px; }
  .footer .verify { text-align: right; }
  .footer .verify a { color: ${gradeColor}; font-size: 12px; text-decoration: none; opacity: 0.8; }
  .footer .verify .token { color: #555; font-size: 11px; margin-top: 4px; }
  .footer .logo { font-weight: 800; font-size: 20px; background: linear-gradient(135deg, #a78bfa, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  @media print { body { background: #fff; } .certificate { box-shadow: none; border-color: #ccc; } }
</style></head><body>
<div class="certificate">
  <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
  <div class="corner corner-bl"></div><div class="corner corner-br"></div>
  <div class="header">
    <div class="seal">🏆</div>
    <h1>Certificate of Completion</h1>
    <h2>LAUNCHPAD</h2>
    <div class="issuer">Verified Micro-Internship Program</div>
  </div>
  <div class="content">
    <div class="awarded">This certifies that</div>
    <div class="name">${cert.user_name}</div>
    <div class="for-text">has successfully completed</div>
    <div class="title-text">${cert.title}</div>
    <div class="company">${cert.company}</div>
    <div class="grade-badge">${cert.grade}</div>
    ${cert.skills.length ? '<div class="skills">' + cert.skills.map(s => '<span>' + s + '</span>').join('') + '</div>' : ''}
  </div>
  <div class="footer">
    <div><div class="logo">🚀 LaunchPad</div><div class="date">Issued: ${new Date(cert.issued_at).toLocaleDateString()}</div></div>
    <div class="verify">
      <a href="/api/work/certificates/${cert.id}/verify">🔗 Verify Credential</a>
      <div class="token">ID: ${cert.id.slice(0, 8)}...</div>
    </div>
  </div>
</div></body></html>`);
});

// ─── Public Verification ───
router.get('/certificates/:id/verify', (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, u.name AS user_name, wm.company, wm.title, cv.verification_token, cv.view_count
    FROM certificates c
    JOIN users u ON c.user_id = u.id
    JOIN work_modules wm ON c.module_id = wm.id
    LEFT JOIN credential_verifications cv ON cv.certificate_id = c.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!cert) return res.status(404).json({ valid: false, error: 'Certificate not found' });

  if (cert.verification_token) {
    db.prepare('UPDATE credential_verifications SET view_count = view_count + 1 WHERE certificate_id = ?').run(req.params.id);
  }

  res.json({
    valid: true,
    name: cert.user_name,
    title: cert.title,
    company: cert.company,
    grade: cert.grade,
    issued: cert.issued_at,
    skills: JSON.parse(cert.skills || '[]'),
    verificationToken: cert.verification_token,
    verified: true
  });
});

router.get('/verify/:token', (req, res) => {
  const cv = db.prepare(`
    SELECT c.id AS cert_id FROM credential_verifications cv
    JOIN certificates c ON cv.certificate_id = c.id
    WHERE cv.verification_token = ? AND cv.active = 1
  `).get(req.params.token);

  if (!cv) return res.status(404).json({ valid: false });
  res.redirect(`/api/work/certificates/${cv.cert_id}/verify`);
});

// ─── Endorsements ───
router.post('/certificates/:id/endorse', authenticateToken, (req, res) => {
  const { message, relationship } = req.body;
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });

  const existing = db.prepare('SELECT id FROM work_endorsements WHERE certificate_id = ? AND endorser_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already endorsed' });

  const id = uuidv4();
  db.prepare('INSERT INTO work_endorsements (id, certificate_id, endorser_id, message, relationship) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, req.user.id, message || '', relationship || 'mentor');

  db.prepare('UPDATE certificates SET grade = grade WHERE id = ?').run(req.params.id);

  res.status(201).json({ id });
});

// ─── Work Experiences (Portfolio) ───
router.get('/experiences', authenticateToken, (req, res) => {
  const exps = db.prepare(`
    SELECT pwe.*, c.title AS cert_title, c.grade AS cert_grade
    FROM portfolio_work_experiences pwe
    LEFT JOIN certificates c ON pwe.certificate_id = c.id
    WHERE pwe.user_id = ? AND pwe.visible = 1
    ORDER BY pwe.start_date DESC
  `).all(req.user.id);
  exps.forEach(e => { e.skills_learned = JSON.parse(e.skills_learned || '[]'); });
  res.json({ experiences: exps });
});

router.get('/experiences/:userId/public', (req, res) => {
  const exps = db.prepare(`
    SELECT pwe.*, c.id AS cert_id, c.grade AS cert_grade, c.title AS cert_title
    FROM portfolio_work_experiences pwe
    LEFT JOIN certificates c ON pwe.certificate_id = c.id
    WHERE pwe.user_id = ? AND pwe.visible = 1
    ORDER BY pwe.start_date DESC
  `).all(req.params.userId);
  exps.forEach(e => { e.skills_learned = JSON.parse(e.skills_learned || '[]'); });
  res.json({ experiences: exps });
});

// ─── Stats ───
router.get('/stats', authenticateToken, (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM work_enrollments WHERE user_id = ?) AS total_enrolled,
      (SELECT COUNT(*) FROM work_enrollments WHERE user_id = ? AND status = 'completed') AS total_completed,
      (SELECT COUNT(*) FROM certificates WHERE user_id = ?) AS total_certificates,
      (SELECT COUNT(*) FROM work_endorsements we JOIN certificates c ON we.certificate_id = c.id WHERE c.user_id = ?) AS total_endorsements,
      (SELECT SUM(duration_hours) FROM work_enrollments we JOIN work_modules wm ON we.module_id = wm.id WHERE we.user_id = ? AND we.status = 'completed') AS total_hours
  `).all(...Array(5).fill(req.user.id))[0];
  res.json(stats);
});

// ─── Helpers ───
function generateCertificate(userId, mod, enrollmentId) {
  const certId = uuidv4();
  const gradeOptions = ['pass', 'merit', 'distinction', 'excellence'];
  const grade = gradeOptions[Math.floor(Math.random() * gradeOptions.length)];
  const skills = JSON.parse(mod.skills || '[]');

  db.prepare('INSERT INTO certificates (id, user_id, module_id, enrollment_id, title, description, issuer, issuer_logo, skills, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(certId, userId, mod.id, enrollmentId, mod.title, mod.description || '', mod.company, mod.sponsor_logo || '', JSON.stringify(skills), grade);

  const token = uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase();
  const publicUrl = `/api/work/verify/${token}`;
  db.prepare('INSERT INTO credential_verifications (id, certificate_id, verification_token, public_url) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), certId, token, publicUrl);

  db.prepare('INSERT INTO portfolio_work_experiences (id, user_id, company, position, type, start_date, end_date, skills_learned, certificate_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), userId, mod.company, mod.title, 'micro_internship', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0], JSON.stringify(skills), certId);

  skills.forEach(skill => {
    const existing = db.prepare('SELECT id FROM skill_credentials WHERE user_id = ? AND skill = ?').get(userId, skill);
    if (!existing) {
      db.prepare('INSERT INTO skill_credentials (id, user_id, skill, source, source_id, level, verified, verified_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), userId, skill, 'work_module', certId, grade === 'excellence' || grade === 'distinction' ? 'advanced' : 'intermediate', 1, 'LaunchPad AI');
    }
  });

  db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, reference_id) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), userId, 'certificate', '🎉 New Certificate Earned!', `You earned "${mod.title}" from ${mod.company}`, certId);

  db.prepare(`INSERT INTO xp_transactions (id, user_id, amount, source, description) VALUES (?, ?, ?, ?, ?)`)
    .run(uuidv4(), userId, 150, 'work_completion', `Completed work module: ${mod.title}`);
  db.prepare('UPDATE users SET xp = xp + 150 WHERE id = ?').run(userId);

  return certId;
}

function awardCompletionXP(userId, difficulty) {
  const xpMap = { beginner: 50, intermediate: 100, advanced: 200 };
  const xp = xpMap[difficulty] || 50;
  db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xp, userId);
  db.prepare(`INSERT INTO xp_transactions (id, user_id, amount, source, description) VALUES (?, ?, ?, ?, ?)`)
    .run(uuidv4(), userId, xp, 'work_step', `Completed step in ${difficulty} module`);
}

export default router;
