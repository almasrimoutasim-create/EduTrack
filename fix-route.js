const fs = require('fs');
let content = fs.readFileSync('C:/MFA/src/App.jsx', 'utf8');

const leavesLine = '<Route path="/staff/leaves" element={<PlanAccessGuard><StaffLeaves /></PlanAccessGuard>} />';
const evaluationsLine = '<Route path="/staff/evaluations" element={<PlanAccessGuard><StaffEvaluations /></PlanAccessGuard>} />';
const newRoute = '<Route path="/staff/personal-requests" element={<PlanAccessGuard><StaffPersonalRequests /></PlanAccessGuard>} />';

const oldBlock = leavesLine + '\n            ' + evaluationsLine;
const newBlock = leavesLine + '\n            ' + newRoute + '\n            ' + evaluationsLine;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync('C:/MFA/src/App.jsx', content);
  console.log('SUCCESS: Route /staff/personal-requests added!');
} else {
  console.log('Old block not found. Searching for leaves line...');
  const idx = content.indexOf('staff/leaves');
  if (idx >= 0) {
    console.log('Found leaves at index', idx);
    console.log('Raw context:', JSON.stringify(content.substring(idx, idx + 200)));
  }
}
