import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
let isSupabase = false;

export function initSupabase() {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    isSupabase = true;
    console.log('Supabase client initialized');
  } else {
    console.log('Supabase not configured, using SQLite fallback');
  }
  return supabase;
}

export function getSupabase() {
  if (!supabase) initSupabase();
  return supabase;
}

export function isSupabaseEnabled() {
  return isSupabase;
}

// Helper: convert SQLite-style ? params to Supabase named params
export function buildQuery(table, operation, conditions = {}, options = {}) {
  if (!isSupabase) return null;
  let query = supabase.from(table).select(options.select || '*', { count: 'exact' });

  Object.entries(conditions).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      query = query.eq(key, val);
    }
  });

  if (options.order) query = query.order(options.order.by, { ascending: options.order.ascending || false });
  if (options.limit) query = query.limit(options.limit);
  if (options.range) query = query.range(options.range[0], options.range[1]);

  return query;
}

// Migration helper: convert SQLite row to Supabase compatible
export function convertRow(row, table) {
  if (!row) return row;
  const converted = { ...row };
  // JSON fields that are strings in SQLite need to stay as JSONB for Supabase
  const jsonFields = [
    'interests', 'skills', 'goals', 'expertise', 'availability',
    'tags', 'skills_needed', 'steps', 'deliverables', 'rubric',
    'skills_learned', 'file_urls', 'programs', 'requirements',
    'essays', 'recommendation_letters', 'eligibility',
    'monitor_log', 'recommendations', 'factors', 'education',
    'work', 'projects', 'certifications',
  ];
  jsonFields.forEach(f => {
    if (typeof converted[f] === 'string') {
      try { converted[f] = JSON.parse(converted[f]); } catch {}
    }
  });
  return converted;
}

export default { initSupabase, getSupabase, isSupabaseEnabled, buildQuery, convertRow };
