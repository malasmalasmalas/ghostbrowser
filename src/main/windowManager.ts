import path from 'path'
import fs from 'fs'
import { app, screen } from 'electron'
import { Profile, Fingerprint } from '@shared/types'
import { getGlobalExtensions, getAllExtensions, getProxyById, getProfileById, updateProfileRecord } from './db'

function getStealthExtensionPath(): string {
  const isPackaged = app.isPackaged
  if (isPackaged) {
    return path.join(process.resourcesPath, 'stealth-extension')
  }
  return path.join(app.getAppPath(), 'src', 'main', 'stealth-extension')
}

function generateProfileStealthExtension(fp: Fingerprint, profileId: string): string {
  const extDir = path.join(app.getPath('userData'), 'stealth-ext', profileId)
  if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true })

  const manifest = {
    manifest_version: 3,
    name: 'Browser Helper',
    version: '1.0.0',
    description: 'Browser enhancement utility',
    content_scripts: [{
      matches: ['<all_urls>'],
      js: ['stealth.js', 'fingerprint.js'],
      run_at: 'document_start',
      all_frames: true,
      world: 'MAIN'
    }],
    permissions: []
  }
  fs.writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const baseStealth = path.join(getStealthExtensionPath(), 'stealth.js')
  if (fs.existsSync(baseStealth)) {
    fs.copyFileSync(baseStealth, path.join(extDir, 'stealth.js'))
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

const activeBrowsers = new Map<string, { browser: any; fingerprint: Fingerprint }>()
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

/**
 * Start proxy rotation timer for a profile.
 * On each tick: close browser, pick next proxy from pool, re-launch.
 */
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

      // Get current page URL to restore after rotation
      let currentUrl = currentProfile.startUrl || 'https://www.google.com'
      try {
        const pages = await entry.browser.pages()
        if (pages.length > 0) currentUrl = pages[0].url() || currentUrl
      } catch {}

      // Pick next proxy
      const idx = ((currentProfile.proxyPoolIndex || 0) + 1) % currentProfile.proxyPool.length
      const nextProxyRecord = getProxyById(currentProfile.proxyPool[idx])
      if (!nextProxyRecord) {
        logToFile(`Proxy rotation: proxy not found at index ${idx}`)
        return
      }

      const newProxy = { type: nextProxyRecord.type as 'http' | 'socks5', host: nextProxyRecord.host, port: nextProxyRecord.port, username: nextProxyRecord.username, password: nextProxyRecord.password }
      updateProfileRecord(profile.id, { proxy: newProxy, proxyPoolIndex: idx + 1 } as any)

      logToFile(`Proxy rotation for ${currentProfile.name}: switching to ${nextProxyRecord.label} (${nextProxyRecord.host}:${nextProxyRecord.port})`)

      // Close current browser (this will trigger 'disconnected' and clear this timer)
      // So we need to stop timer first, then close, then re-launch with new timer
      clearInterval(timer)
      proxyRotationTimers.delete(profile.id)

      try {
        await entry.browser.close()
      } catch {}
      activeBrowsers.delete(profile.id)

      // Re-launch with updated profile
      const updatedProfile = getProfileById(profile.id)
      if (updatedProfile) {
        updatedProfile.startUrl = currentUrl
        // Small delay to let browser fully close
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

function getPuppeteer(): any {
  const pup = require('puppeteer-core')
  logToFile('puppeteer-core loaded successfully')
  return pup
}

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

function getBadgeScript(name: string, color: string): string {
  return `(function(){
    if (document.getElementById('__mb_badge')) return;
    var badge = document.createElement('div');
    badge.id = '__mb_badge';
    badge.textContent = ${JSON.stringify(name)};
    badge.style.cssText = 'position:fixed;top:6px;right:6px;z-index:2147483647;background:${color};color:#fff;font-size:12px;font-weight:bold;padding:3px 10px;border-radius:12px;opacity:0.9;pointer-events:none;font-family:system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.4);letter-spacing:0.3px;';
    if (document.body) document.body.appendChild(badge);
    else document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(badge); });
  })()`
}

function injectBadge(page: any, name: string, color: string): void {
  const script = getBadgeScript(name, color)
  // Inject for future navigations
  page.evaluateOnNewDocument(script).catch(() => {})
  // Inject on current page
  page.evaluate(script).catch(() => {})
  // Re-inject after each navigation
  page.on('framenavigated', () => {
    page.evaluate(script).catch(() => {})
  })
}

function getScreenshotDir(): string {
  const dir = path.join(app.getPath('userData'), 'screenshots')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

async function takeScreenshot(profileId: string): Promise<void> {
  const entry = activeBrowsers.get(profileId)
  if (!entry) return
  try {
    const pages = await entry.browser.pages()
    if (pages.length === 0) return
    const screenshotPath = path.join(getScreenshotDir(), `${profileId}.png`)
    await pages[0].screenshot({ path: screenshotPath, type: 'png', quality: undefined })
    logToFile(`Screenshot saved for ${profileId}`)
  } catch {}
}

export function getScreenshotPath(profileId: string): string | null {
  const p = path.join(getScreenshotDir(), `${profileId}.png`)
  return fs.existsSync(p) ? p : null
}

function getUserDataDir(profileId: string): string {
  return path.join(app.getPath('userData'), 'profiles', profileId)
}


export async function launchProfileBrowser(profile: Profile): Promise<void> {
  logToFile(`Launch requested for: ${profile.name}`)

  const existing = activeBrowsers.get(profile.id)
  if (existing) {
    try {
      const pages = await existing.browser.pages()
      if (pages.length > 0) {
        await pages[0].bringToFront()
        return
      }
    } catch {
      activeBrowsers.delete(profile.id)
    }
  }

  const fp = profile.fingerprint
  const userDataDir = getUserDataDir(profile.id)
  const executablePath = getChromePath()

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Chromium not found at: ${executablePath}. Install Ungoogled Chromium or place it in resources/chromium.`)
  }

  logToFile(`Launching with executablePath: ${executablePath}, userDataDir: ${userDataDir}`)

  const launchArgs = [
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
    '--export-tagged-pdf',
    '--disable-webrtc-hw-encoding',
    '--disable-webrtc-hw-decoding',
    '--enforce-webrtc-ip-permission-check',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials',
    `--window-size=${fp.viewport.width},${fp.viewport.height}`,
    `--lang=${fp.locale}`,
  ]

  // Load extensions
  const globalExts = getGlobalExtensions()
  const profileExtIds = profile.extensions || []
  const allExts = getAllExtensions()
  const profileExts = allExts.filter(e => profileExtIds.includes(e.id) && e.enabled)
  const extPaths = [...globalExts, ...profileExts]
    .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
    .map(e => e.path)
    .filter(p => fs.existsSync(p))

  // Generate per-profile stealth extension
  const stealthExtPath = generateProfileStealthExtension(fp, profile.id)
  extPaths.push(stealthExtPath)

  if (extPaths.length > 0) {
    launchArgs.push(`--load-extension=${extPaths.join(',')}`)
    launchArgs.push(`--disable-extensions-except=${extPaths.join(',')}`)
  }

  if (profile.proxy && profile.proxy.type !== 'none') {
    const { type, host, port } = profile.proxy
    if (host && port) {
      launchArgs.push(`--proxy-server=${type}://${host}:${port}`)
    }
  }

  const puppeteer = getPuppeteer()

  const browser = await puppeteer.launch({
    headless: false,
    executablePath,
    defaultViewport: {
      width: fp.viewport.width,
      height: fp.viewport.height,
      deviceScaleFactor: fp.deviceScaleFactor,
    },
    userDataDir,
    args: launchArgs,
    ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=IdleDetection', '--disable-component-extensions-with-background-pages'],
    ignoreHTTPSErrors: true,
  })

  activeBrowsers.set(profile.id, { browser, fingerprint: fp })

  const pages = await browser.pages()
  const page = pages[0] || await browser.newPage()

  await page.setUserAgent(fp.userAgent)

  if (profile.proxy?.username && profile.proxy?.password) {
    await page.authenticate({
      username: profile.proxy.username,
      password: profile.proxy.password,
    })
  }

  await page.emulateTimezone(fp.timezone)
  await page.setExtraHTTPHeaders({ 'Accept-Language': `${fp.locale},en;q=0.9` })

  // Apply UA/timezone to new pages/popups (Google OAuth opens popup windows)
  browser.on('targetcreated', async (target: any) => {
    try {
      if (target.type() === 'page') {
        const newPage = await target.page()
        if (newPage) {
          await newPage.setUserAgent(fp.userAgent)
          await newPage.emulateTimezone(fp.timezone)
          await newPage.setExtraHTTPHeaders({ 'Accept-Language': `${fp.locale},en;q=0.9` })
          if (profile.proxy?.username && profile.proxy?.password) {
            await newPage.authenticate({ username: profile.proxy.username, password: profile.proxy.password })
          }
        }
      }
    } catch {}
  })

  // Inject profile badge overlay on the original launchProfileBrowser
  injectBadge(page, profile.name, profile.color)

  const startUrl = profile.startUrl || 'https://www.google.com'
  page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})

  // Periodic screenshot
  const ssInterval = setInterval(() => { takeScreenshot(profile.id) }, 30000)
  // Take first screenshot after page loads
  setTimeout(() => { takeScreenshot(profile.id) }, 5000)

  // Proxy rotation scheduler
  if (profile.proxyRotateInterval && profile.proxyRotateInterval > 0 && profile.proxyPool && profile.proxyPool.length > 1) {
    startProxyRotation(profile)
  }

  browser.on('disconnected', () => {
    clearInterval(ssInterval)
    stopProxyRotation(profile.id)
    activeBrowsers.delete(profile.id)
  })

  logToFile(`Browser window opened for: ${profile.name}`)
}

