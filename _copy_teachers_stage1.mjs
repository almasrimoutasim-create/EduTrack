import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import targetDb from './server/db.js';

const sourceText = await readFile('_qschools.js', 'utf8');
const sourceUrl = sourceText.match(/postgres(?:ql)?:\/\/[^'"\s]+/)?.[0];
if (!sourceUrl) throw new Error('Legacy connection was not found.');
const sourceDb = neon(sourceUrl);
const schoolName = 'مدارس المجد العالمية';
const sourceSchool = (await sourceDb`SELECT id FROM schools WHERE COALESCE(NULLIF(BTRIM(name_ar), ''), NULLIF(BTRIM(name), ''), name_en) = ${schoolName} LIMIT 1`)[0];
const targetSchool = (await targetDb`SELECT id FROM schools WHERE COALESCE(NULLIF(BTRIM(name_ar), ''), NULLIF(BTRIM(name), ''), name_en) = ${schoolName} LIMIT 1`)[0];
if (!sourceSchool || !targetSchool) throw new Error('School is missing in source or target.');
const targetBranch = (await targetDb`SELECT id FROM school_branches WHERE school_id::text = ${String(targetSchool.id)} AND is_main = true LIMIT 1`)[0];
if (!targetBranch) throw new Error('Target main branch is missing.');

const sourceTeachers = await sourceDb`SELECT * FROM teachers WHERE school_id::text = ${String(sourceSchool.id)} ORDER BY created_at, id`;
if (sourceTeachers.length !== 6) throw new Error(`Expected six source teachers; found ${sourceTeachers.length}.`);
const sourceIds = sourceTeachers.map(row => String(row.id));
const emails = sourceTeachers.map(row => row.email).filter(Boolean).map(value => String(value).toLowerCase());
const employeeIds = sourceTeachers.map(row => row.employee_id).filter(Boolean).map(String);
const [sourceDuplicateIds, sourceDuplicateEmails, idCollisions, emailCollisions, employeeIdCollisions, targetSchoolCount] = await Promise.all([
  sourceDb`SELECT COUNT(*) AS count FROM (SELECT id FROM teachers WHERE school_id::text = ${String(sourceSchool.id)} GROUP BY id HAVING COUNT(*) > 1) d`,
  sourceDb`SELECT COUNT(*) AS count FROM (SELECT LOWER(email) FROM teachers WHERE school_id::text = ${String(sourceSchool.id)} AND email IS NOT NULL GROUP BY LOWER(email) HAVING COUNT(*) > 1) d`,
  targetDb`SELECT COUNT(*) AS count FROM teachers WHERE id::text = ANY(${sourceIds}::text[])`,
  targetDb`SELECT COUNT(*) AS count FROM teachers WHERE LOWER(email) = ANY(${emails}::text[])`,
  targetDb`SELECT COUNT(*) AS count FROM teachers WHERE employee_id = ANY(${employeeIds}::text[])`,
  targetDb`SELECT COUNT(*) AS count FROM teachers WHERE school_id::text = ${String(targetSchool.id)}`,
]);
if ([sourceDuplicateIds[0].count, sourceDuplicateEmails[0].count, idCollisions[0].count, emailCollisions[0].count, employeeIdCollisions[0].count, targetSchoolCount[0].count].some(value => value !== '0')) {
  throw new Error('A source or target teacher conflict was found; no records were inserted.');
}

const missingColumns = {
  subject: 'TEXT',
  photo_url: 'TEXT',
  salary: 'NUMERIC',
  username: 'VARCHAR(255)',
  independent_teacher_id: 'VARCHAR(50)',
};
for (const [column, type] of Object.entries(missingColumns)) {
  await targetDb.query(`ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS ${column} ${type}`);
}

const [sourceColumnRows, targetColumnRows] = await Promise.all([
  sourceDb`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teachers'`,
  targetDb`SELECT column_name, data_type, character_maximum_length, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'teachers'`,
]);
const sourceColumns = new Map(sourceColumnRows.map(column => [column.column_name, column]));
const targetColumns = new Map(targetColumnRows.map(column => [column.column_name, column]));
const insertColumns = [...sourceColumns.keys()].filter(column => targetColumns.has(column) && column !== 'portal_password_plain');
for (const column of ['school_id', 'branch_id', 'academic_year_id']) {
  if (!targetColumns.has(column)) throw new Error(`Target column ${column} is missing.`);
  if (!insertColumns.includes(column)) insertColumns.push(column);
}
const missingRequired = targetColumnRows.filter(column => column.is_nullable === 'NO' && column.column_default === null && !insertColumns.includes(column.column_name)).map(column => column.column_name);
if (missingRequired.length) throw new Error(`Required teacher columns cannot be populated: ${missingRequired.join(', ')}`);
const numericTypes = new Set(['smallint', 'integer', 'bigint', 'numeric', 'real', 'double precision']);
for (const column of insertColumns) {
  if (['school_id', 'branch_id', 'academic_year_id'].includes(column)) continue;
  const sourceType = sourceColumns.get(column)?.data_type;
  const targetType = targetColumns.get(column)?.data_type;
  const textCompatible = ['text', 'character varying'].includes(sourceType) && ['text', 'character varying'].includes(targetType);
  const numericCompatible = numericTypes.has(sourceType) && numericTypes.has(targetType);
  const timeCompatible = sourceType === 'timestamp without time zone' && targetType === 'timestamp with time zone';
  if (sourceType !== targetType && !textCompatible && !numericCompatible && !timeCompatible) throw new Error(`Incompatible teachers.${column}: ${sourceType} -> ${targetType}`);
  const sourceLength = sourceColumns.get(column)?.character_maximum_length;
  const targetLength = targetColumns.get(column)?.character_maximum_length;
  if (sourceLength && targetLength && targetLength < sourceLength) throw new Error(`Target teachers.${column} is too narrow.`);
}

const params = [];
const valuesSql = sourceTeachers.map((teacher, rowIndex) => {
  const first = rowIndex * insertColumns.length + 1;
  for (const column of insertColumns) {
    let value = column === 'school_id' ? targetSchool.id
      : column === 'branch_id' ? targetBranch.id
      : column === 'academic_year_id' ? '2025-2026'
      : teacher[column];
    if (value !== null && typeof value === 'object' && ['json', 'jsonb'].includes(targetColumns.get(column).data_type)) value = JSON.stringify(value);
    if (targetColumns.get(column).is_nullable === 'NO' && targetColumns.get(column).column_default === null && value == null) {
      throw new Error(`Required teacher value ${column} is null.`);
    }
    params.push(value);
  }
  return `(${insertColumns.map((_, columnIndex) => `$${first + columnIndex}`).join(', ')})`;
});
await targetDb.query(
  `INSERT INTO public.teachers (${insertColumns.map(column => `"${column}"`).join(', ')}) VALUES ${valuesSql.join(', ')}`,
  params
);

const verification = await targetDb`
  SELECT COUNT(*) AS total,
         COUNT(*) FILTER (WHERE school_id::text = ${String(targetSchool.id)}) AS school_match,
         COUNT(*) FILTER (WHERE branch_id::text = ${String(targetBranch.id)}) AS branch_match,
         COUNT(*) FILTER (WHERE academic_year_id = '2025-2026') AS year_match,
         COUNT(*) FILTER (WHERE portal_password_plain IS NOT NULL AND id::text = ANY(${sourceIds}::text[])) AS copied_plain_passwords
  FROM teachers WHERE id::text = ANY(${sourceIds}::text[])
`;
if (verification[0].total !== '6' || verification[0].school_match !== '6' || verification[0].branch_match !== '6' || verification[0].year_match !== '6' || verification[0].copied_plain_passwords !== '0') {
  throw new Error(`Teacher verification failed: ${JSON.stringify(verification[0])}`);
}
console.log(JSON.stringify({ teachersCopied: verification[0].total, schoolMatch: verification[0].school_match, branchMatch: verification[0].branch_match, academicYearMatch: verification[0].year_match, plainPasswordsCopied: verification[0].copied_plain_passwords }));
