import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5173/neon-db/entities'; // Or fallback port if vite dev server is on 5173

async function testRoute(entity) {
  try {
    const res = await fetch(`${API_BASE}/${entity}?limit=5`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log(`Entity ${entity} failed:`, err.error || res.statusText);
    } else {
      console.log(`Entity ${entity} succeeded`);
    }
  } catch (err) {
    console.log(`Entity ${entity} connection failed:`, err.message);
  }
}

async function run() {
  // Let's test the main entities loaded in portals
  const entities = ['Student', 'Teacher', 'PrivateMessage', 'PortalNotification', 'ClassSchedule', 'Subject', 'TeacherTask'];
  for (const ent of entities) {
    await testRoute(ent);
  }
}
run();