export function getProfileFingerprint(profileId: string): Fingerprint | null {
  const entry = activeBrowsers.get(profileId)
  return entry?.fingerprint || null
}

export async function getProfileCookies(profileId: string): Promise<any[]> {
  const entry = activeBrowsers.get(profileId)
  if (!entry) return []
  try {
    const pages = await entry.browser.pages()
    if (pages.length === 0) return []
    const client = await pages[0].target().createCDPSession()
    const { cookies } = await client.send('Network.getAllCookies')
    return cookies
  } catch {
    return []
  }
}

export function isProfileRunning(profileId: string): boolean {
  return activeBrowsers.has(profileId)
}

export function getActiveBrowser(profileId: string): any | null {
  const entry = activeBrowsers.get(profileId)
  return entry?.browser || null
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
  if (profileId) {
    logToFile(`Master profile set: ${profileId}`)
  }
}

export function getMasterProfileId(): string | null {
  return masterProfileId
}

export function startMirrorLoop(): void {
  stopMirrorLoop()
  mirrorInterval = setInterval(async () => {
    if (!masterProfileId) return
    const events = await pollMasterEvents()
    if (events.length > 0) {
      await replayEventsToSynced(events)
    }
  }, 80)
  logToFile('Mirror loop started')
}

export function stopMirrorLoop(): void {
  if (mirrorInterval) {
    clearInterval(mirrorInterval)
    mirrorInterval = null
    logToFile('Mirror loop stopped')
  }
}

