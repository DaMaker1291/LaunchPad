import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import portfolioRoutes from './routes/portfolio.js';
import freelanceRoutes from './routes/freelance.js';
import admissionsRoutes from './routes/admissions.js';
import mentorshipRoutes from './routes/mentorship.js';
import socialRoutes from './routes/social.js';
import messagingRoutes from './routes/messaging.js';
import gamificationRoutes from './routes/gamification.js';
import safetyRoutes from './routes/safety.js';
import aiCopilotRoutes from './routes/ai-copilot.js';
import parentRoutes from './routes/parent.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/freelance', freelanceRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/ai', aiCopilotRoutes);
app.use('/api/parent', parentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: 'LaunchPad v1.0' }));

app.listen(PORT, () => console.log(`🚀 LaunchPad API running on port ${PORT}`));
