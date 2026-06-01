import { useState, useCallback, createContext, useContext } from "react"

export type LocaleCode = string

interface TranslationMap {
  [key: string]: string
}

const EN: TranslationMap = {
  "app.title": "GhostBrowser",
  "header.new": "New",
  "header.proxyManager": "Proxy Manager",
  "header.bulkCreate": "Bulk Create",
  "header.import": "Import",
  "header.export": "Export",
  "header.selectAll": "Select All",
  "header.deselectAll": "Deselect All",
  "header.launchSelected": "Launch Selected",
  "header.launchAll": "Launch All",
  "header.lightMode": "Light Mode",
  "header.darkMode": "Dark Mode",
  "header.settings": "Settings",
  "header.extensions": "Extensions",
  "search.placeholder": "Search...",
  "filter.allGroups": "All Groups",
  "filter.ungrouped": "Ungrouped",
  "profiles.count": "{count} profiles",
  "profiles.noResults": "No profiles found.",
  "profile.launch": "Launch",
  "profile.stop": "Stop",
  "profile.edit": "Edit",
  "profile.delete": "Delete",
  "profile.exportCookies": "Export Cookies",
  "profile.importCookies": "Import Cookies",
  "profile.regenFp": "Regenerate FP",
  "profile.master": "Master",
  "profile.direct": "Direct",
  "profile.lastUsed": "Last",
  "profile.autoRotate": "(auto)",
  "modal.newProfile": "New Profile",
  "modal.editProfile": "Edit Profile",
  "modal.name": "Name",
  "modal.group": "Group",
  "modal.color": "Color",
  "modal.startUrl": "Start URL",
  "modal.proxy": "Proxy",
  "modal.proxyNone": "None (Direct)",
  "modal.proxyPool": "Proxy Pool (rotate per launch)",
  "modal.proxyPoolHint": "If pool is set, proxy rotates each launch",
  "modal.notes": "Notes",
  "modal.autoRotate": "Auto-rotate fingerprint on each launch",
  "modal.cancel": "Cancel",
  "modal.save": "Save",
  "modal.create": "Create",
  "modal.manageProxies": "+ Manage Proxies",
  "bulk.title": "Bulk Create Profiles",
  "bulk.prefix": "Name Prefix",
  "bulk.proxyList": "Proxy List (one per line: host:port:user:pass:type)",
  "bulk.format": "Format: host:port:username:password:type (optional)",
  "bulk.create": "Create {count} Profiles",
  "proxy.title": "Proxy Manager",
  "proxy.bulk": "Bulk",
  "proxy.single": "Single",
  "proxy.label": "Label",
  "proxy.host": "Host",
  "proxy.port": "Port",
  "proxy.username": "Username",
  "proxy.password": "Password",
  "proxy.test": "Test",
  "proxy.add": "Add",
  "proxy.update": "Update",
  "proxy.cancelEdit": "Cancel edit",
  "proxy.noProxies": "No proxies saved.",
  "proxy.bulkFormat": "Format: host:port:user:pass:type (optional)",
  "proxy.addCount": "Add {count} Proxies",
  "cookies.title": "Cookies - {name}",
  "cookies.copy": "Copy JSON",
  "cookies.copied": "Copied!",
  "cookies.importTitle": "Import Cookies - {name}",
  "cookies.importHint": "Paste cookies JSON array. Browser must be running.",
  "cookies.import": "Import",
  "fp.title": "Fingerprint - {name}",
  "fp.ua": "UA", "fp.platform": "Platform", "fp.viewport": "Viewport",
  "fp.timezone": "Timezone", "fp.locale": "Locale", "fp.cores": "Cores",
  "fp.memory": "Memory", "fp.webgl": "WebGL", "fp.scale": "Scale", "fp.depth": "Depth",
  "sync.label": "Sync", "sync.mirrorOn": "Mirror ON", "sync.mirrorOff": "Mirror OFF",
  "sync.master": "Master", "sync.url": "URL", "sync.type": "Type...",
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.password": "Profile Password",
  "settings.passwordHint": "Encrypt profiles with password (AES-256-GCM)",
  "settings.setPassword": "Set Password",
  "settings.changePassword": "Change Password",
  "settings.removePassword": "Remove Password",
  "settings.currentPassword": "Current Password",
  "settings.newPassword": "New Password",
  "settings.confirmPassword": "Confirm Password",
  "settings.blocklist": "DNS Blocklist",
  "settings.blocklistHint": "Block ads, trackers, and malware domains",
  "settings.blocklistEnabled": "Enabled",
  "settings.blocklistDisabled": "Disabled",
  "settings.blocklistRefresh": "Refresh Now",
  "settings.save": "Save",
  "settings.saved": "Saved!",
  "ext.title": "Extensions",
  "ext.add": "Add Extension",
  "ext.noExtensions": "No extensions added.",
  "ext.global": "Global (all profiles)",
  "ext.remove": "Remove",
  "ext.enabled": "Enabled",
  "ext.disabled": "Disabled",
  "about.title": "About",
  "about.version": "Version",
  "about.description": "Privacy-focused multi-profile browser with anti-detection fingerprint spoofing",
  "about.credit": "Made by injector sepuh pensiun",
  "about.features": "Features",
  "about.featureList": "Multi-profile isolation, Fingerprint spoofing, Proxy rotation, Sync/Mirror, Cookie management",
}
const ID: TranslationMap = {
  "app.title": "GhostBrowser",
  "header.new": "Baru",
  "header.proxyManager": "Kelola Proxy",
  "header.bulkCreate": "Buat Massal",
  "header.import": "Impor",
  "header.export": "Ekspor",
  "header.selectAll": "Pilih Semua",
  "header.deselectAll": "Batal Pilih",
  "header.launchSelected": "Jalankan Terpilih",
  "header.launchAll": "Jalankan Semua",
  "header.lightMode": "Mode Terang",
  "header.darkMode": "Mode Gelap",
  "header.settings": "Pengaturan",
  "header.extensions": "Ekstensi",
  "search.placeholder": "Cari...",
  "filter.allGroups": "Semua Grup",
  "filter.ungrouped": "Tanpa Grup",
  "profiles.count": "{count} profil",
  "profiles.noResults": "Tidak ada profil ditemukan.",
  "profile.launch": "Jalankan",
  "profile.stop": "Hentikan",
  "profile.edit": "Edit",
  "profile.delete": "Hapus",
  "profile.exportCookies": "Ekspor Cookie",
  "profile.importCookies": "Impor Cookie",
  "profile.regenFp": "Regenerasi FP",
  "profile.master": "Master",
  "profile.direct": "Langsung",
  "profile.lastUsed": "Terakhir",
  "profile.autoRotate": "(otomatis)",
  "modal.newProfile": "Profil Baru",
  "modal.editProfile": "Edit Profil",
  "modal.name": "Nama",
  "modal.group": "Grup",
  "modal.color": "Warna",
  "modal.startUrl": "URL Awal",
  "modal.proxy": "Proxy",
  "modal.proxyNone": "Tanpa (Langsung)",
  "modal.proxyPool": "Pool Proxy (rotasi per peluncuran)",
  "modal.proxyPoolHint": "Jika pool diatur, proxy berrotasi setiap peluncuran",
  "modal.notes": "Catatan",
  "modal.autoRotate": "Rotasi otomatis fingerprint setiap peluncuran",
  "modal.cancel": "Batal",
  "modal.save": "Simpan",
  "modal.create": "Buat",
  "modal.manageProxies": "+ Kelola Proxy",
  "bulk.title": "Buat Profil Massal",
  "bulk.prefix": "Awalan Nama",
  "bulk.proxyList": "Daftar Proxy (satu per baris: host:port:user:pass:type)",
  "bulk.format": "Format: host:port:username:password:type (opsional)",
  "bulk.create": "Buat {count} Profil",
  "proxy.title": "Kelola Proxy",
  "proxy.bulk": "Massal",
  "proxy.single": "Tunggal",
  "proxy.label": "Label",
  "proxy.host": "Host",
  "proxy.port": "Port",
  "proxy.username": "Username",
  "proxy.password": "Password",
  "proxy.test": "Tes",
  "proxy.add": "Tambah",
  "proxy.update": "Perbarui",
  "proxy.cancelEdit": "Batal edit",
  "proxy.noProxies": "Belum ada proxy tersimpan.",
  "proxy.bulkFormat": "Format: host:port:user:pass:type (opsional)",
  "proxy.addCount": "Tambah {count} Proxy",
  "cookies.title": "Cookie - {name}",
  "cookies.copy": "Salin JSON",
  "cookies.copied": "Tersalin!",
  "cookies.importTitle": "Impor Cookie - {name}",
  "cookies.importHint": "Tempel array JSON cookie. Browser harus berjalan.",
  "cookies.import": "Impor",
  "fp.title": "Fingerprint - {name}",
  "fp.ua": "UA", "fp.platform": "Platform", "fp.viewport": "Viewport",
  "fp.timezone": "Zona Waktu", "fp.locale": "Bahasa", "fp.cores": "Core",
  "fp.memory": "Memori", "fp.webgl": "WebGL", "fp.scale": "Skala", "fp.depth": "Kedalaman",
  "sync.label": "Sinkron", "sync.mirrorOn": "Mirror AKTIF", "sync.mirrorOff": "Mirror MATI",
  "sync.master": "Master", "sync.url": "URL", "sync.type": "Ketik...",
  "settings.title": "Pengaturan",
  "settings.language": "Bahasa",
  "settings.password": "Password Profil",
  "settings.passwordHint": "Enkripsi profil dengan password (AES-256-GCM)",
  "settings.setPassword": "Atur Password",
  "settings.changePassword": "Ubah Password",
  "settings.removePassword": "Hapus Password",
  "settings.currentPassword": "Password Saat Ini",
  "settings.newPassword": "Password Baru",
  "settings.confirmPassword": "Konfirmasi Password",
  "settings.blocklist": "Daftar Blokir DNS",
  "settings.blocklistHint": "Blokir iklan, pelacak, dan domain malware",
  "settings.blocklistEnabled": "Aktif",
  "settings.blocklistDisabled": "Nonaktif",
  "settings.blocklistRefresh": "Perbarui Sekarang",
  "settings.save": "Simpan",
  "settings.saved": "Tersimpan!",
  "ext.title": "Ekstensi",
  "ext.add": "Tambah Ekstensi",
  "ext.noExtensions": "Belum ada ekstensi.",
  "ext.global": "Global (semua profil)",
  "ext.remove": "Hapus",
  "ext.enabled": "Aktif",
  "ext.disabled": "Nonaktif",
  "about.title": "Tentang",
  "about.version": "Versi",
  "about.description": "Browser multi-profil berfokus privasi dengan anti-detection fingerprint spoofing",
  "about.credit": "Dibuat oleh injector sepuh pensiun",
  "about.features": "Fitur",
  "about.featureList": "Isolasi multi-profil, Fingerprint spoofing, Rotasi proxy, Sync/Mirror, Manajemen cookie",
}
const ZH: TranslationMap = {
  "app.title": "GhostBrowser",
  "header.new": "\u65b0\u5efa",
  "header.proxyManager": "\u4ee3\u7406\u7ba1\u7406",
  "header.bulkCreate": "\u6279\u91cf\u521b\u5efa",
  "header.import": "\u5bfc\u5165",
  "header.export": "\u5bfc\u51fa",
  "header.selectAll": "\u5168\u9009",
  "header.deselectAll": "\u53d6\u6d88\u5168\u9009",
  "header.launchSelected": "\u542f\u52a8\u5df2\u9009",
  "header.launchAll": "\u542f\u52a8\u5168\u90e8",
  "header.lightMode": "\u6d45\u8272\u6a21\u5f0f",
  "header.darkMode": "\u6df1\u8272\u6a21\u5f0f",
  "header.settings": "\u8bbe\u7f6e",
  "header.extensions": "\u6269\u5c55",
  "search.placeholder": "\u641c\u7d22...",
  "filter.allGroups": "\u6240\u6709\u5206\u7ec4",
  "filter.ungrouped": "\u672a\u5206\u7ec4",
  "profiles.count": "{count} \u4e2a\u914d\u7f6e",
  "profiles.noResults": "\u672a\u627e\u5230\u914d\u7f6e\u6587\u4ef6\u3002",
  "profile.launch": "\u542f\u52a8",
  "profile.stop": "\u505c\u6b62",
  "modal.cancel": "\u53d6\u6d88",
  "modal.save": "\u4fdd\u5b58",
  "modal.create": "\u521b\u5efa",
  "settings.title": "\u8bbe\u7f6e",
  "settings.language": "\u8bed\u8a00",
  "settings.save": "\u4fdd\u5b58",
  "settings.saved": "\u5df2\u4fdd\u5b58!",
  "ext.title": "\u6269\u5c55",
  "ext.add": "\u6dfb\u52a0\u6269\u5c55",
  "ext.noExtensions": "\u6682\u65e0\u6269\u5c55\u3002",
  "ext.global": "\u5168\u5c40\uff08\u6240\u6709\u914d\u7f6e\uff09",
  "ext.remove": "\u5220\u9664",
  "ext.enabled": "\u5df2\u542f\u7528",
  "ext.disabled": "\u5df2\u7981\u7528",
}

