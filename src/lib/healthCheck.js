/**
 * Quick backend health check. Use before calling APIs to give a clear error
 * instead of a cryptic "TypeError: Failed to fetch".
 */
export async function checkBackendHealth() {
  const base = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
  const url = base ? `${base}/health` : '/health';
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => ({}));
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err?.message || 'تعذر الاتصال بالخادم (Network/CORS)' };
  }
}

export function getApiBase() {
  const base = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
  return base ? `${base}/neon-db/entities` : '/neon-db/entities';
}
