import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getProfiles: () => ipcRenderer.invoke('profile:getAll'),
  createProfile: (payload: any) => ipcRenderer.invoke('profile:create', payload),
  updateProfile: (id: string, payload: any) => ipcRenderer.invoke('profile:update', id, payload),
  deleteProfile: (id: string) => ipcRenderer.invoke('profile:delete', id),
  cloneProfile: (id: string) => ipcRenderer.invoke('profile:clone', id),
  launchProfile: (id: string) => ipcRenderer.invoke('profile:launch', id),
  multiLaunch: (ids: string[]) => ipcRenderer.invoke('profile:multiLaunch', ids),
  getCookies: (id: string) => ipcRenderer.invoke('profile:getCookies', id),
  getFingerprint: (id: string) => ipcRenderer.invoke('profile:getFingerprint', id),
  isRunning: (id: string) => ipcRenderer.invoke('profile:isRunning', id),
  getRunningIds: () => ipcRenderer.invoke('profile:getRunningIds'),
  regenerateFingerprint: (id: string) => ipcRenderer.invoke('profile:regenerateFingerprint', id),
  testProxy: (proxy: any) => ipcRenderer.invoke('util:testProxy', proxy),
  syncSetEnabled: (id: string, enabled: boolean) => ipcRenderer.invoke('sync:setEnabled', id, enabled),
  syncIsEnabled: (id: string) => ipcRenderer.invoke('sync:isEnabled', id),
  syncGetEnabledIds: () => ipcRenderer.invoke('sync:getEnabledIds'),
  syncNavigate: (url: string) => ipcRenderer.invoke('sync:navigate', url),
  syncClick: (relX: number, relY: number) => ipcRenderer.invoke('sync:click', relX, relY),
  syncClickAbsolute: (x: number, y: number) => ipcRenderer.invoke('sync:clickAbsolute', x, y),
  syncMouseMove: (relX: number, relY: number) => ipcRenderer.invoke('sync:mouseMove', relX, relY),
  syncType: (text: string) => ipcRenderer.invoke('sync:type', text),
  syncScroll: (deltaY: number) => ipcRenderer.invoke('sync:scroll', deltaY),
  syncScrollTo: (scrollX: number, scrollY: number) => ipcRenderer.invoke('sync:scrollTo', scrollX, scrollY),
  syncSetMaster: (id: string | null) => ipcRenderer.invoke('sync:setMaster', id),
  syncGetMaster: () => ipcRenderer.invoke('sync:getMaster'),
  syncPollMaster: () => ipcRenderer.invoke('sync:pollMaster'),
  syncReplayEvents: (events: any[]) => ipcRenderer.invoke('sync:replayEvents', events),
  syncMirrorToggle: (active: boolean) => ipcRenderer.invoke('sync:mirrorToggle', active),
  // Proxy Manager
  getProxies: () => ipcRenderer.invoke('proxy:getAll'),
  createProxy: (payload: any) => ipcRenderer.invoke('proxy:create', payload),
  updateProxy: (id: string, payload: any) => ipcRenderer.invoke('proxy:update', id, payload),
  deleteProxy: (id: string) => ipcRenderer.invoke('proxy:delete', id),
  // Import/Export
  exportProfiles: (ids: string[]) => ipcRenderer.invoke('profile:export', ids),
  importProfiles: () => ipcRenderer.invoke('profile:import'),
  // Close browser
  closeBrowser: (id: string) => ipcRenderer.invoke('profile:closeBrowser', id),
  closeAllBrowsers: () => ipcRenderer.invoke('profile:closeAll'),
  // Sync
  syncEnableAll: () => ipcRenderer.invoke('sync:enableAll'),
  // Bulk create
  bulkCreate: (lines: string[], namePrefix: string) => ipcRenderer.invoke('profile:bulkCreate', lines, namePrefix),
  // Cookie import
  importCookies: (id: string, cookiesJson: string) => ipcRenderer.invoke('profile:importCookies', id, cookiesJson),
  // Screenshot
  getScreenshot: (id: string) => ipcRenderer.invoke('profile:getScreenshot', id),
  // Extensions
  getExtensions: () => ipcRenderer.invoke('extensions:getAll'),
  addExtension: () => ipcRenderer.invoke('extensions:add'),
  addExtensionFromPath: (extPath: string, name: string, enabled: boolean) => ipcRenderer.invoke('extensions:addFromPath', extPath, name, enabled),
  updateExtension: (id: string, payload: any) => ipcRenderer.invoke('extensions:update', id, payload),
  deleteExtension: (id: string) => ipcRenderer.invoke('extensions:delete', id),
  getGlobalExtensions: () => ipcRenderer.invoke('extensions:getGlobal'),
  // Chrome import
  listChromeProfiles: () => ipcRenderer.invoke('chrome:listProfiles'),
  importChromeCookies: (chromeProfilePath: string, domain?: string) => ipcRenderer.invoke('chrome:importCookies', chromeProfilePath, domain),
  detectChromeExtensions: () => ipcRenderer.invoke('chrome:detectExtensions'),
  // Warmup
  warmupProfile: (id: string, siteCount?: number) => ipcRenderer.invoke('profile:warmup', id, siteCount),
  // Events
  onProxyHealth: (cb: (results: any[]) => void) => {
    ipcRenderer.on('proxy:healthUpdate', (_e, r) => cb(r))
    return () => { ipcRenderer.removeAllListeners('proxy:healthUpdate') }
  },
  onResourceUpdate: (cb: (results: any[]) => void) => {
    ipcRenderer.on('profile:resourceUpdate', (_e, r) => cb(r))
    return () => { ipcRenderer.removeAllListeners('profile:resourceUpdate') }
  },
}

contextBridge.exposeInMainWorld('electronAPI', api)
