# Library window

SNDBTS manages the sound library in a **separate framed window**, opened from the launcher via **Edit Library** (or **⌘E**).

## What it replaces

Earlier builds used **inline editing** in the launcher (edit mode, row editor, footer Import). That flow is **removed**; all import and metadata editing happens in the library window.

## Features

- **Browse to import** — macOS file picker; copies `.mp3` / `.wav` into `Effects/` and appends entries to `sounds.json` (with `userAdded: true`).
- **Drag and drop** — drop files from Finder onto the drop zone; same import pipeline as browse (uses absolute paths via Electron’s `File.path`).
- **Filter** — search across name, category, tags, and source (Fuse.js); optional **Category** dropdown filter.
- **Single selection** — edit **Name**, **Category**, and **Tags** (comma-separated) for one sound; **Save row** writes via `save-sounds` IPC.
- **Multi selection** — checkboxes, **Select all**, **⌘/Ctrl-click** to toggle, **Shift-click** for range. **Batch** panel:
  - **Set category** — applies to all selected (leave empty to skip).
  - **Add tags** — merges comma-separated tags into each selected sound (deduped).
  - **Remove tag** — choose a tag from the union of tags on the selection; removes it from each selected sound that has it.
  - **Apply to selection** — saves the full library.

## Sync

After any save, main process broadcasts **`sounds-updated`** to both the launcher and the library window so lists reload from `sounds.json` without restarting the app.

## Implementation notes

| Piece | Location |
| --- | --- |
| Second `BrowserWindow` | [app/main.js](../app/main.js) — `createLibraryWindow`, `open-library-window` IPC |
| Import copy + parse | [app/lib/import-audio.js](../app/lib/import-audio.js) — used by dialog import and `import-sounds-from-paths` |
| UI | [app/renderer/library.html](../app/renderer/library.html), [library.css](../app/renderer/library.css), [library.js](../app/renderer/library.js) |

## Browser preview

`npm run browser` does **not** open the library window; `openLibraryWindow` is a no-op in [browser-sndbts.js](../app/renderer/browser-sndbts.js). Use the Electron app for library management.
