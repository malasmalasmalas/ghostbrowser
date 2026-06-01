import path from 'path'
import fs from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { app, screen } from 'electron'
import { Profile, Fingerprint } from '@shared/types'
import { getGlobalExtensions, getAllExtensions, getProxyById, getProfileById, updateProfileRecord } from './db'

const activeBrowsers = new Map<string, { process: ChildProcess; fingerprint: Fingerprint }>()
const proxyRotationTimers = new Map<string, ReturnType<typeof setInterval>>()
let masterProfileId: string | null = null
let mirrorInterval: ReturnType<typeof setInterval> | null = null

export function logToFile(msg: string): void {
  try {
    const logPath = path.join(app.getPath('userData'), 'debug.log')
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${msg}\n`)
  } catch {}
}

logToFile('windowManager module loaded')

function getStealthExtensionPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'stealth-extension')
  }
  return path.join(app.getAppPath(), 'src', 'main', 'stealth-extension')
}

function generateProfileExtensions(fp: Fingerprint, profileId: string, proxy?: { type: string; host: string; port: number; username?: string; password?: string }): string {
  const extDir = path.join(app.getPath('userData'), 'stealth-ext', profileId)
  if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true })

  const hasProxyAuth = proxy && proxy.username && proxy.password

  const manifest: any = {
    manifest_version: 2,
    name: 'Browser Helper',
    version: '1.0.0',
    description: 'Browser enhancement utility',
    content_scripts: [{
      matches: ['<all_urls>'],
      js: ['stealth.js', 'fingerprint.js'],
      run_at: 'document_start',
      all_frames: true
    }],
    permissions: ['<all_urls>']
  }

  if (hasProxyAuth) {
    manifest.permissions.push('webRequest', 'webRequestBlocking')
    manifest.background = { scripts: ['proxy-auth.js'], persistent: true }
  }

  fs.writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const baseStealth = path.join(getStealthExtensionPath(), 'stealth.js')
  if (fs.existsSync(baseStealth)) {
    fs.copyFileSync(baseStealth, path.join(extDir, 'stealth.js'))
  }

  if (hasProxyAuth) {
    const proxyAuthScript = `chrome.webRequest.onAuthRequired.addListener(function(details){return{authCredentials:{username:${JSON.stringify(proxy!.username)},password:${JSON.stringify(proxy!.password)}}};},{urls:["<all_urls>"]},["blocking"]);`
    fs.writeFileSync(path.join(extDir, 'proxy-auth.js'), proxyAuthScript)
  }

  const fpScript = `(function(){
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => ${fp.hardwareConcurrency} });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => ${fp.deviceMemory} });
    Object.defineProperty(navigator, 'platform', { get: () => ${JSON.stringify(fp.platform)} });
    Object.defineProperty(navigator, 'languages', { get: () => Object.freeze([${JSON.stringify(fp.locale)}, 'en']) });
    Object.defineProperty(navigator, 'language', { get: () => ${JSON.stringify(fp.locale)} });
    Object.defineProperty(navigator, 'maxTouchPoints', { get: () => ${fp.isMobile ? 5 : 0} });
    Object.defineProperty(screen, 'colorDepth', { get: () => ${fp.screenDepth} });
    Object.defineProperty(screen, 'pixelDepth', { get: () => ${fp.screenDepth} });
    Object.defineProperty(screen, 'width', { get: () => ${fp.viewport.width} });
    Object.defineProperty(screen, 'height', { get: () => ${fp.viewport.height} });
    Object.defineProperty(screen, 'availWidth', { get: () => ${fp.viewport.width} });
    Object.defineProperty(screen, 'availHeight', { get: () => ${fp.viewport.height - 40} });
    Object.defineProperty(window, 'outerWidth', { get: () => ${fp.viewport.width} });
    Object.defineProperty(window, 'outerHeight', { get: () => ${fp.viewport.height + 80} });
    Object.defineProperty(window, 'devicePixelRatio', { get: () => ${fp.deviceScaleFactor} });
    Object.defineProperty(navigator, 'appVersion', { get: () => ${JSON.stringify(fp.userAgent.replace('Mozilla/', ''))} });
    Object.defineProperty(navigator, 'userAgent', { get: () => ${JSON.stringify(fp.userAgent)} });

    // WebGL
    (function(){
      var origGetParam = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(p) {
        if (p === 37445) return ${JSON.stringify(fp.webglVendor)};
        if (p === 37446) return ${JSON.stringify(fp.webglRenderer)};
        return origGetParam.call(this, p);
      };
      if (typeof WebGL2RenderingContext !== 'undefined') {
        var orig2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(p) {
          if (p === 37445) return ${JSON.stringify(fp.webglVendor)};
          if (p === 37446) return ${JSON.stringify(fp.webglRenderer)};
          return orig2.call(this, p);
        };
      }
      var origGetExt = WebGLRenderingContext.prototype.getExtension;
      WebGLRenderingContext.prototype.getExtension = function(name) {
        if (name === 'WEBGL_debug_renderer_info') return null;
        return origGetExt.call(this, name);
      };
    })();

    // Canvas noise
    (function(){
      var origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function() {
        var ctx = this.getContext('2d');
        if (ctx && this.width > 0 && this.height > 0) {
          try {
            var imageData = ctx.getImageData(0, 0, Math.min(this.width, 16), Math.min(this.height, 16));
            var noise = ${(fp.hardwareConcurrency * 7 + fp.deviceMemory * 3) % 10};
            for (var i = 0; i < imageData.data.length; i += 4) {
              imageData.data[i] = (imageData.data[i] + noise) % 256;
            }
            ctx.putImageData(imageData, 0, 0);
          } catch(e) {}
        }
        return origToDataURL.apply(this, arguments);
      };
    })();

    // AudioContext noise
    (function(){
      var seed = ${fp.hardwareConcurrency * 13 + fp.deviceMemory * 7};
      var origGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function(ch) {
        var data = origGetChannelData.call(this, ch);
        if (this.numberOfChannels === 1 && this.length < 1000) {
          for (var i = 0; i < data.length; i++) {
            data[i] = data[i] + (((seed + i) % 100) / 10000000);
          }
        }
        return data;
      };
    })();

    // ClientRects noise
    (function(){
      var noise = ${(fp.hardwareConcurrency * 3 + fp.deviceMemory * 7) % 10} * 0.00001;
      var origRect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function() {
        var r = origRect.call(this);
        return new DOMRect(r.x + noise, r.y + noise, r.width + noise, r.height + noise);
      };
    })();

    // Font spoofing
    (function(){
      var fakeFonts = ${JSON.stringify(fp.fonts)};
      var origMeasure = CanvasRenderingContext2D.prototype.measureText;
      var baseFonts = ['monospace', 'sans-serif', 'serif'];
      CanvasRenderingContext2D.prototype.measureText = function(text) {
        var result = origMeasure.call(this, text);
        var font = this.font || '';
        var isFontTest = text.length > 5 && baseFonts.some(function(b){ return font.includes(b); });
        if (isFontTest) {
          var fontName = font.replace(/[0-9px\\s]/g, '').split(',')[0];
          if (fontName && !fakeFonts.includes(fontName) && !baseFonts.includes(fontName)) {
            Object.defineProperty(result, 'width', { value: result.width + (${fp.hardwareConcurrency % 3} - 1) * 0.1 });
          }
        }
        return result;
      };
    })();

    // WebRTC leak protection
    (function(){
      var origRTC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
      if (!origRTC) return;
      var newRTC = function(config, constraints) {
        if (config && config.iceServers) {
          config.iceServers = config.iceServers.filter(function(s) {
            var urls = Array.isArray(s.urls) ? s.urls : [s.urls || s.url];
            return urls.some(function(u) { return u && !u.startsWith('stun:'); });
          });
        }
        return new origRTC(config, constraints);
      };
      newRTC.prototype = origRTC.prototype;
      Object.keys(origRTC).forEach(function(k) { try { newRTC[k] = origRTC[k]; } catch(e){} });
      newRTC.generateCertificate = origRTC.generateCertificate;
      window.RTCPeerConnection = newRTC;
      if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = newRTC;
    })();

    // Speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices = function() {
        return [
          {name:'Microsoft David - English (United States)',lang:'en-US',localService:true,default:true,voiceURI:'Microsoft David - English (United States)'},
          {name:'Microsoft Zira - English (United States)',lang:'en-US',localService:true,default:false,voiceURI:'Microsoft Zira - English (United States)'},
          {name:'Google US English',lang:'en-US',localService:false,default:false,voiceURI:'Google US English'}
        ];
      };
    }
  })();`
  fs.writeFileSync(path.join(extDir, 'fingerprint.js'), fpScript)

  return extDir
}

function startProxyRotation(profile: Profile): void {
  stopProxyRotation(profile.id)
  const intervalMs = (profile.proxyRotateInterval || 5) * 60 * 1000
  logToFile(`Proxy rotation started for ${profile.name}: every ${profile.proxyRotateInterval} min`)

  const timer = setInterval(async () => {
    try {
      const currentProfile = getProfileById(profile.id)
      if (!currentProfile || !currentProfile.proxyPool || currentProfile.proxyPool.length < 2) {
        stopProxyRotation(profile.id)
        return
      }
      const entry = activeBrowsers.get(profile.id)
      if (!entry) {
        stopProxyRotation(profile.id)
        return
      }

      const idx = ((currentProfile.proxyPoolIndex || 0) + 1) % currentProfile.proxyPool.length
      const nextProxyRecord = getProxyById(currentProfile.proxyPool[idx])
      if (!nextProxyRecord) {
        logToFile(`Proxy rotation: proxy not found at index ${idx}`)
        return
      }

      const newProxy = { type: nextProxyRecord.type as 'http' | 'socks5', host: nextProxyRecord.host, port: nextProxyRecord.port, username: nextProxyRecord.username, password: nextProxyRecord.password }
      updateProfileRecord(profile.id, { proxy: newProxy, proxyPoolIndex: idx + 1 } as any)

      logToFile(`Proxy rotation for ${currentProfile.name}: switching to ${nextProxyRecord.label} (${nextProxyRecord.host}:${nextProxyRecord.port})`)

      clearInterval(timer)
      proxyRotationTimers.delete(profile.id)

      try { entry.process.kill() } catch {}
      activeBrowsers.delete(profile.id)

      const updatedProfile = getProfileById(profile.id)
      if (updatedProfile) {
        await new Promise(r => setTimeout(r, 1500))
        await launchProfileBrowser(updatedProfile)
      }
    } catch (e: any) {
      logToFile(`Proxy rotation error for ${profile.name}: ${e?.message}`)
    }
  }, intervalMs)

  proxyRotationTimers.set(profile.id, timer)
}

function stopProxyRotation(profileId: string): void {
  const timer = proxyRotationTimers.get(profileId)
  if (timer) {
    clearInterval(timer)
    proxyRotationTimers.delete(profileId)
    logToFile(`Proxy rotation stopped for ${profileId}`)
  }
}

export { startProxyRotation, stopProxyRotation }

function getChromePath(): string {
  const platform = process.platform
  const isPackaged = app.isPackaged

  const candidates: string[] = []

  if (platform === 'win32') {
    candidates.push(path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'))
    candidates.push(path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'))
    candidates.push(path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'))
    candidates.push(path.join(process.env.LOCALAPPDATA || '', 'Chromium', 'Application', 'chrome.exe'))
    candidates.push(path.join(process.env.PROGRAMFILES || '', 'Chromium', 'Application', 'chrome.exe'))
    if (isPackaged) {
      candidates.push(path.join(process.resourcesPath, 'chrome-win64', 'chrome.exe'))
    } else {
      candidates.push(path.join(app.getAppPath(), 'resources', 'chrome-win64', 'chrome.exe'))
    }
  } else if (platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    candidates.push(path.join(process.env.HOME || '', 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'))
    candidates.push('/Applications/Chromium.app/Contents/MacOS/Chromium')
  } else {
    candidates.push('/usr/bin/google-chrome')
    candidates.push('/usr/bin/google-chrome-stable')
    candidates.push('/usr/bin/chromium')
    candidates.push('/usr/bin/chromium-browser')
    candidates.push('/snap/bin/chromium')
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      logToFile(`Browser found: ${candidate}`)
      return candidate
    }
  }

  const fallback = candidates[0]
  logToFile(`No browser found, fallback: ${fallback}`)
  return fallback
}

function getUserDataDir(profileId: string): string {
  return path.join(app.getPath('userData'), 'profiles', profileId)
}

function getScreenshotDir(): string {
  const dir = path.join(app.getPath('userData'), 'screenshots')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getScreenshotPath(profileId: string): string | null {
  const p = path.join(getScreenshotDir(), `${profileId}.png`)
  return fs.existsSync(p) ? p : null
}

export async function launchProfileBrowser(profile: Profile): Promise<void> {
  logToFile(`Launch requested for: ${profile.name}`)

  const existing = activeBrowsers.get(profile.id)
  if (existing) {
    logToFile(`Profile ${profile.name} already running`)
    return
  }

  const fp = profile.fingerprint
  const userDataDir = getUserDataDir(profile.id)
  const executablePath = getChromePath()

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Chromium not found at: ${executablePath}. Install Ungoogled Chromium or place it in resources/chromium.`)
  }

  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true })

  logToFile(`Native launching: ${executablePath}, userDataDir: ${userDataDir}`)

  const proxy = (profile.proxy && profile.proxy.type !== 'none' && profile.proxy.host && profile.proxy.port)
    ? profile.proxy : undefined

  const stealthExtPath = generateProfileExtensions(fp, profile.id, proxy as any)

  const globalExts = getGlobalExtensions()
  const profileExtIds = profile.extensions || []
  const allExts = getAllExtensions()
  const profileExts = allExts.filter(e => profileExtIds.includes(e.id) && e.enabled)
  const extPaths = [...globalExts, ...profileExts]
    .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
    .map(e => e.path)
    .filter(p => fs.existsSync(p))
  extPaths.push(stealthExtPath)

  const launchArgs = [
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=TranslateUI,AutomationControlled,OptimizationHints,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater',
    '--no-pings',
    '--disable-infobars',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-ipc-flooding-protection',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-domain-reliability',
    '--disable-component-update',
    '--disable-breakpad',
    '--metrics-recording-only',
    '--no-service-autorun',
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-webrtc-hw-encoding',
    '--disable-webrtc-hw-decoding',
    '--enforce-webrtc-ip-permission-check',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--disable-site-isolation-trials',
    `--window-size=${fp.viewport.width},${fp.viewport.height}`,
    `--lang=${fp.locale}`,
    `--load-extension=${extPaths.join(',')}`,
    `--disable-extensions-except=${extPaths.join(',')}`,
  ]

  if (proxy) {
    launchArgs.push(`--proxy-server=${proxy.type}://${proxy.host}:${proxy.port}`)
  }

  const startUrl = profile.startUrl || 'https://www.google.com'
  launchArgs.push(startUrl)

  const chromeProcess = spawn(executablePath, launchArgs, {
    detached: true,
    stdio: 'ignore',
  })

  chromeProcess.unref()

  activeBrowsers.set(profile.id, { process: chromeProcess, fingerprint: fp })

  chromeProcess.on('exit', () => {
    stopProxyRotation(profile.id)
    activeBrowsers.delete(profile.id)
    logToFile(`Browser exited for: ${profile.name}`)
  })

  if (profile.proxyRotateInterval && profile.proxyRotateInterval > 0 && profile.proxyPool && profile.proxyPool.length > 1) {
    startProxyRotation(profile)
  }

  logToFile(`Native browser launched for: ${profile.name}`)
}

