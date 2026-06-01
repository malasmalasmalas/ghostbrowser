import { BrowserWindow } from 'electron'
import { getActiveBrowser } from './windowManager'
import { logToFile } from './windowManager'

interface ProfileResourceUsage {
  id: string
  cpu: number      // percentage
  memory: number   // MB
}

let resourceInterval: ReturnType<typeof setInterval> | null = null

/**
 * Get resource usage for a single running profile via CDP
 */
async function getProfileResources(profileId: string): Promise<ProfileResourceUsage | null> {
  const browser = getActiveBrowser(profileId)
  if (!browser) return null

  try {
    const pages = await browser.pages()
    if (pages.length === 0) return null

    const client = await pages[0].target().createCDPSession()

    // Get memory info
    const memInfo = await client.send('Performance.getMetrics')
    let memoryMB = 0
    for (const metric of memInfo.metrics) {
      if (metric.name === 'JSHeapUsedSize') {
        memoryMB = Math.round(metric.value / 1024 / 1024)
        break
      }
    }

    // Get CPU via sampling (measure JS execution time)
    const startMetrics = await client.send('Performance.getMetrics')
    await new Promise(r => setTimeout(r, 200))
    const endMetrics = await client.send('Performance.getMetrics')

    let cpuStart = 0
    let cpuEnd = 0
    for (const m of startMetrics.metrics) {
      if (m.name === 'TaskDuration') cpuStart = m.value
    }
    for (const m of endMetrics.metrics) {
      if (m.name === 'TaskDuration') cpuEnd = m.value
    }

    // TaskDuration is cumulative seconds of CPU time
    const cpuDelta = cpuEnd - cpuStart
    const cpuPercent = Math.min(100, Math.round((cpuDelta / 0.2) * 100))

    return { id: profileId, cpu: cpuPercent, memory: memoryMB }
  } catch {
    return null
  }
}

/**
 * Get resource usage for all running profiles
 */
export async function getAllProfileResources(runningIds: string[]): Promise<ProfileResourceUsage[]> {
  const results: ProfileResourceUsage[] = []
  for (const id of runningIds) {
    const usage = await getProfileResources(id)
    if (usage) results.push(usage)
  }
  return results
}

/**
 * Start periodic resource monitoring, broadcast to renderer
 */
export function startResourceMonitor(intervalMs = 10000): void {
  if (resourceInterval) clearInterval(resourceInterval)

  resourceInterval = setInterval(async () => {
    try {
      const { getRunningProfileIds } = require('./windowManager')
      const runningIds = getRunningProfileIds() as string[]
      if (runningIds.length === 0) return

      const resources = await getAllProfileResources(runningIds)
      if (resources.length === 0) return

      const wins = BrowserWindow.getAllWindows()
      for (const win of wins) {
        win.webContents.send('profile:resourceUpdate', resources)
      }
    } catch (e: any) {
      logToFile(`Resource monitor error: ${e?.message}`)
    }
  }, intervalMs)
}

export function stopResourceMonitor(): void {
  if (resourceInterval) { clearInterval(resourceInterval); resourceInterval = null }
}
