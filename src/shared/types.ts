export interface ExtensionInfo {
  id: string
  name: string
  path: string
  enabled: boolean
  global: boolean
}

export interface ProxyConfig {
  type: 'none' | 'http' | 'socks5'
  host?: string
  port?: number
  username?: string
  password?: string
}

export interface SavedProxy {
  id: string
  label: string
  type: 'http' | 'socks5'
  host: string
  port: number
  username?: string
  password?: string
  createdAt: number
}

export interface Fingerprint {
  userAgent: string
  viewport: { width: number; height: number }
  timezone: string
  locale: string
  platform: string
  hardwareConcurrency: number
  deviceMemory: number
  webglVendor: string
  webglRenderer: string
  screenDepth: number
  fonts: string[]
  deviceScaleFactor: number
  isMobile: boolean
}

export interface Profile {
  id: string
  name: string
  color: string
  proxy: ProxyConfig
  startUrl?: string
  fingerprint: Fingerprint
  notes?: string
  group?: string
  autoRotateUA?: boolean
  proxyPool?: string[]
  proxyPoolIndex?: number
  proxyRotateInterval?: number // minutes, 0 = disabled
  extensions?: string[]
  createdAt: number
  lastUsedAt?: number
}

export interface CreateProfilePayload {
  name: string
  color: string
  proxy: ProxyConfig
  startUrl?: string
  notes?: string
  group?: string
  autoRotateUA?: boolean
  proxyPool?: string[]
  proxyRotateInterval?: number
  extensions?: string[]
}

export interface SyncAction {
  type: 'navigate' | 'click' | 'type' | 'scroll'
  url?: string
  selector?: string
  text?: string
  x?: number
  y?: number
  deltaY?: number
}
