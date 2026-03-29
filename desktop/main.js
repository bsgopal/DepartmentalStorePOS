const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

const BACKEND_PORT = process.env.PORT || 5000;
let backendProcess = null;

const isDev = !app.isPackaged;

function waitForBackend(url, timeoutMs = 25000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const ping = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve();
        if (Date.now() - started > timeoutMs) return reject(new Error('Backend health check timeout'));
        setTimeout(ping, 500);
      });

      req.on('error', () => {
        if (Date.now() - started > timeoutMs) return reject(new Error('Backend did not start in time'));
        setTimeout(ping, 500);
      });
    };

    ping();
  });
}

function getBackendPaths() {
  if (isDev) {
    const root = path.resolve(__dirname, '..');
    return {
      cwd: path.join(root, 'backend'),
      serverScript: path.join(root, 'backend', 'src', 'server.js'),
    };
  }

  return {
    cwd: path.join(process.resourcesPath, 'backend'),
    serverScript: path.join(process.resourcesPath, 'backend', 'src', 'server.js'),
  };
}

function startBackend() {
  const { cwd, serverScript } = getBackendPaths();

  backendProcess = fork(serverScript, {
    cwd,
    env: {
      ...process.env,
      PORT: String(BACKEND_PORT),
    },
    stdio: 'inherit',
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    win.loadURL(devUrl);
  } else {
    const indexPath = path.join(process.resourcesPath, 'frontend-build', 'index.html');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(async () => {
  try {
    startBackend();
    await waitForBackend(`http://localhost:${BACKEND_PORT}/api/health`);
    createWindow();
  } catch (err) {
    dialog.showErrorBox('Startup Error', `Unable to start Renic POS backend:\\n${err.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});
