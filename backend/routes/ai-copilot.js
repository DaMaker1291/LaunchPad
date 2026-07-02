import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/essay/review', authenticateToken, (req, res) => {
  const { essayText, prompt } = req.body;
  if (!essayText) return res.status(400).json({ error: 'Essay text required' });

  const wordCount = essayText.split(/\s+/).length;
  const cliches = ['in today\'s society', 'my passion', 'ever since I was young', 'it was then that I realized', 'through this experience I learned', 'I am honored', 'the journey'];
  const foundCliches = cliches.filter(c => essayText.toLowerCase().includes(c));
  const hasWeakOpening = essayText.length > 0 && /^(i was|i am|the|when|my|a|an|it|there)/i.test(essayText.trim());
  const avgSentenceLength = essayText.split(/[.!?]+/).filter(s => s.trim()).reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0) / Math.max(1, essayText.split(/[.!?]+/).filter(s => s.trim()).length);

  const recommendations = [];
  if (wordCount < 250) recommendations.push('Your essay is too short. Aim for 400-650 words.');
  if (wordCount > 700) recommendations.push('Your essay exceeds the typical word limit. Consider trimming to under 650 words.');
  if (foundCliches.length > 0) recommendations.push(`Avoid overused phrases: "${foundCliches.join(', ')}" — be more specific and personal.`);
  if (hasWeakOpening) recommendations.push('Your opening sentence is generic. Try starting with a vivid, specific moment or scene.');
  if (avgSentenceLength > 25) recommendations.push('Your sentences average over 25 words. Vary sentence length for better rhythm.');
  if (avgSentenceLength < 10) recommendations.push('Your sentences are very short. Try combining some for smoother flow.');

  const toneScore = Math.min(100, Math.max(40, 70 - foundCliches.length * 5 + (hasWeakOpening ? -10 : 5) + (avgSentenceLength > 15 && avgSentenceLength < 25 ? 10 : 0)));

  res.json({
    wordCount,
    toneScore,
    recommendations: recommendations.length > 0 ? recommendations : ['Your essay reads well! Consider having a teacher or mentor review it.'],
    stats: { avgSentenceLength: Math.round(avgSentenceLength * 10) / 10, clichesFound: foundCliches.length, weakOpening: hasWeakOpening }
  });
});

router.post('/resume/review', authenticateToken, (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText) return res.status(400).json({ error: 'Resume text required' });

  const sections = resumeText.toLowerCase();
  const hasEducation = /education|school|university|gpa/.test(sections);
  const hasSkills = /skills|technologies|proficient|languages/.test(sections);
  const hasExperience = /experience|internship|work|volunteer|project/.test(sections);
  const hasActionVerbs = /developed|created|led|managed|designed|implemented|achieved|improved|built/.test(sections);
  const hasNumbers = /\d+/.test(resumeText);

  const missing = [];
  if (!hasEducation) missing.push('Education section');
  if (!hasSkills) missing.push('Skills section');
  if (!hasExperience) missing.push('Experience/Projects section');
  if (!hasActionVerbs) missing.push('Action verbs (developed, created, led, etc.)');
  if (!hasNumbers) missing.push('Quantifiable achievements (numbers, percentages)');

  const score = Math.min(100, Math.max(20, 40 + (hasEducation ? 15 : 0) + (hasSkills ? 15 : 0) + (hasExperience ? 15 : 0) + (hasActionVerbs ? 10 : 0) + (hasNumbers ? 5 : 0)));

  res.json({
    score,
    missing,
    recommendations: missing.length > 0
      ? missing.map(m => `Add "${m}" to strengthen your resume.`)
      : ['Strong resume structure! Ensure all dates are consistent and formatting is clean.'],
    sectionsFound: { education: hasEducation, skills: hasSkills, experience: hasExperience, actionVerbs: hasActionVerbs, quantifiable: hasNumbers }
  });
});

export default router;
