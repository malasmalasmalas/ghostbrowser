import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { Profile, CreateProfilePayload, SavedProxy, ExtensionInfo } from '@shared/types'
import { generateRandomFingerprint } from './randomizer'

interface DbSchema {
  profiles: Profile[]
  proxies: SavedProxy[]
  extensions: ExtensionInfo[]
}

let dbPath = ''
let data: DbSchema = { profiles: [], proxies: [], extensions: [] }

export function initDatabase(): void {
  dbPath = path.join(app.getPath('userData'), 'profiles.json')
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf-8')
      data = JSON.parse(raw)
      if (!data.proxies) data.proxies = []
      if (!data.extensions) data.extensions = []
      migrateProfiles()
    } catch {
      data = { profiles: [], proxies: [], extensions: [] }
      saveDb()
    }
  } else {
    data = { profiles: [], proxies: [], extensions: [] }
    saveDb()
  }
}

function migrateProfiles(): void {
  let changed = false
  for (const profile of data.profiles) {
    if (!profile.fingerprint) {
      profile.fingerprint = generateRandomFingerprint()
      changed = true
    }
  }
  if (changed) saveDb()
}

function saveDb(): void {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
}

export function getAllProfiles(): Profile[] {
  return [...data.profiles].sort((a, b) => b.createdAt - a.createdAt)
}

export function createProfileRecord(profile: Profile): void {
  data.profiles.push(profile)
  saveDb()
}

export function updateProfileRecord(id: string, payload: Partial<CreateProfilePayload> & { fingerprint?: import('@shared/types').Fingerprint; lastUsedAt?: number }): void {
  const idx = data.profiles.findIndex(p => p.id === id)
  if (idx === -1) return
  const existing = data.profiles[idx]
  data.profiles[idx] = {
    ...existing,
    ...payload,
    proxy: payload.proxy ? { ...existing.proxy, ...payload.proxy } : existing.proxy,
    fingerprint: payload.fingerprint || existing.fingerprint,
    id: existing.id,
    createdAt: existing.createdAt
  } as Profile
  saveDb()
}

export function deleteProfileRecord(id: string): void {
  data.profiles = data.profiles.filter(p => p.id !== id)
  saveDb()
}

export function getProfileById(id: string): Profile | null {
  return data.profiles.find(p => p.id === id) || null
}

// Proxy CRUD
export function getAllProxies(): SavedProxy[] {
  return [...data.proxies].sort((a, b) => b.createdAt - a.createdAt)
}

export function createProxyRecord(proxy: SavedProxy): void {
  data.proxies.push(proxy)
  saveDb()
}

export function updateProxyRecord(id: string, payload: Partial<Omit<SavedProxy, 'id' | 'createdAt'>>): void {
  const idx = data.proxies.findIndex(p => p.id === id)
  if (idx === -1) return
  data.proxies[idx] = { ...data.proxies[idx], ...payload }
  saveDb()
}

export function deleteProxyRecord(id: string): void {
  data.proxies = data.proxies.filter(p => p.id !== id)
  saveDb()
}

export function getProxyById(id: string): SavedProxy | null {
  return data.proxies.find(p => p.id === id) || null
}

export function getAllExtensions(): ExtensionInfo[] {
  return [...data.extensions]
}

export function getGlobalExtensions(): ExtensionInfo[] {
  return data.extensions.filter(e => e.global && e.enabled)
}

export function createExtensionRecord(ext: ExtensionInfo): void {
  data.extensions.push(ext)
  saveDb()
}

export function updateExtensionRecord(id: string, payload: Partial<Omit<ExtensionInfo, 'id'>>): void {
  const idx = data.extensions.findIndex(e => e.id === id)
  if (idx === -1) return
  data.extensions[idx] = { ...data.extensions[idx], ...payload }
  saveDb()
}

export function deleteExtensionRecord(id: string): void {
  data.extensions = data.extensions.filter(e => e.id !== id)
  saveDb()
}
