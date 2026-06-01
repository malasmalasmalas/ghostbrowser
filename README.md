# GhostBrowser v2.0.0

Multi-profile anti-detect browser dengan fingerprint spoofing, proxy rotation, dan isolasi penuh per profil.

![Electron](https://img.shields.io/badge/Electron-33-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## Fitur Utama

### Anti-Detection & Fingerprint Spoofing
- User-Agent randomizer (Chrome 131-149, Windows/Mac/Linux)
- Canvas noise injection
- WebGL vendor/renderer spoofing
- AudioContext fingerprint randomizer
- ClientRects noise spoofing
- Speech synthesis spoofing
- Screen resolution randomizer per profil
- Font enumeration spoofing
- WebRTC leak protection
- Navigator properties override (hardwareConcurrency, deviceMemory, platform, languages)
- Battery API spoofing
- Connection type spoofing

### Multi-Profile Management
- Isolasi data penuh per profil (cookies, localStorage, cache)
- Warna & grup untuk organisasi
- Clone profil dengan fingerprint baru
- Bulk create profil dari daftar proxy
- Import/Export profil (JSON)
- Auto-rotate fingerprint setiap launch

### Proxy System
- HTTP & SOCKS5 support
- Proxy pool per profil (round-robin rotation)
- Proxy rotation scheduler (auto-ganti tiap X menit saat running)
- Timezone auto-match lokasi proxy (via IP geolocation)
- Proxy health monitor (cek tiap 5 menit)
- Bulk add proxy (host:port:user:pass:type)
- Test koneksi proxy dengan latency

### Chrome Integration
- Import cookies dari Chrome system (decrypt DPAPI Windows)
- Auto-detect extensions dari Chrome yang terinstall
- Enable/disable extension per profil
- Manual add extension folder

### Sync & Mirror
- Sinkronisasi aksi ke semua profil yang di-sync
- Master-slave mirror mode
- Navigate, click, type, scroll ke semua browser sekaligus

### Profile Warmup
- Auto-visit random sites (Google, YouTube, Reddit, dll)
- Simulasi scroll & delay seperti manusia
- Build cookies & history untuk profil baru

### Performance
- Bulk launch queue (batch 5 per gelombang, anti-overload)
- RAM/CPU monitor per profil (real-time via CDP)
- Periodic screenshot per profil

### UI/UX
- Dark/Light theme
- 15 bahasa (EN, ID, ZH, JA, KO, RU, ES, FR, DE, PT, AR, TH, VI, TR, HI)
- Keyboard shortcuts (Ctrl+N, Ctrl+L, Ctrl+S, Ctrl+F)
- Grid layout responsive
- System tray

## Instalasi

```bash
# Clone repo
git clone https://github.com/malasmalasmalas/ghostbrowser.git
cd ghostbrowser

# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Package (distributable)
npm run dist
```

### Prasyarat
- Node.js 18+
- Google Chrome atau Chromium terinstall di system
- Windows 10/11, macOS, atau Linux

## Penggunaan

1. **Buat Profil** — Klik tombol "New", isi nama, pilih proxy (opsional), set grup
2. **Launch** — Klik Play di profil card, browser terbuka dengan fingerprint unik
3. **Proxy Rotation** — Set proxy pool + interval di profil, proxy otomatis ganti saat running
4. **Import Cookies** — Klik icon Download di header untuk import dari Chrome system
5. **Warmup** — Klik icon Api di profil yang running untuk auto-visit random sites
6. **Sync** — Enable sync di beberapa profil, set satu sebagai Master, aktifkan Mirror

## Tech Stack

- **Runtime:** Electron 33
- **UI:** React 18 + TypeScript (strict mode)
- **Styling:** Tailwind CSS 3
- **Browser Automation:** puppeteer-core 21
- **Build:** electron-vite + Vite 5 + electron-builder
- **Database:** JSON file-based (profiles, proxies, extensions)
- **Crypto:** better-sqlite3 + DPAPI (untuk Chrome cookie decrypt)

## Struktur Proyek

```
src/
├── main/                   # Electron main process
│   ├── index.ts            # App entry, window, tray
│   ├── profileManager.ts   # IPC handlers
│   ├── windowManager.ts    # Puppeteer launch, stealth scripts
│   ├── sessionManager.ts   # Proxy test, health monitor, timezone lookup
│   ├── chromeImporter.ts   # Chrome cookies & extensions import
│   ├── randomizer.ts       # Fingerprint generation
│   ├── warmup.ts           # Profile warmup logic
│   ├── resourceMonitor.ts  # RAM/CPU monitoring
│   └── db.ts               # JSON data store
├── preload/
│   └── index.ts            # contextBridge API
├── renderer/               # React UI
│   ├── components/
│   │   ├── Dashboard.tsx   # Main UI
│   │   ├── Settings.tsx    # Settings + extensions
│   │   └── helpers.ts      # Utilities
│   └── i18n/
│       └── index.ts        # 15 languages
└── shared/
    └── types.ts            # TypeScript interfaces
```

## Support

Kalau tool ini berguna, boleh traktir kopi:

**https://saweria.co/malasmalas**

## License

MIT
