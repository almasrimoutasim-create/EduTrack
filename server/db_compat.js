import pg from 'pg';
const { Pool } = pg;

export function neon(connectionString) {
  if (!connectionString) {
    return null;
  }
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const queryFn = async (strings, ...values) => {
    if (Array.isArray(strings)) {
      let queryStr = '';
      for (let i = 0; i < strings.length; i++) {
        queryStr += strings[i];
        if (i < values.length) {
          queryStr += `$${i + 1}`;
        }
      }
      const res = await pool.query(queryStr, values);
      return res.rows;
    }
    const res = await pool.query(strings, values);
    return res.rows;
  };

  queryFn.query = async (queryStr, params = []) => {
    const res = await pool.query(queryStr, params);
    return res.rows;
  };

  return queryFn;
}
