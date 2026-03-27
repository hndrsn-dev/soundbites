# SNDBTS — SoundBites

A Mac-only soundboard launcher. Press `Option+Space` from anywhere → a Spotlight-style floating window appears → fuzzy-search 764 sound effects → press `Enter` to play.

Lives in your menu bar. Stays out of your way.

---

## Features

- **Global shortcut** — `Option+Space` toggles the launcher from any app
- **Fuzzy search** — powered by Fuse.js across name, category, source, and tags
- **Keyboard-first** — `↑↓` to navigate, `Enter` to play/stop, `Escape` to hide
- **Theme toggle** — dark (default) and light mode via `⌘/`
- **Menu bar app** — no Dock icon, runs silently in the background
- **764 sound effects** — TV shows, movies, memes, sound design

---

## Tech Stack

| Layer | What |
|---|---|
| Runtime | Electron 41.x |
| Search | Fuse.js 7.x |
| UI | Plain HTML, CSS, vanilla JS — no framework |
| Packaging | electron-builder |
| Design tokens | CSS custom properties (`tokens.css`) |
| Font | JetBrains Mono |

---

## Design Language

"Solarpunk meets Teenage Engineering" — dark olive/charcoal background, amber accents, sage green for playing state, monospace type throughout. Compact, information-dense, keyboard-driven.

---

## Project Structure

```
soundbites/
├── app/
│   ├── main.js              # Electron main process — window, tray, shortcuts, IPC
│   ├── preload.js           # Secure IPC bridge (window.sndbts API)
│   └── renderer/
│       ├── index.html       # Full component tree
│       ├── app.js           # Search, playback, keyboard nav, theme
│       ├── tokens.css       # CSS custom properties — source of truth for all colors/type
│       └── styles.css       # Component styles
├── Effects/                 # 764 .mp3/.wav files
│   └── hidden/              # 7 additional files
├── scripts/
│   └── generate-metadata.js # Scans Effects/, writes sounds.json
├── docs/                    # Project documentation
│   └── phase-4-library-editor.md
├── sounds.json              # Generated metadata for all 764 sounds
├── package.json
└── dist/                    # Built .dmg files (not committed)
```

---

## Getting Started

### Prerequisites

- macOS (arm64 or x64)
- Node.js (any recent LTS)

### Install

```bash
npm install
```

### Run (Development)

```bash
npm run open
```

> **Important:** Use `npm run open`, not `npm start`. Electron's GUI initialization fails when launched as a subprocess from a sandboxed terminal (like VS Code's integrated terminal). `npm run open` uses `open Electron.app --args "$PWD"` which properly initializes the macOS GUI context.

### Browser preview (same UI in Chrome / Cursor browser)

Useful for layout, theme, and search without running Electron:

```bash
npm run browser
```

Then open **http://localhost:3847/app/renderer/browser.html** — it loads `sounds.json` and audio from `/Effects/` over HTTP. The **library window** (Edit Library) is Electron-only; the button logs a hint in the console. Close/Escape and saving to disk are no-ops (see the banner on the page).

### Generate Sound Metadata

If you add or remove files from `Effects/`:

```bash
npm run generate
```

Scans `Effects/`, parses filenames, and rewrites `sounds.json`.

### Build Distribution DMG

```bash
npm run dist          # Full DMG build (arm64 + x64)
npm run dist-dir      # Faster unpacked .app build for quick testing
```

Output goes to `dist/`.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Option+Space` | Toggle launcher (global, works from any app) |
| `↑` / `↓` | Navigate results |
| `Enter` | Play / stop selected sound |
| `Escape` | Hide launcher |
| `⌘/` | Toggle dark/light theme |

---

## Sound File Naming Convention

Files in `Effects/` follow the format:

```
PREFIX-nameInCamelCase.ext
```

Examples:
- `ad-clubSauce.mp3` → name: "Club Sauce", category: "Arrested Development"
- `30rock-ham.mp3` → name: "Ham", category: "30 Rock"
- `airhorn-classic.mp3` → name: "Classic", category: "Air Horn"

The generator script maps known prefixes to human-readable category names. Unknown prefixes fall back to category: "Effects".

### Known Prefixes

| Prefix | Category |
|---|---|
| `ad` | Arrested Development |
| `at` | Adventure Time |
| `30rock` | 30 Rock |
| `office` | The Office |
| `snl` | SNL |
| `mario` | Mario |
| `bale` | Christian Bale |
| `airhorn` | Air Horn |
| `bm` | Beavis & Butt-Head |
| `bf` | Bob's Burgers |
| ...and more | See `scripts/generate-metadata.js` for the full list |

---

## sounds.json Schema

```json
{
  "id": "0001",
  "filename": "ad-clubSauce.mp3",
  "path": "Effects/ad-clubSauce.mp3",
  "name": "Club Sauce",
  "source": "ad",
  "category": "Arrested Development",
  "tags": ["ad"],
  "format": "mp3",
  "duration": null
}
```

`duration` is populated when `ffprobe` is available on the system; otherwise `null`.

---

## Distribution

Built with electron-builder. Produces unsigned `.dmg` files for arm64 (Apple Silicon) and x64 (Intel).

**First-launch note:** macOS Gatekeeper blocks unsigned apps on first double-click. Right-click → Open to bypass on first run. Accessibility permissions may be required for the `Option+Space` global shortcut.

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Done | Core launcher — search, play, tray, global shortcut |
| 2 | ✅ Done | Visual polish — design tokens, theme toggle, waveform animation |
| 3 | ✅ Done | Distribution — electron-builder DMG packaging |
| 4 | Planned | Library editor — import new sounds, edit tags/name/category in-app |
| 5 | Deferred | BlackHole virtual audio routing |

See [docs/phase-4-library-editor.md](docs/phase-4-library-editor.md) for the full Phase 4 plan.

---

## App ID

`com.sndbts.app`