const JA: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "\u65b0\u898f",  "header.settings": "\u8a2d\u5b9a",  "header.extensions": "\u62e1\u5f35\u6a5f\u80fd",  "search.placeholder": "\u691c\u7d22...",  "profiles.count": "{count} \u30d7\u30ed\u30d5\u30a1\u30a4\u30eb",  "profiles.noResults": "\u30d7\u30ed\u30d5\u30a1\u30a4\u30eb\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002",  "profile.launch": "\u8d77\u52d5",  "profile.stop": "\u505c\u6b62",  "modal.cancel": "\u30ad\u30e3\u30f3\u30bb\u30eb",  "modal.save": "\u4fdd\u5b58",  "modal.create": "\u4f5c\u6210",  "settings.title": "\u8a2d\u5b9a",  "settings.language": "\u8a00\u8a9e",  "settings.save": "\u4fdd\u5b58",  "settings.saved": "\u4fdd\u5b58\u3057\u307e\u3057\u305f!",  "ext.title": "\u62e1\u5f35\u6a5f\u80fd",  "ext.add": "\u62e1\u5f35\u6a5f\u80fd\u3092\u8ffd\u52a0",  "ext.noExtensions": "\u62e1\u5f35\u6a5f\u80fd\u306a\u3057\u3002",  "ext.remove": "\u524a\u9664",  "ext.enabled": "\u6709\u52b9",  "ext.disabled": "\u7121\u52b9",
}


