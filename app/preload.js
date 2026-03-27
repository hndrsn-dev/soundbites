const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sndbts', {
  getSoundsPath: () => ipcRenderer.invoke('get-sounds-path'),
  getEffectsPath: () => ipcRenderer.invoke('get-effects-path'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  onWindowShown: (cb) => ipcRenderer.on('window-shown', cb),
  saveSounds: (sounds) => ipcRenderer.invoke('save-sounds', sounds),
  importSounds: () => ipcRenderer.invoke('import-sounds'),
  importSoundsFromPaths: (paths) => ipcRenderer.invoke('import-sounds-from-paths', paths),
  deleteImportedFile: (filename) => ipcRenderer.invoke('delete-imported-file', filename),
  openLibraryWindow: () => ipcRenderer.invoke('open-library-window'),
  onSoundsUpdated: (cb) => ipcRenderer.on('sounds-updated', cb),
});
