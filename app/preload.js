const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sndbrd', {
  getSoundsPath: () => ipcRenderer.invoke('get-sounds-path'),
  getEffectsPath: () => ipcRenderer.invoke('get-effects-path'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  onWindowShown: (cb) => ipcRenderer.on('window-shown', cb),
});
