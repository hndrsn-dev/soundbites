# Phase 4: Library Editor — SNDBTS

> **Superseded:** Inline launcher editing described below was replaced by a **dedicated library window**. See [library-window.md](./library-window.md) for the current behavior. The IPC helpers (`save-sounds`, import helpers, `sounds-updated`) remain; the launcher no longer has edit mode, row editor, or footer Import.

## Context

Phase 4 is the first major feature update to SNDBTS. The app currently has a static, read-only sound library: metadata is generated from filenames by a script, and there's no way to add new sounds or change tags/names without editing files directly. This plan adds in-app editing — import new audio files, and freely edit name, category, and tags on any sound.

---

## Approach

### Edit Mode Toggle
A "Edit Library" button lives in the footer (right side). Pressing it (or `⌘E`) puts the launcher into edit mode — an `is-editing` class on `.launcher` that enables all editing affordances. Pressing it again exits. This keeps editing clearly separated from normal search-and-play.

### Inline Row Editor
In edit mode, a pencil icon fades in on row hover. Clicking it opens an inline editor panel directly below the row. The window height expands from 520px → 660px via `win.setSize()` to give the panel room. The panel slides in with a 150ms CSS transition. Only one row is editable at a time.

### Import Flow
A "+ Import" button appears in the footer when in edit mode. It opens a native macOS file picker (`.mp3`, `.wav`, multi-select). Each selected file is copied to `Effects/`, metadata is auto-parsed from the filename (using shared logic), and a new row is appended to the list with its editor already open for review. Cancel → file is deleted from `Effects/`. Save → entry is written to `sounds.json`.

### Persistence
Saving writes the full updated `sounds` array to `sounds.json` via a new IPC handler. Main process creates a `.bak` file first (one-level rollback). After write, main sends `sounds-updated` to renderer, which re-inits Fuse and re-renders in place — no app restart needed.

---

## sounds.json Schema Changes

Two new optional fields added (absent on unedited entries — no migration needed):

```json
"userAdded": true,     // set when imported via UI (not generate-metadata.js)
"userEdited": true     // set when name/category/tags saved via editor
```

The `tags` array is now fully writable. Previously it only ever held the source prefix; after Phase 4 it holds whatever the user sets.

---

## New IPC Calls

### `main.js` new handlers

| Channel | What it does |
|---|---|
| `save-sounds` | Writes `.bak`, writes new `sounds.json`, sends `sounds-updated` to renderer |
| `import-sounds` | Opens dialog, copies files to `Effects/`, returns parsed metadata entries |
| `delete-imported-file` | Deletes a file from `Effects/` (called on import cancel). Validates no path separators before unlink. |
| `set-window-height` | Calls `win.setSize(560, height)`, clamped 520–700px |

### `preload.js` new exposures (added to `window.sndbts`)

```js
saveSounds: (sounds) => ipcRenderer.invoke('save-sounds', sounds),
importSounds: () => ipcRenderer.invoke('import-sounds'),
deleteImportedFile: (filename) => ipcRenderer.invoke('delete-imported-file', filename),
setWindowHeight: (h) => ipcRenderer.invoke('set-window-height', h),
onSoundsUpdated: (cb) => ipcRenderer.on('sounds-updated', cb),
```

---

## New Shared Module

**`app/lib/parse-filename.js`** — Extract `PREFIX_MAP`, `splitCamelCase()`, and `parseFilename()` from `scripts/generate-metadata.js` into this CommonJS module. Both `main.js` (for import) and the refactored `generate-metadata.js` require it. Single source of truth for filename parsing logic.

---

## Visual Design

All new components use existing CSS tokens — no new color values needed.

### Footer in Edit Mode
Footer becomes 3-zone: `[kbd hints]` · `[+ Import]` · `[⌘E Done Editing]`

```
.footer-right         flex container, gap: 6px
.footer-edit-btn      9px JetBrains Mono, uppercase, 1px border var(--border-light),
                      border-radius: 3px, padding: 2px 8px, height: 24px
                      default: color var(--text-muted)
                      .is-active: color var(--accent-text), border var(--accent-border)
.footer-import-btn    same style as footer-edit-btn, hidden unless .is-editing
```

### Row Pencil Icon (edit mode only)
```
.sound-row-edit-btn   20×20px, absolutely positioned right: 10px
                      opacity: 0, shown via .is-editing .sound-row:hover rule
                      color: var(--text-muted), hover: var(--accent-default)
                      12×12 SVG pencil icon
```

### Editor Panel

