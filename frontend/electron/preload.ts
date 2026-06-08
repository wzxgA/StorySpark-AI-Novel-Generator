import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  backendUrl: 'http://localhost:18080',
})
