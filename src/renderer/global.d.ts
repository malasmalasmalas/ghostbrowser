import { Profile, CreateProfilePayload, ProxyConfig, Fingerprint, SavedProxy, ExtensionInfo } from '../shared/types'

interface ElectronAPI {
  getProfiles: () => Promise<Profile[]>
  createProfile: (payload: CreateProfilePayload) => Promise<Profile>
  updateProfile: (id: string, payload: Partial<CreateProfilePayload>) => Promise<Profile>
  deleteProfile: (id: string) => Promise<void>
  cloneProfile: (id: string) => Promise<Profile>
  launchProfile: (id: string) => Promise<void>
  multiLaunch: (ids: string[]) => Promise<void>
  getCookies: (id: string) => Promise<any[]>
  getFingerprint: (id: string) => Promise<Fingerprint | null>
  isRunning: (id: string) => Promise<boolean>
  getRunningIds: () => Promise<string[]>
  regenerateFingerprint: (id: string) => Promise<Fingerprint>
  testProxy: (proxy: ProxyConfig) => Promise<{ ok: boolean; message: string; latency?: number }>
  syncSetEnabled: (id: string, enabled: boolean) => Promise<void>
  syncIsEnabled: (id: string) => Promise<boolean>
  syncGetEnabledIds: () => Promise<string[]>
  syncNavigate: (url: string) => Promise<void>
  syncClick: (relX: number, relY: number) => Promise<void>
  syncClickAbsolute: (x: number, y: number) => Promise<void>
  syncMouseMove: (relX: number, relY: number) => Promise<void>
  syncType: (text: string) => Promise<void>
  syncScroll: (deltaY: number) => Promise<void>
  syncScrollTo: (scrollX: number, scrollY: number) => Promise<void>
  syncSetMaster: (id: string | null) => Promise<void>
  syncGetMaster: () => Promise<string | null>
  syncPollMaster: () => Promise<any[]>
  syncReplayEvents: (events: any[]) => Promise<void>
  syncMirrorToggle: (active: boolean) => Promise<void>
  // Proxy Manager
  getProxies: () => Promise<SavedProxy[]>
  createProxy: (payload: Omit<SavedProxy, 'id' | 'createdAt'>) => Promise<SavedProxy>
  updateProxy: (id: string, payload: Partial<Omit<SavedProxy, 'id' | 'createdAt'>>) => Promise<void>
  deleteProxy: (id: string) => Promise<void>
  // Import/Export
  exportProfiles: (ids: string[]) => Promise<boolean>
  importProfiles: () => Promise<number>
  // Close browser
  closeBrowser: (id: string) => Promise<void>
  closeAllBrowsers: () => Promise<void>
  // Bulk create
  bulkCreate: (lines: string[], namePrefix: string) => Promise<{ count: number; results: { line: string; ok: boolean; message?: string }[] }>
  // Sync
  syncEnableAll: () => Promise<string[]>
  // Cookie import
  importCookies: (id: string, cookiesJson: string) => Promise<{ ok: boolean; message: string }>
  // Screenshot
  getScreenshot: (id: string) => Promise<string | null>
  // Extensions
  getExtensions: () => Promise<ExtensionInfo[]>
  addExtension: () => Promise<ExtensionInfo | null>
  updateExtension: (id: string, payload: Partial<Omit<ExtensionInfo, 'id'>>) => Promise<void>
  deleteExtension: (id: string) => Promise<void>
  getGlobalExtensions: () => Promise<ExtensionInfo[]>
  // Chrome import
  listChromeProfiles: () => Promise<{ name: string; path: string }[]>
  importChromeCookies: (chromeProfilePath: string, domain?: string) => Promise<{ ok: boolean; message: string; cookies?: any[] }>
  detectChromeExtensions: () => Promise<{ id: string; name: string; version: string; path: string; enabled: boolean; description: string }[]>
  addExtensionFromPath: (extPath: string, name: string, enabled: boolean) => Promise<ExtensionInfo | null>
  // Warmup
  warmupProfile: (id: string, siteCount?: number) => Promise<void>
  // Events
  onProxyHealth: (cb: (results: { id: string; label: string; ok: boolean; latency?: number }[]) => void) => () => void
  onResourceUpdate: (cb: (results: { id: string; cpu: number; memory: number }[]) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
