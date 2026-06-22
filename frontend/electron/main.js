import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// As VITE_DEV_SERVER_URL is set by vite-plugin-electron
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    backgroundColor: '#0f172a', // Evita flash branco e combina com o tema escuro
    autoHideMenuBar: true,      // Esconde o menu 'File, Edit, View' padrão
    titleBarStyle: 'hidden',    // Esconde a barra branca do Windows
    titleBarOverlay: {          // Adiciona os botões nativos (X, -, []) na cor escura!
      color: '#0f172a',         // Mesma cor do fundo do app
      symbolColor: '#ffffff',   // Ícones brancos
      height: 32
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // Quando buildado
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Remove o menu superior padrão
  win.setMenu(null);
}

// Ouve o evento do React informando que o login ocorreu com sucesso
ipcMain.on('login-success', () => {
  if (win) {
    win.setResizable(true); // Permite redimensionar
    win.maximize();         // Maximiza com controles padrão
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.whenReady().then(createWindow);