export function getProfileFingerprint(profileId: string): Fingerprint | null {
  const entry = activeBrowsers.get(profileId)
  return entry?.fingerprint || null
}

export async function getProfileCookies(_profileId: string): Promise<any[]> {
  return []
}

export function isProfileRunning(profileId: string): boolean {
  return activeBrowsers.has(profileId)
}

export function getActiveBrowser(profileId: string): any | null {
  const entry = activeBrowsers.get(profileId)
  return entry?.process || null
}

export function getRunningProfileIds(): string[] {
  return Array.from(activeBrowsers.keys())
}

const syncEnabled = new Set<string>()

export function setSyncEnabled(profileId: string, enabled: boolean): void {
  if (enabled) {
    syncEnabled.add(profileId)
  } else {
    syncEnabled.delete(profileId)
  }
}

export function isSyncEnabled(profileId: string): boolean {
  return syncEnabled.has(profileId)
}

export function getSyncEnabledIds(): string[] {
  return Array.from(syncEnabled).filter(id => activeBrowsers.has(id))
}

export function setMasterProfile(profileId: string | null): void {
  masterProfileId = profileId
}

export function getMasterProfileId(): string | null {
  return masterProfileId
}

export function startMirrorLoop(): void {
  logToFile('Mirror mode not available in native launch mode')
}

