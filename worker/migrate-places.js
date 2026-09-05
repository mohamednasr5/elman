const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("./firebase-backup.json", "utf8")
);

const places = Object.values(data.places || {});

console.log("Total places found:", places.length);

if (places.length === 0) {
  console.error("No places found.");
  process.exit(1);
}

function json(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
}

function text(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return String(value);
}

function number(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function bool(value) {
  return value ? 1 : 0;
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return "'" + String(value).replace(/'/g, "''") + "'";
}

const statements = [];

for (const p of places) {
  const location = p.location || {};

  const values = [
    sqlString(text(p.id)),
    sqlString(text(p.name)),
    sqlString(text(p.nameEn)),
    sqlString(text(p.slug)),
    sqlString(text(p.categoryId)),
    sqlString(text(p.subcategoryId)),
    sqlString(text(p.customCategory)),

    sqlString(text(p.address)),
    sqlString(text(p.area)),
    sqlString(text(p.phone)),
    sqlString(text(p.whatsapp)),
    sqlString(text(p.mapsLink)),

    number(location.lat) === null ? "NULL" : number(location.lat),
    number(location.lng) === null ? "NULL" : number(location.lng),

    sqlString(text(p.description)),

    sqlString(text(p.logoUrl)),
    sqlString(text(p.coverImageUrl)),

    sqlString(text(p.ownerId)),
    sqlString(text(p.ownerEmail)),

    sqlString(text(p.status)),
    bool(p.isVerified),
    sqlString(text(p.verificationStatus)),

    number(p.offerCount) === null ? "NULL" : number(p.offerCount),
    number(p.productCount) === null ? "NULL" : number(p.productCount),

    sqlString(json(p.services)),
    sqlString(json(p.social)),
    sqlString(json(p.stats)),
    sqlString(json(p.workingHours)),

    number(p.createdAt) === null ? "NULL" : number(p.createdAt),
    number(p.updatedAt) === null ? "NULL" : number(p.updatedAt)
  ];

  statements.push(`
INSERT OR REPLACE INTO places (
  id,
  name,
  name_en,
  slug,
  category_id,
  subcategory_id,
  custom_category,
  address,
  area,
  phone,
  whatsapp,
  maps_link,
  latitude,
  longitude,
  description,
  logo_url,
  cover_image_url,
  owner_id,
  owner_email,
  status,
  is_verified,
  verification_status,
  offer_count,
  product_count,
  services_json,
  social_json,
  stats_json,
  working_hours_json,
  created_at,
  updated_at
) VALUES (
  ${values.join(", ")}
);`);
}

const output = statements.join("\n");

fs.writeFileSync("./places-import.sql", output, "utf8");

console.log("SQL statements generated:", statements.length);
console.log("Output file: places-import.sql");
console.log("SQL size:", output.length, "characters");