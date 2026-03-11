#!/usr/bin/env node
/**
 * Get row count for table "member-database" in Supabase.
 * Requires: SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in env.
 *
 * Usage:
 *   SUPABASE_URL=https://YOUR_PROJECT.supabase.co SUPABASE_ANON_KEY=your_key node count-member-database.js
 * Or create a .env with those variables and run: node -r dotenv/config count-member-database.js
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

// Table might be "member-database" or "member_database" in the API
const table = 'member-database';
const endpoint = `${url.replace(/\/$/, '')}/rest/v1/${table}`;

fetch(endpoint + '?select=*', {
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'count=exact',
    'Range': '0-0', // only need one row to get the count in header
  },
})
  .then((res) => {
    const range = res.headers.get('Content-Range');
    if (res.ok && range) {
      // Content-Range format: "0-0/123" or "*/123"
      const total = range.split('/')[1];
      console.log('Row count:', total === '*' ? '0' : total);
    } else if (res.status === 404) {
      // Try snake_case table name
      const alt = endpoint.replace('member-database', 'member_database');
      return fetch(alt + '?select=*', {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact',
          'Range': '0-0',
        },
      }).then(async (r) => {
        const r2 = r.headers.get('Content-Range');
        if (r.ok && r2) {
          const total = r2.split('/')[1];
          console.log('Row count (member_database):', total === '*' ? '0' : total);
        } else {
          console.error('Table not found or error:', r.status, await r.text());
          process.exit(1);
        }
      });
    } else {
      return res.text().then((body) => {
        console.error('Error:', res.status, body);
        process.exit(1);
      });
    }
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