const KO: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "\uc0c8\ub85c",  "header.settings": "\uc124\uc815",  "header.extensions": "\ud655\uc7a5",  "search.placeholder": "\uac80\uc0c9...",  "profiles.count": "{count}\uac1c \ud504\ub85c\ud544",  "profiles.noResults": "\ud504\ub85c\ud544\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",  "profile.launch": "\uc2e4\ud589",  "profile.stop": "\uc815\uc9c0",  "modal.cancel": "\ucde8\uc18c",  "modal.save": "\uc800\uc7a5",  "modal.create": "\uc0dd\uc131",  "settings.title": "\uc124\uc815",  "settings.language": "\uc5b8\uc5b4",  "settings.save": "\uc800\uc7a5",  "settings.saved": "\uc800\uc7a5\ub428!",  "ext.title": "\ud655\uc7a5",  "ext.add": "\ud655\uc7a5 \ucd94\uac00",  "ext.noExtensions": "\ud655\uc7a5\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",  "ext.remove": "\uc0ad\uc81c",  "ext.enabled": "\ud65c\uc131",  "ext.disabled": "\ube44\ud65c\uc131",
}

const RU: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "\u041d\u043e\u0432\u044b\u0439",  "header.settings": "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",  "header.extensions": "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u0438\u044f",  "search.placeholder": "\u041f\u043e\u0438\u0441\u043a...",  "profiles.count": "{count} \u043f\u0440\u043e\u0444\u0438\u043b\u0435\u0439",  "profiles.noResults": "\u041f\u0440\u043e\u0444\u0438\u043b\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b.",  "profile.launch": "\u0417\u0430\u043f\u0443\u0441\u043a",  "profile.stop": "\u0421\u0442\u043e\u043f",  "modal.cancel": "\u041e\u0442\u043c\u0435\u043d\u0430",  "modal.save": "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",  "modal.create": "\u0421\u043e\u0437\u0434\u0430\u0442\u044c",  "settings.title": "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",  "settings.language": "\u042f\u0437\u044b\u043a",  "settings.save": "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",  "settings.saved": "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e!",  "ext.title": "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u0438\u044f",  "ext.add": "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c",  "ext.noExtensions": "\u041d\u0435\u0442 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u0438\u0439.",  "ext.remove": "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",  "ext.enabled": "\u0412\u043a\u043b.",  "ext.disabled": "\u0412\u044b\u043a\u043b.",
}


