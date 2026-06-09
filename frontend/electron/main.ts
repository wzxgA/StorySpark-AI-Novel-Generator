import { app, BrowserWindow, ipcMain } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'
import net from 'net'

let mainWindow: BrowserWindow | null = null
let javaProcess: ChildProcess | null = null
let actualPort: number = 18080

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

function getBackendJarPath(): string {
  if (isDev) {
    return path.join(__dirname, '..', '..', 'backend', 'target', 'storyspark-backend-0.1.0-SNAPSHOT.jar')
  }
  return path.join(process.resourcesPath, 'backend.jar')
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => { server.close(); resolve(true) })
    server.listen(port, '127.0.0.1')
  })
}

async function findAvailablePort(): Promise<number> {
  for (let port = 18080; port <= 18089; port++) {
    if (await isPortAvailable(port)) return port
  }
  throw new Error('No available port in range 18080-18089')
}

function startJavaBackend(port: number): void {
  const jarPath = getBackendJarPath()
  console.log(`[Main] Starting Java backend on port ${port}: ${jarPath}`)

  javaProcess = spawn('java', ['-jar', jarPath, `--server.port=${port}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  javaProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`[Backend] ${data.toString().trim()}`)
  })

  javaProcess.stderr?.on('data', (data: Buffer) => {
    console.error(`[Backend Error] ${data.toString().trim()}`)
  })

  javaProcess.on('close', (code: number | null) => {
    console.log(`[Main] Java backend exited with code ${code}`)
    javaProcess = null
  })

  javaProcess.on('error', (err: Error) => {
    console.error(`[Main] Failed to start Java backend:`, err.message)
  })
}

function stopJavaBackend(): void {
  if (javaProcess) {
    console.log('[Main] Stopping Java backend...')
    javaProcess.kill('SIGTERM')
    setTimeout(() => {
      if (javaProcess) {
        javaProcess.kill('SIGKILL')
      }
    }, 10000)
    javaProcess = null
  }
}

function waitForBackend(port: number, retries: number = 30, delay: number = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = (remaining: number) => {
      if (remaining <= 0) {
        reject(new Error('Backend health check timed out'))
        return
      }

      const req = http.get(`http://localhost:${port}/actuator/health`, (res) => {
        if (res.statusCode === 200) {
          console.log(`[Main] Backend is ready on port ${port}`)
          resolve()
        } else {
          setTimeout(() => check(remaining - 1), delay)
        }
      })

      req.on('error', () => {
        setTimeout(() => check(remaining - 1), delay)
      })

      req.setTimeout(2000, () => {
        req.destroy()
        setTimeout(() => check(remaining - 1), delay)
      })
    }
    check(retries)
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'StorySpark AI Novel Generator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  try {
    actualPort = await findAvailablePort()
  } catch (err) {
    console.error('[Main] Port detection failed, using default 18080:', err)
    actualPort = 18080
  }

  ipcMain.handle('get-backend-port', () => actualPort)

  startJavaBackend(actualPort)

  try {
    await waitForBackend(actualPort)
  } catch (err) {
    console.error('[Main] Could not connect to backend:', err)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopJavaBackend()
  app.quit()
})

app.on('before-quit', () => {
  stopJavaBackend()
})
