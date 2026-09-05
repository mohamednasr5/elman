const fs = require("fs");

const data = JSON.parse(
  fs.readFileSync("./firebase-backup.json", "utf8")
);

let reviews = [];

for (const place of Object.values(data.places || {})) {
  if (!place.reviews || typeof place.reviews !== "object") {
    continue;
  }

  for (const review of Object.values(place.reviews)) {
    reviews.push(review);
  }
}

console.log("Total reviews found:", reviews.length);

if (reviews.length === 0) {
  console.error("No reviews found.");
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

for (const r of reviews) {
  const values = [
    sqlString(text(r.id)),
    sqlString(text(r.placeId)),

    sqlString(text(r.userId)),
    sqlString(text(r.userName)),
    sqlString(text(r.userPhoto)),

    sqlString(text(r.placeName)),
    sqlString(text(r.placeSlug)),

    number(r.rating) === null ? "NULL" : number(r.rating),
    sqlString(text(r.comment)),

    bool(r.isAdminGenerated),
    number(r.editCount) === null ? "NULL" : number(r.editCount),

    number(r.createdAt) === null ? "NULL" : number(r.createdAt),
    number(r.updatedAt) === null ? "NULL" : number(r.updatedAt)
  ];

  statements.push(`
INSERT OR REPLACE INTO reviews (
  id,
  place_id,
  user_id,
  user_name,
  user_photo,
  place_name,
  place_slug,
  rating,
  comment,
  is_admin_generated,
  edit_count,
  created_at,
  updated_at
) VALUES (
  ${values.join(", ")}
);`);
}

const output = statements.join("\n");

fs.writeFileSync(
  "./reviews-import.sql",
  output,
  "utf8"
);

console.log(
  "SQL statements generated:",
  statements.length
);

console.log(
  "Output file: reviews-import.sql"
);

console.log(
  "SQL size:",
  output.length,
  "characters"
);