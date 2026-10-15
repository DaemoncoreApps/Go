const { app, BrowserWindow, protocol, shell } = require('electron')
const { readFile } = require('node:fs/promises')
const path = require('node:path')

const isDev = !app.isPackaged

protocol.registerSchemesAsPrivileged([{
  scheme: 'daemoncore',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}])

function registerRendererProtocol() {
  const rendererRoot = path.resolve(__dirname, '..', 'dist')
  const contentTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.wasm', 'application/wasm'],
  ])

  protocol.handle('daemoncore', async (request) => {
    const requestUrl = new URL(request.url)
    const requestedPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html'
    const resolvedPath = path.resolve(rendererRoot, requestedPath)
    const relativePath = path.relative(rendererRoot, resolvedPath)
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return new Response('Not found', { status: 404 })
    }
    try {
      const body = await readFile(resolvedPath)
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': contentTypes.get(path.extname(resolvedPath).toLowerCase()) ?? 'application/octet-stream' },
      })
    } catch (error) {
      if (error?.code === 'ENOENT') return new Response('Not found', { status: 404 })
      throw error
    }
  })
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#030205',
    title: 'DaemonCore Academy: Intro to Go',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) window.loadURL('http://localhost:5173')
  else window.loadURL('daemoncore://app/index.html')
}

app.whenReady().then(() => {
  if (!isDev) registerRendererProtocol()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
