import path from 'path'
import fs from 'fs'
import os from 'os'
import { execSync } from 'child_process'
import Database from 'better-sqlite3'

interface ChromeProfile {
  name: string
  path: string
}

interface ChromeCookie {
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: string
  expires: number
}

interface DetectedExtension {
  id: string
  name: string
  version: string
  path: string
  enabled: boolean
  description: string
}

/**
 * Get Chrome User Data directory based on platform
 */
function getChromeUserDataDir(): string {
  const platform = os.platform()
  if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data')
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome')
  }
  return path.join(os.homedir(), '.config', 'google-chrome')
}

/**
 * List available Chrome profiles
 */
export function listChromeProfiles(): ChromeProfile[] {
  const userDataDir = getChromeUserDataDir()
  if (!fs.existsSync(userDataDir)) return []

  const profiles: ChromeProfile[] = []

  // Default profile
  const defaultCookies = path.join(userDataDir, 'Default', 'Cookies')
  const defaultNetwork = path.join(userDataDir, 'Default', 'Network', 'Cookies')
  if (fs.existsSync(defaultCookies) || fs.existsSync(defaultNetwork)) {
    profiles.push({ name: 'Default', path: path.join(userDataDir, 'Default') })
  }

  // Numbered profiles (Profile 1, Profile 2, etc.)
  try {
    const entries = fs.readdirSync(userDataDir)
    for (const entry of entries) {
      if (entry.startsWith('Profile ')) {
        const profilePath = path.join(userDataDir, entry)
        const cookiesPath = path.join(profilePath, 'Cookies')
        const networkCookies = path.join(profilePath, 'Network', 'Cookies')
        if (fs.existsSync(cookiesPath) || fs.existsSync(networkCookies)) {
          // Try to get display name from Preferences
          let displayName = entry
          try {
            const prefs = JSON.parse(fs.readFileSync(path.join(profilePath, 'Preferences'), 'utf-8'))
            if (prefs.profile?.name) displayName = prefs.profile.name
          } catch {}
          profiles.push({ name: displayName, path: profilePath })
        }
      }
    }
  } catch {}

  return profiles
}

/**
 * Get Chrome encryption key (Windows DPAPI)
 */
function getChromeEncryptionKey(): Buffer | null {
  const platform = os.platform()
  if (platform !== 'win32') return null

  const localStatePath = path.join(getChromeUserDataDir(), 'Local State')
  if (!fs.existsSync(localStatePath)) return null

  try {
    const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf-8'))
    const encryptedKeyB64 = localState.os_crypt?.encrypted_key
    if (!encryptedKeyB64) return null

    // Key is base64 encoded, prefixed with "DPAPI"
    const encryptedKey = Buffer.from(encryptedKeyB64, 'base64')
    // Remove "DPAPI" prefix (5 bytes)
    const keyWithoutPrefix = encryptedKey.subarray(5)

    // Decrypt using DPAPI via PowerShell
    const b64Input = keyWithoutPrefix.toString('base64')
    const psScript = `
      Add-Type -AssemblyName System.Security
      $encrypted = [Convert]::FromBase64String('${b64Input}')
      $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect($encrypted, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
      [Convert]::ToBase64String($decrypted)
    `
    const result = execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, {
      encoding: 'utf-8',
      windowsHide: true
    }).trim()

    return Buffer.from(result, 'base64')
  } catch {
    return null
  }
}

/**
 * Decrypt Chrome cookie value (AES-256-GCM with v10/v20 prefix on Windows)
 */
function decryptCookieValue(encryptedValue: Buffer, key: Buffer | null): string {
  if (!encryptedValue || encryptedValue.length === 0) return ''

  // Check for v10/v20 prefix (Chrome 80+)
  const prefix = encryptedValue.subarray(0, 3).toString('utf-8')
  if ((prefix === 'v10' || prefix === 'v20') && key) {
    try {
      const crypto = require('crypto')
      const nonce = encryptedValue.subarray(3, 3 + 12)
      const ciphertext = encryptedValue.subarray(3 + 12, encryptedValue.length - 16)
      const tag = encryptedValue.subarray(encryptedValue.length - 16)

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)
      decipher.setAuthTag(tag)
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
      return decrypted.toString('utf-8')
    } catch {
      return ''
    }
  }

  // Legacy DPAPI encryption (pre Chrome 80)
  if (os.platform() === 'win32') {
    try {
      const b64Input = encryptedValue.toString('base64')
      const psScript = `
        Add-Type -AssemblyName System.Security
        $encrypted = [Convert]::FromBase64String('${b64Input}')
        $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect($encrypted, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
        [System.Text.Encoding]::UTF8.GetString($decrypted)
      `
      return execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, {
        encoding: 'utf-8',
        windowsHide: true
      }).trim()
    } catch {
      return ''
    }
  }

  return ''
}

/**
 * Import cookies from a Chrome profile
 * @param chromeProfilePath - Path to Chrome profile directory
 * @param domain - Optional domain filter (e.g. ".facebook.com")
 */
