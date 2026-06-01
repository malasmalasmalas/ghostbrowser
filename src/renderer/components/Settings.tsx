import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark, faGlobe, faPuzzlePiece, faTrash, faCheck, faSearch } from "@fortawesome/free-solid-svg-icons"
import { useI18n, SUPPORTED_LOCALES } from "../i18n"
import type { ExtensionInfo } from "@shared/types"

interface Props {
  open: boolean
  onClose: () => void
}

export default function Settings({ open, onClose }: Props) {
  const { locale, setLocale, t } = useI18n()
  const [saved, setSaved] = useState(false)
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([])
  const [detecting, setDetecting] = useState(false)
  const [detectedExts, setDetectedExts] = useState<{ id: string; name: string; version: string; path: string; enabled: boolean; description: string }[]>([])
  const [showDetected, setShowDetected] = useState(false)

  useEffect(() => {
    if (!open) return
    window.electronAPI.getExtensions().then(setExtensions)
  }, [open])

  if (!open) return null

  const handleLanguageChange = (code: string) => {
    setLocale(code)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleAddExtension = async () => {
    const ext = await window.electronAPI.addExtension()
    if (ext) setExtensions([...extensions, ext])
  }

  const handleDeleteExtension = async (id: string) => {
    await window.electronAPI.deleteExtension(id)
    setExtensions(extensions.filter(e => e.id !== id))
  }

  const handleToggleExtension = async (id: string, enabled: boolean) => {
    await window.electronAPI.updateExtension(id, { enabled })
    setExtensions(extensions.map(e => e.id === id ? { ...e, enabled } : e))
  }

  const handleDetectFromChrome = async () => {
    setDetecting(true)
    const detected = await window.electronAPI.detectChromeExtensions()
    setDetectedExts(detected)
    setShowDetected(true)
    setDetecting(false)
  }

  const handleImportDetected = async (ext: { id: string; name: string; path: string; enabled: boolean }) => {
    // Add as extension to GhostBrowser
    const existing = extensions.find(e => e.path === ext.path)
    if (existing) return // Already added
    await window.electronAPI.addExtensionFromPath?.(ext.path, ext.name, ext.enabled)
    // Refresh
    const updated = await window.electronAPI.getExtensions()
    setExtensions(updated)
    // Remove from detected list
    setDetectedExts(detectedExts.filter(d => d.id !== ext.id))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold">{t("settings.title")}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <div className="p-4 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faGlobe} className="text-primary text-sm" />
              <span className="text-xs font-medium">{t("settings.language")}</span>
              {saved && <span className="text-[10px] text-green-500 ml-auto">{t("settings.saved")}</span>}
            </div>
            <select value={locale} onChange={e => handleLanguageChange(e.target.value)} className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs">
              {SUPPORTED_LOCALES.map(l => <option key={l.code} value={l.code}>{l.name} ({l.code})</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon icon={faPuzzlePiece} className="text-primary text-sm" />
              <span className="text-xs font-medium">{t("ext.title")}</span>
              <button onClick={handleDetectFromChrome} disabled={detecting} className="ml-auto px-2 py-1 bg-muted text-muted-foreground rounded text-[11px] hover:bg-muted/80 disabled:opacity-50">
                <FontAwesomeIcon icon={faSearch} className="mr-1" />{detecting ? "Scanning..." : "Detect from Chrome"}
              </button>
              <button onClick={handleAddExtension} className="px-2 py-1 bg-primary text-primary-foreground rounded text-[11px]">{t("ext.add")}</button>
            </div>
            {showDetected && detectedExts.length > 0 && (
              <div className="mb-3 border border-border rounded p-2 bg-background">
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Detected from Chrome ({detectedExts.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {detectedExts.map(ext => (
                    <div key={ext.id} className="flex items-center justify-between bg-card border border-border rounded p-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{ext.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">v{ext.version}{ext.enabled ? "" : " (disabled in Chrome)"}</p>
                      </div>
                      <button onClick={() => handleImportDetected(ext)} className="flex-shrink-0 px-2 py-0.5 bg-primary text-primary-foreground rounded text-[10px] ml-2">Import</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showDetected && detectedExts.length === 0 && !detecting && (
              <p className="text-[11px] text-muted-foreground mb-2">No extensions detected from Chrome.</p>
            )}
            {extensions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{t("ext.noExtensions")}</p>
            ) : (
              <div className="space-y-1.5">
                {extensions.map(ext => (
                  <div key={ext.id} className="flex items-center justify-between bg-background border border-border rounded p-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleExtension(ext.id, !ext.enabled)} className={"w-4 h-4 rounded flex items-center justify-center text-[9px] " + (ext.enabled ? "bg-green-600 text-white" : "bg-muted text-muted-foreground")}>
                        {ext.enabled && <FontAwesomeIcon icon={faCheck} />}
                      </button>
                      <span className="text-xs">{ext.name}</span>
                      {ext.global && <span className="text-[9px] bg-muted px-1 py-0.5 rounded text-muted-foreground">{t("ext.global")}</span>}
                    </div>
                    <button onClick={() => handleDeleteExtension(ext.id)} className="p-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20"><FontAwesomeIcon icon={faTrash} className="text-[10px]" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
