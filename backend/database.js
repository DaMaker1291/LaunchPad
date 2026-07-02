import 'dotenv/config';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || join(__dirname, 'launchpad.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
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
    interests TEXT DEFAULT '[]',
    skills TEXT DEFAULT '[]',
    goals TEXT DEFAULT '[]',
    verified INTEGER DEFAULT 0,
    verification_doc TEXT DEFAULT '',
    cohort TEXT CHECK(cohort IN ('12-14','15-18','adult')) DEFAULT '',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_active DATE DEFAULT CURRENT_DATE,
    alumni INTEGER DEFAULT 0,
    parent_id TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mentors (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    expertise TEXT DEFAULT '[]',
    company TEXT DEFAULT '',
    job_title TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    availability TEXT DEFAULT '{}',
    rating REAL DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS mentorship_requests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    mentor_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending','accepted','rejected')) DEFAULT 'pending',
    message TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (mentor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id TEXT PRIMARY KEY,
    mentor_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    date DATETIME NOT NULL,
    duration INTEGER DEFAULT 30,
    topic TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT CHECK(status IN ('scheduled','completed','cancelled')) DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS moderation_log (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT DEFAULT '',
    flagged_by TEXT DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vetted_spaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('chat','forum','session')) DEFAULT 'chat',
    participant_a TEXT NOT NULL,
    participant_b TEXT NOT NULL,
    monitor_log TEXT DEFAULT '[]',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS portfolio_projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    project_type TEXT CHECK(project_type IN ('code','art','essay','robotics','speech','debate','video','other')) DEFAULT 'other',
    media_url TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS skill_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    level TEXT CHECK(level IN ('basic','intermediate','advanced','expert')) DEFAULT 'basic',
    verified INTEGER DEFAULT 0,
    challenge_score INTEGER DEFAULT 0,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS endorsements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    endorser_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    message TEXT DEFAULT '',
    relationship TEXT CHECK(relationship IN ('teacher','coach','peer','mentor','parent')) DEFAULT 'peer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (endorser_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS journey_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    entry_type TEXT CHECK(entry_type IN ('hobby','skill','course','project','achievement','milestone')) DEFAULT 'milestone',
    date DATE NOT NULL,
    icon TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS freelance_gigs (
    id TEXT PRIMARY KEY,
    poster_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    budget TEXT DEFAULT '',
    duration TEXT DEFAULT '',
    skills_needed TEXT DEFAULT '[]',
    status TEXT CHECK(status IN ('open','in_progress','completed','cancelled')) DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poster_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS freelance_applications (
    id TEXT PRIMARY KEY,
    gig_id TEXT NOT NULL,
    freelancer_id TEXT NOT NULL,
    message TEXT DEFAULT '',
    bid TEXT DEFAULT '',
    status TEXT CHECK(status IN ('pending','accepted','rejected','completed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gig_id) REFERENCES freelance_gigs(id),
    FOREIGN KEY (freelancer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('deposit','withdrawal','payment','fee','reward')) DEFAULT 'reward',
    description TEXT DEFAULT '',
    status TEXT CHECK(status IN ('pending','completed','failed')) DEFAULT 'completed',
    parent_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS micro_internships (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    duration_hours INTEGER DEFAULT 5,
    category TEXT DEFAULT '',
    skills TEXT DEFAULT '[]',
    compensation TEXT DEFAULT '',
    age_min INTEGER DEFAULT 12,
    age_max INTEGER DEFAULT 18,
    sponsored INTEGER DEFAULT 0,
    sponsor_logo TEXT DEFAULT '',
    spots_available INTEGER DEFAULT 10,
    spots_filled INTEGER DEFAULT 0,
    posted_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS micro_internship_enrollments (
    id TEXT PRIMARY KEY,
    micro_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('enrolled','in_progress','completed','dropped')) DEFAULT 'enrolled',
    progress INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (micro_id) REFERENCES micro_internships(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS apprenticeship_programs (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    field TEXT DEFAULT '',
    duration_months INTEGER DEFAULT 6,
    location TEXT DEFAULT '',
    paid INTEGER DEFAULT 0,
    requirements TEXT DEFAULT '[]',
    age_min INTEGER DEFAULT 16,
    posted_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT DEFAULT '',
    city TEXT DEFAULT '',
    description TEXT DEFAULT '',
    programs TEXT DEFAULT '[]',
    requirements TEXT DEFAULT '{}',
    tuition_fee TEXT DEFAULT '',
    website TEXT DEFAULT '',
    rating REAL DEFAULT 0,
    image TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS university_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    university_id TEXT NOT NULL,
    program TEXT DEFAULT '',
    status TEXT CHECK(status IN ('draft','submitted','reviewing','accepted','rejected')) DEFAULT 'draft',
    essays TEXT DEFAULT '[]',
    recommendation_letters TEXT DEFAULT '[]',
    deadline DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (university_id) REFERENCES universities(id)
  );

  CREATE TABLE IF NOT EXISTS scholarship_opportunities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT DEFAULT '',
    amount TEXT DEFAULT '',
    description TEXT DEFAULT '',
    requirements TEXT DEFAULT '[]',
    eligibility TEXT DEFAULT '{}',
    deadline DATE,
    application_url TEXT DEFAULT '',
    category TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admission_predictions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    university_id TEXT NOT NULL,
    probability REAL DEFAULT 0,
    recommendations TEXT DEFAULT '[]',
    factors TEXT DEFAULT '{}',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (university_id) REFERENCES universities(id)
  );

  CREATE TABLE IF NOT EXISTS student_academics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT DEFAULT '',
    score REAL DEFAULT 0,
    ap_class INTEGER DEFAULT 0,
    semester TEXT DEFAULT '',
    year INTEGER DEFAULT 2024,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS extracurriculars (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    activity TEXT NOT NULL,
    role TEXT DEFAULT '',
    hours_per_week INTEGER DEFAULT 0,
    description TEXT DEFAULT '',
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS campus_hubs (
    id TEXT PRIMARY KEY,
    university_id TEXT NOT NULL,
    name TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_by TEXT NOT NULL,
    member_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS hub_members (
    id TEXT PRIMARY KEY,
    hub_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin','member')) DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hub_id) REFERENCES campus_hubs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS peer_cohorts (
    id TEXT PRIMARY KEY,
    name TEXT DEFAULT '',
    description TEXT DEFAULT '',
    skill_focus TEXT DEFAULT '',
    size INTEGER DEFAULT 5,
    created_by TEXT NOT NULL,
    member_count INTEGER DEFAULT 1,
    status TEXT CHECK(status IN ('forming','active','completed')) DEFAULT 'forming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS cohort_members (
    id TEXT PRIMARY KEY,
    cohort_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('lead','member')) DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cohort_id) REFERENCES peer_cohorts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_quests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quest_type TEXT NOT NULL,
    description TEXT DEFAULT '',
    xp_reward INTEGER DEFAULT 10,
    coin_reward INTEGER DEFAULT 5,
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 1,
    completed INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS xp_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS coin_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS redeemable_rewards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    coin_cost INTEGER NOT NULL,
    category TEXT DEFAULT '',
    provider TEXT DEFAULT '',
    stock INTEGER DEFAULT 100,
    image TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reward_redemptions (
    id TEXT PRIMARY KEY,
    reward_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending','fulfilled','cancelled')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reward_id) REFERENCES redeemable_rewards(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS university_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date DATETIME,
    completed INTEGER DEFAULT 0,
    category TEXT CHECK(category IN ('test','essay','application','scholarship','other')) DEFAULT 'other',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS work_experiences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    type TEXT CHECK(type IN ('internship','volunteer','part-time','shadowing','project','freelance')) DEFAULT 'internship',
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT DEFAULT '',
    skills_learned TEXT DEFAULT '[]',
    status TEXT CHECK(status IN ('current','completed')) DEFAULT 'current',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS groups_table (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    image TEXT DEFAULT '',
    created_by TEXT NOT NULL,
    member_count INTEGER DEFAULT 1,
    age_restricted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin','moderator','member')) DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups_table(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT DEFAULT '',
    type TEXT CHECK(type IN ('post','achievement','question','resource','opportunity')) DEFAULT 'post',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    tags TEXT DEFAULT '[]',
    moderated INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS post_likes (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    moderated INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    moderated INTEGER DEFAULT 0,
    in_vetted_space INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    date DATETIME NOT NULL,
    duration INTEGER DEFAULT 60,
    type TEXT CHECK(type IN ('webinar','workshop','meetup','career_talk','live_stream','other')) DEFAULT 'webinar',
    host_id TEXT NOT NULL,
    max_attendees INTEGER DEFAULT 100,
    attendees_count INTEGER DEFAULT 0,
    location TEXT DEFAULT '',
    online INTEGER DEFAULT 1,
    link TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    age_restricted TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS event_attendees (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('registered','attended','cancelled')) DEFAULT 'registered',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    url TEXT DEFAULT '',
    type TEXT CHECK(type IN ('article','video','course','book','tool','other')) DEFAULT 'article',
    category TEXT DEFAULT '',
    age_min INTEGER DEFAULT 12,
    age_max INTEGER DEFAULT 18,
    posted_by TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    badge TEXT DEFAULT '',
    category TEXT CHECK(category IN ('skill','education','volunteer','leadership','competition','other')) DEFAULT 'other',
    date_earned DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT DEFAULT '',
    reference_id TEXT DEFAULT '',
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

try { db.prepare("ALTER TABLE users ADD COLUMN parent_id TEXT DEFAULT ''").run(); } catch {}
try { db.prepare("ALTER TABLE posts ADD COLUMN moderated INTEGER DEFAULT 0").run(); } catch {}
try { db.prepare("ALTER TABLE comments ADD COLUMN moderated INTEGER DEFAULT 0").run(); } catch {}

export default db;
