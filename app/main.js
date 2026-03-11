// Diagnostic: confirm we're inside Electron's runtime
const _rawElectron = require('electron');
if (typeof _rawElectron === 'string') {
  // This means Node resolved the npm package instead of Electron's built-in.
  // This can happen when the Electron binary behaves as plain Node.
  // Print diagnostics and bail with a helpful message.
  process.stderr.write(
    `[SNDBRD] ERROR: require('electron') returned a path string, not the Electron module.\n` +
    `  process.type       = ${process.type}\n` +
    `  process.versions.electron = ${process.versions && process.versions.electron}\n` +
    `  Electron path = ${_rawElectron}\n`
  );
  process.exit(1);
}

const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  shell,
} = _rawElectron;
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOUNDS_JSON = path.join(REPO_ROOT, 'sounds.json');
const EFFECTS_DIR = path.join(REPO_ROOT, 'Effects');

let win = null;
let tray = null;

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

  // Hide when focus is lost
  win.on('blur', () => {
    win.hide();
  });

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
  tray.setToolTip('SNDBRD');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show SNDBRD',
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
