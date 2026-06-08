/**
 * Electron preload shim for running the app in a normal browser (http://localhost).
 * Serve repo root: npx serve . -p 3847
 * Open: http://localhost:3847/app/renderer/browser.html
 */
'use strict';

window.sndbts = {
  /** Same-origin /sounds.json (repo root when using `serve`); resolved file URL when opening *.html from disk */
  getSoundsPath: () => {
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
      return Promise.resolve(new URL('../../sounds.json', location.href).href);
    }
    return Promise.resolve('/sounds.json');
  },

  /** Magic value; app.js maps audio to /Effects/... */
  getEffectsPath: () => Promise.resolve('__browser__'),

  hideWindow: () => {
    console.log('[browser preview] hideWindow (no-op)');
  },

  onWindowShown: (cb) => {
    // Focus search like the real app after a tick
    setTimeout(cb, 0);
  },

  saveSounds: async (sounds) => {
    console.log('[browser preview] saveSounds — not persisted to disk', sounds?.length);
  },

  importSounds: async () => {
    console.log('[browser preview] importSounds — use the desktop app for file picker');
    return { entries: [], paths: [] };
  },

  importSoundsFromPaths: async () => {
    console.log('[browser preview] importSoundsFromPaths — Electron only');
    return { entries: [], paths: [] };
  },

  deleteImportedFile: async (filename) => {
    console.log('[browser preview] deleteImportedFile', filename);
  },

  openLibraryWindow: () => {
    console.log('[browser preview] Library window is only available in the Electron app (npm run open).');
  },

  onSoundsUpdated: () => {
    /* No main process in browser */
  },

  getSettings: () => Promise.resolve({
    callMode: { enabled: false, outputDeviceId: '' },
  }),

  saveSettings: async (settings) => settings,

  openCallAudioGuide: () => {
    console.log('[browser preview] openCallAudioGuide — see docs/call-audio-setup.md');
  },

  openAudioMidiSetup: () => {
    console.log('[browser preview] openAudioMidiSetup — macOS only');
  },

  openBlackholeDownload: () => {
    window.open('https://existential.audio/blackhole/', '_blank');
  },

  onShowCallSetup: () => {
    /* No tray in browser */
  },
};
