const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Check if base44Client is imported
  if (content.includes('@/api/base44Client')) {
    // Determine if entities is already imported from dbClient
    const hasDbClientEntities = content.includes('@/api/dbClient') && content.includes('entities');
    
    if (hasDbClientEntities) {
      // Just remove the base44 import
      content = content.replace(/import\s*\{\s*base44\s*\}\s*from\s*['"]@\/api\/base44Client['"];?\n?/g, '');
    } else {
      // Replace base44Client import with dbClient import
      content = content.replace(/import\s*\{\s*base44\s*\}\s*from\s*['"]@\/api\/base44Client['"]/g, 'import { entities } from "@/api/dbClient"');
    }
    
    // Replace base44.entities with entities
    content = content.replace(/base44\.entities\./g, 'entities.');
    changed = true;
  }

  // Also replace any remaining base44.entities if somehow the import was weird
  if (content.includes('base44.entities.')) {
    content = content.replace(/base44\.entities\./g, 'entities.');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
}

console.log(`Updated ${changedCount} files to remove base44Client.`);
