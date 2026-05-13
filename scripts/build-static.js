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

const supabaseConfigPath = path.join(outDir, "assets", "js", "supabase.js");
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(supabaseConfigPath) && supabaseUrl && supabaseAnonKey) {
  const supabaseConfig = `(function () {\n    window.App = window.App || {};\n\n    window.App.supabaseEnv = {\n        url: ${JSON.stringify(supabaseUrl)},\n        anonKey: ${JSON.stringify(supabaseAnonKey)}\n    };\n})();\n`;
  fs.writeFileSync(supabaseConfigPath, supabaseConfig);
  console.log("Supabase config injected into public/assets/js/supabase.js");
} else {
  console.warn("Supabase environment variables are not set. App will use localStorage fallback.");
}