const ES: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "Nuevo",  "header.settings": "Ajustes",  "header.extensions": "Extensiones",  "search.placeholder": "Buscar...",  "profiles.count": "{count} perfiles",  "profiles.noResults": "No se encontraron perfiles.",  "profile.launch": "Iniciar",  "profile.stop": "Detener",  "modal.cancel": "Cancelar",  "modal.save": "Guardar",  "modal.create": "Crear",  "settings.title": "Ajustes",  "settings.language": "Idioma",  "settings.save": "Guardar",  "settings.saved": "Guardado!",  "ext.title": "Extensiones",  "ext.add": "Agregar",  "ext.noExtensions": "Sin extensiones.",  "ext.remove": "Eliminar",  "ext.enabled": "Activo",  "ext.disabled": "Inactivo",
}


const FR: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "Nouveau",  "header.settings": "Param\u00e8tres",  "header.extensions": "Extensions",  "search.placeholder": "Rechercher...",  "profiles.count": "{count} profils",  "profiles.noResults": "Aucun profil trouv\u00e9.",  "profile.launch": "Lancer",  "profile.stop": "Arr\u00eater",  "modal.cancel": "Annuler",  "modal.save": "Enregistrer",  "modal.create": "Cr\u00e9er",  "settings.title": "Param\u00e8tres",  "settings.language": "Langue",  "settings.save": "Enregistrer",  "settings.saved": "Enregistr\u00e9!",  "ext.title": "Extensions",  "ext.add": "Ajouter",  "ext.noExtensions": "Aucune extension.",  "ext.remove": "Supprimer",  "ext.enabled": "Activ\u00e9",  "ext.disabled": "D\u00e9sactiv\u00e9",
}