```
.sound-row-editor     inserted as sibling immediately after the target .sound-row
                      height: 0 → 140px (CSS transition 150ms ease-out)
                      background: var(--surface-input)
                      border: 1px solid var(--border-focus), border-top: none
                      border-radius: 0 0 6px 6px
                      padding: 10px 12px 12px 44px  (aligns with sound-name column)
                      display: flex, flex-direction: column, gap: 8px

.editor-field-row     flex row, align-items: center, gap: 8px
.editor-label         9px mono, 0.08em tracking, uppercase, color: var(--text-muted), width: 52px
.editor-input         26px height, background: var(--surface-card), border: 1px var(--border-default),
                      border-radius: 4px, 12px JetBrains Mono, color: var(--text-primary)
                      :focus → border var(--accent-border), box-shadow var(--shadow-input-focus)

.editor-tag-field     flex-wrap container (chips + text input), min-height: 26px
                      same background/border/border-radius/focus as .editor-input
.editor-tag-chip      9px mono, 0.08em tracking, uppercase, var(--interactive-tag-bg) bg,
                      border: 1px var(--border-light), border-radius: 2px, padding: 1px 4px 1px 5px
.editor-tag-chip-remove  10×10px × button, color: var(--text-muted), hover: var(--text-primary)
.editor-tag-input     flex: 1, transparent, no border, 9px mono, caret var(--accent-default)

.editor-actions       flex, justify-content: flex-end, gap: 6px, margin-top: 2px
.editor-btn-save      height: 22px, background: var(--accent-default), color: #10120E,
                      9px bold mono, border-radius: 3px
                      hover: background var(--amber-400)
.editor-btn-cancel    height: 22px, ghost (transparent bg, 1px var(--border-light)),
                      9px mono, color: var(--text-muted)
                      hover: color var(--text-primary)
```

### User-Added Row Indicator
```
.sound-row--user-added  left accent bar uses var(--status-playing) (sage green) instead of amber
                        subtle visual distinction from library-generated sounds
```

### Toast Notification
```
.sndbts-toast         fixed, bottom: 40px right: 12px (above footer)
                      background: var(--surface-card), border: 1px var(--border-default)
                      border-radius: 6px, padding: 6px 12px
                      10px mono, color: var(--text-secondary)
                      opacity: 0, translateY(4px) → opacity: 1, translateY(0) on .is-visible
                      auto-removed after 2000ms
```

---

## File Changes Summary

| File | What changes |
|---|---|
| `app/lib/parse-filename.js` | **NEW** — extracted `PREFIX_MAP` + `parseFilename()` shared module |
| `app/main.js` | Add `dialog`, `fs` imports; 4 new `ipcMain.handle` blocks; require `parse-filename.js` |
| `app/preload.js` | Expose 5 new methods in `window.sndbts` |
| `app/renderer/app.js` | New state (`isEditing`, `expandedId`, `pendingImports`); new functions: `toggleEditMode`, `openRowEditor`, `closeRowEditor`, `saveSound`, `buildTagChipEditor`, `importSounds`, `showToast`; modify `buildSoundRow`, `renderResults`, `init`, keyboard handler |
| `app/renderer/index.html` | Add `.footer-right` with edit/import buttons; add `#sndbts-toast` element |
| `app/renderer/styles.css` | All new CSS classes above + `.is-editing` modifier rules |
| `scripts/generate-metadata.js` | Replace inline parse logic with `require('../app/lib/parse-filename')` |

---

## New Renderer State & Functions

**State:**
```js
let isEditing = false;       // edit mode toggle
let expandedId = null;       // id of currently expanded row
let pendingImports = [];     // filenames of imported-but-unsaved files
```

**Functions:**
- `toggleEditMode()` — flips `isEditing`, updates footer button, adds/removes `.is-editing` on `.launcher`, closes any open editor without saving
- `openRowEditor(sound, rowEl)` — inserts `.sound-row-editor` after `rowEl`, populates fields, calls `setWindowHeight(660)`
- `closeRowEditor(save)` — if `save=true` calls `saveSound()`; always removes editor DOM, calls `setWindowHeight(520)`, resets `expandedId`
- `saveSound(updatedSound)` — updates entry in `sounds` array, re-inits Fuse, updates the row DOM in-place, calls `window.sndbts.saveSounds(sounds)`, shows toast
- `buildTagChipEditor(tags)` — returns `.editor-tag-field` with chips and text input; comma/Enter commits, Backspace removes last chip
- `importSounds()` — calls `window.sndbts.importSounds()`, appends entries to `sounds`, re-renders, scrolls to first new entry, opens its editor
- `showToast(message, duration = 2000)` — adds `.is-visible`, removes after duration

---

## Verification

1. `npm run open` — no console errors
2. Click "Edit Library" → button turns amber, `.is-editing` applied, pencil icons appear on row hover
3. Click pencil on a row → window grows to 660px, panel slides in with pre-populated values
4. Edit name + category + add/remove tags → click Save → toast appears, row updates in-place, `sounds.json` on disk reflects change
5. Click Cancel → no changes, window shrinks back to 520px
6. Click "+ Import" → file picker opens → pick a `.mp3` → file copied to `Effects/`, new row appears with editor open pre-filled → Save → `userAdded: true` in `sounds.json`
7. Cancel an import → file removed from `Effects/`, provisional row gone
8. Toggle theme (`⌘/`) in edit mode → editor re-themes correctly (all CSS vars, no hardcoded colors)
9. Click "Done Editing" → edit affordances gone, any open editor closed without saving
10. `⌘E` keyboard shortcut → same as clicking the button
11. Search while in edit mode → filtering still works; open editor closes if its sound is filtered out
12. `npm run generate` → runs clean using shared `parse-filename.js` module
13. Regression: play/stop sounds, Escape to hide window, Option+Space to re-open → all unchanged