export async function startMirrorMode(profileId: string): Promise<void> {
  masterProfileId = profileId
  const entry = activeBrowsers.get(profileId)
  if (!entry) return

  const pages = await entry.browser.pages()
  if (pages.length === 0) return
  const page = pages[0]

  const mirrorScript = `(function(){
    if (window.__mirrorInjected) return;
    window.__mirrorInjected = true;
    window.__mirrorQueue = [];

    var vw = function(){ return window.innerWidth; };
    var vh = function(){ return window.innerHeight; };

    document.addEventListener('mousemove', function(e) {
      var q = window.__mirrorQueue;
      if (q.length > 0 && q[q.length - 1].type === 'mousemove') {
        q[q.length - 1] = { type: 'mousemove', relX: e.clientX / vw(), relY: e.clientY / vh(), ts: Date.now() };
      } else {
        q.push({ type: 'mousemove', relX: e.clientX / vw(), relY: e.clientY / vh(), ts: Date.now() });
      }
    }, true);

    document.addEventListener('mousedown', function(e) {
      window.__mirrorQueue.push({ type: 'mousedown', relX: e.clientX / vw(), relY: e.clientY / vh(), button: e.button, ts: Date.now() });
    }, true);

    document.addEventListener('mouseup', function(e) {
      window.__mirrorQueue.push({ type: 'mouseup', relX: e.clientX / vw(), relY: e.clientY / vh(), button: e.button, ts: Date.now() });
    }, true);

    document.addEventListener('click', function(e) {
      window.__mirrorQueue.push({ type: 'click', relX: e.clientX / vw(), relY: e.clientY / vh(), ts: Date.now() });
    }, true);

    document.addEventListener('scroll', function() {
      window.__mirrorQueue.push({ type: 'scroll', scrollX: window.scrollX, scrollY: window.scrollY, ts: Date.now() });
    }, true);

    document.addEventListener('keydown', function(e) {
      if (e.key.length === 1) {
        window.__mirrorQueue.push({ type: 'key', key: e.key, ts: Date.now() });
      } else if (['Enter','Backspace','Tab','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Delete','Home','End'].indexOf(e.key) !== -1) {
        window.__mirrorQueue.push({ type: 'specialkey', key: e.key, ts: Date.now() });
      }
    }, true);
  })()`

  // Inject on current page immediately
  await page.evaluate(mirrorScript).catch(() => {})

  // Also inject for future navigations
  await page.evaluateOnNewDocument(mirrorScript).catch(() => {})

  // Listen for new pages/tabs in this browser and inject there too
  entry.browser.on('targetcreated', async (target: any) => {
    try {
      if (target.type() === 'page') {
        const newPage = await target.page()
        if (newPage) {
          await newPage.evaluateOnNewDocument(mirrorScript).catch(() => {})
          await newPage.evaluate(mirrorScript).catch(() => {})
        }
      }
    } catch {}
  })

  logToFile(`Mirror mode started for: ${profileId}`)
}

