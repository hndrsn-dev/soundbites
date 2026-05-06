# Search query highlighting in SoundBites (fuzzy-aligned)

## Goal

As the user types, highlight the **same characters Fuse.js used to score the match** in each visible field (title, category, tags, and `source` badge on the launcher)—**case-insensitive in effect** because highlights are driven by **indices from the search engine**, not by re-scanning the raw query as a substring.

## Context

- **Launcher**: [`app/renderer/app.js`](app/renderer/app.js) — `fuse.search(query)` currently keeps only `.item`; `buildSoundRow` renders name, category, tags/`source`.
- **Library**: [`app/renderer/library.js`](app/renderer/library.js) — same Fuse keys (`name`, `source`, `category`, `tags`).
- **Fuse**: [`package.json`](package.json) `fuse.js` ^7 — supports `includeMatches: true` on the options object so each result includes **per-key match metadata with character index ranges** (plus `refIndex` for array fields like `tags`).

## Approach (replaces substring-only highlighting)

1. **Enable `includeMatches: true`** in both Fuse initializations ([`app.js`](app/renderer/app.js), [`library.js`](app/renderer/library.js)). Keep existing `keys`, `threshold`, and other options unchanged so ranking behavior stays the same.

2. **Preserve full search results when the query is non-empty**  
   Instead of only storing `fuse.search(q).map(r => r.item)`:
   - Build a **Map** from sound `id` → `matches` array (from the Fuse result object), **or** store parallel `{ item, matches }[]` and thread `.item` through navigation/playback.
   - When the query is empty, clear the map / omit matches so rows render with plain text (no `<mark>`).

3. **Highlight helper: indices → safe HTML**  
   Implement something like `highlightByIndices(text, ranges)` where `ranges` is a sorted list of `[start, end]` pairs from Fuse for that **specific string** (merge overlaps/adjacent ranges before rendering). Escape HTML for every text segment; wrap matched segments in `<mark class="search-highlight">`.  
   No separate “query string” scan—**only** Fuse-provided indices.

4. **Field mapping in `buildSoundRow` / `renderTable`**  
   For each displayed string:
   - **name**: apply ranges from matches where `key === 'name'` (or equivalent path Fuse returns).
   - **category**: same for `category`.
   - **tags**: for each tag chip, find match entries with `key === 'tags'` and **`refIndex` equal to that tag’s index** in `sound.tags`; apply that entry’s indices to **that tag’s text only**.
   - **source** (launcher fallback badge when no tags): ranges from `key === 'source'`.

   If Fuse returns multiple match records for one field, **merge** their `indices` arrays before highlighting.

5. **Styles**  
   Same as before: `mark.search-highlight` in [`app/renderer/styles.css`](app/renderer/styles.css) and [`app/renderer/library.css`](app/renderer/library.css) using design tokens; verify contrast on selected rows.

6. **Refactor touchpoints (launcher)**  
   Any code that iterates `filtered` for keyboard selection, playback, or counts must use the **sound object** consistently—either `filtered` stays `Sound[]` and a **`matchBySoundId` Map** is updated on each search, or `filtered` becomes an array of `{ item, matches }` with small call-site updates (`filtered[i].item` vs `filtered[i]`).

7. **Library**  
   Mirror the same: after `fuse.search(q)`, map `matches` by id (or carry entries) and use `highlightByIndices` in `renderTable` for name, category, and per-tag chips when query is non-empty.

## Verification

- Typing partial/fuzzy queries still lists the same rows as today; highlighted segments should **line up with Fuse’s fuzzy matches** (not necessarily a contiguous literal substring of the query).
- Empty query: no highlights, no HTML injection issues.
- Tags: only the tag(s) that matched show marks inside that chip.
- Manual pass on launcher + library; keyboard nav and selection unchanged.

## Implementation todos

- Add `includeMatches: true` to Fuse config in `app.js` and `library.js`.
- Store per-result `matches` alongside filtered items (Map by id or `{ item, matches }[]`); update all `filtered` consumers.
- Add `highlightByIndices` (+ small range-merge utility) with strict escaping; use in `buildSoundRow` and library `renderTable`.
- Add `.search-highlight` CSS; confirm selected-row readability.
- Regression check: `onSoundsUpdated` / library reload paths still run search and rebuild Fuse + match map correctly.
