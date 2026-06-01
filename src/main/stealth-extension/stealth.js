(function() {
  // Webdriver - comprehensive removal
  Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });
  const navProto = Object.getPrototypeOf(navigator);
  if (Object.getOwnPropertyDescriptor(navProto, 'webdriver')) {
    Object.defineProperty(navProto, 'webdriver', { get: () => false, configurable: true });
  }

  // Remove automation indicators
  for (const key of Object.keys(window)) {
    if (/^cdc_/.test(key) || /^__webdriver/.test(key) || /^__selenium/.test(key) || /^__driver/.test(key)) {
      try { delete window[key]; } catch(e) {}
    }
  }

  // Document focus
  Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
  Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
  document.hasFocus = () => true;

  // Vendor
  Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });

  // Function.prototype.toString spoofing
  const origToString = Function.prototype.toString;
  const spoofedFns = new WeakSet();
  Function.prototype.toString = function() {
    if (spoofedFns.has(this)) return 'function ' + (this.name || '') + '() { [native code] }';
    return origToString.call(this);
  };
  spoofedFns.add(Function.prototype.toString);
  const markNative = (fn) => { spoofedFns.add(fn); return fn; };

  // Chrome runtime
  if (!window.chrome) window.chrome = {};
  if (!window.chrome.app) {
    window.chrome.app = { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } };
  }
  if (!window.chrome.runtime) {
    window.chrome.runtime = { OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' }, OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' }, PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' }, PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' }, PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' }, RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' }, connect: function(){}, sendMessage: function(){} };
  }
  if (!window.chrome.csi) window.chrome.csi = function(){ return {}; };
  if (!window.chrome.loadTimes) window.chrome.loadTimes = function(){ return {}; };

  // Plugins
  const makePluginArray = () => {
    const plugins = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
    ];
    const arr = Object.create(PluginArray.prototype);
    plugins.forEach((p, i) => { arr[i] = Object.create(Plugin.prototype, { name: {value:p.name}, filename: {value:p.filename}, description: {value:p.description}, length: {value:1} }); });
    Object.defineProperty(arr, 'length', { value: plugins.length });
    return arr;
  };
  Object.defineProperty(navigator, 'plugins', { get: makePluginArray });

  // Permissions
  const origQuery = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = markNative(function(params) {
    if (params.name === 'notifications') return Promise.resolve({ state: 'default', onchange: null });
    return origQuery(params).catch(() => Promise.resolve({ state: 'prompt', onchange: null }));
  });

  // Performance.now noise
  const origPerfNow = performance.now.bind(performance);
  performance.now = markNative(function() { return origPerfNow() + (Math.random() * 0.001); });

  // Error stack filtering (remove CDP/puppeteer traces)
  const origErrorStack = Object.getOwnPropertyDescriptor(Error.prototype, 'stack');
  if (origErrorStack && origErrorStack.get) {
    Object.defineProperty(Error.prototype, 'stack', {
      get: function() {
        const stack = origErrorStack.get.call(this);
        if (stack && typeof stack === 'string') {
          return stack.replace(/puppeteer/gi, '').replace(/cdp/gi, '').replace(/devtools/gi, '').replace(/__puppeteer_evaluation_script__/g, '');
        }
        return stack;
      },
      configurable: true
    });
  }

  // Prevent navigator.webdriver from showing in property enumeration
  const origGetOwnPropNames = Object.getOwnPropertyNames;
  Object.getOwnPropertyNames = function(obj) {
    const result = origGetOwnPropNames.call(Object, obj);
    if (obj === navigator || obj === navProto) {
      return result.filter(p => p !== 'webdriver');
    }
    return result;
  };
  spoofedFns.add(Object.getOwnPropertyNames);

  const origGetOwnPropDesc = Object.getOwnPropertyDescriptor;
  Object.getOwnPropertyDescriptor = function(obj, prop) {
    if ((obj === navigator || obj === navProto) && prop === 'webdriver') return undefined;
    return origGetOwnPropDesc.call(Object, obj, prop);
  };
  spoofedFns.add(Object.getOwnPropertyDescriptor);

  // Window history length
  Object.defineProperty(window.history, 'length', { get: () => Math.floor(Math.random() * 5) + 2 });

  // MediaDevices
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    const origEnum = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = markNative(async function() {
      const devices = await origEnum();
      return devices.map((d, i) => ({ deviceId: 'dev_' + i, groupId: 'grp_' + i, kind: d.kind, label: '' }));
    });
  }

  // Notification
  if (window.Notification) {
    Object.defineProperty(Notification, 'permission', { get: () => 'default', configurable: true });
  }

  // Connection
  if (navigator.connection) {
    Object.defineProperty(navigator.connection, 'type', { get: () => 'wifi' });
    Object.defineProperty(navigator.connection, 'effectiveType', { get: () => '4g' });
    Object.defineProperty(navigator.connection, 'downlink', { get: () => (Math.random() * 8 + 5) });
    Object.defineProperty(navigator.connection, 'rtt', { get: () => Math.floor(Math.random() * 50 + 25) });
    Object.defineProperty(navigator.connection, 'saveData', { get: () => false });
  }

  // Battery
  if (navigator.getBattery) {
    navigator.getBattery = markNative(function() {
      return Promise.resolve({
        charging: true, chargingTime: 0, dischargingTime: Infinity, level: 0.7 + Math.random() * 0.3,
        addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true
      });
    });
  }
})();
