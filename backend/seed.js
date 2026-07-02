import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';

const hash = bcrypt.hashSync('password123', 10);

const tables = ['users', 'mentors', 'mentorship_requests', 'mentorship_sessions', 'universities', 'university_applications', 'university_tasks', 'work_experiences', 'job_listings', 'job_applications', 'groups_table', 'group_members', 'posts', 'post_likes', 'comments', 'messages', 'events', 'event_attendees', 'achievements', 'connections', 'notifications', 'resources', 'portfolio_projects', 'skill_badges', 'endorsements', 'journey_entries', 'freelance_gigs', 'freelance_applications', 'wallet_transactions', 'micro_internships', 'micro_internship_enrollments', 'apprenticeship_programs', 'scholarship_opportunities', 'admission_predictions', 'student_academics', 'extracurriculars', 'campus_hubs', 'hub_members', 'peer_cohorts', 'cohort_members', 'daily_quests', 'xp_transactions', 'coin_transactions', 'redeemable_rewards', 'reward_redemptions', 'moderation_log', 'vetted_spaces'];
tables.forEach(t => { try { db.prepare(`DELETE FROM ${t}`).run(); } catch {} });

const users = [
  { id: uuidv4(), email: 'alex@example.com', name: 'Alex Chen', age: 16, role: 'student', cohort: '15-18', school: 'Lincoln High', grade: '11', interests: JSON.stringify(['Coding', 'Robotics', 'Math']), skills: JSON.stringify(['Python', 'JavaScript', 'React']), bio: 'Aspiring software engineer | Building the future one line at a time', xp: 450, level: 5, coins: 120, streak: 12, verified: 1 },
  { id: uuidv4(), email: 'maya@example.com', name: 'Maya Patel', age: 17, role: 'student', cohort: '15-18', school: 'Westside Academy', grade: '12', interests: JSON.stringify(['Medicine', 'Biology', 'Volunteering']), skills: JSON.stringify(['Research', 'Writing', 'Public Speaking']), bio: 'Future doctor | Pre-med track', xp: 620, level: 6, coins: 200, streak: 8, verified: 1 },
  { id: uuidv4(), email: 'jordan@example.com', name: 'Jordan Smith', age: 14, role: 'student', cohort: '12-14', school: 'Central Middle', grade: '9', interests: JSON.stringify(['Art', 'Music', 'Design']), skills: JSON.stringify(['Illustration', 'Photoshop', 'UI Design']), bio: 'Creative thinker | Digital artist', xp: 230, level: 3, coins: 85, streak: 5 },
  { id: uuidv4(), email: 'sarah@example.com', name: 'Sarah Kim', age: 15, role: 'student', cohort: '15-18', school: 'Northville High', grade: '10', interests: JSON.stringify(['Business', 'Entrepreneurship', 'Public Speaking']), skills: JSON.stringify(['Leadership', 'Communication', 'Marketing']), bio: 'Young entrepreneur | CEO of my own future', xp: 380, level: 4, coins: 150, streak: 15, verified: 1 },
  { id: uuidv4(), email: 'mentor1@example.com', name: 'Dr. James Wilson', age: 18, role: 'mentor', cohort: 'adult', school: 'Stanford University', bio: 'Senior Software Engineer at Google. Passionate about teaching coding to teens.', xp: 1500, level: 12, coins: 500, verified: 1 },
  { id: uuidv4(), email: 'mentor2@example.com', name: 'Prof. Lisa Chang', age: 18, role: 'mentor', cohort: 'adult', school: 'Harvard University', bio: 'Biology professor. Helping students explore careers in medicine and research.', xp: 2000, level: 14, coins: 600, verified: 1 },
  { id: uuidv4(), email: 'mentor3@example.com', name: 'Marcus Johnson', age: 18, role: 'mentor', cohort: 'adult', school: 'MIT', bio: 'Startup founder & investor. Mentoring young entrepreneurs.', xp: 1800, level: 13, coins: 750, verified: 1 },
];
users.forEach(u => {
  db.prepare(`INSERT INTO users (id, email, password, name, age, role, cohort, bio, school, grade, interests, skills, xp, level, coins, streak, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(u.id, u.email, hash, u.name, u.age, u.role, u.cohort, u.bio, u.school, u.grade || '', u.interests || '[]', u.skills || '[]', u.xp || 0, u.level || 1, u.coins || 0, u.streak || 0, u.verified || 0);
});

const mentorData = [
  { user_id: users[4].id, expertise: JSON.stringify(['Python', 'JavaScript', 'Web Development', 'Algorithms']), company: 'Google', job_title: 'Senior Software Engineer' },
  { user_id: users[5].id, expertise: JSON.stringify(['Biology', 'Chemistry', 'Medicine', 'Research Methods']), company: 'Harvard Medical', job_title: 'Professor' },
  { user_id: users[6].id, expertise: JSON.stringify(['Entrepreneurship', 'Business Strategy', 'Marketing', 'Investing']), company: 'TechVentures Inc.', job_title: 'CEO & Founder' },
];
mentorData.forEach(m => {
  db.prepare(`INSERT INTO mentors (id, user_id, expertise, company, job_title, bio) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), m.user_id, m.expertise, m.company, m.job_title, '');
});

