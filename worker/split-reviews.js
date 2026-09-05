const fs = require("fs");

const input = fs.readFileSync("./reviews-import.sql", "utf8");

const statements = input
  .split(/(?=INSERT OR REPLACE INTO reviews)/)
  .map(s => s.trim())
  .filter(Boolean);

console.log("Total statements found:", statements.length);

if (statements.length !== 11235) {
  console.error("ERROR: Expected 11235 statements.");
  process.exit(1);
}

const batchSize = 1000;

for (let i = 0; i < statements.length; i += batchSize) {
  const batch = statements.slice(i, i + batchSize);

  const fileNumber = String(Math.floor(i / batchSize) + 1).padStart(2, "0");

  const filename = `reviews-batch-${fileNumber}.sql`;

  fs.writeFileSync(
    filename,
    batch.join("\n"),
    "utf8"
  );

  console.log(
    filename,
    "=>",
    batch.length,
    "reviews"
  );
}

console.log("Done.");