export async function pollMasterEvents(): Promise<any[]> {
  if (!masterProfileId) return []
  const entry = activeBrowsers.get(masterProfileId)
  if (!entry) return []

  try {
    const pages = await entry.browser.pages()
    if (pages.length === 0) return []
    const page = pages[0]
    const events = await page.evaluate(`(function(){
      var q = window.__mirrorQueue || [];
      window.__mirrorQueue = [];
      return q;
    })()`).catch(() => [])
    return events || []
  } catch {
    return []
  }
}

// Replay a batch of events to all synced browsers (except master)
export async function replayEventsToSynced(events: any[]): Promise<void> {
  const ids = getSyncEnabledIds().filter(id => id !== masterProfileId)
  if (ids.length === 0 || events.length === 0) return

  await Promise.allSettled(ids.map(async (id) => {
    const entry = activeBrowsers.get(id)
    if (!entry) return
    const pages = await entry.browser.pages()
    if (pages.length === 0) return
    const page = pages[0]
    const vp = await page.viewport()
    const vpW = vp?.width || 1280
    const vpH = vp?.height || 720

    for (const evt of events) {
      try {
        if (evt.type === 'mousemove' && evt.relX != null && evt.relY != null) {
          await page.mouse.move(Math.round(evt.relX * vpW), Math.round(evt.relY * vpH))
        } else if (evt.type === 'mousedown' && evt.relX != null && evt.relY != null) {
          await page.mouse.move(Math.round(evt.relX * vpW), Math.round(evt.relY * vpH))
          await page.mouse.down({ button: evt.button === 2 ? 'right' : 'left' })
        } else if (evt.type === 'mouseup') {
          await page.mouse.up({ button: evt.button === 2 ? 'right' : 'left' })
        } else if (evt.type === 'click' && evt.relX != null && evt.relY != null) {
          // Use click as fallback — move + click in one action
          await page.mouse.click(Math.round(evt.relX * vpW), Math.round(evt.relY * vpH))
        } else if (evt.type === 'scroll' && evt.scrollX != null && evt.scrollY != null) {
          await page.evaluate(`window.scrollTo(${evt.scrollX}, ${evt.scrollY})`)
        } else if (evt.type === 'key' && evt.key) {
          await page.keyboard.press(evt.key)
        } else if (evt.type === 'specialkey' && evt.key) {
          await page.keyboard.press(evt.key)
        }
      } catch {}
    }
  }))
}

