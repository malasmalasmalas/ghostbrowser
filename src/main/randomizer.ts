const CHROME_VERSIONS = [
  '131.0.6778.69', '131.0.6778.108', '131.0.6778.139',
  '132.0.6834.57', '132.0.6834.83', '132.0.6834.110',
  '133.0.6890.60', '133.0.6890.92', '133.0.6890.126',
  '134.0.6946.54', '134.0.6946.86', '134.0.6946.108',
  '135.0.7002.42', '135.0.7002.73', '135.0.7002.99',
  '136.0.7058.48', '136.0.7058.80', '136.0.7058.107',
  '137.0.7114.44', '137.0.7114.72', '137.0.7114.98',
  '138.0.7170.52', '138.0.7170.81', '138.0.7170.105',
  '139.0.7226.40', '139.0.7226.68', '139.0.7226.95',
  '140.0.7282.46', '140.0.7282.77', '140.0.7282.102',
  '141.0.7338.50', '141.0.7338.78', '141.0.7338.99',
  '142.0.7394.44', '142.0.7394.70', '142.0.7394.96',
  '143.0.7450.38', '143.0.7450.65', '143.0.7450.91',
  '144.0.7506.42', '144.0.7506.69', '144.0.7506.94',
  '145.0.7562.48', '145.0.7562.74', '145.0.7562.100',
  '146.0.7618.36', '146.0.7618.63', '146.0.7618.89',
  '147.0.7674.44', '147.0.7674.71', '147.0.7674.97',
  '148.0.7730.40', '148.0.7730.66', '148.0.7730.92',
  '149.0.7786.38', '149.0.7786.64', '149.0.7786.90',
]

const WINDOWS_VERSIONS = [
  'Windows NT 10.0; Win64; x64',
  'Windows NT 10.0; WOW64',
  'Windows NT 11.0; Win64; x64',
]

const MAC_VERSIONS = [
  'Macintosh; Intel Mac OS X 10_15_7',
  'Macintosh; Intel Mac OS X 11_6_8',
  'Macintosh; Intel Mac OS X 12_7_1',
  'Macintosh; Intel Mac OS X 13_6_3',
  'Macintosh; Intel Mac OS X 14_2_1',
  'Macintosh; Intel Mac OS X 14_4',
  'Macintosh; Intel Mac OS X 15_0',
  'Macintosh; Intel Mac OS X 15_1',
]

const LINUX_VERSIONS = [
  'X11; Linux x86_64',
  'X11; Ubuntu; Linux x86_64',
]

const IOS_VERSIONS = [
  'iPhone; CPU iPhone OS 17_0 like Mac OS X',
  'iPhone; CPU iPhone OS 17_1 like Mac OS X',
  'iPhone; CPU iPhone OS 17_2 like Mac OS X',
  'iPhone; CPU iPhone OS 17_3 like Mac OS X',
  'iPhone; CPU iPhone OS 17_4 like Mac OS X',
  'iPhone; CPU iPhone OS 17_5 like Mac OS X',
  'iPhone; CPU iPhone OS 18_0 like Mac OS X',
  'iPhone; CPU iPhone OS 18_1 like Mac OS X',
  'iPhone; CPU iPhone OS 18_2 like Mac OS X',
  'iPad; CPU OS 17_0 like Mac OS X',
  'iPad; CPU OS 17_4 like Mac OS X',
  'iPad; CPU OS 18_0 like Mac OS X',
]

const ANDROID_DEVICES = [
  'Linux; Android 13; SM-S918B',
  'Linux; Android 13; SM-G998B',
  'Linux; Android 14; SM-S928B',
  'Linux; Android 14; SM-S921B',
  'Linux; Android 14; Pixel 8 Pro',
  'Linux; Android 14; Pixel 8',
  'Linux; Android 14; Pixel 7a',
  'Linux; Android 15; SM-S938B',
  'Linux; Android 15; Pixel 9 Pro',
  'Linux; Android 15; Pixel 9',
  'Linux; Android 13; SAMSUNG SM-A546B',
  'Linux; Android 14; OnePlus 12',
  'Linux; Android 14; Xiaomi 14',
]

const SAFARI_VERSIONS = ['17.0', '17.1', '17.2', '17.3', '17.4', '17.5', '18.0', '18.1', '18.2']

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 2560, height: 1440 },
  { width: 1280, height: 800 },
  { width: 1680, height: 1050 },
  { width: 1360, height: 768 },
]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Phoenix', 'America/Anchorage',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Zurich',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Seoul',
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Bangkok', 'Asia/Hong_Kong',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
]

