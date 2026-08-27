import fs from 'fs';
import path from 'path';

const DB_URL = 'https://elmanzla-default-rtdb.firebaseio.com';

async function seed() {
  console.log('Seeding El Manzala Realtime Database...');
  const seedData = JSON.parse(fs.readFileSync(path.resolve('./database/seed-data.json'), 'utf8'));

  // 1. Seed Categories
  const catRes = await fetch(`${DB_URL}/categories.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seedData.categories)
  });

  if (catRes.ok) {
    console.log('✓ Successfully seeded 21 categories to Firebase RTDB!');
  } else {
    console.warn('Categories seed response:', catRes.status, await catRes.text());
  }

  // 2. Seed Settings
  const setRes = await fetch(`${DB_URL}/settings.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(seedData.settings)
  });

  if (setRes.ok) {
    console.log('✓ Successfully seeded default settings to Firebase RTDB!');
  } else {
    console.warn('Settings seed response:', setRes.status, await setRes.text());
  }
}

seed().catch(console.error);
