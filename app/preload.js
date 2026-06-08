const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sndbts', {
  getSoundsPath: () => ipcRenderer.invoke('get-sounds-path'),
  getEffectsPath: () => ipcRenderer.invoke('get-effects-path'),
  getEffectsPaths: () => ipcRenderer.invoke('get-effects-paths'),
  resolveAudioPath: (relPath) => ipcRenderer.invoke('resolve-audio-path', relPath),
  hideWindow: () => ipcRenderer.send('hide-window'),
  onWindowShown: (cb) => ipcRenderer.on('window-shown', cb),
  saveSounds: (sounds) => ipcRenderer.invoke('save-sounds', sounds),
  importSounds: () => ipcRenderer.invoke('import-sounds'),
  importSoundsFromPaths: (paths) => ipcRenderer.invoke('import-sounds-from-paths', paths),
  deleteImportedFile: (filename) => ipcRenderer.invoke('delete-imported-file', filename),
  openLibraryWindow: () => ipcRenderer.invoke('open-library-window'),
  onSoundsUpdated: (cb) => ipcRenderer.on('sounds-updated', cb),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  openCallAudioGuide: () => ipcRenderer.invoke('open-call-audio-guide'),
  openAudioMidiSetup: () => ipcRenderer.invoke('open-audio-midi-setup'),
  openBlackholeDownload: () => ipcRenderer.invoke('open-blackhole-download'),
  onShowCallSetup: (cb) => ipcRenderer.on('show-call-setup', cb),
});
