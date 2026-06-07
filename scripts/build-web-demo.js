#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOUNDS_JSON = path.join(REPO_ROOT, 'sounds.json');
const EFFECTS_DIR = path.join(REPO_ROOT, 'Effects');
const RENDERER = path.join(REPO_ROOT, 'app', 'renderer');
const OUT_DIR = path.join(REPO_ROOT, 'web-demo');
const TARGET_COUNT = 90;

const CSS_FILES = ['tokens.css', 'atoms.css', 'molecules.css', 'organisms.css', 'styles.css'];
const JS_FILES = ['app.js', 'demo-sndbts.js'];

function selectCuratedSounds(allSounds, targetCount) {
  const candidates = allSounds.filter((s) => s.category && s.category !== 'Effects');
  const byCategory = new Map();
  for (const sound of candidates) {
    const cat = sound.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(sound);
  }

  const categories = [...byCategory.keys()].sort(
    (a, b) => byCategory.get(b).length - byCategory.get(a).length
  );
  const picked = [];
  const seen = new Set();
  let round = 0;

  while (picked.length < targetCount && categories.length > 0) {
    let addedThisRound = false;
    for (const cat of categories) {
      if (picked.length >= targetCount) break;
      const list = byCategory.get(cat);
      const sound = list[round];
      if (sound && !seen.has(sound.id)) {
        picked.push(sound);
        seen.add(sound.id);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
    round += 1;
  }

  if (picked.length < targetCount) {
    for (const sound of candidates) {
      if (picked.length >= targetCount) break;
      if (!seen.has(sound.id)) {
        picked.push(sound);
        seen.add(sound.id);
      }
    }
  }

  return picked.map((sound, index) => ({
    ...sound,
    id: String(index + 1).padStart(4, '0'),
  }));
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function buildIndexHtml(soundCount) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SNDBTS — Interactive Demo</title>
  <link rel="stylesheet" href="tokens.css" />
  <link rel="stylesheet" href="styles.css" />
  <style>
    html, body {
      min-height: 100%;
      width: 100%;
      max-width: none;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 16px 32px;
      background: var(--surface-desktop);
      gap: 12px;
    }
    .demo-banner {
      width: 100%;
      max-width: 720px;
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.02em;
      color: var(--text-secondary);
      padding: 10px 14px;
      background: var(--surface-input);
      border: 1px solid var(--border-default);
      border-radius: 8px;
      line-height: 1.45;
    }
    .demo-banner strong { color: var(--text-primary); font-weight: 500; }
    .launcher {
      height: 520px;
      max-height: 520px;
      flex-shrink: 0;
    }
    .footer-edit-btn { display: none !important; }
    .footer-hints .kbd-hint:last-of-type { display: none; }
  </style>
</head>
<body>
  <div class="demo-banner">
    <strong>SNDBTS demo</strong> — Search and play ${soundCount} curated sound bites.
    Use <strong>↑↓</strong> to navigate, <strong>Enter</strong> to play/stop, <strong>⌘/</strong> for theme.
    Desktop app adds global shortcut, menu bar, and local library editing.
  </div>
  <div class="launcher" id="launcher">
    <div class="noise-overlay" aria-hidden="true"></div>
    <div class="header">
      <div class="top-row">
        <div class="wordmark">
          <div class="wordmark-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="22" height="22" rx="4" fill="currentColor" fill-opacity="0.08"/>
              <path d="M6 8.5H8.5L12 6V16L8.5 13.5H6V8.5Z" fill="currentColor" fill-opacity="0.9"/>
              <path d="M14 8.5C14.8 9.3 15.3 10.1 15.3 11C15.3 11.9 14.8 12.7 14 13.5" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.2" stroke-linecap="round"/>
              <path d="M15.5 7C16.8 8.2 17.5 9.6 17.5 11C17.5 12.4 16.8 13.8 15.5 15" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="wordmark-label">SNDBTS</span>
        </div>
        <div class="header-right">
          <div class="live-badge" id="live-badge">
            <span class="live-dot" aria-hidden="true"></span>
            <span class="live-count" id="live-count">0</span>
            <span class="live-label">LIVE</span>
          </div>
          <span class="version-label">demo</span>
          <div class="vertical-divider" aria-hidden="true"></div>
          <button class="theme-toggle" id="theme-toggle" title="Toggle theme (⌘/)" aria-label="Toggle light/dark theme">
            <svg class="icon-sun" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="2.5" fill="currentColor"/>
              <line x1="6.5" y1="0.5" x2="6.5" y2="2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="6.5" y1="11" x2="6.5" y2="12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="0.5" y1="6.5" x2="2" y2="6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="11" y1="6.5" x2="12.5" y2="6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="2.4" y1="2.4" x2="3.4" y2="3.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="9.6" y1="9.6" x2="10.6" y2="10.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="10.6" y1="2.4" x2="9.6" y2="3.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="3.4" y1="9.6" x2="2.4" y2="10.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <svg class="icon-moon" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M11 7.5A5 5 0 1 1 5.5 2a3.5 3.5 0 0 0 5.5 5.5Z" fill="currentColor"/>
            </svg>
            <span class="kbd-hint-small">⌘/</span>
          </button>
          <div class="vertical-divider" aria-hidden="true"></div>
          <button class="close-btn" id="close-btn" title="Close (Esc)" aria-label="Close">&#x2715;</button>
        </div>
      </div>
      <div class="search-wrap">
        <div class="search-frame" id="search-frame">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/>
            <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input type="text" class="search-input" id="search-input" placeholder="Search sounds…" autocomplete="off" spellcheck="false" />
          <span class="search-kbd" aria-hidden="true">⌘K</span>
        </div>
      </div>
    </div>
    <div class="gradient-divider" aria-hidden="true"></div>
    <div class="column-headers" aria-hidden="true">
      <span class="col-name">NAME</span>
      <span class="col-meta">CAT · TAG · DUR</span>
    </div>
    <div class="results-list" id="results-list" role="listbox" aria-label="Sound results">
      <div class="results-empty" id="results-empty" style="display:none;"><span>No sounds found</span></div>
    </div>
    <div class="footer">
      <div class="footer-hints">
        <span class="kbd-hint"><kbd>↵</kbd> play/stop</span>
        <span class="kbd-hint"><kbd>↑↓</kbd> navigate</span>
        <span class="kbd-hint"><kbd>⌘/</kbd> theme</span>
        <span class="kbd-hint"><kbd>⌘E</kbd> library</span>
      </div>
      <div class="footer-right">
        <button type="button" class="footer-edit-btn" id="footer-edit-btn">Edit Library</button>
      </div>
      <div class="footer-playing" id="footer-playing" style="display:none;">
        <div class="footer-waveform" aria-hidden="true">
          <span class="wv-bar"></span><span class="wv-bar"></span><span class="wv-bar"></span>
          <span class="wv-bar"></span><span class="wv-bar"></span>
        </div>
        <span class="footer-playing-name" id="footer-playing-name"></span>
      </div>
    </div>
  </div>
  <script src="fuse.min.js"></script>
  <script src="demo-sndbts.js"></script>
  <script src="app.js"></script>
</body>
</html>`;
}

function main() {
  const allSounds = JSON.parse(fs.readFileSync(SOUNDS_JSON, 'utf8'));
  const curated = selectCuratedSounds(allSounds, TARGET_COUNT);

  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(OUT_DIR, 'Effects'), { recursive: true });

  for (const sound of curated) {
    const rel = sound.path.replace(/^Effects\//, '');
    const src = path.join(EFFECTS_DIR, rel);
    const dest = path.join(OUT_DIR, 'Effects', path.basename(rel));
    if (!fs.existsSync(src)) {
      console.warn(`Missing audio file, skipping: ${rel}`);
      continue;
    }
    copyFile(src, dest);
    sound.path = 'Effects/' + path.basename(rel);
  }

  const written = curated.filter((s) =>
    fs.existsSync(path.join(OUT_DIR, 'Effects', path.basename(s.path)))
  );
  fs.writeFileSync(path.join(OUT_DIR, 'sounds.json'), JSON.stringify(written, null, 2));

  for (const file of CSS_FILES) {
    copyFile(path.join(RENDERER, file), path.join(OUT_DIR, file));
  }
  for (const file of JS_FILES) {
    copyFile(path.join(RENDERER, file), path.join(OUT_DIR, file));
  }

  copyFile(
    path.join(REPO_ROOT, 'node_modules', 'fuse.js', 'dist', 'fuse.min.js'),
    path.join(OUT_DIR, 'fuse.min.js')
  );

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), buildIndexHtml(written.length));

  const categories = {};
  for (const s of written) {
    categories[s.category] = (categories[s.category] || 0) + 1;
  }
  console.log(`Built web-demo with ${written.length} sounds`);
  console.log('Categories:', categories);
}

main();
