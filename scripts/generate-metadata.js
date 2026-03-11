#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const EFFECTS_DIR = path.join(REPO_ROOT, 'Effects');
const OUTPUT_FILE = path.join(REPO_ROOT, 'sounds.json');

// Prefix → human-readable category mapping
const PREFIX_MAP = {
  'ad':     { category: 'Arrested Development', source: 'ad' },
  'bale':   { category: 'Christian Bale',        source: 'bale' },
  'bacon':  { category: 'Kevin Bacon',           source: 'bacon' },
  'bm':     { category: 'Billy Madison',         source: 'bm' },
  'bf':     { category: 'Karl',                  source: 'bf' },
  'blake':  { category: 'Workaholics',           source: 'blake' },
  'bog':    { category: 'Misc',                  source: 'bog' },
  'at':     { category: 'Adventure Time',        source: 'at' },
  '30rock': { category: '30 Rock',               source: '30rock' },
  'biggie': { category: 'Biggie Smalls',         source: 'biggie' },
  'bk':     { category: 'Burger King',           source: 'bk' },
  'bell':   { category: 'Bell',                  source: 'bell' },
  'office': { category: 'The Office',            source: 'office' },
  'snl':    { category: 'SNL',                   source: 'snl' },
  'mario':  { category: 'Mario',                 source: 'mario' },
  'shia':   { category: 'Shia LaBeouf',         source: 'shia' },
  'cb':     { category: 'Misc',                  source: 'cb' },
  'fb':     { category: 'Misc',                  source: 'fb' },
  'airhorn':{ category: 'Effects',               source: 'airhorn' },
  'air':    { category: 'Effects',               source: 'air' },
};

// Split camelCase or PascalCase into Title Case words
function splitCamelCase(str) {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Parse a filename (without extension) into metadata
function parseFilename(filename) {
  const dashIdx = filename.indexOf('-');

  if (dashIdx > 0) {
    const prefix = filename.slice(0, dashIdx).toLowerCase();
    const rest = filename.slice(dashIdx + 1);
    const mapped = PREFIX_MAP[prefix];

    if (mapped) {
      return {
        source: mapped.source,
        category: mapped.category,
        name: splitCamelCase(rest),
        tags: [mapped.source],
      };
    }
  }

  // No recognized prefix — standalone effect
  return {
    source: null,
    category: 'Effects',
    name: splitCamelCase(filename),
    tags: ['effect'],
  };
}

// Try to get audio duration via ffprobe (optional)
function getDuration(filePath) {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { stdio: ['pipe', 'pipe', 'pipe'], timeout: 3000 }
    ).toString().trim();
    const secs = parseFloat(result);
    if (!isNaN(secs)) {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
  } catch {
    // ffprobe not available or failed — skip duration
  }
  return null;
}

// Recursively collect audio files
function collectFiles(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, base));
    } else if (/\.(mp3|wav)$/i.test(entry.name)) {
      files.push({ fullPath, relPath: path.relative(base, fullPath) });
    }
  }
  return files;
}

// Main
console.log(`Scanning ${EFFECTS_DIR}...`);
const files = collectFiles(EFFECTS_DIR, REPO_ROOT);
console.log(`Found ${files.length} audio files.`);

const sounds = files.map((file, idx) => {
  const ext = path.extname(file.relPath).slice(1).toLowerCase();
  const basename = path.basename(file.relPath, path.extname(file.relPath));
  const meta = parseFilename(basename);
  const duration = getDuration(file.fullPath);

  return {
    id: String(idx + 1).padStart(4, '0'),
    filename: path.basename(file.relPath),
    path: file.relPath,
    name: meta.name,
    source: meta.source,
    category: meta.category,
    tags: meta.tags,
    format: ext,
    duration,
  };
});

// Sort by category then name
sounds.sort((a, b) => {
  if (a.category < b.category) return -1;
  if (a.category > b.category) return 1;
  return a.name.localeCompare(b.name);
});

// Re-assign IDs after sort
sounds.forEach((s, i) => { s.id = String(i + 1).padStart(4, '0'); });

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sounds, null, 2));
console.log(`Written ${sounds.length} sounds to ${OUTPUT_FILE}`);
