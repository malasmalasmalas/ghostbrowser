import net from 'net'
import http from 'http'
import { getAllProxies } from './db'
import { BrowserWindow } from 'electron'

/**
 * Lookup timezone for a proxy IP using ip-api.com (free, no key)
 */
export async function lookupProxyTimezone(host: string): Promise<{ timezone?: string; locale?: string; country?: string } | null> {
  return new Promise((resolve) => {
    const req = http.get(`http://ip-api.com/json/${host}?fields=timezone,countryCode,country`, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.timezone) {
            const localeMap: Record<string, string> = {
              US: 'en-US', GB: 'en-GB', CA: 'en-CA', AU: 'en-AU',
              DE: 'de-DE', FR: 'fr-FR', ES: 'es-ES', IT: 'it-IT',
              JP: 'ja-JP', KR: 'ko-KR', CN: 'zh-CN', TW: 'zh-TW',
              BR: 'pt-BR', PT: 'pt-PT', RU: 'ru-RU', IN: 'hi-IN',
              ID: 'id-ID', TH: 'th-TH', VN: 'vi-VN', TR: 'tr-TR',
              NL: 'nl-NL', PL: 'pl-PL', SE: 'sv-SE', NO: 'nb-NO',
              DK: 'da-DK', FI: 'fi-FI', CZ: 'cs-CZ', HU: 'hu-HU',
              RO: 'ro-RO', UA: 'uk-UA', AR: 'es-AR', MX: 'es-MX',
              CL: 'es-CL', CO: 'es-CO', PH: 'en-PH', SG: 'en-SG',
              MY: 'ms-MY', SA: 'ar-SA', AE: 'ar-AE', EG: 'ar-EG',
            }
            resolve({
              timezone: json.timezone,
              locale: localeMap[json.countryCode] || 'en-US',
              country: json.countryCode
            })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(5000, () => { req.destroy(); resolve(null) })
  })
}

export async function testProxyConnection(proxy: { type: string; host?: string; port?: number }): Promise<{ ok: boolean; message: string; latency?: number }> {
  const host = proxy.host || '127.0.0.1'
  const port = proxy.port || 1080

  return new Promise((resolve) => {
    const start = Date.now()
    const socket = new net.Socket()
    socket.setTimeout(5000)

    socket.on('connect', () => {
      const latency = Date.now() - start
      socket.destroy()
      resolve({ ok: true, message: `Connected (${latency}ms)`, latency })
    })

    socket.on('timeout', () => {
      socket.destroy()
      resolve({ ok: false, message: 'Connection timeout (5s)' })
    })

    socket.on('error', (err) => {
      socket.destroy()
      resolve({ ok: false, message: `Failed: ${err.message}` })
    })

    socket.connect(port, host)
  })
}

let healthInterval: ReturnType<typeof setInterval> | null = null

export function startProxyHealthMonitor(intervalMs = 300000): void {
  if (healthInterval) clearInterval(healthInterval)
  healthInterval = setInterval(async () => {
    const proxies = getAllProxies()
    const results: { id: string; label: string; ok: boolean; latency?: number }[] = []
    for (const px of proxies) {
      const r = await testProxyConnection({ type: px.type, host: px.host, port: px.port })
      results.push({ id: px.id, label: px.label, ok: r.ok, latency: r.latency })
    }
    const wins = BrowserWindow.getAllWindows()
    for (const win of wins) {
      win.webContents.send('proxy:healthUpdate', results)
    }
  }, intervalMs)
}

export function stopProxyHealthMonitor(): void {
  if (healthInterval) { clearInterval(healthInterval); healthInterval = null }
}
