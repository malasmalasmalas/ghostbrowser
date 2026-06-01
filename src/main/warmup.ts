import { getActiveBrowser } from './windowManager'
import { logToFile } from './windowManager'

const WARMUP_SITES = [
  'https://www.google.com',
  'https://www.youtube.com',
  'https://www.wikipedia.org',
  'https://www.reddit.com',
  'https://www.amazon.com',
  'https://www.facebook.com',
  'https://www.twitter.com',
  'https://www.instagram.com',
  'https://www.linkedin.com',
  'https://www.github.com',
  'https://www.stackoverflow.com',
  'https://www.medium.com',
  'https://www.bbc.com',
  'https://www.cnn.com',
  'https://www.nytimes.com',
  'https://www.weather.com',
  'https://www.ebay.com',
  'https://www.netflix.com',
  'https://www.spotify.com',
  'https://www.twitch.tv',
  'https://www.pinterest.com',
  'https://www.quora.com',
  'https://www.imdb.com',
  'https://www.bing.com',
  'https://www.yahoo.com',
]

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Warmup a profile by visiting random sites with human-like behavior
 * @param profileId - Profile ID to warmup
 * @param siteCount - Number of sites to visit (default 5)
 */
export async function warmupProfile(profileId: string, siteCount = 5): Promise<{ ok: boolean; message: string; visited: string[] }> {
  const browser = getActiveBrowser(profileId)
  if (!browser) {
    return { ok: false, message: 'Browser not running. Launch first.', visited: [] }
  }

  const sites = shuffleArray(WARMUP_SITES).slice(0, siteCount)
  const visited: string[] = []

  try {
    const pages = await browser.pages()
    const page = pages[0] || await browser.newPage()

    for (const site of sites) {
      try {
        logToFile(`Warmup: visiting ${site} for profile ${profileId}`)
        await page.goto(site, { waitUntil: 'domcontentloaded', timeout: 15000 })
        visited.push(site)

        // Random scroll to simulate human behavior
        const scrollAmount = Math.floor(Math.random() * 800) + 200
        await page.evaluate((amt: number) => window.scrollBy(0, amt), scrollAmount)

        // Random delay between 2-5 seconds
        const delay = Math.floor(Math.random() * 3000) + 2000
        await new Promise(r => setTimeout(r, delay))

        // Sometimes scroll back up
        if (Math.random() > 0.5) {
          await page.evaluate(() => window.scrollTo(0, 0))
          await new Promise(r => setTimeout(r, 1000))
        }
      } catch (e: any) {
        logToFile(`Warmup: failed to visit ${site}: ${e?.message}`)
        // Continue to next site even if one fails
      }
    }

    // Navigate back to start page or google
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})

    return { ok: true, message: `Visited ${visited.length}/${siteCount} sites`, visited }
  } catch (e: any) {
    return { ok: false, message: `Warmup error: ${e?.message}`, visited }
  }
}