const DE: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "Neu",  "header.settings": "Einstellungen",  "header.extensions": "Erweiterungen",  "search.placeholder": "Suchen...",  "profiles.count": "{count} Profile",  "profiles.noResults": "Keine Profile gefunden.",  "profile.launch": "Starten",  "profile.stop": "Stoppen",  "modal.cancel": "Abbrechen",  "modal.save": "Speichern",  "modal.create": "Erstellen",  "settings.title": "Einstellungen",  "settings.language": "Sprache",  "settings.save": "Speichern",  "settings.saved": "Gespeichert!",  "ext.title": "Erweiterungen",  "ext.add": "Hinzuf\u00fcgen",  "ext.noExtensions": "Keine Erweiterungen.",  "ext.remove": "Entfernen",  "ext.enabled": "Aktiv",  "ext.disabled": "Inaktiv",
}


const PT: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "Novo",  "header.settings": "Configura\u00e7\u00f5es",  "header.extensions": "Extens\u00f5es",  "search.placeholder": "Pesquisar...",  "profiles.count": "{count} perfis",  "profiles.noResults": "Nenhum perfil encontrado.",  "profile.launch": "Iniciar",  "profile.stop": "Parar",  "modal.cancel": "Cancelar",  "modal.save": "Salvar",  "modal.create": "Criar",  "settings.title": "Configura\u00e7\u00f5es",  "settings.language": "Idioma",  "settings.save": "Salvar",  "settings.saved": "Salvo!",  "ext.title": "Extens\u00f5es",  "ext.add": "Adicionar",  "ext.noExtensions": "Sem extens\u00f5es.",  "ext.remove": "Remover",  "ext.enabled": "Ativo",  "ext.disabled": "Inativo",
}

