/**
 * Browser shim for the hosted portfolio demo (web-demo/).
 * Audio loads from same-origin /Effects/; no server uploads.
 */
'use strict';

/** Resolve paths relative to the demo page (works on GitHub Pages /soundbites/). */
function demoUrl(relativePath) {
  return new URL(relativePath, window.location.href).href;
}

window.sndbts = {
  getSoundsPath: () => Promise.resolve(demoUrl('sounds.json')),

  getEffectsPath: () => Promise.resolve('__browser__'),

  hideWindow: () => {},

  onWindowShown: (cb) => {
    setTimeout(cb, 0);
  },

  saveSounds: async () => {},

  importSounds: async () => ({ entries: [], paths: [] }),

  importSoundsFromPaths: async () => ({ entries: [], paths: [] }),

  deleteImportedFile: async () => {},

  openLibraryWindow: () => {},

  onSoundsUpdated: () => {},
};