const unis = [
  { name: 'Stanford University', country: 'USA', city: 'Stanford, CA', description: 'Leading research university in Silicon Valley. Known for CS, engineering, and entrepreneurship.', programs: JSON.stringify(['Computer Science', 'Engineering', 'Business', 'Biology']), tuition_fee: '$56,000/year', req: JSON.stringify({ gpa_min: 3.8, sat_min: 1420 }) },
  { name: 'MIT', country: 'USA', city: 'Cambridge, MA', description: 'World-renowned for science, technology, and innovation.', programs: JSON.stringify(['Computer Science', 'Physics', 'Engineering', 'Economics']), tuition_fee: '$55,000/year', req: JSON.stringify({ gpa_min: 3.9, sat_min: 1500 }) },
  { name: 'Harvard University', country: 'USA', city: 'Cambridge, MA', description: 'Ivy League university with exceptional programs across all fields.', programs: JSON.stringify(['Medicine', 'Law', 'Business', 'Computer Science']), tuition_fee: '$54,000/year', req: JSON.stringify({ gpa_min: 3.9, sat_min: 1460 }) },
  { name: 'University of Oxford', country: 'UK', city: 'Oxford, England', description: 'One of the oldest and most prestigious universities in the world.', programs: JSON.stringify(['Philosophy', 'Law', 'Medicine', 'Literature']), tuition_fee: '£38,000/year', req: JSON.stringify({ gpa_min: 3.7 }) },
  { name: 'UC Berkeley', country: 'USA', city: 'Berkeley, CA', description: 'Top public university known for STEM and social sciences.', programs: JSON.stringify(['Computer Science', 'Data Science', 'Engineering', 'Economics']), tuition_fee: '$44,000/year (out-of-state)', req: JSON.stringify({ gpa_min: 3.7, sat_min: 1380 }) },
];
unis.forEach(u => {
  db.prepare(`INSERT INTO universities (id, name, country, city, description, programs, tuition_fee, requirements, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), u.name, u.country, u.city, u.description, u.programs, u.tuition_fee, u.req, `https://www.${u.name.toLowerCase().replace(/\s+/g, '')}.edu`);
});

const scholarships = [
  { name: 'National Merit Scholarship', provider: 'National Merit Corp', amount: '$2,500', description: 'For high-performing PSAT/NMSQT test takers', requirements: JSON.stringify(['Top 1% PSAT scores', 'US Citizen']), deadline: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], category: 'Academic' },
  { name: 'Coca-Cola Scholars Program', provider: 'Coca-Cola Foundation', amount: '$20,000', description: 'For community-minded high school seniors', requirements: JSON.stringify(['Strong community service record', 'Minimum 3.5 GPA']), deadline: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], category: 'Community Service' },
  { name: 'Google Generation Scholarship', provider: 'Google', amount: '$10,000', description: 'For students pursuing computer science degrees', requirements: JSON.stringify(['CS/related major intended', 'Demonstrated financial need']), deadline: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0], category: 'STEM' },
  { name: 'Elks Most Valuable Student', provider: 'Elks National Foundation', amount: '$15,000', description: 'For leadership and academic achievement', requirements: JSON.stringify(['Leadership experience', 'Community involvement']), deadline: new Date(Date.now() + 150 * 86400000).toISOString().split('T')[0], category: 'Leadership' },
];
scholarships.forEach(s => {
  db.prepare(`INSERT INTO scholarship_opportunities (id, name, provider, amount, description, requirements, deadline, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), s.name, s.provider, s.amount, s.description, s.requirements, s.deadline, s.category);
});

const microInternships = [
  { company: 'TechStart Academy', title: 'Build a Weather App (5hr)', description: 'Learn React by building a real weather dashboard. Mentorship included!', duration_hours: 5, category: 'Web Dev', skills: JSON.stringify(['HTML', 'CSS', 'JavaScript']), compensation: 'Certificate + Letter of Rec', sponsored: 1 },
  { company: 'GreenEarth Org', title: 'Social Media Takeover (5hr)', description: 'Run our Instagram for a week. Create content and analyze engagement.', duration_hours: 5, category: 'Marketing', skills: JSON.stringify(['Social Media', 'Content Creation']), compensation: 'Featured Portfolio Badge' },
  { company: 'CodeForGood', title: 'Debug-a-thon Challenge', description: 'Find and fix bugs in open-source projects. Win prizes!', duration_hours: 5, category: 'Coding', skills: JSON.stringify(['Python', 'Git']), compensation: '$50 Gift Card + Swag', sponsored: 1 },
  { company: 'Local Museum', title: 'Virtual Tour Guide Script', description: 'Write the script for our upcoming virtual youth tour.', duration_hours: 5, category: 'Writing', skills: JSON.stringify(['Writing', 'Research']), compensation: 'Volunteer Hours + Reference' },
];
microInternships.forEach(m => {
  db.prepare(`INSERT INTO micro_internships (id, company, title, description, duration_hours, category, skills, compensation, sponsored, spots_available, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), m.company, m.title, m.description, m.duration_hours, m.category, m.skills, m.compensation, m.sponsored, 10, users[4].id);
});