const AR: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "\u062c\u062f\u064a\u062f",  "header.settings": "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a",  "header.extensions": "\u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062a",  "search.placeholder": "\u0628\u062d\u062b...",  "profiles.count": "{count} \u0645\u0644\u0641\u0627\u062a",  "profile.launch": "\u062a\u0634\u063a\u064a\u0644",  "profile.stop": "\u0625\u064a\u0642\u0627\u0641",  "modal.cancel": "\u0625\u0644\u063a\u0627\u0621",  "modal.save": "\u062d\u0641\u0638",  "modal.create": "\u0625\u0646\u0634\u0627\u0621",  "settings.title": "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a",  "settings.language": "\u0627\u0644\u0644\u063a\u0629",  "settings.save": "\u062d\u0641\u0638",  "settings.saved": "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638!",  "ext.title": "\u0627\u0644\u0625\u0636\u0627\u0641\u0627\u062a",  "ext.add": "\u0625\u0636\u0627\u0641\u0629",  "ext.remove": "\u062d\u0630\u0641",
}

const TH: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "\u0e43\u0e2b\u0e21\u0e48",  "header.settings": "\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32",  "header.extensions": "\u0e2a\u0e48\u0e27\u0e19\u0e02\u0e22\u0e32\u0e22",  "search.placeholder": "\u0e04\u0e49\u0e19\u0e2b\u0e32...",  "profiles.count": "{count} \u0e42\u0e1b\u0e23\u0e44\u0e1f\u0e25\u0e4c",  "profile.launch": "\u0e40\u0e1b\u0e34\u0e14",  "profile.stop": "\u0e2b\u0e22\u0e38\u0e14",  "modal.cancel": "\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01",  "modal.save": "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01",  "modal.create": "\u0e2a\u0e23\u0e49\u0e32\u0e07",  "settings.title": "\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32",  "settings.language": "\u0e20\u0e32\u0e29\u0e32",  "settings.save": "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01",  "settings.saved": "\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e41\u0e25\u0e49\u0e27!",  "ext.title": "\u0e2a\u0e48\u0e27\u0e19\u0e02\u0e22\u0e32\u0e22",  "ext.add": "\u0e40\u0e1e\u0e34\u0e48\u0e21",  "ext.remove": "\u0e25\u0e1a",
}

const VI: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "M\u1edbi",  "header.settings": "C\u00e0i \u0111\u1eb7t",  "header.extensions": "Ti\u1ec7n \u00edch",  "search.placeholder": "T\u00ecm ki\u1ebfm...",  "profiles.count": "{count} h\u1ed3 s\u01a1",  "profile.launch": "Kh\u1edfi ch\u1ea1y",  "profile.stop": "D\u1eebng",  "modal.cancel": "H\u1ee7y",  "modal.save": "L\u01b0u",  "modal.create": "T\u1ea1o",  "settings.title": "C\u00e0i \u0111\u1eb7t",  "settings.language": "Ng\u00f4n ng\u1eef",  "settings.save": "L\u01b0u",  "settings.saved": "\u0110\u00e3 l\u01b0u!",  "ext.title": "Ti\u1ec7n \u00edch",  "ext.add": "Th\u00eam",  "ext.remove": "X\u00f3a",
}

