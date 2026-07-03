import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import sqliteDb from './database.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BATCH_SIZE = 100;

// Map SQLite table → Supabase table (with column mapping if needed)
const TABLE_MAP = {
  users: { columns: '*' },
  mentors: { columns: '*' },
  mentorship_requests: { columns: '*' },
  mentorship_sessions: { columns: '*' },
  moderation_log: { columns: '*' },
  vetted_spaces: { columns: '*' },
  portfolio_projects: { columns: '*' },
  skill_badges: { columns: '*' },
  endorsements: { columns: '*' },
  journey_entries: { columns: '*' },
  freelance_gigs: { columns: '*' },
  freelance_applications: { columns: '*' },
  wallet_transactions: { columns: '*' },
  micro_internships: { columns: '*' },
  micro_internship_enrollments: { columns: '*' },
  apprenticeship_programs: { columns: '*' },
  universities: { columns: '*' },
  university_applications: { columns: '*' },
  scholarship_opportunities: { columns: '*' },
  admission_predictions: { columns: '*' },
  student_academics: { columns: '*' },
  extracurriculars: { columns: '*' },
  campus_hubs: { columns: '*' },
  hub_members: { columns: '*' },
  peer_cohorts: { columns: '*' },
  cohort_members: { columns: '*' },
  daily_quests: { columns: '*' },
  xp_transactions: { columns: '*' },
  coin_transactions: { columns: '*' },
  redeemable_rewards: { columns: '*' },
  reward_redemptions: { columns: '*' },
  university_tasks: { columns: '*' },
  groups_table: { columns: '*' },
  group_members: { columns: '*' },
  posts: { columns: '*' },
  post_likes: { columns: '*' },
  comments: { columns: '*' },
  messages: { columns: '*' },
  events: { columns: '*' },
  event_attendees: { columns: '*' },
  resources: { columns: '*' },
  achievements: { columns: '*' },
  notifications: { columns: '*' },
  work_modules: { columns: '*' },
  work_enrollments: { columns: '*' },
  work_submissions: { columns: '*' },
  certificates: { columns: '*' },
  credential_verifications: { columns: '*' },
  work_endorsements: { columns: '*' },
  skill_credentials: { columns: '*' },
  portfolio_work_experiences: { columns: '*' },
};

// JSON fields that need string→object conversion for Supabase
const JSON_FIELDS = new Set([
  'interests', 'skills', 'goals', 'expertise', 'availability',
  'tags', 'skills_needed', 'steps', 'deliverables', 'rubric',
  'skills_learned', 'file_urls', 'programs', 'requirements',
  'essays', 'recommendation_letters', 'eligibility',
  'monitor_log', 'recommendations', 'factors',
]);

function prepareRow(row) {
  if (!row) return row;
  const prepared = { ...row };
  for (const key of Object.keys(prepared)) {
    if (JSON_FIELDS.has(key) && typeof prepared[key] === 'string') {
      try { prepared[key] = JSON.parse(prepared[key]); } catch {}
    }
  }
  return prepared;
}

async function migrateTable(tableName) {
  console.log(`Migrating ${tableName}...`);
  let offset = 0;
  let total = 0;

  while (true) {
    const rows = sqliteDb.prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`).all(BATCH_SIZE, offset);
    if (rows.length === 0) break;

    const prepared = rows.map(prepareRow);
    const { error } = await supabase.from(tableName).upsert(prepared, { ignoreDuplicates: false });

    if (error) {
      console.error(`  Error inserting ${tableName} batch:`, error.message);
      // Try one-by-one
      for (const row of prepared) {
        const { error: rowError } = await supabase.from(tableName).upsert(row);
        if (rowError) console.error(`  Row error (${row.id?.slice(0,8)}): ${rowError.message}`);
        else total++;
      }
    } else {
      total += rows.length;
    }
    offset += BATCH_SIZE;
  }
  console.log(`  Done: ${total} rows migrated`);
  return total;
}

async function main() {
  console.log('=== LaunchPad SQLite → Supabase Migration ===\n');

  const tables = Object.keys(TABLE_MAP);
  let grandTotal = 0;

  for (const table of tables) {
    try {
      const count = sqliteDb.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
      if (count.c === 0) {
        console.log(`Skipping ${table} (empty)`);
        continue;
      }
      grandTotal += await migrateTable(table);
    } catch (err) {
      console.log(`Skipping ${table} (not found or error): ${err.message}`);
    }
  }

  console.log(`\n=== Migration complete: ${grandTotal} total rows migrated ===`);
  console.log('Next steps:');
  console.log('1. Run the SQL from migrations/supabase.sql in Supabase SQL Editor');
  console.log('2. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  console.log('3. Update server.js to initialize Supabase client');
  console.log('4. Run: node migrations/migrate-data.js');
  process.exit(0);
}

main();
