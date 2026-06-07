import pg from 'pg';

const NEON_URL = 'postgresql://neondb_owner:npg_lvhWgpGZ38XP@ep-little-dawn-ap8mvsvt-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const COCKROACH_URL = 'postgresql://almasrimoutasim_gmai:F4ve-jO7r211G__ECLadaA@bumpy-hunter-16875.jxf.gcp-asia-south1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';

async function migrate() {
  console.log('Connecting to Neon source database...');
  const neonPool = new pg.Pool({ connectionString: NEON_URL });
  
  console.log('Connecting to CockroachDB target database...');
  const cockroachPool = new pg.Pool({
    connectionString: COCKROACH_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Get all tables in Neon
    const tablesRes = await neonPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables in Neon source database:`, tables);

    // 2. For each table, migrate schema and data
    for (const table of tables) {
      console.log(`\n--- Migrating table: ${table} ---`);

      // Get columns definitions
      const colsRes = await neonPool.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [table]);

      // Get primary key
      const pkRes = await neonPool.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1
      `, [table]);
      const pkCols = pkRes.rows.map(r => r.column_name);

      // Construct CREATE TABLE DDL
      const columnDefs = [];
      for (const col of colsRes.rows) {
        let typeStr = col.data_type.toUpperCase();
        if (col.data_type.toLowerCase() === 'array' && col.udt_name) {
          if (col.udt_name.startsWith('_')) {
            typeStr = `${col.udt_name.substring(1).toUpperCase()}[]`;
          } else {
            typeStr = 'TEXT[]';
          }
        }
        let def = `"${col.column_name}" ${typeStr}`;
        
        // Handle uuid and gen_random_uuid() default mapping
        if (col.column_default) {
          if (col.column_default.includes('gen_random_uuid()') || col.column_default.includes('uuid_generate_v4()')) {
            def += ' DEFAULT gen_random_uuid()';
          } else if (col.column_default.includes('nextval') || col.column_default.includes('identity')) {
            // Let cockroachdb handle serials automatically
            if (col.data_type.toLowerCase() === 'integer' || col.data_type.toLowerCase() === 'bigint') {
              // do nothing, CockroachDB defaults to unique IDs or serials
            }
          } else {
            def += ` DEFAULT ${col.column_default}`;
          }
        }
        
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        
        if (pkCols.includes(col.column_name)) {
          def += ' PRIMARY KEY';
        }
        
        columnDefs.push(def);
      }

      console.log(`Dropping table if exists on CockroachDB...`);
      await cockroachPool.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);

      const createTableQuery = `CREATE TABLE "${table}" (\n  ${columnDefs.join(',\n  ')}\n);`;
      console.log(`Creating table on CockroachDB...`);
      await cockroachPool.query(createTableQuery);

      // Fetch data from Neon
      console.log(`Fetching rows from Neon...`);
      const dataRes = await neonPool.query(`SELECT * FROM "${table}"`);
      const rows = dataRes.rows;
      console.log(`Fetched ${rows.length} rows.`);

      if (rows.length > 0) {
        const colNames = Object.keys(rows[0]);
        const columns = colNames.map(c => `"${c}"`).join(', ');
        
        console.log(`Inserting ${rows.length} rows into CockroachDB in batches...`);
        const chunkSize = 200; // Limit parameters size
        
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const valueClauses = [];
          const values = [];
          let paramCounter = 1;
          
          for (const row of chunk) {
            const rowParams = [];
            for (const col of colNames) {
              values.push(row[col]);
              rowParams.push(`$${paramCounter++}`);
            }
            valueClauses.push(`(${rowParams.join(', ')})`);
          }
          
          const batchQuery = `INSERT INTO "${table}" (${columns}) VALUES ${valueClauses.join(', ')} ON CONFLICT DO NOTHING`;
          await cockroachPool.query(batchQuery, values);
        }
        console.log(`Successfully migrated ${rows.length} rows.`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await neonPool.end();
    await cockroachPool.end();
  }
}

migrate();