const TR: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "Yeni",  "header.settings": "Ayarlar",  "header.extensions": "Eklentiler",  "search.placeholder": "Ara...",  "profiles.count": "{count} profil",  "profile.launch": "Ba\u015flat",  "profile.stop": "Durdur",  "modal.cancel": "\u0130ptal",  "modal.save": "Kaydet",  "modal.create": "Olu\u015ftur",  "settings.title": "Ayarlar",  "settings.language": "Dil",  "settings.save": "Kaydet",  "settings.saved": "Kaydedildi!",  "ext.title": "Eklentiler",  "ext.add": "Ekle",  "ext.remove": "Kald\u0131r",
}

const HI: TranslationMap = {
  "app.title": "GhostBrowser",  "header.new": "\u0928\u092f\u093e",  "header.settings": "\u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938",  "header.extensions": "\u090f\u0915\u094d\u0938\u091f\u0947\u0902\u0936\u0928",  "search.placeholder": "\u0916\u094b\u091c\u0947\u0902...",  "profiles.count": "{count} \u092a\u094d\u0930\u094b\u092b\u093e\u0907\u0932",  "profile.launch": "\u0936\u0941\u0930\u0942",  "profile.stop": "\u0930\u094b\u0915\u0947\u0902",  "modal.cancel": "\u0930\u0926\u094d\u0926",  "modal.save": "\u0938\u0947\u0935",  "modal.create": "\u092c\u0928\u093e\u090f\u0902",  "settings.title": "\u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938",  "settings.language": "\u092d\u093e\u0937\u093e",  "settings.save": "\u0938\u0947\u0935",  "settings.saved": "\u0938\u0947\u0935 \u0939\u094b \u0917\u092f\u093e!",  "ext.title": "\u090f\u0915\u094d\u0938\u091f\u0947\u0902\u0936\u0928",  "ext.add": "\u091c\u094b\u0921\u093c\u0947\u0902",  "ext.remove": "\u0939\u091f\u093e\u090f\u0902",
}
const LOCALE_NAMES: Record<string, string> = {
  en: "English", id: "Bahasa Indonesia", zh: "\u4e2d\u6587", ja: "\u65e5\u672c\u8a9e", ko: "\ud55c\uad6d\uc5b4",
  ru: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", es: "Espa\u00f1ol", fr: "Fran\u00e7ais", de: "Deutsch", pt: "Portugu\u00eas",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", th: "\u0e44\u0e17\u0e22", vi: "Ti\u1ebfng Vi\u1ec7t", tr: "T\u00fcrk\u00e7e", hi: "\u0939\u093f\u0928\u094d\u0926\u0940",
}

export const SUPPORTED_LOCALES = Object.entries(LOCALE_NAMES).map(([code, name]) => ({ code, name }))

const translations: Record<string, TranslationMap> = {
  en: EN, id: ID, zh: ZH, ja: JA, ko: KO, ru: RU, es: ES, fr: FR, de: DE, pt: PT,
  ar: AR, th: TH, vi: VI, tr: TR, hi: HI,
}

export function t(key: string, locale: string, params?: Record<string, string | number>): string {
  const map = translations[locale] || translations["en"]
  let val = map[key] ?? translations["en"][key] ?? key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v))
    })
  }
  return val
}

interface I18nContextValue {
  locale: string
  setLocale: (l: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
})

export function useI18n() {
  return useContext(I18nContext)
}

export function useI18nProvider() {
  const [locale, setLocaleState] = useState<string>(() => {
    return localStorage.getItem("mb-locale") || "en"
  })

  const setLocale = useCallback((l: string) => {
    setLocaleState(l)
    localStorage.setItem("mb-locale", l)
  }, [])

  const translate = useCallback((key: string, params?: Record<string, string | number>) => {
    return t(key, locale, params)
  }, [locale])

  return { locale, setLocale, t: translate }
}