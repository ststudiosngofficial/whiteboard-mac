const { app, BrowserWindow, ipcMain, shell, clipboard, Menu } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getProductId, verifyCodeFor, normalize } = require('./license');

const PAY_URL = 'https://selar.com/1171787jb0';

let boardWin = null;
let actWin = null;

function licensePath() {
  return path.join(app.getPath('userData'), 'license.json');
}

function savedCode() {
  try {
    const data = JSON.parse(fs.readFileSync(licensePath(), 'utf8'));
    return data && data.code ? String(data.code) : '';
  } catch (e) {
    return '';
  }
}

function isActivated() {
  const code = savedCode();
  return code !== '' && verifyCodeFor(code, getProductId());
}

function saveCode(code) {
  fs.mkdirSync(path.dirname(licensePath()), { recursive: true });
  fs.writeFileSync(licensePath(), JSON.stringify({ code: normalize(code) }));
}

function unlockBoard() {
  if (boardWin && !boardWin.isDestroyed()) {
    boardWin._wantTitle = 'Whiteboard';
    boardWin.setTitle('Whiteboard');
    boardWin.webContents.executeJavaScript('if(window.__wbUnlock)window.__wbUnlock();').catch(() => {});
  }
}

function openActivation() {
  if (actWin && !actWin.isDestroyed()) {
    actWin.focus();
    return;
  }
  actWin = new BrowserWindow({
    width: 480,
    height: 600,
    parent: boardWin,
    modal: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Whiteboard Activation',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, devTools: false }
  });
  actWin.setMenu(null);
  actWin.webContents.on('page-title-updated', (e) => {
    e.preventDefault();
    try { if (!actWin.isDestroyed()) actWin.setTitle('Whiteboard Activation'); } catch (err) {}
  });
  actWin.loadFile(path.join(__dirname, 'activate.html'), { query: { pid: getProductId() } });
  actWin.on('closed', () => { actWin = null; });
}

function createBoard(locked) {
  boardWin = new BrowserWindow({
    width: 1280,
    height: 820,
    title: locked ? 'Whiteboard (Locked - pay to unlock)' : 'Whiteboard',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, devTools: false }
  });
  // The board page rewrites document.title per file ("Untitled — Whiteboard").
  // Electron adopts page titles into the window title, so re-assert ours
  // every time the page tries to change it.
  boardWin._wantTitle = locked ? 'Whiteboard (Locked - pay to unlock)' : 'Whiteboard';
  boardWin.webContents.on('page-title-updated', (e) => {
    e.preventDefault();
    try { if (!boardWin.isDestroyed()) boardWin.setTitle(boardWin._wantTitle); } catch (err) {}
  });
  const query = { win: 'app' };
  if (locked) query.locked = '1';
  boardWin.loadFile(path.join(__dirname, 'board.html'), { query: query });
  boardWin.on('closed', () => { boardWin = null; });
}

function setupMenu() {
  const template = [
    { label: 'Whiteboard', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  setupMenu();

  ipcMain.handle('wb-get-pid', () => getProductId());
  ipcMain.handle('wb-copy-pid', () => { clipboard.writeText(getProductId()); return true; });
  ipcMain.handle('wb-submit-code', (event, code) => {
    if (verifyCodeFor(code, getProductId())) {
      saveCode(code);
      if (actWin && !actWin.isDestroyed()) actWin.close();
      unlockBoard();
      return { ok: true };
    }
    return { ok: false, error: 'That code is not valid for this Mac. Check it carefully, or confirm it was made for the Product ID shown above.' };
  });
  ipcMain.on('wb-open-pay', () => { shell.openExternal(PAY_URL); });
  ipcMain.on('wb-request-activation', () => { openActivation(); });
  ipcMain.on('wb-enter-code', () => { openActivation(); });

  createBoard(!isActivated());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createBoard(!isActivated());
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