export function stopMirrorLoop(): void {
  if (mirrorInterval) {
    clearInterval(mirrorInterval)
    mirrorInterval = null
  }
}

export async function startMirrorMode(_profileId: string): Promise<void> {
  logToFile('Mirror mode not available in native launch mode')
}

export async function pollMasterEvents(): Promise<any[]> {
  return []
}

export async function replayEventsToSynced(_events: any[]): Promise<void> {}

export async function syncNavigate(_url: string): Promise<void> {}

export async function syncClick(_x: number, _y: number): Promise<void> {}

export async function syncClickAbsolute(_x: number, _y: number): Promise<void> {}

export async function syncMouseMove(_relX: number, _relY: number): Promise<void> {}

export async function syncType(_text: string): Promise<void> {}

export async function syncScroll(_deltaY: number): Promise<void> {}

export async function syncScrollTo(_scrollX: number, _scrollY: number): Promise<void> {}

function calculateGrid(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 }
  if (count <= 2) return { cols: 2, rows: 1 }
  if (count <= 4) return { cols: 2, rows: 2 }
  if (count <= 6) return { cols: 3, rows: 2 }
  if (count <= 9) return { cols: 3, rows: 3 }
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  return { cols, rows }
}

export async function multiLaunch(profiles: import('@shared/types').Profile[]): Promise<void> {
  const display = screen.getPrimaryDisplay()
  const { width: screenW, height: screenH } = display.workAreaSize
  const { x: offsetX, y: offsetY } = display.workArea

  const { cols, rows } = calculateGrid(profiles.length)
  const cellW = Math.floor(screenW / cols)
  const cellH = Math.floor(screenH / rows)

  const BATCH_SIZE = 5
  const BATCH_DELAY_MS = 2000

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE)
    await Promise.allSettled(batch.map((p, batchIdx) => {
      const idx = i + batchIdx
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const posX = offsetX + col * cellW
      const posY = offsetY + row * cellH
      return launchProfileBrowserTiled(p, posX, posY, cellW, cellH)
    }))
    if (i + BATCH_SIZE < profiles.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
    }
  }
}

