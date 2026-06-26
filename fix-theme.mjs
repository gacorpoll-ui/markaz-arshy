import fs from 'fs';
import path from 'path';

const BASE = 'D:/follower-store/frontend/src';

const REPLACEMENTS = [
  // Backgrounds
  [/rgba\(255,\s*255,\s*255,\s*0\.0[1-9]\)/g, "var(--bg-page)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.06\)/g, "var(--bg-muted)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, "var(--bg-muted)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, "var(--border-default)"],
  [/rgba\(255,\s*255,\s*255,\s*0\.97\)/g, "var(--bg-surface)"],
  [/rgba\(0,\s*0,\s*0,\s*0\.\d+\)/g, "var(--bg-muted)"],
  // Neon cyan → blue
  [/rgba\(0,\s*242,\s*254,\s*0\.05\)/g, "var(--accent-primary-light)"],
  [/rgba\(0,\s*242,\s*254,\s*0\.08\)/g, "var(--accent-primary-light)"],
  [/rgba\(0,\s*242,\s*254,\s*0\.1\)/g, "var(--accent-primary-light)"],
  [/rgba\(0,\s*242,\s*254,\s*0\.15\)/g, "var(--accent-primary-light)"],
  [/rgba\(0,\s*242,\s*254,\s*0\.2\)/g, "rgba(59, 130, 246, 0.15)"],
  [/rgba\(0,\s*242,\s*254,\s*0\.3\)/g, "rgba(59, 130, 246, 0.2)"],
  [/rgba\(0,242,254,/g, "rgba(59, 130, 246,"],
  // Purple/pink → blue
  [/rgba\(127,\s*0,\s*255,/g, "rgba(59, 130, 246,"],
  [/rgba\(127,0,255,/g, "rgba(59, 130, 246,"],
  [/rgba\(255,\s*0,\s*127,/g, "rgba(239, 68, 68,"],
  // Border
  [/"var\(--border-color\)"/g, '"var(--border-default)"'],
  [/"'var\(--border-color\)'"/g, "'var(--border-default)'"],
  [/var\(--border-color\)/g, "var(--border-default)"],
  // Font
  [/"var\(--font-title\)"/g, '"var(--font-display)"'],
  ["'var(--font-title)'", "'var(--font-display)'"],
  // Legacy color vars
  [/"var\(--color-primary\)"/g, '"var(--accent-primary)"'],
  ["'var(--color-primary)'", "'var(--accent-primary)'"],
  ["var(--color-primary)", "var(--accent-primary)"],
  ["var(--color-success)", "var(--accent-success)"],
  ["var(--color-error)", "var(--accent-danger)"],
  ["var(--color-warning)", "var(--accent-warning)"],
  // Gradient → solid
  ["var(--grad-primary)", "var(--accent-primary)"],
  ["var(--grad-accent)", "var(--accent-primary)"],
  // Specific hex
  [/"color":\s*"#fff"/g, '"color":"var(--text-primary)"'],
  [/"color":\s*'#fff'/g, '"color":"var(--text-primary)"'],
  ["color: '#fff'", "color: 'var(--text-primary)'"],
  ["color: '#070913'", "color: 'var(--text-inverse)'"],
  ["color: '#fca5a5'", "color: 'var(--accent-danger)'"],
  ["color: '#a5f3fc'", "color: 'var(--accent-primary)'"],
  ["color: '#d8b4fe'", "color: '#7C3AED'"],
  // Shadow
  ["box-shadow: '0 20px 40px rgba(0,0,0,0.3)'", "box-shadow: 'var(--shadow-md)'"],
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walk(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (/\.(jsx|js|css)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const skipFiles = new Set(['App.jsx', 'Home.jsx', 'Login.jsx', 'Register.jsx', 'tokens.css']);
const files = walk(BASE).filter(f => !skipFiles.has(path.basename(f)));

let fixed = 0;
for (const file of files) {
  if (fixFile(file)) {
    fixed++;
    console.log('Fixed: ' + path.relative(BASE, file));
  }
}
console.log(`\nDone! Fixed ${fixed} files.`);
