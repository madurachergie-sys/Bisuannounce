const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const entries = ["index.html", "assets", "supabase"];

for (const entry of entries) {
  const source = path.join(root, entry);
  const target = path.join(outDir, entry);

  if (fs.existsSync(source)) {
    fs.cpSync(source, target, { recursive: true });
  }
}