const programs = [
  { company: 'Google', title: 'Google Apprenticeship Program', field: 'Software Engineering', duration_months: 12, paid: 1, age_min: 16 },
  { company: 'Microsoft', title: 'LEAP Apprenticeship', field: 'Technical Roles', duration_months: 16, paid: 1, age_min: 16 },
  { company: 'Local Hospital', title: 'Medical Apprenticeship', field: 'Healthcare', duration_months: 6, paid: 0, age_min: 17 },
];
programs.forEach(p => {
  db.prepare(`INSERT INTO apprenticeship_programs (id, company, title, field, duration_months, paid, age_min, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), p.company, p.title, p.field, p.duration_months, p.paid, p.age_min, users[5].id);
});

const gigs = [
  { poster_id: users[1].id, title: 'Design a Logo for My Science Club', description: 'Need a cool logo for our high school science club. Digital format preferred.', category: 'Design', budget: '$20', skills_needed: JSON.stringify(['Illustration', 'Logo Design']) },
  { poster_id: users[0].id, title: 'Tutor Middle School Math', description: 'Looking for someone to help my brother with 8th grade math (2 hrs/week).', category: 'Tutoring', budget: '$15/hr', skills_needed: JSON.stringify(['Math', 'Teaching']) },
  { poster_id: users[3].id, title: 'Social Media Posts for Student Store', description: 'Create 5 Instagram posts per week for our student-run store.', category: 'Social Media', budget: '$10/hr', skills_needed: JSON.stringify(['Canva', 'Social Media']) },
];
gigs.forEach(g => {
  db.prepare(`INSERT INTO freelance_gigs (id, poster_id, title, description, category, budget, skills_needed) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), g.poster_id, g.title, g.description, g.category, g.budget, g.skills_needed);
});

