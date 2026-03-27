// Diagnostic: confirm we're inside Electron's runtime
const _rawElectron = require('electron');
if (typeof _rawElectron === 'string') {
  // This means Node resolved the npm package instead of Electron's built-in.
  // This can happen when the Electron binary behaves as plain Node.
  // Print diagnostics and bail with a helpful message.
  process.stderr.write(
    `[SNDBTS] ERROR: require('electron') returned a path string, not the Electron module.\n` +
    `  process.type       = ${process.type}\n` +
    `  process.versions.electron = ${process.versions && process.versions.electron}\n` +
    `  Electron path = ${_rawElectron}\n`
  );
  process.exit(1);
}

const {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  shell,
} = _rawElectron;
const path = require('path');
const fs = require('fs');
const { importAudioFilesFromSourcePaths } = require('./lib/import-audio');

const REPO_ROOT = app.isPackaged
  ? process.resourcesPath
  : path.resolve(__dirname, '..');
const SOUNDS_JSON = path.join(REPO_ROOT, 'sounds.json');
const EFFECTS_DIR = path.join(REPO_ROOT, 'Effects');

let win = null;
let libraryWin = null;
let tray = null;

function sendSoundsUpdated() {
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send('sounds-updated');
  }
  if (libraryWin && !libraryWin.isDestroyed() && libraryWin.webContents) {
    libraryWin.webContents.send('sounds-updated');
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 560,
    height: 520,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    hasShadow: true, // native macOS shadow respects transparent corners
    vibrancy: null,
    visualEffectState: 'inactive',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  win.on('closed', () => {
    win = null;
  });
}

function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    centerWindow();
    win.show();
    win.focus();
    win.webContents.send('window-shown');
  }
}

function centerWindow() {
  const { screen } = require('electron');
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const winBounds = win.getBounds();
  win.setPosition(
    Math.round((width - winBounds.width) / 2),
    Math.round(height * 0.28) // slightly above center, Spotlight-style
  );
}

function createTray() {
  // Minimal 16x16 transparent PNG (1x1 scaled) for macOS menu bar
  // We use a title character instead of an icon image
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AEEBiMYSD1TVQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAD0lEQVQ4y2NgGAWDEwAAAQQAAWbWDIMAAAAASUVORK5CYII='
  );
  tray = new Tray(icon);
  tray.setTitle('◉');
  tray.setToolTip('SNDBTS');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show SNDBTS',
      click: toggleWindow,
    },
    { type: 'separator' },
    {
      label: 'Generate sounds.json',
      click: () => {
        const { execFile } = require('child_process');
        execFile('node', [path.join(REPO_ROOT, 'scripts', 'generate-metadata.js')]);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);
}

function createLibraryWindow() {
  if (libraryWin && !libraryWin.isDestroyed()) {
    libraryWin.show();
    libraryWin.focus();
    return;
  }
  libraryWin = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 640,
    minHeight: 480,
    show: false,
    title: 'SNDBTS — Library',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  libraryWin.loadFile(path.join(__dirname, 'renderer', 'library.html'));
  libraryWin.once('ready-to-show', () => {
    if (libraryWin && !libraryWin.isDestroyed()) libraryWin.show();
  });
  libraryWin.on('closed', () => {
    libraryWin = null;
  });
}

app.whenReady().then(() => {
  // Hide dock icon — menu bar app only
  if (app.dock) app.dock.hide();

  createWindow();
  createTray();

  globalShortcut.register('Alt+Space', toggleWindow);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Keep app running when all windows are closed (menu bar app)
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// IPC handlers
ipcMain.handle('get-sounds-path', () => SOUNDS_JSON);
ipcMain.handle('get-effects-path', () => EFFECTS_DIR);
ipcMain.on('hide-window', () => {
  if (win) win.hide();
});

ipcMain.handle('save-sounds', async (_, sounds) => {
  const bakPath = SOUNDS_JSON + '.bak';
  try {
    if (fs.existsSync(SOUNDS_JSON)) {
      fs.copyFileSync(SOUNDS_JSON, bakPath);
    }
    fs.writeFileSync(SOUNDS_JSON, JSON.stringify(sounds, null, 2));
    sendSoundsUpdated();
  } catch (err) {
    console.error('save-sounds error:', err);
    throw err;
  }
});

ipcMain.handle('open-library-window', () => {
  createLibraryWindow();
});

ipcMain.handle('import-sounds', async () => {
  const parent = libraryWin && !libraryWin.isDestroyed() ? libraryWin : win;
  const result = await dialog.showOpenDialog(parent || undefined, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav'] }],
  });
  if (result.canceled || !result.filePaths.length) return { entries: [], paths: [] };
  return importAudioFilesFromSourcePaths(result.filePaths, EFFECTS_DIR);
});

ipcMain.handle('import-sounds-from-paths', async (_, paths) => {
  if (!Array.isArray(paths)) return { entries: [], paths: [] };
  const abs = paths.filter((p) => typeof p === 'string' && path.isAbsolute(p));
  return importAudioFilesFromSourcePaths(abs, EFFECTS_DIR);
});

ipcMain.handle('delete-imported-file', async (_, filename) => {
  if (!filename || /[\\/]/.test(filename)) {
    throw new Error('Invalid filename');
  }
  const filePath = path.join(EFFECTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