export async function syncNavigate(url: string): Promise<void> {
  const ids = getSyncEnabledIds()
  await Promise.allSettled(ids.map(async (id) => {
    const entry = activeBrowsers.get(id)
    if (!entry) return
    const pages = await entry.browser.pages()
    if (pages.length > 0) {
      pages[0].goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
    }
  }))
}

export async function syncClick(x: number, y: number): Promise<void> {
  const ids = getSyncEnabledIds()
  await Promise.allSettled(ids.map(async (id) => {
    const entry = activeBrowsers.get(id)
    if (!entry) return
    const pages = await entry.browser.pages()
    if (pages.length > 0) {
      // Use relative coordinates: x and y are percentages (0-1)
      const vp = await pages[0].viewport()
      const absX = Math.round(x * (vp?.width || 1280))
      const absY = Math.round(y * (vp?.height || 720))
      await pages[0].mouse.click(absX, absY).catch(() => {})
    }
  }))
}

export async function syncClickAbsolute(x: number, y: number): Promise<void> {
  const ids = getSyncEnabledIds()
  await Promise.allSettled(ids.map(async (id) => {
    const entry = activeBrowsers.get(id)
    if (!entry) return
    const pages = await entry.browser.pages()
    if (pages.length > 0) {
      await pages[0].mouse.click(x, y).catch(() => {})
    }
  }))
}

export async function syncMouseMove(relX: number, relY: number): Promise<void> {
  const ids = getSyncEnabledIds().filter(id => id !== masterProfileId)
  await Promise.allSettled(ids.map(async (id) => {
    const entry = activeBrowsers.get(id)
    if (!entry) return
    const pages = await entry.browser.pages()
    if (pages.length > 0) {
      const vp = await pages[0].viewport()
      const absX = Math.round(relX * (vp?.width || 1280))
      const absY = Math.round(relY * (vp?.height || 720))
      await pages[0].mouse.move(absX, absY).catch(() => {})
    }
  }))
}

export async function syncType(text: string): Promise<void> {
  const ids = getSyncEnabledIds()
  await Promise.allSettled(ids.map(async (id) => {
    const entry = activeBrowsers.get(id)
    if (!entry) return
    const pages = await entry.browser.pages()
    if (pages.length > 0) {
      await pages[0].keyboard.type(text).catch(() => {})
    }
  }))
}

export async function syncScroll(deltaY: number): Promise<void> {
  const ids = getSyncEnabledIds()
  await Promise.allSettled(ids.map(async (id) => {
    const entry = activeBrowsers.get(id)
    if (!entry) return
    const pages = await entry.browser.pages()
    if (pages.length > 0) {
      await pages[0].evaluate((dy: number) => window.scrollBy(0, dy), deltaY).catch(() => {})
    }
  }))
}