const rewards = [
  { name: 'Notion Templates Pack', description: 'Premium Notion templates for college planning', coin_cost: 100, category: 'Productivity', provider: 'Notion' },
  { name: 'Resume Review Session', description: 'Get your resume reviewed by a professional', coin_cost: 250, category: 'Career', provider: 'LaunchPad' },
  { name: 'Interview Prep Course', description: 'Access our exclusive interview prep course', coin_cost: 300, category: 'Education', provider: 'SkillPrep' },
  { name: '$5 Gift Card', description: 'Redeem for an Amazon or Starbucks gift card', coin_cost: 500, category: 'Lifestyle', provider: 'Partner' },
  { name: 'College App Fee Waiver', description: 'One college application fee waived', coin_cost: 1000, category: 'Education', provider: 'LaunchPad' },
];
rewards.forEach(r => {
  db.prepare(`INSERT INTO redeemable_rewards (id, name, description, coin_cost, category, provider) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), r.name, r.description, r.coin_cost, r.category, r.provider);
});

const posts = [
  { user_id: users[0].id, content: 'Just built my first React weather app! The 5-hour micro-internship from TechStart Academy was amazing. Learned so much about APIs and state management 🚀', type: 'achievement', tags: JSON.stringify(['coding', 'react']) },
  { user_id: users[1].id, content: 'Finished my hospital volunteer program (100 hours!). Got endorsed by my supervisor for "Teamwork" and "Resilience". So worth it!', type: 'achievement', tags: JSON.stringify(['medicine', 'volunteer']) },
  { user_id: users[2].id, content: 'My digital art portfolio just hit 1000 likes! Check out my profile to see my latest illustration series 🎨', type: 'achievement', tags: JSON.stringify(['art', 'design']) },
  { user_id: users[3].id, content: 'Our student store startup just got featured in the school newsletter! We used LaunchPad to find our graphic designer. This platform is amazing!', type: 'post', tags: JSON.stringify(['entrepreneurship', 'startup']) },
  { user_id: users[4].id, content: 'FREE coding mentorship: Every Saturday 10am-12pm PST. We cover Python, JavaScript, and web dev. DM me to join the next cohort! 🖥️', type: 'opportunity', tags: JSON.stringify(['coding', 'mentorship']) },
];
posts.forEach(p => {
  db.prepare(`INSERT INTO posts (id, user_id, content, type, tags) VALUES (?, ?, ?, ?, ?)`)
    .run(uuidv4(), p.user_id, p.content, p.type, p.tags);
});

const projects = [
  { user_id: users[0].id, title: 'Weather Dashboard App', description: 'A React app that displays live weather data using OpenWeatherMap API', project_type: 'code', tags: JSON.stringify(['React', 'API', 'JavaScript']) },
  { user_id: users[0].id, title: 'Python Calculator', description: 'Command-line calculator with advanced math functions', project_type: 'code', tags: JSON.stringify(['Python']) },
  { user_id: users[2].id, title: 'Fantasy Landscape Series', description: 'Digital illustrations of imaginary landscapes using Procreate', project_type: 'art', tags: JSON.stringify(['Procreate', 'Digital Art']) },
  { user_id: users[1].id, title: 'Cell Division Research Paper', description: 'Research paper on mitosis regulation for AP Biology', project_type: 'essay', tags: JSON.stringify(['Biology', 'Research']) },
  { user_id: users[3].id, title: 'Student Store Pitch Deck', description: 'Presentation for our school entrepreneurship competition', project_type: 'speech', tags: JSON.stringify(['Business', 'Pitching']) },
];
projects.forEach(p => {
  db.prepare(`INSERT INTO portfolio_projects (id, user_id, title, description, project_type, tags) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), p.user_id, p.title, p.description, p.project_type, p.tags);
});

const badges = [
  { user_id: users[0].id, skill: 'Python', level: 'intermediate', challenge_score: 85 },
  { user_id: users[0].id, skill: 'JavaScript', level: 'intermediate', challenge_score: 78 },
  { user_id: users[1].id, skill: 'Research Methods', level: 'advanced', challenge_score: 92 },
  { user_id: users[2].id, skill: 'Digital Art', level: 'advanced', challenge_score: 95 },
  { user_id: users[3].id, skill: 'Public Speaking', level: 'intermediate', challenge_score: 80 },
  { user_id: users[4].id, skill: 'Software Engineering', level: 'expert', challenge_score: 99 },
];
badges.forEach(b => {
  db.prepare(`INSERT INTO skill_badges (id, user_id, skill, level, verified, challenge_score) VALUES (?, ?, ?, ?, 1, ?)`)
    .run(uuidv4(), b.user_id, b.skill, b.level, b.challenge_score);
});

