import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import path from 'path'
import { initDatabase, getAllProfiles } from './db'
import { registerProfileHandlers } from './profileManager'
import { closeAllBrowsers, launchProfileBrowser, getRunningProfileIds } from './windowManager'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createMainWindow(): void {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'GhostBrowser',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: true,
    autoHideMenuBar: true,
    show: false
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Allow self-signed certs globally (for BrowserWindow default session)
// Webview partition sessions have their own setCertificateVerifyProc
app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault()
  callback(true)
})

// Global F12 handler for main window devtools (dev only)
if (process.env.NODE_ENV === 'development') {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('before-input-event', (_event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && (input.key === 'I' || input.key === 'J'))) {
        _event.preventDefault()
        if (contents.isDevToolsOpened()) {
          contents.closeDevTools()
        } else {
          contents.openDevTools()
        }
      }
    })
  })
}

app.whenReady().then(() => {
  initDatabase()
  registerProfileHandlers()
  createMainWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

function createTray(): void {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('GhostBrowser')
  updateTrayMenu()
  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus() }
  })
}

function updateTrayMenu(): void {
  if (!tray) return
  const profiles = getAllProfiles().slice(0, 10)
  const runningIds = getRunningProfileIds()
  const template: Electron.MenuItemConstructorOptions[] = [
    { label: 'Show GhostBrowser', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus() } } },
    { type: 'separator' },
    ...profiles.map(p => ({
      label: `${runningIds.includes(p.id) ? '● ' : ''}${p.name}`,
      click: () => { launchProfileBrowser(p) }
    })),
    { type: 'separator' as const },
    { label: 'Stop All', click: () => { closeAllBrowsers() } },
    { label: 'Quit', click: () => { closeAllBrowsers(); app.quit() } },
  ]
  tray.setContextMenu(Menu.buildFromTemplate(template))
}

setInterval(() => { updateTrayMenu() }, 5000)

app.on('window-all-closed', () => {
  closeAllBrowsers()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