export async function syncScrollTo(scrollX: number, scrollY: number): Promise<void> {
  const ids = getSyncEnabledIds().filter(id => id !== masterProfileId)
  await Promise.allSettled(ids.map(async (id) => {
    const entry = activeBrowsers.get(id)
    if (!entry) return
    const pages = await entry.browser.pages()
    if (pages.length > 0) {
      await pages[0].evaluate((sx: number, sy: number) => window.scrollTo(sx, sy), scrollX, scrollY).catch(() => {})
    }
  }))
}

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
    // Delay between batches to avoid system overload
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
  if (existing) {
    try {
      const pages = await existing.browser.pages()
      if (pages.length > 0) {
        await pages[0].bringToFront()
        return
      }
    } catch {
      activeBrowsers.delete(profile.id)
    }
  }

  const fp = profile.fingerprint
  const userDataDir = getUserDataDir(profile.id)
  const executablePath = getChromePath()

  if (!fs.existsSync(executablePath)) {
    throw new Error(`Chromium not found at: ${executablePath}. Install Ungoogled Chromium or place it in resources/chromium.`)
  }

  const launchArgs = [
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
    '--export-tagged-pdf',
    '--disable-webrtc-hw-encoding',
    '--disable-webrtc-hw-decoding',
    '--enforce-webrtc-ip-permission-check',
    '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials',
    `--window-size=${width},${height}`,
    `--window-position=${posX},${posY}`,
    `--lang=${fp.locale}`,
  ]

  if (profile.proxy && profile.proxy.type !== 'none') {
    const { type, host, port } = profile.proxy
    if (host && port) {
      launchArgs.push(`--proxy-server=${type}://${host}:${port}`)
    }
  }

  // Generate per-profile stealth extension for tiled launch
  const stealthExtPath = generateProfileStealthExtension(fp, profile.id)
  const tiledExtPaths = [stealthExtPath]
  if (tiledExtPaths.length > 0) {
    launchArgs.push(`--load-extension=${tiledExtPaths.join(',')}`)
    launchArgs.push(`--disable-extensions-except=${tiledExtPaths.join(',')}`)
  }

  const puppeteer = getPuppeteer()

  const browser = await puppeteer.launch({
    headless: false,
    executablePath,
    defaultViewport: {
      width: width - 16,
      height: height - 88,
      deviceScaleFactor: fp.deviceScaleFactor,
    },
    userDataDir,
    args: launchArgs,
    ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=IdleDetection', '--disable-component-extensions-with-background-pages'],
    ignoreHTTPSErrors: true,
  })

  activeBrowsers.set(profile.id, { browser, fingerprint: fp })

  const pages = await browser.pages()
  const page = pages[0] || await browser.newPage()

  await page.setUserAgent(fp.userAgent)

  if (profile.proxy?.username && profile.proxy?.password) {
    await page.authenticate({
      username: profile.proxy.username,
      password: profile.proxy.password,
    })
  }

  await page.emulateTimezone(fp.timezone)
  await page.setExtraHTTPHeaders({ 'Accept-Language': `${fp.locale},en;q=0.9` })

  // Inject profile badge overlay on tiled launch
  injectBadge(page, profile.name, profile.color)

  const startUrl = profile.startUrl || 'https://www.google.com'
  page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})

  // Periodic screenshot
  const ssInterval = setInterval(() => { takeScreenshot(profile.id) }, 30000)
  setTimeout(() => { takeScreenshot(profile.id) }, 5000)

  browser.on('disconnected', () => {
    clearInterval(ssInterval)
    activeBrowsers.delete(profile.id)
    if (masterProfileId === profile.id) masterProfileId = null
  })
}

export async function closeBrowser(profileId: string): Promise<void> {
  const entry = activeBrowsers.get(profileId)
  if (entry) {
    try { await entry.browser.close() } catch {}
    activeBrowsers.delete(profileId)
    syncEnabled.delete(profileId)
    if (masterProfileId === profileId) masterProfileId = null
  }
}

export async function closeAllBrowsers(): Promise<void> {
  for (const [id, entry] of activeBrowsers) {
    try { await entry.browser.close() } catch {}
    activeBrowsers.delete(id)
  }
  syncEnabled.clear()
}
