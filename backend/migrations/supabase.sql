-- LaunchPad PostgreSQL/Supabase Schema
-- Generated from SQLite schema. Run this in Supabase SQL Editor.

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER CHECK(age >= 12 AND age <= 100),
  role TEXT CHECK(role IN ('student','mentor','parent','alumni')) DEFAULT 'student',
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  school TEXT DEFAULT '',
  grade TEXT DEFAULT '',
  interests JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]',
  verified INTEGER DEFAULT 0,
  verification_doc TEXT DEFAULT '',
  cohort TEXT CHECK(cohort IN ('12-14','15-18','adult')) DEFAULT '',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  coins INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active DATE DEFAULT CURRENT_DATE,
  alumni INTEGER DEFAULT 0,
  parent_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cohort ON users(cohort);
CREATE INDEX idx_users_parent ON users(parent_id);

-- Mentors
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expertise JSONB DEFAULT '[]',
  company TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  availability JSONB DEFAULT '{}',
  rating REAL DEFAULT 0,
  sessions_count INTEGER DEFAULT 0
);
CREATE INDEX idx_mentors_user ON mentors(user_id);

-- Mentorship Requests
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  mentor_id UUID NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending','accepted','rejected')) DEFAULT 'pending',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mentorship_req_mentor ON mentorship_requests(mentor_id);

