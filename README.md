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
- **Library editor** — import new sounds and edit name, category, and tags in a dedicated window (`⌘E`)

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
│   ├── lib/
│   │   ├── import-audio.js  # File copy + metadata parse for imported sounds
│   │   └── parse-filename.js # Shared filename → metadata parser (used by main + generate-metadata)
│   └── renderer/
│       ├── index.html       # Launcher component tree
│       ├── app.js           # Search, playback, keyboard nav, theme
│       ├── library.html     # Library editor window
│       ├── library.js       # Library editor — browse, import, filter, single/batch edit
│       ├── library.css      # Library editor styles
│       ├── browser.html     # Browser-mode launcher (no Electron, for layout/dev)
│       ├── browser-sndbts.js # Browser shim for window.sndbts API
│       ├── tokens.css       # CSS custom properties — source of truth for all colors/type
│       ├── sndbts-tokens.json # Same token set (W3C-style) — import into Figma Variables / Tokens
│       └── styles.css       # Component styles
├── Effects/                 # 764 .mp3/.wav files
│   └── hidden/              # 7 additional files
├── scripts/
│   └── generate-metadata.js # Scans Effects/, writes sounds.json
├── docs/                    # Project documentation
│   ├── library-window.md    # Library editor feature reference
│   └── phase-4-library-editor.md # Original Phase 4 implementation plan (superseded)
├── sounds.json              # Generated + user-edited metadata for all sounds
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
| `⌘E` | Open / close library editor window |

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
  "duration": null,
  "userAdded": true,
  "userEdited": true
}
```

- `duration` — populated when `ffprobe` is available; otherwise `null`
- `userAdded` — present (`true`) when a sound was imported via the library editor, not generated by `generate-metadata.js`
- `userEdited` — present (`true`) when name, category, or tags were saved via the library editor

---

## Sharing & Distribution

### Downloadable macOS app

Build unsigned DMGs for testers:

```bash
npm run dist          # Full DMG (arm64 + x64)
npm run dist-dir      # Faster unpacked .app for local testing
```

Publish the `.dmg` files from `dist/` as assets on a [GitHub Release](https://github.com/hndrsn-dev/soundbites/releases) and share the release link. Binaries stay out of source control.

```bash
npm run dist
./scripts/publish-release.sh   # or upload dist/*.dmg manually in GitHub Releases UI
```

**First launch (unsigned app):**

1. Open the `.dmg` and drag SNDBTS to Applications.
2. On first open, macOS Gatekeeper may block the app. Either **right-click → Open**, or run:
   ```bash
   xattr -cr /Applications/SNDBTS.app
   ```
3. Grant **Accessibility** permission (System Settings → Privacy & Security → Accessibility) so the `Option+Space` global shortcut works.

### User data stays local

Imports and library edits are stored in the app’s user data folder (`~/Library/Application Support/sndbts/`), not in the app bundle or this repo. Testers’ sound bites never sync back to GitHub.

Bundled sounds ship read-only inside the app; user imports live in a writable overlay that survives app updates.

### Web demo (portfolio / case study)

A curated subset (~90 categorized sounds) can be hosted as a static interactive demo:

```bash
npm run build:web-demo   # writes web-demo/ (gitignored)
```

CI deploys `web-demo/` to GitHub Pages on push to `main`/`master` (see `.github/workflows/deploy-web-demo.yml`). Enable Pages under repo **Settings → Pages → Source: GitHub Actions**.

Embed in Framer: add an Embed component pointing at `https://hndrsn-dev.github.io/soundbites/`. See [docs/framer-embed.md](docs/framer-embed.md).

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Done | Core launcher — search, play, tray, global shortcut |
| 2 | ✅ Done | Visual polish — design tokens, theme toggle, waveform animation |
| 3 | ✅ Done | Distribution — electron-builder DMG packaging |
| 4 | ✅ Done | Library editor — import new sounds, edit tags/name/category in dedicated window |
| 5 | Deferred | BlackHole virtual audio routing |

See [docs/library-window.md](docs/library-window.md) for the library editor feature reference.

---

## App ID

`com.sndbts.app`
