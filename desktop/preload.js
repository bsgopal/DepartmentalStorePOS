const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('renicDesktop', {
  platform: process.platform,
});
