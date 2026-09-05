const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("./firebase-backup.json", "utf8")
);

const categories = Object.values(data.categories || {});

console.log("Total categories found:", categories.length);

if (categories.length === 0) {
  console.error("No categories found.");
  process.exit(1);
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

for (const c of categories) {
  const values = [
    sqlString(text(c.id)),
    sqlString(text(c.name)),
    sqlString(text(c.nameEn)),
    sqlString(text(c.slug)),
    sqlString(text(c.icon)),
    sqlString(text(c.imageUrl)),
    sqlString(text(c.description)),
    sqlString(text(c.parentId)),
    number(c.sortOrder) === null ? "NULL" : number(c.sortOrder),
    bool(c.isActive),
    number(c.createdAt) === null ? "NULL" : number(c.createdAt),
    number(c.updatedAt) === null ? "NULL" : number(c.updatedAt)
  ];

  statements.push(`
INSERT OR REPLACE INTO categories (
  id,
  name,
  name_en,
  slug,
  icon,
  image_url,
  description,
  parent_id,
  sort_order,
  is_active,
  created_at,
  updated_at
) VALUES (
  ${values.join(", ")}
);`);
}

const output = statements.join("\n");

fs.writeFileSync(
  "./categories-import.sql",
  output,
  "utf8"
);

console.log(
  "SQL statements generated:",
  statements.length
);

console.log(
  "Output file: categories-import.sql"
);

console.log(
  "SQL size:",
  output.length,
  "characters"
);