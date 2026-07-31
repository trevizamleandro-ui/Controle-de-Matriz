import { BrowserWindow as e, app as t, ipcMain as n } from "electron";
import { fileURLToPath as r } from "node:url";
import i from "node:path";
//#region electron/main.js
var a = i.dirname(r(import.meta.url));
process.env.APP_ROOT = i.join(a, "..");
var o = process.env.VITE_DEV_SERVER_URL, s = i.join(process.env.APP_ROOT, "dist-electron"), c = i.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = o ? i.join(process.env.APP_ROOT, "public") : c;
var l;
function u() {
	l = new e({
		width: 1280,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		resizable: !0,
		backgroundColor: "#0f172a",
		autoHideMenuBar: !0,
		titleBarStyle: "hidden",
		titleBarOverlay: {
			color: "#0f172a",
			symbolColor: "#ffffff",
			height: 32
		},
		webPreferences: {
			preload: i.join(a, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), o ? l.loadURL(o) : l.loadFile(i.join(c, "index.html")), l.setMenu(null);
}
n.on("login-success", () => {
	l && (l.setResizable(!0), l.maximize());
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && (t.quit(), l = null);
}), t.whenReady().then(u);
//#endregion
export { s as MAIN_DIST, c as RENDERER_DIST, o as VITE_DEV_SERVER_URL };