async function launchProfileBrowserTiled(
  profile: Profile,
  posX: number,
  posY: number,
  width: number,
  height: number
): Promise<void> {
  logToFile(`Tiled launch for: ${profile.name} at (${posX},${posY}) ${width}x${height}`)

  const existing = activeBrowsers.get(profile.id)
  if (existing) return

  const fp = profile.fingerprint
  const userDataDir = getUserDataDir(profile.id)
  const executablePath = getChromePath()

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Chromium not found at: ${executablePath}`)
  }

  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true })

  const proxy = (profile.proxy && profile.proxy.type !== 'none' && profile.proxy.host && profile.proxy.port)
    ? profile.proxy : undefined

  const stealthExtPath = generateProfileExtensions(fp, profile.id, proxy as any)
  const extPaths = [stealthExtPath]

  const launchArgs = [
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=TranslateUI,AutomationControlled,OptimizationHints,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater',
    '--no-pings',
    '--disable-infobars',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-ipc-flooding-protection',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-domain-reliability',
    '--disable-component-update',
    '--disable-breakpad',
    '--metrics-recording-only',
    '--no-service-autorun',
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-webrtc-hw-encoding',
    '--disable-webrtc-hw-decoding',
    '--enforce-webrtc-ip-permission-check',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--disable-site-isolation-trials',
    `--window-size=${width},${height}`,
    `--window-position=${posX},${posY}`,
    `--lang=${fp.locale}`,
    `--load-extension=${extPaths.join(',')}`,
    `--disable-extensions-except=${extPaths.join(',')}`,
  ]

  if (proxy) {
    launchArgs.push(`--proxy-server=${proxy.type}://${proxy.host}:${proxy.port}`)
  }

  const startUrl = profile.startUrl || 'https://www.google.com'
  launchArgs.push(startUrl)

  const chromeProcess = spawn(executablePath, launchArgs, {
    detached: true,
    stdio: 'ignore',
  })
  chromeProcess.unref()

  activeBrowsers.set(profile.id, { process: chromeProcess, fingerprint: fp })

  chromeProcess.on('exit', () => {
    activeBrowsers.delete(profile.id)
    if (masterProfileId === profile.id) masterProfileId = null
  })
}

export async function closeBrowser(profileId: string): Promise<void> {
  const entry = activeBrowsers.get(profileId)
  if (entry) {
    try { entry.process.kill() } catch {}
    activeBrowsers.delete(profileId)
    syncEnabled.delete(profileId)
    if (masterProfileId === profileId) masterProfileId = null
  }
}

export async function closeAllBrowsers(): Promise<void> {
  for (const [id, entry] of activeBrowsers) {
    try { entry.process.kill() } catch {}
    activeBrowsers.delete(id)
  }
  syncEnabled.clear()
}
