import { ipcMain, dialog, BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import {
  getAllProfiles,
  createProfileRecord,
  updateProfileRecord,
  deleteProfileRecord,
  getProfileById,
  getProxyById,
  getAllProxies,
  createProxyRecord,
  updateProxyRecord,
  deleteProxyRecord,
  getAllExtensions,
  getGlobalExtensions,
  createExtensionRecord,
  updateExtensionRecord,
  deleteExtensionRecord
} from './db'
import { CreateProfilePayload, Profile, SavedProxy, ExtensionInfo } from '@shared/types'
import { launchProfileBrowser, getProfileCookies, isProfileRunning, logToFile, setSyncEnabled, isSyncEnabled, getSyncEnabledIds, syncNavigate, syncClick, syncClickAbsolute, syncMouseMove, syncType, syncScroll, syncScrollTo, multiLaunch, getRunningProfileIds, setMasterProfile, getMasterProfileId, startMirrorMode, pollMasterEvents, replayEventsToSynced, closeBrowser, startMirrorLoop, stopMirrorLoop, getActiveBrowser, getScreenshotPath, closeAllBrowsers } from './windowManager'
import { testProxyConnection, startProxyHealthMonitor, lookupProxyTimezone } from './sessionManager'
import { generateRandomFingerprint } from './randomizer'
import { listChromeProfiles, importChromeProfileCookies, detectChromeExtensions } from './chromeImporter'
import { warmupProfile } from './warmup'
import { startResourceMonitor } from './resourceMonitor'

export function registerProfileHandlers(): void {
  ipcMain.handle('profile:getAll', async () => {
    return getAllProfiles()
  })

  ipcMain.handle('profile:create', async (_event, payload: CreateProfilePayload) => {
    const fingerprint = generateRandomFingerprint()
    const profile: Profile = {
      id: uuidv4(),
      name: payload.name,
      color: payload.color || '#3b82f6',
      proxy: payload.proxy || { type: 'none' },
      startUrl: payload.startUrl || 'https://www.google.com',
      fingerprint,
      notes: payload.notes,
      createdAt: Date.now()
    }
    createProfileRecord(profile)
    return profile
  })

  ipcMain.handle('profile:update', async (_event, id: string, payload: Partial<CreateProfilePayload>) => {
    updateProfileRecord(id, payload)
    return getProfileById(id)
  })

  ipcMain.handle('profile:delete', async (_event, id: string) => {
    await closeBrowser(id)
    deleteProfileRecord(id)
    return
  })

  ipcMain.handle('profile:clone', async (_event, id: string) => {
    const source = getProfileById(id)
    if (!source) throw new Error('Profile not found')
    const cloned: Profile = {
      ...source,
      id: uuidv4(),
      name: `${source.name} (copy)`,
      fingerprint: generateRandomFingerprint(),
      createdAt: Date.now(),
      lastUsedAt: undefined,
      proxyPoolIndex: 0,
    }
    createProfileRecord(cloned)
    return cloned
  })

  ipcMain.handle('profile:launch', async (_event, id: string) => {
    const profile = getProfileById(id)
    if (!profile) throw new Error('Profile not found')
    // Auto-rotate UA if enabled
    if (profile.autoRotateUA) {
      const newFp = generateRandomFingerprint()
      profile.fingerprint = newFp
      updateProfileRecord(id, { fingerprint: newFp, lastUsedAt: Date.now() })
    } else {
      updateProfileRecord(id, { lastUsedAt: Date.now() })
    }
    // Proxy rotation from pool
    if (profile.proxyPool && profile.proxyPool.length > 0) {
      const idx = (profile.proxyPoolIndex || 0) % profile.proxyPool.length
      const proxyRecord = getProxyById(profile.proxyPool[idx])
      if (proxyRecord) {
        profile.proxy = { type: proxyRecord.type, host: proxyRecord.host, port: proxyRecord.port, username: proxyRecord.username, password: proxyRecord.password }
      }
      updateProfileRecord(id, { proxyPoolIndex: idx + 1 } as any)
    }
    // Timezone auto-match proxy location
    if (profile.proxy && profile.proxy.type !== 'none' && profile.proxy.host) {
      try {
        const geoInfo = await lookupProxyTimezone(profile.proxy.host)
        if (geoInfo?.timezone) {
          profile.fingerprint.timezone = geoInfo.timezone
          if (geoInfo.locale) profile.fingerprint.locale = geoInfo.locale
          updateProfileRecord(id, { fingerprint: profile.fingerprint } as any)
          logToFile(`Timezone auto-matched for ${profile.name}: ${geoInfo.timezone} (${geoInfo.locale})`)
        }
      } catch (e: any) {
        logToFile(`Timezone lookup failed for ${profile.name}: ${e?.message}`)
      }
    }
    try {
      logToFile(`profileManager: calling launchProfileBrowser for ${profile.name}`)
      await launchProfileBrowser(profile)
      logToFile(`profileManager: launch completed for ${profile.name}`)
    } catch (e: any) {
      logToFile(`LAUNCH ERROR: ${e?.message}\n${e?.stack}`)
      throw new Error(e?.message || 'Launch failed')
    }
  })

  ipcMain.handle('profile:getCookies', async (_event, id: string) => {
    return getProfileCookies(id)
  })

  ipcMain.handle('profile:getFingerprint', async (_event, id: string) => {
    const profile = getProfileById(id)
    if (!profile) return null
    return profile.fingerprint
  })

  ipcMain.handle('profile:isRunning', async (_event, id: string) => {
    return isProfileRunning(id)
  })

  ipcMain.handle('profile:regenerateFingerprint', async (_event, id: string) => {
    const profile = getProfileById(id)
    if (!profile) throw new Error('Profile not found')
    const fingerprint = generateRandomFingerprint()
    updateProfileRecord(id, { fingerprint })
    return fingerprint
  })

  ipcMain.handle('util:testProxy', async (_event, proxy) => {
    return testProxyConnection(proxy)
  })

  ipcMain.handle('sync:setEnabled', async (_event, id: string, enabled: boolean) => {
    setSyncEnabled(id, enabled)
  })

  ipcMain.handle('sync:isEnabled', async (_event, id: string) => {
    return isSyncEnabled(id)
  })

  ipcMain.handle('sync:getEnabledIds', async () => {
    return getSyncEnabledIds()
  })

  ipcMain.handle('sync:navigate', async (_event, url: string) => {
    await syncNavigate(url)
  })

  ipcMain.handle('sync:click', async (_event, x: number, y: number) => {
    await syncClick(x, y)
  })

  ipcMain.handle('sync:clickAbsolute', async (_event, x: number, y: number) => {
    await syncClickAbsolute(x, y)
  })

  ipcMain.handle('sync:mouseMove', async (_event, relX: number, relY: number) => {
    await syncMouseMove(relX, relY)
  })

  ipcMain.handle('sync:type', async (_event, text: string) => {
    await syncType(text)
  })

  ipcMain.handle('sync:scroll', async (_event, deltaY: number) => {
    await syncScroll(deltaY)
  })

  ipcMain.handle('sync:scrollTo', async (_event, scrollX: number, scrollY: number) => {
    await syncScrollTo(scrollX, scrollY)
  })

  ipcMain.handle('sync:setMaster', async (_event, id: string | null) => {
    setMasterProfile(id)
    if (id) {
      await startMirrorMode(id)
      startMirrorLoop()
    } else {
      stopMirrorLoop()
    }
  })

  ipcMain.handle('sync:getMaster', async () => {
    return getMasterProfileId()
  })

  ipcMain.handle('sync:mirrorToggle', async (_event, active: boolean) => {
    if (active && getMasterProfileId()) {
      startMirrorLoop()
    } else {
      stopMirrorLoop()
    }
  })

  ipcMain.handle('sync:pollMaster', async () => {
    return pollMasterEvents()
  })

  ipcMain.handle('sync:replayEvents', async (_event, events: any[]) => {
    await replayEventsToSynced(events)
  })

  ipcMain.handle('profile:multiLaunch', async (_event, ids: string[]) => {
    const profiles = ids.map(id => getProfileById(id)).filter(Boolean) as Profile[]
    for (const p of profiles) {
      p.lastUsedAt = Date.now()
      updateProfileRecord(p.id, { name: p.name, color: p.color, proxy: p.proxy, startUrl: p.startUrl })
    }
    await multiLaunch(profiles)
  })

  ipcMain.handle('profile:getRunningIds', async () => {
    return getRunningProfileIds()
  })

  // Proxy Manager CRUD
  ipcMain.handle('proxy:getAll', async () => {
    return getAllProxies()
  })

  ipcMain.handle('proxy:create', async (_event, payload: Omit<SavedProxy, 'id' | 'createdAt'>) => {
    const proxy: SavedProxy = {
      id: uuidv4(),
      ...payload,
      createdAt: Date.now()
    }
    createProxyRecord(proxy)
    return proxy
  })

  ipcMain.handle('proxy:update', async (_event, id: string, payload: Partial<Omit<SavedProxy, 'id' | 'createdAt'>>) => {
    updateProxyRecord(id, payload)
  })

  ipcMain.handle('proxy:delete', async (_event, id: string) => {
    deleteProxyRecord(id)
  })

  // Import/Export profiles
  ipcMain.handle('profile:export', async (_event, ids: string[]) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return false
    const profiles = ids.map(id => getProfileById(id)).filter(Boolean) as Profile[]
    if (profiles.length === 0) return false
    const result = await dialog.showSaveDialog(win, {
      title: 'Export Profiles',
      defaultPath: `ghostbrowser-profiles-${Date.now()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return false
    fs.writeFileSync(result.filePath, JSON.stringify(profiles, null, 2), 'utf-8')
    return true
  })

  ipcMain.handle('profile:import', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return 0
    const result = await dialog.showOpenDialog(win, {
      title: 'Import Profiles',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return 0
    try {
      const raw = fs.readFileSync(result.filePaths[0], 'utf-8')
      const imported = JSON.parse(raw) as Profile[]
      if (!Array.isArray(imported)) return 0
      let count = 0
      for (const p of imported) {
        if (!p.name || !p.fingerprint) continue
        const profile: Profile = {
          ...p,
          id: uuidv4(),
          createdAt: Date.now()
        }
        createProfileRecord(profile)
        count++
      }
      return count
    } catch {
      return 0
    }
  })

  // Close browser without deleting profile
  ipcMain.handle('profile:closeBrowser', async (_event, id: string) => {
    await closeBrowser(id)
  })

  // Close all browsers
  ipcMain.handle('profile:closeAll', async () => {
    await closeAllBrowsers()
  })

  // Sync all running profiles
  ipcMain.handle('sync:enableAll', async () => {
    const runningIds = getRunningProfileIds()
    for (const id of runningIds) {
      setSyncEnabled(id, true)
    }
    return runningIds
  })

  // Bulk create profiles from proxy list (with proxy check)
  ipcMain.handle('profile:bulkCreate', async (_event, lines: string[], namePrefix: string) => {
    let count = 0
    const results: { line: string; ok: boolean; message?: string }[] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const parts = line.split(':')
      if (parts.length < 2) { results.push({ line, ok: false, message: 'Invalid format' }); continue }
      const host = parts[0]
      const port = parseInt(parts[1]) || 0
      const username = parts[2] || undefined
      const password = parts[3] || undefined
      const type = parts[4] === 'socks5' ? 'socks5' as const : 'http' as const
      const proxy: import('@shared/types').ProxyConfig = { type, host, port, username, password }

      const testResult = await testProxyConnection(proxy)
      if (!testResult.ok) {
        results.push({ line, ok: false, message: testResult.message })
        continue
      }

      const profile: Profile = {
        id: uuidv4(),
        name: `${namePrefix} ${count + 1}`,
        color: ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16'][count % 8],
        proxy,
        startUrl: 'https://www.google.com',
        fingerprint: generateRandomFingerprint(),
        createdAt: Date.now()
      }
      createProfileRecord(profile)
      results.push({ line, ok: true })
      count++
    }
    return { count, results }
  })

  // Cookie import
  ipcMain.handle('profile:importCookies', async (_event, id: string, cookiesJson: string) => {
    try {
      const parsed = JSON.parse(cookiesJson)
      if (!Array.isArray(parsed)) return { ok: false, message: 'Invalid JSON: must be array' }
      const browser = getActiveBrowser(id)
      if (!browser) return { ok: false, message: 'Browser not running. Launch first.' }
      const pages = await browser.pages()
      if (pages.length === 0) return { ok: false, message: 'No page open' }
      const client = await pages[0].target().createCDPSession()
      for (const cookie of parsed) {
        try {
          await client.send('Network.setCookie', {
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path || '/',
            secure: cookie.secure || false,
            httpOnly: cookie.httpOnly || false,
            sameSite: cookie.sameSite || undefined,
            expires: cookie.expires || cookie.expirationDate || undefined
          })
        } catch {}
      }
      return { ok: true, message: `Imported ${parsed.length} cookies` }
    } catch (e: any) {
      return { ok: false, message: e?.message || 'Parse error' }
    }
  })

  // Screenshot
  ipcMain.handle('profile:getScreenshot', async (_event, id: string) => {
    const p = getScreenshotPath(id)
    if (!p) return null
    try {
      const data = fs.readFileSync(p)
      return `data:image/png;base64,${data.toString('base64')}`
    } catch { return null }
  })

  // Profile warmup
  ipcMain.handle('profile:warmup', async (_event, id: string, siteCount?: number) => {
    return warmupProfile(id, siteCount || 5)
  })

  // Chrome cookie import
  ipcMain.handle('chrome:listProfiles', async () => {
    return listChromeProfiles()
  })

  ipcMain.handle('chrome:importCookies', async (_event, chromeProfilePath: string, domain?: string) => {
    return importChromeProfileCookies(chromeProfilePath, domain)
  })

  ipcMain.handle('chrome:detectExtensions', async () => {
    return detectChromeExtensions()
  })

  // Proxy health monitor (every 5 min)
  startProxyHealthMonitor(300000)

  // Resource monitor (every 10 sec)
  startResourceMonitor(10000)

  // Extensions
  ipcMain.handle('extensions:getAll', async () => getAllExtensions())
  ipcMain.handle('extensions:add', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Extension Folder',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const extPath = result.filePaths[0]
    let name = extPath.split(/[\\/]/).pop() || 'Extension'
    try {
      const manifest = JSON.parse(fs.readFileSync(`${extPath}/manifest.json`, 'utf-8'))
      if (manifest.name) name = manifest.name
    } catch {}
    const ext: ExtensionInfo = { id: uuidv4(), name, path: extPath, enabled: true, global: true }
    createExtensionRecord(ext)
    return ext
  })
  ipcMain.handle('extensions:addFromPath', async (_event, extPath: string, name: string, enabled: boolean) => {
    if (!fs.existsSync(extPath)) return null
    let extName = name
    try {
      const manifest = JSON.parse(fs.readFileSync(`${extPath}/manifest.json`, 'utf-8'))
      if (manifest.name && !manifest.name.startsWith('__MSG_')) extName = manifest.name
    } catch {}
    const ext: ExtensionInfo = { id: uuidv4(), name: extName, path: extPath, enabled, global: true }
    createExtensionRecord(ext)
    return ext
  })
  ipcMain.handle('extensions:update', async (_event, id: string, payload: Partial<Omit<ExtensionInfo, 'id'>>) => {
    updateExtensionRecord(id, payload)
  })
  ipcMain.handle('extensions:delete', async (_event, id: string) => {
    deleteExtensionRecord(id)
  })
  ipcMain.handle('extensions:getGlobal', async () => getGlobalExtensions())
}
