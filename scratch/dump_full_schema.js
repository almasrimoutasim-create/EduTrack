import { neon } from '../server/db_compat.js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function fmtDefault(v) {
  return v === null ? null : String(v);
}

async function getTables() {
  return sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
}

async function getColumns(table) {
  return sql`
    SELECT column_name, data_type, udt_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${table}
    ORDER BY ordinal_position
  `;
}

async function getConstraints(table) {
  return sql`
    SELECT tc.constraint_name, tc.constraint_type,
           kcu.column_name,
           ccu.table_schema AS ref_schema, ccu.table_name AS ref_table, ccu.column_name AS ref_column
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
     AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = ${table}
      AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
    ORDER BY tc.constraint_type, tc.constraint_name, kcu.ordinal_position
  `;
}

async function getRowCount(table) {
  const rows = await sql.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)}`);
  return rows[0].count;
}

const tables = await getTables();

console.log(`FULL SCHEMA DUMP (${tables.length} tables)`);
console.log('='.repeat(60));

for (const { table_name } of tables) {
  const count = await getRowCount(table_name);
  const columns = await getColumns(table_name);
  const constraints = await getConstraints(table_name);

  console.log('');
  console.log(`TABLE ${table_name} (rows: ${count})`);
  console.log('columns:');
  for (const c of columns) {
    console.log(
      `  ${c.column_name} | ${c.data_type} (${c.udt_name}) | nullable=${c.is_nullable} | default=${fmtDefault(c.column_default)}`
    );
  }
  if (constraints.length > 0) {
    console.log('constraints:');
    for (const con of constraints) {
      let line = `  [${con.constraint_type}] ${con.constraint_name} on ${con.column_name}`;
      if (con.constraint_type === 'FOREIGN KEY') {
        line += ` -> ${con.ref_schema}.${con.ref_table}(${con.ref_column})`;
      }
      console.log(line);
    }
  } else {
    console.log('constraints: (none)');
  }
}

sql.end?.();
console.log('');
console.log('END OF DUMP');