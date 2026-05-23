import { base44 } from './src/api/base44Client.js';

async function run() {
  try {
    const students = await base44.entities.Student.list();
    if (students.length > 0) {
      const s = students[0];
      console.log('Student fields and types:');
      for (const [k, v] of Object.entries(s)) {
        console.log(`Field: ${k}, Type: ${typeof v}, Value: ${v}`);
      }
    } else {
      console.log('No students found');
    }
  } catch (err) {
    console.error('Error listing students:', err);
  }
}
run();
