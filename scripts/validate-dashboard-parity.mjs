import fs from 'node:fs';

const ar = fs.readFileSync('src/js/ui/pages/dashboard.js', 'utf8');
const en = fs.readFileSync('src/js/ui/pages/en/dashboard-en.js', 'utf8');
const requiredArabicSections = ['overview','places','analytics','following','around-me','loyalty','add','notifications'];
const requiredEnglishLabels = ['Overview','My Places','Analytics & Reports','My Following & Offers','Near Me (GPS)','Loyalty & Points','Add a Place Manually','Notifications & Visits'];
for (const section of requiredArabicSections) {
  if (!ar.includes(`section === '${section}'`) && !ar.includes(`section === \"${section}\"`)) {
    throw new Error(`Arabic dashboard is missing expected section: ${section}`);
  }
}
for (const label of requiredEnglishLabels) {
  if (!en.includes(label)) throw new Error(`English dashboard is missing expected feature: ${label}`);
}
if (!ar.includes('isAdmin(user)') || !en.includes('isAdmin(currentUser)')) throw new Error('Admin visibility must remain server-authorized and role-gated in both dashboards.');
console.log('Dashboard feature-parity contract: PASS');