const LOCALES = ['en-US', 'en-GB', 'en-CA', 'en-AU']

const HARDWARE_CONCURRENCY = [2, 4, 6, 8, 10, 12, 16]
const DEVICE_MEMORY = [2, 4, 8, 16, 32]

const WEBGL_VENDORS = [
  'Google Inc. (NVIDIA)',
  'Google Inc. (AMD)',
  'Google Inc. (Intel)',
  'Google Inc. (Apple)',
]

const WEBGL_RENDERERS = [
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Ti/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1070/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 2070/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (AMD, AMD Radeon RX 580/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (AMD, AMD Radeon RX 5700 XT/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (AMD, AMD Radeon RX 6600 XT/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (AMD, AMD Radeon RX 6700 XT/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (AMD, AMD Radeon RX 7800 XT/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (Intel, Intel(R) UHD Graphics 630/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (Intel, Intel(R) UHD Graphics 770/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics/PCIe/SSE2, OpenGL 4.5.0)',
  'ANGLE (Apple, Apple M1, OpenGL 4.1)',
  'ANGLE (Apple, Apple M2, OpenGL 4.1)',
]

const MOBILE_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 414, height: 896 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
  { width: 412, height: 915 },
  { width: 428, height: 926 },
  { width: 320, height: 568 },
]

const SCREEN_DEPTHS = [24, 32]
const FONTS_POOL = [
  'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Georgia',
  'Courier New', 'Trebuchet MS', 'Palatino Linotype', 'Lucida Console',
  'Tahoma', 'Impact', 'Comic Sans MS', 'Segoe UI', 'Calibri',
  'Cambria', 'Consolas', 'Candara', 'Franklin Gothic Medium',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

import { Fingerprint } from '@shared/types'

export function generateRandomFingerprint(): Fingerprint {
  const chromeVersion = pick(CHROME_VERSIONS)
  const deviceType = pick(['windows', 'windows', 'windows', 'mac', 'mac', 'linux'] as const)

  let userAgent: string
  let platform: string
  let viewport: { width: number; height: number }
  let isMobile = false
  let deviceScaleFactor: number

  if (deviceType === 'windows') {
    const osString = pick(WINDOWS_VERSIONS)
    platform = 'Win32'
    userAgent = `Mozilla/5.0 (${osString}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
    viewport = pick(VIEWPORTS)
    deviceScaleFactor = pick([1, 1, 1.25, 1.5])
  } else if (deviceType === 'mac') {
    const osString = pick(MAC_VERSIONS)
    platform = 'MacIntel'
    userAgent = `Mozilla/5.0 (${osString}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
    viewport = pick(VIEWPORTS)
    deviceScaleFactor = pick([1, 2, 2])
  } else if (deviceType === 'linux') {
    const osString = pick(LINUX_VERSIONS)
    platform = 'Linux x86_64'
    userAgent = `Mozilla/5.0 (${osString}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
    viewport = pick(VIEWPORTS)
    deviceScaleFactor = pick([1, 1, 1.25])
  } else if (deviceType === 'ios') {
    const osString = pick(IOS_VERSIONS)
    const safariVersion = pick(SAFARI_VERSIONS)
    platform = 'iPhone'
    userAgent = `Mozilla/5.0 (${osString}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion} Mobile/15E148 Safari/604.1`
    viewport = pick(MOBILE_VIEWPORTS)
    isMobile = true
    deviceScaleFactor = pick([2, 3, 3])
  } else {
    const osString = pick(ANDROID_DEVICES)
    platform = 'Linux armv81'
    userAgent = `Mozilla/5.0 (${osString}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Mobile Safari/537.36`
    viewport = pick(MOBILE_VIEWPORTS)
    isMobile = true
    deviceScaleFactor = pick([2, 2.5, 3, 3.5])
  }

  const timezone = pick(TIMEZONES)
  const locale = pick(LOCALES)
  const hardwareConcurrency = isMobile ? pick([4, 6, 8]) : pick(HARDWARE_CONCURRENCY)
  const deviceMemory = isMobile ? pick([3, 4, 6, 8]) : pick(DEVICE_MEMORY)
  const webglVendor = pick(WEBGL_VENDORS)
  const webglRenderer = pick(WEBGL_RENDERERS)
  const screenDepth = pick(SCREEN_DEPTHS)
  const fonts = pickN(FONTS_POOL, randInt(8, 14))

  return {
    userAgent,
    viewport,
    timezone,
    locale,
    platform,
    hardwareConcurrency,
    deviceMemory,
    webglVendor,
    webglRenderer,
    screenDepth,
    fonts,
    deviceScaleFactor,
    isMobile,
  }
}
