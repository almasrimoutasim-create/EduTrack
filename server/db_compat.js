import { neon as neonHttp } from '@neondatabase/serverless';
import pg from 'pg';
const { Pool } = pg;

// Prevent timezone shifting by returning DATE types as raw string (YYYY-MM-DD)
pg.types.setTypeParser(1082, (val) => val);

export function neon(connectionString) {
  if (!connectionString) {
    return null;
  }

  // If connecting to Neon cloud, use HTTP Serverless Driver (port 443 HTTPS)
  // This bypasses VPN connection resets (ECONNRESET on port 5432) and works seamlessly.
  const isNeonCloud = connectionString.includes('neon.tech') || connectionString.includes('neon.cloud');

  if (isNeonCloud) {
    const rawSql = neonHttp(connectionString);

    const executeWithRetry = async (fn, maxRetries = 3) => {
      let lastError;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err) {
          lastError = err;
          const isRetryable = err.message?.includes('fetch failed') ||
                              err.message?.includes('timeout') ||
                              err.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                              err.sourceError?.code === 'UND_ERR_CONNECT_TIMEOUT';
          if (!isRetryable || attempt === maxRetries - 1) {
            throw err;
          }
          await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
        }
      }
      throw lastError;
    };

    const queryFn = async (strings, ...values) => {
      return executeWithRetry(async () => {
        if (Array.isArray(strings) && 'raw' in strings) {
          return rawSql(strings, ...values);
        }
        if (typeof strings === 'string') {
          return rawSql.query(strings, values);
        }
        let queryStr = '';
        for (let i = 0; i < strings.length; i++) {
          queryStr += strings[i];
          if (i < values.length) {
            queryStr += `$${i + 1}`;
          }
        }
        return rawSql.query(queryStr, values);
      });
    };

    queryFn.query = async (queryStr, params = []) => {
      return executeWithRetry(() => rawSql.query(queryStr, params));
    };

    return queryFn;
  }

  // Fallback for local PostgreSQL (TCP port 5432)
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=disable') ? false : {
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