const academics = [
  { user_id: users[0].id, subject: 'Math', grade: 'A', score: 93, ap_class: 1, semester: 'Fall', year: 2024 },
  { user_id: users[0].id, subject: 'Computer Science', grade: 'A+', score: 98, ap_class: 1, semester: 'Fall', year: 2024 },
  { user_id: users[1].id, subject: 'Biology', grade: 'A+', score: 97, ap_class: 1, semester: 'Fall', year: 2024 },
  { user_id: users[1].id, subject: 'Chemistry', grade: 'A', score: 91, ap_class: 1, semester: 'Fall', year: 2024 },
  { user_id: users[3].id, subject: 'Economics', grade: 'A', score: 94, ap_class: 1, semester: 'Fall', year: 2024 },
];
academics.forEach(a => {
  db.prepare(`INSERT INTO student_academics (id, user_id, subject, grade, score, ap_class, semester, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), a.user_id, a.subject, a.grade, a.score, a.ap_class, a.semester, a.year);
});

const groups = [
  { name: 'STEM Explorers', description: 'For teens interested in Science, Technology, Engineering & Math', category: 'STEM', created_by: users[0].id },
  { name: 'Future Artists Collective', description: 'A community for creative teens to share artwork and get feedback', category: 'Arts', created_by: users[2].id },
  { name: 'Young Entrepreneurs Network', description: 'Learn about startups, business, and innovation together', category: 'Business', created_by: users[3].id },
  { name: 'College Prep Hub', description: 'SAT prep, essay reviews, and university application tips', category: 'Education', created_by: users[1].id },
];
groups.forEach(g => {
  const gid = uuidv4();
  db.prepare(`INSERT INTO groups_table (id, name, description, category, created_by, member_count) VALUES (?, ?, ?, ?, ?, ?)`).run(gid, g.name, g.description, g.category, g.created_by, 1);
  db.prepare(`INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)`).run(uuidv4(), gid, g.created_by, 'admin');
});

const events = [
  { title: 'Intro to Python Programming', description: 'Live coding workshop for beginners. Learn variables, loops, and functions!', date: new Date(Date.now() + 7 * 86400000).toISOString(), type: 'workshop', host_id: users[4].id, tags: JSON.stringify(['coding', 'python', 'beginner']) },
  { title: 'College Essay Bootcamp', description: 'Get tips on writing standout college essays from admission experts.', date: new Date(Date.now() + 14 * 86400000).toISOString(), type: 'workshop', host_id: users[5].id, tags: JSON.stringify(['college', 'essays']) },
  { title: 'Career Talk: Day in the Life of a Software Engineer', description: 'Hear from Google engineers about what it\'s really like in tech.', date: new Date(Date.now() + 21 * 86400000).toISOString(), type: 'career_talk', host_id: users[6].id, tags: JSON.stringify(['career', 'tech']) },
  { title: 'Art Portfolio Review Session', description: 'Get your art portfolio reviewed by professional designers.', date: new Date(Date.now() + 10 * 86400000).toISOString(), type: 'live_stream', host_id: users[2].id, tags: JSON.stringify(['art', 'portfolio']) },
];
events.forEach(e => {
  db.prepare(`INSERT INTO events (id, title, description, date, type, host_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), e.title, e.description, e.date, e.type, e.host_id, e.tags);
});

const resources = [
  { title: 'FreeCodeCamp', description: 'Learn to code for free with interactive lessons', url: 'https://freecodecamp.org', type: 'course', category: 'Coding', posted_by: users[0].id },
  { title: 'Khan Academy', description: 'Free world-class education for anyone, anywhere', url: 'https://khanacademy.org', type: 'course', category: 'Math', posted_by: users[1].id },
  { title: 'Crash Course', description: 'Engaging educational videos on countless subjects', url: 'https://youtube.com/@crashcourse', type: 'video', category: 'General', posted_by: users[2].id },
  { title: 'College Board BigFuture', description: 'College planning, career search, and scholarship matching', url: 'https://bigfuture.collegeboard.org', type: 'tool', category: 'College Prep', posted_by: users[3].id },
  { title: 'MIT OpenCourseWare', description: 'Free MIT course materials for self-learners', url: 'https://ocw.mit.edu', type: 'course', category: 'STEM', posted_by: users[4].id },
];
resources.forEach(r => {
  db.prepare(`INSERT INTO resources (id, title, description, url, type, category, posted_by) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), r.title, r.description, r.url, r.type, r.category, r.posted_by);
});

console.log('✅ LaunchPad database seeded successfully!');
console.log('📧 Test accounts (password: password123):');
console.log('   Student (15-18): alex@example.com');
console.log('   Student (15-18): maya@example.com');
console.log('   Student (12-14): jordan@example.com');
console.log('   Student: sarah@example.com');
console.log('   Mentor: mentor1@example.com');
console.log('   Mentor: mentor2@example.com');
