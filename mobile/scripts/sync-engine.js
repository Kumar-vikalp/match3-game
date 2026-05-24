// Sync engine code from web app (../src/engine) into mobile/src/engine
// Run after engine changes: `npm run sync-engine`
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..", "..", "src", "engine");
const DEST = path.resolve(__dirname, "..", "src", "engine");

if (!fs.existsSync(SRC)) {
  console.error(`Source engine dir not found: ${SRC}`);
  process.exit(1);
}

fs.mkdirSync(DEST, { recursive: true });

// Wipe existing dest, then copy
for (const f of fs.readdirSync(DEST)) {
  fs.rmSync(path.join(DEST, f), { recursive: true, force: true });
}

const HEADER = "// AUTO-GENERATED from /src/engine - do not edit. Run `npm run sync-engine` to refresh.\n";

let count = 0;
for (const f of fs.readdirSync(SRC)) {
  const src = path.join(SRC, f);
  const dest = path.join(DEST, f);
  const stat = fs.statSync(src);
  if (stat.isFile() && f.endsWith(".ts")) {
    const body = fs.readFileSync(src, "utf8");
    fs.writeFileSync(dest, HEADER + body);
    count++;
  }
}
console.log(`Synced ${count} engine file(s) → ${DEST}`);
