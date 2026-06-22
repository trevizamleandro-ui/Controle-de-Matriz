let electron = require("electron");
//#region electron/preload.js
electron.contextBridge.exposeInMainWorld("electron", { loginSuccess: () => electron.ipcRenderer.send("login-success") });
//#endregion
