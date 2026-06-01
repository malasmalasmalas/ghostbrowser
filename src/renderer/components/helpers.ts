export function formatTime(ts?: number): string {
  if (!ts) return "Never"
  return new Date(ts).toLocaleDateString()
}

export function truncateUrl(url: string, max = 30): string {
  if (!url) return "-"
  return url.length > max ? url.slice(0, max) + "..." : url
}

export function shortenUA(ua: string): string {
  const m = ua.match(/Chrome\/(\d+)/)
  const pl = ua.includes("Win") ? "Win" : ua.includes("Mac") ? "Mac" : "Linux"
  return m ? "Chrome/" + m[1] + " " + pl : ua.slice(0, 20)
}

export function cardClass(selected: boolean): string {
  return "bg-card border rounded-xl p-4 transition-colors " + (selected ? "border-primary" : "border-border hover:border-primary/30")
}

export function syncBtnClass(synced: boolean): string {
  return "px-1.5 py-0.5 rounded text-[10px] font-medium " + (synced ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
}

export const COLORS = ["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#6366f1"]
