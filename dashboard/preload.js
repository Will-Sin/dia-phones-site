const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getState: () => ipcRenderer.invoke("get-state"),
  action: (name, payload) => ipcRenderer.invoke("action", name, payload),
  onState: (fn) => ipcRenderer.on("state", (_e, s) => fn(s)),
  onPickDuration: (fn) => ipcRenderer.on("pick-duration", (_e, id) => fn(id)),
  onChime: (fn) => ipcRenderer.on("chime", (_e, n) => fn(n)),
});
