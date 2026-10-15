const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('daemoncore', {
  platform: process.platform,
  versions: Object.freeze({ app: '1.1.20', electron: process.versions.electron }),
})