export function importChromeProfileCookies(chromeProfilePath: string, domain?: string): { ok: boolean; cookies: ChromeCookie[]; message: string } {
  // Find cookies database
  let cookiesDbPath = path.join(chromeProfilePath, 'Network', 'Cookies')
  if (!fs.existsSync(cookiesDbPath)) {
    cookiesDbPath = path.join(chromeProfilePath, 'Cookies')
  }
  if (!fs.existsSync(cookiesDbPath)) {
    return { ok: false, cookies: [], message: 'Cookies database not found' }
  }

  // Copy database to temp to avoid lock issues (Chrome locks the file)
  const tempDir = os.tmpdir()
  const tempDb = path.join(tempDir, `ghost_chrome_cookies_${Date.now()}.db`)

  try {
    fs.copyFileSync(cookiesDbPath, tempDb)
  } catch (e: any) {
    return { ok: false, cookies: [], message: `Cannot copy cookies DB: ${e.message}. Close Chrome first.` }
  }

  // Get encryption key
  const encKey = getChromeEncryptionKey()

  try {
    const db = new Database(tempDb, { readonly: true })
    let query = 'SELECT name, encrypted_value, host_key, path, is_secure, is_httponly, samesite, expires_utc FROM cookies'
    const params: string[] = []

    if (domain) {
      query += ' WHERE host_key LIKE ?'
      params.push(`%${domain}%`)
    }

    const rows = db.prepare(query).all(...params) as any[]
    const cookies: ChromeCookie[] = []

    for (const row of rows) {
      const decryptedValue = decryptCookieValue(row.encrypted_value, encKey)
      if (!decryptedValue) continue

      // Chrome stores expires_utc as microseconds since 1601-01-01
      // Convert to Unix timestamp (seconds since 1970-01-01)
      const chromeEpochOffset = 11644473600
      const expiresUnix = row.expires_utc > 0
        ? Math.floor(row.expires_utc / 1000000) - chromeEpochOffset
        : 0

      cookies.push({
        name: row.name,
        value: decryptedValue,
        domain: row.host_key,
        path: row.path,
        secure: row.is_secure === 1,
        httpOnly: row.is_httponly === 1,
        sameSite: row.samesite === 0 ? 'None' : row.samesite === 1 ? 'Lax' : 'Strict',
        expires: expiresUnix
      })
    }

    db.close()
    // Cleanup temp file
    try { fs.unlinkSync(tempDb) } catch {}

    return { ok: true, cookies, message: `Found ${cookies.length} cookies` }
  } catch (e: any) {
    try { fs.unlinkSync(tempDb) } catch {}
    return { ok: false, cookies: [], message: `Database error: ${e.message}` }
  }
}

/**
 * Detect installed Chrome extensions from system Chrome
 * Scans Default profile extensions directory
 */
export function detectChromeExtensions(): DetectedExtension[] {
  const userDataDir = getChromeUserDataDir()
  const extensions: DetectedExtension[] = []

  // Chrome stores extensions in User Data/Default/Extensions/
  const profileDirs = ['Default']
  // Also check numbered profiles
  try {
    const entries = fs.readdirSync(userDataDir)
    for (const entry of entries) {
      if (entry.startsWith('Profile ')) profileDirs.push(entry)
    }
  } catch {}

  // Use first profile that has extensions
  for (const profileDir of profileDirs) {
    const extDir = path.join(userDataDir, profileDir, 'Extensions')
    if (!fs.existsSync(extDir)) continue

    try {
      const extIds = fs.readdirSync(extDir)
      for (const extId of extIds) {
        const extIdPath = path.join(extDir, extId)
        if (!fs.statSync(extIdPath).isDirectory()) continue

        // Each extension has version folders
        try {
          const versions = fs.readdirSync(extIdPath).filter(v => {
            return fs.statSync(path.join(extIdPath, v)).isDirectory()
          })
          if (versions.length === 0) continue

          // Use latest version (last alphabetically)
          const latestVersion = versions.sort().pop()!
          const extPath = path.join(extIdPath, latestVersion)
          const manifestPath = path.join(extPath, 'manifest.json')

          if (!fs.existsSync(manifestPath)) continue

          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
            const name = manifest.name || extId
            // Skip Chrome internal extensions
            if (name.startsWith('__MSG_') || name === 'Chrome Web Store Payments' || name === 'CryptoTokenExtension') continue

            extensions.push({
              id: extId,
              name: name.startsWith('__MSG_') ? extId : name,
              version: manifest.version || latestVersion,
              path: extPath,
              enabled: true,
              description: manifest.description || ''
            })
          } catch {}
        } catch {}
      }
    } catch {}

    // Only scan first profile with extensions
    if (extensions.length > 0) break
  }

  // Also check Preferences to see which are actually enabled
  try {
    const prefsPath = path.join(userDataDir, 'Default', 'Preferences')
    if (fs.existsSync(prefsPath)) {
      const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf-8'))
      const extSettings = prefs.extensions?.settings || {}
      for (const ext of extensions) {
        if (extSettings[ext.id]) {
          const setting = extSettings[ext.id]
          ext.enabled = setting.state !== 0 && !setting.disable_reasons
          if (setting.manifest?.name && !setting.manifest.name.startsWith('__MSG_')) {
            ext.name = setting.manifest.name
          }
        }
      }
    }
  } catch {}

  return extensions
}