-- Mentorship Sessions
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),
  date TIMESTAMPTZ NOT NULL,
  duration INTEGER DEFAULT 30,
  topic TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT CHECK(status IN ('scheduled','completed','cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation Log
CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT DEFAULT '',
  flagged_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_moderation_target ON moderation_log(target_type, target_id);

-- Vetted Spaces
CREATE TABLE IF NOT EXISTS vetted_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('chat','forum','session')) DEFAULT 'chat',
  participant_a UUID NOT NULL,
  participant_b UUID NOT NULL,
  monitor_log JSONB DEFAULT '[]',
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Projects
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  project_type TEXT CHECK(project_type IN ('code','art','essay','robotics','speech','debate','video','other')) DEFAULT 'other',
  media_url TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_portfolio_user ON portfolio_projects(user_id);

-- Skill Badges
CREATE TABLE IF NOT EXISTS skill_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  level TEXT CHECK(level IN ('basic','intermediate','advanced','expert')) DEFAULT 'basic',
  verified INTEGER DEFAULT 0,
  challenge_score INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_badges_user ON skill_badges(user_id);

-- Endorsements
CREATE TABLE IF NOT EXISTS endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endorser_id UUID NOT NULL REFERENCES users(id),
  skill TEXT NOT NULL,
  message TEXT DEFAULT '',
  relationship TEXT CHECK(relationship IN ('teacher','coach','peer','mentor','parent')) DEFAULT 'peer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journey Entries
CREATE TABLE IF NOT EXISTS journey_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  entry_type TEXT CHECK(entry_type IN ('hobby','skill','course','project','achievement','milestone')) DEFAULT 'milestone',
  date DATE NOT NULL,
  icon TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freelance Gigs
CREATE TABLE IF NOT EXISTS freelance_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  skills_needed JSONB DEFAULT '[]',
  status TEXT CHECK(status IN ('open','in_progress','completed','cancelled')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freelance Applications
CREATE TABLE IF NOT EXISTS freelance_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES freelance_gigs(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES users(id),
  message TEXT DEFAULT '',
  bid TEXT DEFAULT '',
  status TEXT CHECK(status IN ('pending','accepted','rejected','completed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('deposit','withdrawal','payment','fee','reward')) DEFAULT 'reward',
  description TEXT DEFAULT '',
  status TEXT CHECK(status IN ('pending','completed','failed')) DEFAULT 'completed',
  parent_approved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Micro Internships
CREATE TABLE IF NOT EXISTS micro_internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration_hours INTEGER DEFAULT 5,
  category TEXT DEFAULT '',
  skills JSONB DEFAULT '[]',
  compensation TEXT DEFAULT '',
  age_min INTEGER DEFAULT 12,
  age_max INTEGER DEFAULT 18,
  sponsored INTEGER DEFAULT 0,
  sponsor_logo TEXT DEFAULT '',
  spots_available INTEGER DEFAULT 10,
  spots_filled INTEGER DEFAULT 0,
  posted_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Micro Internship Enrollments
CREATE TABLE IF NOT EXISTS micro_internship_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  micro_id UUID NOT NULL REFERENCES micro_internships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('enrolled','in_progress','completed','dropped')) DEFAULT 'enrolled',
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Apprenticeship Programs
CREATE TABLE IF NOT EXISTS apprenticeship_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  field TEXT DEFAULT '',
  duration_months INTEGER DEFAULT 6,
  location TEXT DEFAULT '',
  paid INTEGER DEFAULT 0,
  requirements JSONB DEFAULT '[]',
  age_min INTEGER DEFAULT 16,
  posted_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Universities
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT DEFAULT '',
  city TEXT DEFAULT '',
  description TEXT DEFAULT '',
  programs JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '{}',
  tuition_fee TEXT DEFAULT '',
  website TEXT DEFAULT '',
  rating REAL DEFAULT 0,
  image TEXT DEFAULT ''
);

-- University Applications
CREATE TABLE IF NOT EXISTS university_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  university_id UUID NOT NULL REFERENCES universities(id),
  program TEXT DEFAULT '',
  status TEXT CHECK(status IN ('draft','submitted','reviewing','accepted','rejected')) DEFAULT 'draft',
  essays JSONB DEFAULT '[]',
  recommendation_letters JSONB DEFAULT '[]',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scholarship Opportunities
CREATE TABLE IF NOT EXISTS scholarship_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT DEFAULT '',
  amount TEXT DEFAULT '',
  description TEXT DEFAULT '',
  requirements JSONB DEFAULT '[]',
  eligibility JSONB DEFAULT '{}',
  deadline DATE,
  application_url TEXT DEFAULT '',
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admission Predictions
CREATE TABLE IF NOT EXISTS admission_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  university_id UUID NOT NULL REFERENCES universities(id),
  probability REAL DEFAULT 0,
  recommendations JSONB DEFAULT '[]',
  factors JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Student Academics
CREATE TABLE IF NOT EXISTS student_academics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade TEXT DEFAULT '',
  score REAL DEFAULT 0,
  ap_class INTEGER DEFAULT 0,
  semester TEXT DEFAULT '',
  year INTEGER DEFAULT 2024,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_academics_user ON student_academics(user_id);

-- Extracurriculars
CREATE TABLE IF NOT EXISTS extracurriculars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  role TEXT DEFAULT '',
  hours_per_week INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campus Hubs
CREATE TABLE IF NOT EXISTS campus_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id),
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES users(id),
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hub Members
CREATE TABLE IF NOT EXISTS hub_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES campus_hubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT CHECK(role IN ('admin','member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer Cohorts
CREATE TABLE IF NOT EXISTS peer_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  skill_focus TEXT DEFAULT '',
  size INTEGER DEFAULT 5,
  created_by UUID NOT NULL REFERENCES users(id),
  member_count INTEGER DEFAULT 1,
  status TEXT CHECK(status IN ('forming','active','completed')) DEFAULT 'forming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort Members
CREATE TABLE IF NOT EXISTS cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES peer_cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT CHECK(role IN ('lead','member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Quests
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  xp_reward INTEGER DEFAULT 10,
  coin_reward INTEGER DEFAULT 5,
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,
  completed INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP Transactions
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_xp_user ON xp_transactions(user_id);

-- Coin Transactions
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redeemable Rewards
CREATE TABLE IF NOT EXISTS redeemable_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  coin_cost INTEGER NOT NULL,
  category TEXT DEFAULT '',
  provider TEXT DEFAULT '',
  stock INTEGER DEFAULT 100,
  image TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES redeemable_rewards(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending','fulfilled','cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- University Tasks
CREATE TABLE IF NOT EXISTS university_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TIMESTAMPTZ,
  completed INTEGER DEFAULT 0,
  category TEXT CHECK(category IN ('test','essay','application','scholarship','other')) DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups
CREATE TABLE IF NOT EXISTS groups_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  image TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES users(id),
  member_count INTEGER DEFAULT 1,
  age_restricted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups_table(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT CHECK(role IN ('admin','moderator','member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image TEXT DEFAULT '',
  type TEXT CHECK(type IN ('post','achievement','question','resource','opportunity')) DEFAULT 'post',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  moderated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_moderated ON posts(moderated);

-- Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  moderated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  moderated INTEGER DEFAULT 0,
  in_vetted_space INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, created_at DESC);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TIMESTAMPTZ NOT NULL,
  duration INTEGER DEFAULT 60,
  type TEXT CHECK(type IN ('webinar','workshop','meetup','career_talk','live_stream','other')) DEFAULT 'webinar',
  host_id UUID NOT NULL REFERENCES users(id),
  max_attendees INTEGER DEFAULT 100,
  attendees_count INTEGER DEFAULT 0,
  location TEXT DEFAULT '',
  online INTEGER DEFAULT 1,
  link TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  age_restricted TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Attendees
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('registered','attended','cancelled')) DEFAULT 'registered',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  type TEXT CHECK(type IN ('article','video','course','book','tool','other')) DEFAULT 'article',
  category TEXT DEFAULT '',
  age_min INTEGER DEFAULT 12,
  age_max INTEGER DEFAULT 18,
  posted_by UUID NOT NULL REFERENCES users(id),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  category TEXT CHECK(category IN ('skill','education','volunteer','leadership','competition','other')) DEFAULT 'other',
  date_earned DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- ============================================================
-- NEW: Work Module System
-- ============================================================

-- Work Modules
CREATE TABLE IF NOT EXISTS work_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  difficulty TEXT CHECK(difficulty IN ('beginner','intermediate','advanced')) DEFAULT 'beginner',
  duration_hours INTEGER DEFAULT 5,
  steps JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  deliverables JSONB DEFAULT '[]',
  rubric JSONB DEFAULT '{}',
  compensation TEXT DEFAULT '',
  age_min INTEGER DEFAULT 12,
  age_max INTEGER DEFAULT 18,
  sponsored INTEGER DEFAULT 0,
  sponsor_logo TEXT DEFAULT '',
  spots_available INTEGER DEFAULT 100,
  spots_filled INTEGER DEFAULT 0,
  posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Enrollments
CREATE TABLE IF NOT EXISTS work_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES work_modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('enrolled','in_progress','submitted','reviewed','completed','dropped')) DEFAULT 'enrolled',
  current_step INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Work Submissions
CREATE TABLE IF NOT EXISTS work_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES work_enrollments(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  content TEXT DEFAULT '',
  file_urls JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  status TEXT CHECK(status IN ('draft','submitted','approved','revision_needed')) DEFAULT 'draft',
  reviewer_id UUID REFERENCES users(id),
  review_notes TEXT DEFAULT '',
  review_score INTEGER,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  module_id UUID NOT NULL REFERENCES work_modules(id),
  enrollment_id UUID NOT NULL REFERENCES work_enrollments(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  issuer TEXT NOT NULL,
  issuer_logo TEXT DEFAULT '',
  skills JSONB DEFAULT '[]',
  grade TEXT CHECK(grade IN ('pass','merit','distinction','excellence')) DEFAULT 'pass',
  certificate_url TEXT DEFAULT '',
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credential Verifications
CREATE TABLE IF NOT EXISTS credential_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  verification_token TEXT UNIQUE NOT NULL,
  public_url TEXT DEFAULT '',
  qr_data TEXT DEFAULT '',
  view_count INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Endorsements
CREATE TABLE IF NOT EXISTS work_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  endorser_id UUID NOT NULL REFERENCES users(id),
  message TEXT DEFAULT '',
  relationship TEXT DEFAULT 'mentor',
  verified INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill Credentials
CREATE TABLE IF NOT EXISTS skill_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  source TEXT CHECK(source IN ('work_module','certificate','endorsement','manual_verify')) DEFAULT 'work_module',
  source_id TEXT DEFAULT '',
  level TEXT CHECK(level IN ('beginner','intermediate','advanced','expert')) DEFAULT 'intermediate',
  verified INTEGER DEFAULT 0,
  verified_by TEXT DEFAULT '',
  expiry_date DATE,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Work Experiences
CREATE TABLE IF NOT EXISTS portfolio_work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  type TEXT CHECK(type IN ('internship','volunteer','part-time','shadowing','project','freelance','micro_internship')) DEFAULT 'micro_internship',
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT DEFAULT '',
  skills_learned JSONB DEFAULT '[]',
  certificate_id UUID REFERENCES certificates(id),
  endorsement_count INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('current','completed')) DEFAULT 'completed',
  visible INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (Supabase specific)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are readable" ON users FOR SELECT USING (true);
CREATE POLICY "Projects are public" ON portfolio_projects FOR SELECT USING (true);
CREATE POLICY "Own projects can be managed" ON portfolio_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Posts are public" ON posts FOR SELECT USING (moderated = 0);
CREATE POLICY "Messages are private" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
