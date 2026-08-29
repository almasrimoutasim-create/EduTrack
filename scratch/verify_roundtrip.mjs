const BASE = 'http://localhost:3000';
const EMAIL = 'admin@edutrack.com';
const OLD = 'admin123';
const NEW = 'TempTest123!';

async function j(url, opts = {}) {
  const r = await fetch(url, opts);
  let b = null; try { b = await r.json(); } catch {}
  return { status: r.status, body: b };
}
const H = (token) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });

(async () => {
  let token = null;
  try {
    // 1) baseline: login with OLD password (proves old login currently works)
    const lo = await j(`${BASE}/neon-db/auth/login`, { method: 'POST', headers: H(), body: JSON.stringify({ role: 'admin', identifier: EMAIL, password: OLD }) });
    console.log('LOGIN OLD (baseline) status', lo.status);
    token = lo.body && lo.body.token;
    if (!token) { console.log('NO TOKEN -> cannot test update path. body:', JSON.stringify(lo.body)); return; }

    // 2) get admin id
    const list = await j(`${BASE}/neon-db/entities/SystemAdmin`, { headers: H(token) });
    if (!Array.isArray(list.body)) { console.log('LIST FAILED', list.status, JSON.stringify(list.body)); return; }
    const admin = list.body.find(a => a.email === EMAIL);
    if (!admin) { console.log('admin not found', list.body.map(a => a.email)); return; }
    const id = admin.id;
    console.log('admin id =', id, '| current password hashed:', String(admin.password).startsWith('$2'));

    // 3) update password -> NEW (this is the exact Settings.jsx path)
    const upd = await j(`${BASE}/neon-db/entities/SystemAdmin/${id}`, { method: 'PUT', headers: H(token), body: JSON.stringify({ email: EMAIL, password: NEW }) });
    console.log('UPDATE status', upd.status, '| stored password hashed ($2):', String(upd.body && upd.body.password).startsWith('$2'));

    // 4) login with NEW (should succeed)
    const ln = await j(`${BASE}/neon-db/auth/login`, { method: 'POST', headers: H(), body: JSON.stringify({ role: 'admin', identifier: EMAIL, password: NEW }) });
    console.log('LOGIN NEW status', ln.status, '(expect 200)');

    // 5) login with OLD (should fail now)
    const lo2 = await j(`${BASE}/neon-db/auth/login`, { method: 'POST', headers: H(), body: JSON.stringify({ role: 'admin', identifier: EMAIL, password: OLD }) });
    console.log('LOGIN OLD-after-change status', lo2.status, '(expect 401)');
  } finally {
    // 6) ALWAYS restore original password so we do not lock the real account
    if (token) {
      const list2 = await j(`${BASE}/neon-db/entities/SystemAdmin`, { headers: H(token) });
      const admin2 = Array.isArray(list2.body) ? list2.body.find(a => a.email === EMAIL) : null;
      if (admin2) {
        const res = await j(`${BASE}/neon-db/entities/SystemAdmin/${admin2.id}`, { method: 'PUT', headers: H(token), body: JSON.stringify({ email: EMAIL, password: OLD }) });
        console.log('RESTORE status', res.status, '| restored hashed ($2):', String(res.body && res.body.password).startsWith('$2'));
        const verify = await j(`${BASE}/neon-db/auth/login`, { method: 'POST', headers: H(), body: JSON.stringify({ role: 'admin', identifier: EMAIL, password: OLD }) });
        console.log('LOGIN OLD after restore status', verify.status, '(expect 200)');
      }
    }
  }
})();
