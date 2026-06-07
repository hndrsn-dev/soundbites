/**
 * Browser shim for the hosted portfolio demo (web-demo/).
 * Audio loads from same-origin /Effects/; no server uploads.
 */
'use strict';

window.sndbts = {
  getSoundsPath: () => Promise.resolve('/sounds.json'),

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
