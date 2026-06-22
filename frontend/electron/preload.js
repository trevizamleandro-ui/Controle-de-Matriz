import { contextBridge, ipcRenderer } from 'electron';

// Expõe métodos seguros para o window.electron no React
contextBridge.exposeInMainWorld('electron', {
  loginSuccess: () => ipcRenderer.send('login-success')
});
