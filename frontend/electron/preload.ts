import { contextBridge, ipcRenderer } from 'electron'

let cachedPort: number | null = null

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  backendUrl: 'http://localhost:18080',
  getBackendPort: (): Promise<number> => {
    if (cachedPort !== null) return Promise.resolve(cachedPort)
    return ipcRenderer.invoke('get-backend-port').then((port: number) => {
      cachedPort = port
      return port
    })
  },
})
