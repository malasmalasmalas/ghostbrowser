import { useState, useEffect, useCallback } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faSearch, faPlay, faStop, faTrash, faPen, faCookie, faGlobe, faSpinner, faCopy, faXmark, faShield, faLink, faMousePointer, faKeyboard, faArrowDown, faUsers, faChevronDown, faChevronUp, faCrown, faCheckDouble, faFingerprint, faServer, faFileExport, faFileImport, faLayerGroup, faListUl, faMoon, faSun, faGear, faBan, faSync, faClone, faCircleInfo, faDownload, faFire, faHeart } from "@fortawesome/free-solid-svg-icons"
import type { Profile, CreateProfilePayload, ProxyConfig, Fingerprint, SavedProxy } from "@shared/types"
import { COLORS, truncateUrl, shortenUA, syncBtnClass } from "./helpers"
import { useI18n } from "../i18n"
import Settings from "./Settings"

export default function Dashboard() {
  const { t } = useI18n()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [proxies, setProxies] = useState<SavedProxy[]>([])
  const [search, setSearch] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const [showModal, setShowModal] = useState(false)
  const [showProxyMgr, setShowProxyMgr] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [cookiesModal, setCookiesModal] = useState<{ name: string; cookies: any[] } | null>(null)
  const [fpModal, setFpModal] = useState<{ name: string; fp: Fingerprint } | null>(null)
  const [loading, setLoading] = useState(true)
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set())
  const [masterId, setMasterId] = useState<string | null>(null)
  const [mirrorActive, setMirrorActive] = useState(false)
  const [formName, setFormName] = useState("")
  const [formColor, setFormColor] = useState(COLORS[0])
  const [formStartUrl, setFormStartUrl] = useState("")
  const [formProxyId, setFormProxyId] = useState("none")
  const [formNotes, setFormNotes] = useState("")
  const [formGroup, setFormGroup] = useState("")
  const [formAutoRotate, setFormAutoRotate] = useState(false)
  const [formProxyPool, setFormProxyPool] = useState<string[]>([])
  const [formProxyRotateInterval, setFormProxyRotateInterval] = useState(0)
  const [copied, setCopied] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncUrl, setSyncUrl] = useState("")
  const [syncX, setSyncX] = useState("0.5")
  const [syncY, setSyncY] = useState("0.5")
  const [syncText, setSyncText] = useState("")
  const [syncScrollAmt, setSyncScrollAmt] = useState("300")
  // Proxy Manager
  const [pmLabel, setPmLabel] = useState("")
  const [pmType, setPmType] = useState<"http" | "socks5">("http")
  const [pmHost, setPmHost] = useState("")
  const [pmPort, setPmPort] = useState("")
  const [pmUser, setPmUser] = useState("")
  const [pmPass, setPmPass] = useState("")
  const [pmTesting, setPmTesting] = useState(false)
  const [pmTestResult, setPmTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [pmEditing, setPmEditing] = useState<string | null>(null)
  const [pmBulkMode, setPmBulkMode] = useState(false)
  const [pmBulkText, setPmBulkText] = useState("")
  // Bulk create
  const [bulkText, setBulkText] = useState("")
  const [bulkPrefix, setBulkPrefix] = useState("Profile")
  const [bulkResult, setBulkResult] = useState<{ count: number; results: { line: string; ok: boolean; message?: string }[] } | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [cookieImportModal, setCookieImportModal] = useState<{ id: string; name: string } | null>(null)
  const [cookieImportText, setCookieImportText] = useState("")
  const [cookieImportResult, setCookieImportResult] = useState<{ ok: boolean; message: string } | null>(null)
  // Chrome import
  const [showChromeImport, setShowChromeImport] = useState(false)
  const [chromeProfiles, setChromeProfiles] = useState<{ name: string; path: string }[]>([])
  const [chromeSelectedProfile, setChromeSelectedProfile] = useState("")
  const [chromeDomain, setChromeDomain] = useState("")
  const [chromeImportTarget, setChromeImportTarget] = useState("")
  const [chromeImportLoading, setChromeImportLoading] = useState(false)
  const [chromeImportResult, setChromeImportResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [resourceUsage, setResourceUsage] = useState<Map<string, { cpu: number; memory: number }>>(new Map())
  const [showSaweria, setShowSaweria] = useState(false)
  // Theme
  const [showAbout, setShowAbout] = useState(false)
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('mb-theme')
    if (saved) return saved === 'dark'
    return true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('mb-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Saweria reminder every 10 minutes
  useEffect(() => {
    const timer = setInterval(() => { setShowSaweria(true) }, 10 * 60 * 1000)
    // Show first time after 3 minutes
    const firstTimer = setTimeout(() => { setShowSaweria(true) }, 3 * 60 * 1000)
    return () => { clearInterval(timer); clearTimeout(firstTimer) }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const [data, px] = await Promise.all([window.electronAPI.getProfiles(), window.electronAPI.getProxies()])
    setProfiles(data)
    setProxies(px)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const unsub = window.electronAPI.onResourceUpdate((results: any[]) => {
      const map = new Map<string, { cpu: number; memory: number }>()
      for (const r of results) map.set(r.id, { cpu: r.cpu, memory: r.memory })
      setResourceUsage(map)
    })
    return () => { unsub() }
  }, [])

  useEffect(() => {
    const iv = setInterval(async () => {
      const rIds = await window.electronAPI.getRunningIds()
      setRunningIds(new Set(rIds))
      const sIds = await window.electronAPI.syncGetEnabledIds()
      setSyncedIds(new Set(sIds))
      const mId = await window.electronAPI.syncGetMaster()
      setMasterId(mId)
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n': e.preventDefault(); openCreate(); break
          case 'l': e.preventDefault(); handleLaunchAll(); break
          case 's': e.preventDefault(); handleCloseAll(); break
          case 'f': e.preventDefault(); document.querySelector<HTMLInputElement>('input[type="text"]')?.focus(); break
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [profiles])

  const groups = Array.from(new Set(profiles.map(p => p.group).filter(Boolean))) as string[]
  const filtered = profiles.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchGroup = groupFilter === "all" || p.group === groupFilter || (groupFilter === "ungrouped" && !p.group)
    return matchSearch && matchGroup
  })
  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id))

  const resetForm = () => { setFormName(""); setFormColor(COLORS[0]); setFormStartUrl(""); setFormProxyId("none"); setFormNotes(""); setFormGroup(""); setFormAutoRotate(false); setFormProxyPool([]); setFormProxyRotateInterval(0) }
  const openCreate = () => { setEditingProfile(null); resetForm(); setShowModal(true) }
  const openEdit = (p: Profile) => {
    setEditingProfile(p); setFormName(p.name); setFormColor(p.color); setFormStartUrl(p.startUrl || ""); setFormNotes(p.notes || ""); setFormGroup(p.group || ""); setFormAutoRotate(p.autoRotateUA || false); setFormProxyPool(p.proxyPool || []); setFormProxyRotateInterval(p.proxyRotateInterval || 0)
    if (p.proxy.type === "none") setFormProxyId("none")
    else { const match = proxies.find(px => px.type === p.proxy.type && px.host === p.proxy.host && px.port === p.proxy.port); setFormProxyId(match ? match.id : "none") }
    setShowModal(true)
  }
  const buildProxy = (): ProxyConfig => {
    if (formProxyId === "none") return { type: "none" }
    const px = proxies.find(p => p.id === formProxyId)
    if (!px) return { type: "none" }
    return { type: px.type, host: px.host, port: px.port, username: px.username, password: px.password }
  }

  const handleSubmit = async () => {
    const payload: CreateProfilePayload = { name: formName.trim(), color: formColor, proxy: buildProxy(), startUrl: formStartUrl.trim() || undefined, notes: formNotes.trim() || undefined, group: formGroup.trim() || undefined, autoRotateUA: formAutoRotate, proxyPool: formProxyPool.length > 0 ? formProxyPool : undefined, proxyRotateInterval: formProxyRotateInterval > 0 ? formProxyRotateInterval : undefined }
    if (editingProfile) await window.electronAPI.updateProfile(editingProfile.id, payload)
    else await window.electronAPI.createProfile(payload)
    setShowModal(false); load()
  }
  const handleDelete = async (id: string) => { await window.electronAPI.deleteProfile(id); load() }
  const handleDeleteSelected = async () => { if (selectedIds.size === 0) return; for (const id of selectedIds) { await window.electronAPI.deleteProfile(id) } setSelectedIds(new Set()); load() }
  const handleClone = async (id: string) => { await window.electronAPI.cloneProfile(id); load() }
  const handleLaunch = async (id: string) => { setLaunchingId(id); try { await window.electronAPI.launchProfile(id) } catch (e: any) { alert(e?.message || "Launch failed") } setLaunchingId(null); load() }
  const handleClose = async (id: string) => { await window.electronAPI.closeBrowser(id); const rIds = await window.electronAPI.getRunningIds(); setRunningIds(new Set(rIds)) }
  const handleCloseAll = async () => { await window.electronAPI.closeAllBrowsers(); setRunningIds(new Set()) }
  const handleMultiLaunch = async () => { const ids = Array.from(selectedIds); if (ids.length === 0) return; await window.electronAPI.multiLaunch(ids); setSelectedIds(new Set()); load() }
  const handleLaunchAll = async () => { await window.electronAPI.multiLaunch(profiles.map(p => p.id)); load() }
  const handleSyncAll = async () => { const ids = await window.electronAPI.syncEnableAll(); setSyncedIds(new Set(ids)) }
  const handleGetCookies = async (p: Profile) => { const cookies = await window.electronAPI.getCookies(p.id); setCookiesModal({ name: p.name, cookies }) }
  const handleCopy = () => { if (cookiesModal) { navigator.clipboard.writeText(JSON.stringify(cookiesModal.cookies, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000) } }
  const handleRegenFp = async (id: string) => { await window.electronAPI.regenerateFingerprint(id); load() }
  const handleWarmup = async (id: string) => { await window.electronAPI.warmupProfile(id, 5) }
  const toggleSelect = (id: string) => { const s = new Set(selectedIds); if (s.has(id)) s.delete(id); else s.add(id); setSelectedIds(s) }
  const toggleSelectAll = () => { if (allSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map(p => p.id))) }
  const toggleSync = async (id: string) => { const enabled = syncedIds.has(id); await window.electronAPI.syncSetEnabled(id, !enabled); const sIds = await window.electronAPI.syncGetEnabledIds(); setSyncedIds(new Set(sIds)) }
  const toggleMaster = async (id: string) => { const newMaster = masterId === id ? null : id; await window.electronAPI.syncSetMaster(newMaster); setMasterId(newMaster); if (!newMaster) setMirrorActive(false) }
  const toggleMirror = async () => { const ns = !mirrorActive; setMirrorActive(ns); await window.electronAPI.syncMirrorToggle(ns) }
  const handleExport = async () => { const ids = selectedIds.size > 0 ? Array.from(selectedIds) : profiles.map(p => p.id); await window.electronAPI.exportProfiles(ids) }
  const handleImport = async () => { const count = await window.electronAPI.importProfiles(); if (count > 0) load() }
  const handleOpenChromeImport = async () => {
    const cp = await window.electronAPI.listChromeProfiles()
    setChromeProfiles(cp)
    setChromeSelectedProfile(cp.length > 0 ? cp[0].path : "")
    setChromeDomain("")
    setChromeImportTarget("")
    setChromeImportResult(null)
    setShowChromeImport(true)
  }
  const handleChromeImport = async () => {
    if (!chromeSelectedProfile || !chromeImportTarget) return
    setChromeImportLoading(true)
    setChromeImportResult(null)
    const result = await window.electronAPI.importChromeCookies(chromeSelectedProfile, chromeDomain || undefined)
    if (!result.ok) {
      setChromeImportResult({ ok: false, message: result.message })
      setChromeImportLoading(false)
      return
    }
    // Now inject cookies into target profile browser
    const cookiesJson = JSON.stringify(result.cookies)
    const injectResult = await window.electronAPI.importCookies(chromeImportTarget, cookiesJson)
    setChromeImportResult(injectResult)
    setChromeImportLoading(false)
  }
  const handleBulkCreate = async () => { const lines = bulkText.split('\n').filter(l => l.trim()); if (lines.length === 0) return; setBulkLoading(true); setBulkResult(null); const r = await window.electronAPI.bulkCreate(lines, bulkPrefix.trim() || "Profile"); setBulkResult(r); setBulkLoading(false); if (r.count > 0) load() }
  const handleImportCookies = async () => { if (!cookieImportModal || !cookieImportText.trim()) return; const r = await window.electronAPI.importCookies(cookieImportModal.id, cookieImportText); setCookieImportResult(r); if (r.ok) setTimeout(() => { setCookieImportModal(null); setCookieImportText(""); setCookieImportResult(null) }, 1500) }

  // Proxy Manager handlers
  const resetPmForm = () => { setPmLabel(""); setPmType("http"); setPmHost(""); setPmPort(""); setPmUser(""); setPmPass(""); setPmTestResult(null); setPmEditing(null) }
  const handlePmSubmit = async () => {
    const payload = { label: pmLabel.trim(), type: pmType, host: pmHost.trim(), port: parseInt(pmPort) || 0, username: pmUser.trim() || undefined, password: pmPass.trim() || undefined }
    if (pmEditing) await window.electronAPI.updateProxy(pmEditing, payload)
    else await window.electronAPI.createProxy(payload)
    resetPmForm(); const px = await window.electronAPI.getProxies(); setProxies(px)
  }
  const handlePmEdit = (px: SavedProxy) => { setPmEditing(px.id); setPmLabel(px.label); setPmType(px.type); setPmHost(px.host); setPmPort(px.port.toString()); setPmUser(px.username || ""); setPmPass(px.password || "") }
  const handlePmDelete = async (id: string) => { await window.electronAPI.deleteProxy(id); const px = await window.electronAPI.getProxies(); setProxies(px) }
  const handlePmTest = async () => { setPmTesting(true); setPmTestResult(null); const r = await window.electronAPI.testProxy({ type: pmType, host: pmHost, port: parseInt(pmPort) || 0, username: pmUser || undefined, password: pmPass || undefined }); setPmTestResult(r); setPmTesting(false) }
  const handlePmBulkAdd = async () => {
    const lines = pmBulkText.split('\n').filter(l => l.trim())
    let count = 0
    for (const line of lines) {
      const parts = line.trim().split(':')
      if (parts.length < 2) continue
      const host = parts[0]
      const port = parseInt(parts[1]) || 0
      const user = parts[2] || undefined
      const pass = parts[3] || undefined
      const type = (parts[4] === 'socks5' ? 'socks5' : 'http') as 'http' | 'socks5'
      await window.electronAPI.createProxy({ label: `${host}:${port}`, type, host, port, username: user, password: pass })
      count++
    }
    if (count > 0) { const px = await window.electronAPI.getProxies(); setProxies(px) }
    setPmBulkText(""); setPmBulkMode(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground select-none transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faShield} className="text-primary text-lg" />
          <span className="font-bold text-base">{t("app.title")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowAbout(true)} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={t("about.title")}><FontAwesomeIcon icon={faCircleInfo} /></button>
          <button onClick={() => setDark(!dark)} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={dark ? t("header.lightMode") : t("header.darkMode")}><FontAwesomeIcon icon={dark ? faSun : faMoon} /></button>
          <button onClick={() => setShowSettings(true)} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={t("header.settings")}><FontAwesomeIcon icon={faGear} /></button>
          <button onClick={() => { resetPmForm(); setShowProxyMgr(true) }} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={t("header.proxyManager")}><FontAwesomeIcon icon={faServer} /></button>
          <button onClick={() => setShowBulkModal(true)} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={t("header.bulkCreate")}><FontAwesomeIcon icon={faListUl} /></button>
          <button onClick={handleImport} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={t("header.import")}><FontAwesomeIcon icon={faFileImport} /></button>
          <button onClick={handleOpenChromeImport} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title="Import from Chrome"><FontAwesomeIcon icon={faDownload} /></button>
          <button onClick={handleExport} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={t("header.export")}><FontAwesomeIcon icon={faFileExport} /></button>
          <span className="w-px h-5 bg-border mx-1" />
          <button onClick={toggleSelectAll} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={allSelected ? t("header.deselectAll") : t("header.selectAll")}><FontAwesomeIcon icon={faCheckDouble} /></button>
          <button onClick={handleMultiLaunch} disabled={selectedIds.size === 0} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80 disabled:opacity-30" title={t("header.launchSelected")}><FontAwesomeIcon icon={faUsers} className="mr-1" />{selectedIds.size}</button>
          <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="px-2 py-1.5 bg-destructive/80 text-white rounded text-xs hover:bg-destructive disabled:opacity-30" title="Delete Selected"><FontAwesomeIcon icon={faTrash} /></button>
          <button onClick={handleLaunchAll} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80" title={t("header.launchAll")}><FontAwesomeIcon icon={faPlay} /></button>
          <button onClick={handleCloseAll} disabled={runningIds.size === 0} className="px-2 py-1.5 bg-destructive/80 text-white rounded text-xs hover:bg-destructive disabled:opacity-30" title="Stop All"><FontAwesomeIcon icon={faBan} /></button>
          <button onClick={handleSyncAll} disabled={runningIds.size === 0} className="px-2 py-1.5 bg-muted rounded text-xs hover:bg-muted/80 disabled:opacity-30" title="Sync All"><FontAwesomeIcon icon={faSync} /></button>
          <button onClick={openCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:opacity-90"><FontAwesomeIcon icon={faPlus} className="mr-1" />{t("header.new")}</button>
        </div>
      </header>

      {/* Sync Panel */}
      <div className="border-b border-border px-5 py-1.5">
        <button onClick={() => setSyncOpen(!syncOpen)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <FontAwesomeIcon icon={syncOpen ? faChevronUp : faChevronDown} className="text-[10px]" />
          Sync ({syncedIds.size}){mirrorActive && " | Mirror ON"}
        </button>
        {syncOpen && (
          <div className="mt-2 pb-2 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={toggleMirror} className={"px-2.5 py-1 rounded text-xs font-medium " + (mirrorActive ? "bg-green-600/20 text-green-400 border border-green-600/40" : "bg-muted text-muted-foreground")}>{mirrorActive ? "Mirror ON" : "Mirror OFF"}</button>
              {masterId && <span className="text-xs text-muted-foreground">Master: {profiles.find(p => p.id === masterId)?.name || "-"}</span>}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="flex gap-1"><input value={syncUrl} onChange={e => setSyncUrl(e.target.value)} placeholder="URL" className="flex-1 px-2 py-1 bg-card border border-border rounded text-xs" /><button onClick={() => syncUrl && window.electronAPI.syncNavigate(syncUrl)} className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"><FontAwesomeIcon icon={faLink} /></button></div>
              <div className="flex gap-1"><input value={syncX} onChange={e => setSyncX(e.target.value)} placeholder="X" className="w-14 px-2 py-1 bg-card border border-border rounded text-xs" /><input value={syncY} onChange={e => setSyncY(e.target.value)} placeholder="Y" className="w-14 px-2 py-1 bg-card border border-border rounded text-xs" /><button onClick={() => window.electronAPI.syncClick(parseFloat(syncX), parseFloat(syncY))} className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"><FontAwesomeIcon icon={faMousePointer} /></button></div>
              <div className="flex gap-1"><input value={syncText} onChange={e => setSyncText(e.target.value)} placeholder="Type..." className="flex-1 px-2 py-1 bg-card border border-border rounded text-xs" /><button onClick={() => syncText && window.electronAPI.syncType(syncText)} className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"><FontAwesomeIcon icon={faKeyboard} /></button></div>
              <div className="flex gap-1"><input value={syncScrollAmt} onChange={e => setSyncScrollAmt(e.target.value)} placeholder="px" className="w-16 px-2 py-1 bg-card border border-border rounded text-xs" /><button onClick={() => window.electronAPI.syncScroll(parseInt(syncScrollAmt))} className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"><FontAwesomeIcon icon={faArrowDown} /></button></div>
            </div>
          </div>
        )}
      </div>

      {/* Search + Group Filter */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
          <input type="text" placeholder={t("search.placeholder")} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-card border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
        </div>
        {groups.length > 0 && (
          <div className="flex items-center gap-1">
            <FontAwesomeIcon icon={faLayerGroup} className="text-muted-foreground text-xs" />
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="px-2 py-1.5 bg-card border border-border rounded text-xs">
              <option value="all">{t("filter.allGroups")}</option>
              <option value="ungrouped">{t("filter.ungrouped")}</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}
        <span className="text-xs text-muted-foreground">{t("profiles.count", { count: filtered.length })}</span>
      </div>

      {/* Profile Grid */}
      <main className="px-5 pb-5">
        {loading ? (
          <div className="flex justify-center py-16"><FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><FontAwesomeIcon icon={faGlobe} className="text-3xl opacity-40 mb-2" /><p className="text-sm">{t("profiles.noResults")}</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-2">
            {filtered.map(p => (
              <div key={p.id} className={"bg-card border rounded-lg p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 " + (selectedIds.has(p.id) ? "border-primary" : "border-border")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded w-3.5 h-3.5" />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-medium text-xs truncate max-w-[100px]">{p.name}</span>
                    {p.group && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{p.group}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {runningIds.has(p.id) && <span className="w-2 h-2 rounded-full bg-green-500" />}
                    {masterId === p.id && <FontAwesomeIcon icon={faCrown} className="text-yellow-400 text-[10px]" />}
                    <button onClick={() => toggleSync(p.id)} className={syncBtnClass(syncedIds.has(p.id))}>{syncedIds.has(p.id) ? "SYNC" : "OFF"}</button>
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5 mb-2">
                  <p className="truncate">{truncateUrl(p.startUrl || "https://www.google.com", 35)}</p>
                  <p>{p.proxy.type === "none" ? "Direct" : p.proxy.type + "://" + p.proxy.host + ":" + p.proxy.port}</p>
                  <p className="cursor-pointer hover:text-foreground" onClick={() => setFpModal({ name: p.name, fp: p.fingerprint })}>{shortenUA(p.fingerprint?.userAgent || "")} | {p.fingerprint?.viewport?.width}x{p.fingerprint?.viewport?.height}{p.autoRotateUA ? " (auto)" : ""}</p>
                  {p.lastUsedAt && <p>Last: {new Date(p.lastUsedAt).toLocaleDateString()} {new Date(p.lastUsedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</p>}
                  {runningIds.has(p.id) && resourceUsage.has(p.id) && (
                    <p className="text-[10px]"><span className="text-blue-400">CPU: {resourceUsage.get(p.id)!.cpu}%</span> <span className="text-green-400">RAM: {resourceUsage.get(p.id)!.memory}MB</span></p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {runningIds.has(p.id) ? (
                    <button onClick={() => handleClose(p.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-destructive/80 text-white rounded text-[11px]"><FontAwesomeIcon icon={faStop} className="text-[10px]" />{t("profile.stop")}</button>
                  ) : (
                    <button onClick={() => handleLaunch(p.id)} disabled={launchingId === p.id} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-[11px] disabled:opacity-50"><FontAwesomeIcon icon={launchingId === p.id ? faSpinner : faPlay} spin={launchingId === p.id} className="text-[10px]" />{t("profile.launch")}</button>
                  )}
                  <button onClick={() => toggleMaster(p.id)} className={"p-1.5 rounded text-[10px] " + (masterId === p.id ? "bg-yellow-500/20 text-yellow-400" : "bg-muted hover:bg-muted/80")} title="Master"><FontAwesomeIcon icon={faCrown} /></button>
                  <button onClick={() => openEdit(p)} className="p-1.5 bg-muted rounded hover:bg-muted/80" title="Edit"><FontAwesomeIcon icon={faPen} className="text-[10px]" /></button>
                  <button onClick={() => handleGetCookies(p)} className="p-1.5 bg-muted rounded hover:bg-muted/80" title="Export Cookies"><FontAwesomeIcon icon={faCookie} className="text-[10px]" /></button>
                  <button onClick={() => { setCookieImportText(""); setCookieImportResult(null); setCookieImportModal({ id: p.id, name: p.name }) }} className="p-1.5 bg-muted rounded hover:bg-muted/80" title="Import Cookies"><FontAwesomeIcon icon={faFileImport} className="text-[10px]" /></button>
                  <button onClick={() => handleRegenFp(p.id)} className="p-1.5 bg-muted rounded hover:bg-muted/80" title="Regenerate FP"><FontAwesomeIcon icon={faFingerprint} className="text-[10px]" /></button>
                  <button onClick={() => handleClone(p.id)} className="p-1.5 bg-muted rounded hover:bg-muted/80" title="Clone"><FontAwesomeIcon icon={faClone} className="text-[10px]" /></button>
                  <button onClick={() => handleWarmup(p.id)} disabled={!runningIds.has(p.id)} className="p-1.5 bg-muted rounded hover:bg-muted/80 disabled:opacity-30" title="Warmup (visit random sites)"><FontAwesomeIcon icon={faFire} className="text-[10px]" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-destructive/10 text-destructive rounded hover:bg-destructive/20" title="Delete"><FontAwesomeIcon icon={faTrash} className="text-[10px]" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Profile Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">{editingProfile ? "Edit Profile" : "New Profile"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Profile name" className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Group</label>
                <input value={formGroup} onChange={e => setFormGroup(e.target.value)} placeholder="e.g. Facebook, Gmail..." list="group-list" className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <datalist id="group-list">{groups.map(g => <option key={g} value={g} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLORS.map(c => (<button key={c} onClick={() => setFormColor(c)} className={"w-6 h-6 rounded-full " + (formColor === c ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "")} style={{ backgroundColor: c }} />))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Start URL</label>
                <input value={formStartUrl} onChange={e => setFormStartUrl(e.target.value)} placeholder="https://www.google.com" className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Proxy</label>
                <select value={formProxyId} onChange={e => setFormProxyId(e.target.value)} className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs">
                  <option value="none">None (Direct)</option>
                  {proxies.map(px => (<option key={px.id} value={px.id}>{px.label} ({px.type}://{px.host}:{px.port})</option>))}
                </select>
                <button onClick={() => { setShowModal(false); resetPmForm(); setShowProxyMgr(true) }} className="text-[11px] text-primary mt-1 hover:underline">+ Manage Proxies</button>
              </div>
              {proxies.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-1">Proxy Pool (rotate per launch)</label>
                <div className="max-h-24 overflow-y-auto border border-border rounded p-1.5 space-y-1">
                  {proxies.map(px => (
                    <label key={px.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={formProxyPool.includes(px.id)} onChange={e => { if (e.target.checked) setFormProxyPool([...formProxyPool, px.id]); else setFormProxyPool(formProxyPool.filter(x => x !== px.id)) }} className="rounded w-3 h-3" />
                      {px.label} ({px.type}://{px.host}:{px.port})
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">If pool is set, proxy rotates each launch (overrides single proxy above)</p>
              </div>
              )}
              {formProxyPool.length > 1 && (
              <div>
                <label className="block text-xs font-medium mb-1">Auto-Rotate Interval (minutes)</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={1440} value={formProxyRotateInterval} onChange={e => setFormProxyRotateInterval(parseInt(e.target.value) || 0)} placeholder="0 = disabled" className="w-24 px-3 py-1.5 bg-background border border-border rounded text-xs" />
                  <span className="text-[10px] text-muted-foreground">{formProxyRotateInterval > 0 ? `Rotate proxy every ${formProxyRotateInterval} min while running` : "Disabled (only rotate on launch)"}</span>
                </div>
              </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1">Notes</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Optional..." rows={2} className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="autoRotate" checked={formAutoRotate} onChange={e => setFormAutoRotate(e.target.checked)} className="rounded w-3.5 h-3.5" />
                <label htmlFor="autoRotate" className="text-xs">Auto-rotate fingerprint on each launch</label>
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-1.5 bg-muted rounded text-xs">Cancel</button>
              <button onClick={handleSubmit} disabled={!formName.trim()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs disabled:opacity-50">{editingProfile ? "Save" : "Create"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">{t("bulk.title")}</h2>
              <button onClick={() => { setShowBulkModal(false); setBulkResult(null) }} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">{t("bulk.prefix")}</label>
                <input value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value)} placeholder="Profile" className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t("bulk.proxyList")}</label>
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"1.2.3.4:8080:user:pass:http\n5.6.7.8:1080:::socks5\n9.10.11.12:3128"} rows={6} className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs font-mono resize-none" />
              </div>
              <p className="text-[11px] text-muted-foreground">{t("bulk.format")}</p>
              {bulkResult && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium">{bulkResult.count} created, {bulkResult.results.filter(r => !r.ok).length} failed:</p>
                  {bulkResult.results.filter(r => !r.ok).map((r, i) => (
                    <p key={i} className="text-[11px] text-destructive truncate">{r.line} - {r.message}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => { setShowBulkModal(false); setBulkResult(null) }} className="px-3 py-1.5 bg-muted rounded text-xs">{t("modal.cancel")}</button>
              <button onClick={handleBulkCreate} disabled={!bulkText.trim() || bulkLoading} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs disabled:opacity-50">
                {bulkLoading ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-1" />Checking...</> : t("bulk.create", { count: bulkText.split('\n').filter(l => l.trim()).length })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proxy Manager Modal */}
      {showProxyMgr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold"><FontAwesomeIcon icon={faServer} className="mr-2" />Proxy Manager</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setPmBulkMode(!pmBulkMode)} className={"px-2 py-1 rounded text-xs " + (pmBulkMode ? "bg-primary text-primary-foreground" : "bg-muted")}>{pmBulkMode ? "Single" : "Bulk"}</button>
                <button onClick={() => setShowProxyMgr(false)} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
              </div>
            </div>
            {pmBulkMode ? (
            <div className="p-4 border-b border-border space-y-2">
              <textarea value={pmBulkText} onChange={e => setPmBulkText(e.target.value)} placeholder={"host:port:user:pass:type\n1.2.3.4:8080:user:pass:http\n5.6.7.8:1080:::socks5\n9.10.11.12:3128"} rows={6} className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs font-mono resize-none" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">Format: host:port:user:pass:type (user/pass/type optional)</p>
                <button onClick={handlePmBulkAdd} disabled={!pmBulkText.trim()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs disabled:opacity-50">Add {pmBulkText.split('\n').filter(l => l.trim()).length} Proxies</button>
              </div>
            </div>
            ) : (
            <div className="p-4 border-b border-border space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <input value={pmLabel} onChange={e => setPmLabel(e.target.value)} placeholder="Label" className="col-span-2 px-2 py-1.5 bg-background border border-border rounded text-xs" />
                <select value={pmType} onChange={e => setPmType(e.target.value as "http" | "socks5")} className="px-2 py-1.5 bg-background border border-border rounded text-xs">
                  <option value="http">HTTP</option>
                  <option value="socks5">SOCKS5</option>
                </select>
                <button onClick={handlePmSubmit} disabled={!pmLabel.trim() || !pmHost.trim()} className="px-2 py-1.5 bg-primary text-primary-foreground rounded text-xs disabled:opacity-50">{pmEditing ? "Update" : "Add"}</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input value={pmHost} onChange={e => setPmHost(e.target.value)} placeholder="Host" className="col-span-2 px-2 py-1.5 bg-background border border-border rounded text-xs" />
                <input value={pmPort} onChange={e => setPmPort(e.target.value)} placeholder="Port" className="px-2 py-1.5 bg-background border border-border rounded text-xs" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input value={pmUser} onChange={e => setPmUser(e.target.value)} placeholder="Username" className="px-2 py-1.5 bg-background border border-border rounded text-xs" />
                <input type="password" value={pmPass} onChange={e => setPmPass(e.target.value)} placeholder="Password" className="px-2 py-1.5 bg-background border border-border rounded text-xs" />
                <button onClick={handlePmTest} disabled={pmTesting || !pmHost.trim()} className="flex items-center justify-center gap-1 px-2 py-1.5 bg-muted rounded text-xs disabled:opacity-50"><FontAwesomeIcon icon={pmTesting ? faSpinner : faGlobe} spin={pmTesting} className="text-[10px]" />Test</button>
              </div>
              {pmTestResult && <p className={"text-xs " + (pmTestResult.ok ? "text-green-500" : "text-destructive")}>{pmTestResult.message}</p>}
              {pmEditing && <button onClick={resetPmForm} className="text-[11px] text-muted-foreground hover:underline">Cancel edit</button>}
            </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">
              {proxies.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No proxies saved.</p>
              ) : (
                <div className="space-y-2">
                  {proxies.map(px => (
                    <div key={px.id} className="flex items-center justify-between bg-background border border-border rounded p-2">
                      <div className="text-xs"><span className="font-medium">{px.label}</span><span className="text-muted-foreground ml-2">{px.type}://{px.host}:{px.port}</span></div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePmEdit(px)} className="p-1 bg-muted rounded hover:bg-muted/80"><FontAwesomeIcon icon={faPen} className="text-[10px]" /></button>
                        <button onClick={() => handlePmDelete(px.id)} className="p-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20"><FontAwesomeIcon icon={faTrash} className="text-[10px]" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cookies Modal */}
      {cookiesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">Cookies - {cookiesModal.name}</h2>
              <button onClick={() => setCookiesModal(null)} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-[11px] bg-background border border-border rounded p-3 whitespace-pre-wrap break-all">{JSON.stringify(cookiesModal.cookies, null, 2)}</pre>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs"><FontAwesomeIcon icon={faCopy} className="text-[10px]" />{copied ? "Copied!" : "Copy JSON"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Fingerprint Modal */}
      {fpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">Fingerprint - {fpModal.name}</h2>
              <button onClick={() => setFpModal(null)} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="p-4 space-y-1.5 text-xs">
              <p><span className="text-muted-foreground">UA:</span> {fpModal.fp.userAgent}</p>
              <p><span className="text-muted-foreground">Platform:</span> {fpModal.fp.platform}</p>
              <p><span className="text-muted-foreground">Viewport:</span> {fpModal.fp.viewport.width}x{fpModal.fp.viewport.height}</p>
              <p><span className="text-muted-foreground">Timezone:</span> {fpModal.fp.timezone}</p>
              <p><span className="text-muted-foreground">Locale:</span> {fpModal.fp.locale}</p>
              <p><span className="text-muted-foreground">Cores:</span> {fpModal.fp.hardwareConcurrency}</p>
              <p><span className="text-muted-foreground">Memory:</span> {fpModal.fp.deviceMemory}GB</p>
              <p><span className="text-muted-foreground">WebGL:</span> {fpModal.fp.webglRenderer}</p>
              <p><span className="text-muted-foreground">Scale:</span> {fpModal.fp.deviceScaleFactor}x</p>
              <p><span className="text-muted-foreground">Depth:</span> {fpModal.fp.screenDepth}bit</p>
            </div>
          </div>
        </div>
      )}
      {/* Cookie Import Modal */}
      {cookieImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">{t("cookies.importTitle", { name: cookieImportModal.name })}</h2>
              <button onClick={() => setCookieImportModal(null)} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-muted-foreground">{t("cookies.importHint")}</p>
              <textarea value={cookieImportText} onChange={e => setCookieImportText(e.target.value)} placeholder={'[{"name":"sid","value":"abc","domain":".example.com"}]'} rows={8} className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs font-mono resize-none" />
              {cookieImportResult && <p className={"text-xs " + (cookieImportResult.ok ? "text-green-500" : "text-destructive")}>{cookieImportResult.message}</p>}
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setCookieImportModal(null)} className="px-3 py-1.5 bg-muted rounded text-xs">{t("modal.cancel")}</button>
              <button onClick={handleImportCookies} disabled={!cookieImportText.trim()} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs disabled:opacity-50">{t("cookies.import")}</button>
            </div>
          </div>
        </div>
      )}
      {/* Chrome Import Modal */}
      {showChromeImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold"><FontAwesomeIcon icon={faDownload} className="mr-2" />Import Cookies from Chrome</h2>
              <button onClick={() => setShowChromeImport(false)} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="p-4 space-y-3">
              {chromeProfiles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No Chrome profiles found. Make sure Chrome is installed.</p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">Chrome Profile</label>
                    <select value={chromeSelectedProfile} onChange={e => setChromeSelectedProfile(e.target.value)} className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs">
                      {chromeProfiles.map(cp => <option key={cp.path} value={cp.path}>{cp.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Domain Filter (optional)</label>
                    <input value={chromeDomain} onChange={e => setChromeDomain(e.target.value)} placeholder="e.g. facebook.com (leave empty for all)" className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Target Profile (must be running)</label>
                    <select value={chromeImportTarget} onChange={e => setChromeImportTarget(e.target.value)} className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs">
                      <option value="">-- Select --</option>
                      {profiles.filter(p => runningIds.has(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {profiles.filter(p => runningIds.has(p.id)).length === 0 && (
                      <p className="text-[10px] text-destructive mt-1">No running profiles. Launch a profile first.</p>
                    )}
                  </div>
                  {chromeImportResult && (
                    <p className={"text-xs " + (chromeImportResult.ok ? "text-green-500" : "text-destructive")}>{chromeImportResult.message}</p>
                  )}
                </>
              )}
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setShowChromeImport(false)} className="px-3 py-1.5 bg-muted rounded text-xs">{t("modal.cancel")}</button>
              <button onClick={handleChromeImport} disabled={chromeImportLoading || !chromeSelectedProfile || !chromeImportTarget} className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs disabled:opacity-50">
                {chromeImportLoading ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-1" />Importing...</> : "Import Cookies"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-semibold">{t("about.title")}</h2>
              <button onClick={() => setShowAbout(false)} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FontAwesomeIcon icon={faShield} className="text-primary text-2xl" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold">{t("app.title")}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t("about.version")} 2.0.0</p>
              </div>
              <p className="text-xs text-muted-foreground">{t("about.description")}</p>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">{t("about.features")}</p>
                <p className="text-[11px] text-muted-foreground">{t("about.featureList")}</p>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-primary">{t("about.credit")}</p>
                <a href="https://saweria.co/malasmalas" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-3 py-1.5 bg-pink-500 text-white rounded text-[11px] font-medium hover:bg-pink-600 transition-colors"><FontAwesomeIcon icon={faHeart} className="mr-1" />Support via Saweria</a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Saweria Support Toast */}
      {showSaweria && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-card border border-border rounded-xl shadow-lg p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faHeart} className="text-pink-500 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium mb-1">Support GhostBrowser</p>
                <p className="text-[11px] text-muted-foreground mb-2">Kalau tool ini berguna, boleh traktir kopi biar semangat develop terus.</p>
                <a href="https://saweria.co/malasmalas" target="_blank" rel="noopener noreferrer" className="inline-block px-3 py-1.5 bg-pink-500 text-white rounded text-[11px] font-medium hover:bg-pink-600 transition-colors">Traktir via Saweria</a>
              </div>
              <button onClick={() => setShowSaweria(false)} className="p-0.5 hover:bg-muted rounded text-muted-foreground"><FontAwesomeIcon icon={faXmark} className="text-xs" /></button>
            </div>
          </div>
        </div>
      )}
      <Settings open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
