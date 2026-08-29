import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASE = 'http://localhost:3000';

const NEON_URL =
  process.env.E2E_DATABASE_URL ??
  process.env.DATABASE_URL ??
  '';

if (!NEON_URL) {
  console.error('[e2e] No DATABASE_URL provided. Set E2E_DATABASE_URL or DATABASE_URL.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

function isJwt(token) {
  return typeof token === 'string' && token.split('.').filter(Boolean).length >= 2;
}

const results = { health: null, gateway: null, login: null };
let child;

async function run() {
  child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: NEON_URL },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[server-err] ${d}`));

  // Poll /health until 200 (max 60s)
  let healthy = false;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) break;
    try {
      const { status, body } = await fetchJson(`${BASE}/health`);
      if (status === 200 && body && body.status === 'ok') {
        results.health = { status, body };
        healthy = true;
        break;
      }
    } catch {
      // server not up yet
    }
    await sleep(500);
  }

  if (!healthy) {
    console.error('[e2e] FAIL: /health never became ok (30s). Child exitCode:', child.exitCode);
    child.kill('SIGTERM');
    process.exit(1);
  }
  console.log('[e2e] /health OK');

  // Poll the gateway endpoint until it succeeds (startup table-init holds the
  // pool, so we retry instead of assuming a fixed settle window).
  const gwDeadline = Date.now() + Number(process.env.E2E_GATEWAY_DEADLINE_MS ?? 500000);
  let gwTries = 0;
  while (Date.now() < gwDeadline) {
    if (child.exitCode !== null) break;
    gwTries++;
    try {
      const r = await fetchJson(`${BASE}/neon-db/auth/gateway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'gateway', password: 'edutrack2026' }),
      });
      if (r.status === 200 && r.body && r.body.success === true) {
        results.gateway = r;
        console.log('[e2e] gateway =>', r.status, JSON.stringify(r.body));
        break;
      }
      console.log(`[e2e] gateway try ${gwTries} => ${r.status} (retrying)`);
    } catch (e) {
      console.log(`[e2e] gateway try ${gwTries} => error ${e.message} (retrying)`);
    }
    await sleep(3000);
  }

  if (!results.gateway) {
    console.error('[e2e] FAIL: gateway never succeeded (init/pool not ready).');
    child.kill('SIGTERM');
    process.exit(1);
  }

  // Login /neon-db/auth/login
  results.login = await fetchJson(`${BASE}/neon-db/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin', identifier: 'admin@edutrack.com', password: 'admin123' }),
  });
  console.log('[e2e] login   =>', results.login.status, JSON.stringify(results.login.body));

  child.kill('SIGTERM');

  const gatewayOk =
    results.gateway.status === 200 &&
    results.gateway.body &&
    results.gateway.body.success === true;
  const loginOk =
    results.login.status === 200 &&
    results.login.body &&
    results.login.body.success === true &&
    results.login.body.user != null &&
    isJwt(results.login.body.token);

  console.log('[e2e] gateway payload ok:', gatewayOk);
  console.log('[e2e] login payload ok (success/user/jwt):', loginOk);
  console.log(`[e2e] ${gatewayOk && loginOk ? 'ALL PASS' : 'FAILURE'}`);
  process.exit(gatewayOk && loginOk ? 0 : 1);
}

run().catch((err) => {
  console.error('[e2e] unexpected error:', err);
  if (child) child.kill('SIGTERM');
  process.exit(1);
});