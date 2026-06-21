const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("aeroChat", {
  platform: "electron"
});
