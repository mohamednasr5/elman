import { connect } from '@tursodatabase/serverless';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');

const db = connect({ url, authToken });

const LEGACY_COORDINATES = [
  { lat: 31.1578, lng: 31.9367, reason: 'legacy_generic_manzala_default_31.1578_31.9367' },
  { lat: 31.1578, lng: 31.9333, reason: 'legacy_worker_manzala_fallback_31.1578_31.9333' },
  { lat: 31.1833, lng: 32.0333, reason: 'legacy_worker_matariya_fallback_31.1833_32.0333' }
];

const round = n => Math.round(Number(n) * 100000) / 100000;
const same = (a, b) => round(a) === round(b);

async function query(sql, args = []) {
  return await db.all(sql, args);
}

async function run(sql, args = []) {
  return await db.run(sql, args);
}

await run(`CREATE TABLE IF NOT EXISTS place_coordinate_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id TEXT NOT NULL,
  place_name TEXT,
  area TEXT,
  old_latitude REAL NOT NULL,
  old_longitude REAL NOT NULL,
  reason TEXT NOT NULL,
  action TEXT NOT NULL,
  audited_at INTEGER NOT NULL
)`);

const rows = await query(`
  SELECT id, name, area, latitude, longitude, status, is_published, updated_at
  FROM places
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL
`);

const coordGroups = new Map();
for (const row of rows) {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
  const key = `${round(lat)},${round(lng)}`;
  if (!coordGroups.has(key)) coordGroups.set(key, []);
  coordGroups.get(key).push(row);
}

const suspiciousGroups = [...coordGroups.entries()]
  .filter(([, list]) => list.length >= 3)
  .map(([coordinates, list]) => ({
    coordinates,
    count: list.length,
    areas: [...new Set(list.map(r => String(r.area || '').trim()).filter(Boolean))],
    places: list.map(r => ({
      id: r.id,
      name: r.name,
      area: r.area,
      latitude: r.latitude,
      longitude: r.longitude
    }))
  }))
  .sort((a, b) => b.count - a.count);

const toClean = [];
for (const row of rows) {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

  const match = LEGACY_COORDINATES.find(c => same(lat, c.lat) && same(lng, c.lng));
  if (match) toClean.push({ ...row, lat, lng, reason: match.reason });
}

console.log(JSON.stringify({
  scanned: rows.length,
  suspiciousGroups: suspiciousGroups.map(g => ({
    coordinates: g.coordinates,
    count: g.count,
    areas: g.areas,
    placeIds: g.places.map(p => p.id)
  })),
  legacyCandidates: toClean.map(r => ({
    id: r.id,
    name: r.name,
    area: r.area,
    latitude: r.lat,
    longitude: r.lng,
    reason: r.reason
  }))
}, null, 2));

let cleaned = 0;
for (const row of toClean) {
  await run(
    `INSERT INTO place_coordinate_audit
      (place_id, place_name, area, old_latitude, old_longitude, reason, action, audited_at)
     VALUES (?, ?, ?, ?, ?, ?, 'cleared_to_null', ?)`,
    [String(row.id), row.name || null, row.area || null, row.lat, row.lng, row.reason, Date.now()]
  );

  await run(
    `UPDATE places
     SET latitude = NULL, longitude = NULL
     WHERE id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL`,
    [String(row.id)]
  );
  cleaned++;
}

const remainingLegacy = await query(`
  SELECT id, name, area, latitude, longitude
  FROM places
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL
`);

const remaining = remainingLegacy.filter(row => {
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  return LEGACY_COORDINATES.some(c => same(lat, c.lat) && same(lng, c.lng));
});

console.log(JSON.stringify({
  action: 'completed',
  cleaned,
  remainingLegacyCoordinates: remaining.map(r => ({
    id: r.id, name: r.name, area: r.area, latitude: r.latitude, longitude: r.longitude
  })),
  suspiciousNonLegacyGroupsLeftUntouched: suspiciousGroups.filter(g => !LEGACY_COORDINATES.some(c => {
    const [lat, lng] = g.coordinates.split(',').map(Number);
    return same(lat, c.lat) && same(lng, c.lng);
  })).length
}, null, 2));

if (remaining.length > 0) {
  throw new Error('Legacy fallback coordinates remain after cleanup');
}
