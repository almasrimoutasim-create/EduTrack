const fs = require('fs');

let apiFile = fs.readFileSync('server/api.js', 'utf8');

// Update table creation
apiFile = apiFile.replace(
`      allowances NUMERIC DEFAULT 0,
      deductions NUMERIC DEFAULT 0,
      net_salary NUMERIC NOT NULL,`,
`      allowances NUMERIC DEFAULT 0,
      deductions NUMERIC DEFAULT 0,
      advances NUMERIC DEFAULT 0,
      net_salary NUMERIC NOT NULL,`
);

// Add alter table for advances if it's missing (I'll insert it right after the salary_records creation)
const alterScript = `
  // Auto-create salary_records table
  sql\`
    ALTER TABLE salary_records ADD COLUMN IF NOT EXISTS advances NUMERIC DEFAULT 0;
  \`.then(() => {
    console.log('[neon] salary_records table altered successfully with advances column');
  }).catch(err => {
    console.error('[neon] failed to alter salary_records table:', err.message);
  });
`;

apiFile = apiFile.replace(
`  // Auto-create salary_records table`,
  alterScript + `\n  // Auto-create salary_records table`
);

fs.writeFileSync('server/api.js', apiFile);
console.log('Database updated successfully');
