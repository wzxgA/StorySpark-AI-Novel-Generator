import { app, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'

let mainWindow: BrowserWindow | null = null
let javaProcess: ChildProcess | null = null

const JAVA_PORT = 18080
const isDev = process.env.VITE_DEV_SERVER_URL !== undefined

function getBackendJarPath(): string {
  if (isDev) {
    // In dev mode, expect the backend JAR to be in the backend/target directory
    return path.join(__dirname, '..', '..', 'backend', 'target', 'storyspark-backend-0.1.0-SNAPSHOT.jar')
  }
  // In production, the JAR is in the extraResources
  return path.join(process.resourcesPath, 'backend.jar')
}

function startJavaBackend(): void {
  const jarPath = getBackendJarPath()
  console.log(`[Main] Starting Java backend: ${jarPath}`)

  javaProcess = spawn('java', ['-jar', jarPath, `--server.port=${JAVA_PORT}`], {
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
    // Force kill after 10 seconds
    setTimeout(() => {
      if (javaProcess) {
        javaProcess.kill('SIGKILL')
      }
    }, 10000)
    javaProcess = null
  }
}

function waitForBackend(retries: number = 30, delay: number = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = (remaining: number) => {
      if (remaining <= 0) {
        reject(new Error('Backend health check timed out'))
        return
      }

      const req = http.get(`http://localhost:${JAVA_PORT}/actuator/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('[Main] Backend is ready')
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
  startJavaBackend()

  try {
    await waitForBackend()
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
