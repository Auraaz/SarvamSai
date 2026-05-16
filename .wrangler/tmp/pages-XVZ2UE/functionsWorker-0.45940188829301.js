var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// api/access-profile.js
function normalizeProfile(raw, fallbackEmail) {
  const source = raw || {};
  const email = String(source.email || source.userEmail || fallbackEmail || "").trim().toLowerCase();
  const name = String(source.name || source.fullName || source.userName || "").trim();
  const code = String(source.access_code || source.accessCode || source.code || "").trim();
  const passphrase = String(source.passphrase || source.personalMessage || "").trim();
  const invitesLeft = Number(source.invitesLeft ?? source.invites_left ?? source.maxInvites ?? 3);
  const invitesUsed = Number(source.invitesUsed ?? source.invites_used ?? source.inviteCount ?? 0);
  const status = String(source.status || "active").trim().toLowerCase();
  return {
    email,
    name,
    code,
    passphrase,
    invitesLeft: Number.isFinite(invitesLeft) ? invitesLeft : 3,
    invitesUsed: Number.isFinite(invitesUsed) ? invitesUsed : 0,
    status
  };
}
__name(normalizeProfile, "normalizeProfile");
async function onRequestGet({ request, env: env2 }) {
  const requestUrl = new URL(request.url);
  const email = String(requestUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) {
    return Response.json({ success: false, error: "email query param is required." }, { status: 400 });
  }
  const appsScriptUrl = String(env2.APPS_SCRIPT_URL || "").trim();
  if (!appsScriptUrl) {
    return Response.json({ success: false, error: "APPS_SCRIPT_URL is not configured." }, { status: 500 });
  }
  const internalToken = String(env2.INTERNAL_API_TOKEN || "").trim();
  const targetUrl = new URL(appsScriptUrl);
  targetUrl.searchParams.set("action", "getDarshanAccessProfile");
  targetUrl.searchParams.set("email", email);
  if (internalToken) targetUrl.searchParams.set("token", internalToken);
  const upstream = await fetch(targetUrl.toString(), { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      { success: false, error: payload?.error || "Apps Script profile fetch failed." },
      { status: upstream.status }
    );
  }
  const rawProfile = payload?.profile || payload?.user || payload?.data || payload;
  const profile3 = normalizeProfile(rawProfile, email);
  if (!profile3.email) {
    return Response.json({ success: false, error: "Profile not found." }, { status: 404 });
  }
  return Response.json({ success: true, profile: profile3 });
}
__name(onRequestGet, "onRequestGet");

// api/admin-orders.js
function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
__name(unauthorized, "unauthorized");
function readToken(request) {
  const url = new URL(request.url);
  const queryToken = String(url.searchParams.get("token") || "").trim();
  if (queryToken) return queryToken;
  const authHeader = String(request.headers.get("authorization") || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return "";
}
__name(readToken, "readToken");
async function ensureTables(db) {
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          order_id TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          total_items INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0,
          currency TEXT DEFAULT 'INR',
          status TEXT DEFAULT 'confirmed',
          items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          payment_id TEXT NOT NULL,
          order_id TEXT NOT NULL,
          email TEXT NOT NULL,
          item_index INTEGER NOT NULL,
          item_type TEXT,
          recipient_name TEXT,
          recipient_phone TEXT,
          address_line1 TEXT,
          address_line2 TEXT,
          city TEXT,
          state TEXT,
          pincode TEXT,
          country TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
}
__name(ensureTables, "ensureTables");
async function onRequestGet2({ request, env: env2 }) {
  const expectedToken = String(env2.ADMIN_DASHBOARD_TOKEN || "").trim();
  if (!expectedToken) {
    return Response.json({ error: "ADMIN_DASHBOARD_TOKEN is not configured." }, { status: 500 });
  }
  const suppliedToken = readToken(request);
  if (!suppliedToken || suppliedToken !== expectedToken) {
    return unauthorized();
  }
  if (!env2.DB) {
    return Response.json({ error: "D1 database binding is not configured." }, { status: 500 });
  }
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") || 100);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 100));
  const offsetRaw = Number(url.searchParams.get("offset") || 0);
  const offset = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);
  await ensureTables(env2.DB);
  const ordersResult = await env2.DB.prepare(
    `
        SELECT email, order_id, payment_id, total_items, total_amount, currency, status, created_at
        FROM orders
        ORDER BY datetime(created_at) DESC
        LIMIT ? OFFSET ?
      `
  ).bind(limit, offset).all();
  const rows = Array.isArray(ordersResult?.results) ? ordersResult.results : [];
  const itemsResult = await env2.DB.prepare(
    `
        SELECT payment_id, item_index, item_type, recipient_name, recipient_phone,
               address_line1, address_line2, city, state, pincode, country
        FROM order_items
        ORDER BY datetime(created_at) DESC, item_index ASC
      `
  ).all();
  const itemRows = Array.isArray(itemsResult?.results) ? itemsResult.results : [];
  const itemsByPayment = itemRows.reduce((acc, row) => {
    const paymentId = String(row.payment_id || "").trim();
    if (!paymentId) return acc;
    if (!acc[paymentId]) acc[paymentId] = [];
    acc[paymentId].push({
      type: String(row.item_type || "").trim(),
      name: String(row.recipient_name || "").trim(),
      phone: String(row.recipient_phone || "").trim(),
      addressLine1: String(row.address_line1 || "").trim(),
      addressLine2: String(row.address_line2 || "").trim(),
      city: String(row.city || "").trim(),
      state: String(row.state || "").trim(),
      pincode: String(row.pincode || "").trim(),
      country: String(row.country || "").trim()
    });
    return acc;
  }, {});
  const orders = rows.map((row) => {
    const paymentId = String(row.payment_id || "").trim();
    return {
      email: String(row.email || "").trim().toLowerCase(),
      orderId: String(row.order_id || "").trim(),
      paymentId,
      totalItems: Number(row.total_items) || 0,
      totalAmount: Number(row.total_amount) || 0,
      currency: String(row.currency || "INR").trim().toUpperCase(),
      status: String(row.status || "").trim(),
      createdAt: String(row.created_at || "").trim(),
      items: itemsByPayment[paymentId] || []
    };
  });
  return Response.json({ orders, limit, offset });
}
__name(onRequestGet2, "onRequestGet");

// api/admin-orders-csv.js
function unauthorized2() {
  return new Response("Unauthorized", { status: 401 });
}
__name(unauthorized2, "unauthorized");
function readToken2(request) {
  const url = new URL(request.url);
  const queryToken = String(url.searchParams.get("token") || "").trim();
  if (queryToken) return queryToken;
  const authHeader = String(request.headers.get("authorization") || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return "";
}
__name(readToken2, "readToken");
function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
__name(escapeCsv, "escapeCsv");
function parsePrimaryRecipientDetails(itemsJsonRaw) {
  try {
    const items = JSON.parse(String(itemsJsonRaw || "[]"));
    if (!Array.isArray(items) || !items.length) {
      return { phone: "", shippingAddress: "" };
    }
    const first = items[0] || {};
    const shippingAddress = [
      String(first.addressLine1 || "").trim(),
      String(first.addressLine2 || "").trim(),
      String(first.city || "").trim(),
      String(first.state || "").trim(),
      String(first.pincode || "").trim(),
      String(first.country || "").trim()
    ].filter(Boolean).join(", ");
    return {
      phone: String(first.phone || "").trim(),
      shippingAddress
    };
  } catch (_error) {
    return { phone: "", shippingAddress: "" };
  }
}
__name(parsePrimaryRecipientDetails, "parsePrimaryRecipientDetails");
async function ensureOrdersTable(db) {
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          order_id TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          total_items INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0,
          currency TEXT DEFAULT 'INR',
          status TEXT DEFAULT 'confirmed',
          items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
}
__name(ensureOrdersTable, "ensureOrdersTable");
async function onRequestGet3({ request, env: env2 }) {
  const expectedToken = String(env2.ADMIN_DASHBOARD_TOKEN || "").trim();
  if (!expectedToken) {
    return new Response("ADMIN_DASHBOARD_TOKEN is not configured.", { status: 500 });
  }
  const suppliedToken = readToken2(request);
  if (!suppliedToken || suppliedToken !== expectedToken) {
    return unauthorized2();
  }
  if (!env2.DB) {
    return new Response("D1 database binding is not configured.", { status: 500 });
  }
  await ensureOrdersTable(env2.DB);
  const url = new URL(request.url);
  const emailFilter = String(url.searchParams.get("email") || "").trim().toLowerCase();
  const limitRaw = Number(url.searchParams.get("limit") || 5e3);
  const limit = Math.max(1, Math.min(2e4, Number.isFinite(limitRaw) ? limitRaw : 5e3));
  let query = `
    SELECT order_id, payment_id, email, total_amount, total_items, items_json, status, created_at
    FROM orders
  `;
  const binds = [];
  if (emailFilter) {
    query += " WHERE email = ? ";
    binds.push(emailFilter);
  }
  query += " ORDER BY datetime(created_at) DESC LIMIT ? ";
  binds.push(limit);
  const result = await env2.DB.prepare(query).bind(...binds).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  const header = [
    "Order ID",
    "Payment ID",
    "Email",
    "Amount",
    "Status",
    "Email Sent",
    "Number of Discovery Boxes",
    "Phone",
    "Shipping Address",
    "Timestamp"
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    const recipientDetails = parsePrimaryRecipientDetails(row.items_json);
    lines.push(
      [
        escapeCsv(row.order_id),
        escapeCsv(row.payment_id),
        escapeCsv(String(row.email || "").trim().toLowerCase()),
        escapeCsv(Number(row.total_amount) || 0),
        escapeCsv(String(row.status || "confirmed").trim()),
        "NO",
        escapeCsv(Math.max(0, Number(row.total_items) || 0)),
        escapeCsv(recipientDetails.phone),
        escapeCsv(recipientDetails.shippingAddress),
        escapeCsv(String(row.created_at || ""))
      ].join(",")
    );
  }
  const csv = "\uFEFF" + lines.join("\n");
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const filename = `orders-export-${timestamp}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
__name(onRequestGet3, "onRequestGet");

// api/razorpay-shipping-notes.js
var NOTE_VALUE_MAX = 256;
var NOTE_KEY_MAX = 15;
function normalizeCheckoutItems(itemsRaw) {
  if (!Array.isArray(itemsRaw)) return [];
  return itemsRaw.map((item) => ({
    type: item?.type === "self" ? "self" : "gift",
    name: String(item?.name || "").trim(),
    phone: String(item?.phone || "").trim(),
    addressLine1: String(item?.addressLine1 || "").trim(),
    addressLine2: String(item?.addressLine2 || "").trim(),
    city: String(item?.city || "").trim(),
    state: String(item?.state || "").trim(),
    pincode: String(item?.pincode || "").trim(),
    country: String(item?.country || "India").trim() || "India"
  })).filter((item) => item.name || item.addressLine1 || item.phone);
}
__name(normalizeCheckoutItems, "normalizeCheckoutItems");
function noteValue(value) {
  return String(value ?? "").trim().slice(0, NOTE_VALUE_MAX);
}
__name(noteValue, "noteValue");
function compactItemForNotes(item) {
  return {
    t: item.type === "self" ? "s" : "g",
    n: item.name,
    p: item.phone,
    a1: item.addressLine1,
    a2: item.addressLine2,
    c: item.city,
    s: item.state,
    pin: item.pincode,
    co: item.country || "India"
  };
}
__name(compactItemForNotes, "compactItemForNotes");
function expandCompactItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.n || raw.name || "").trim();
  const addressLine1 = String(raw.a1 || raw.addressLine1 || "").trim();
  const phone = String(raw.p || raw.phone || "").trim();
  if (!name && !addressLine1 && !phone) return null;
  const typeToken = String(raw.t || raw.type || "g").trim().toLowerCase();
  return {
    type: typeToken === "s" || typeToken === "self" ? "self" : "gift",
    name,
    phone,
    addressLine1,
    addressLine2: String(raw.a2 || raw.addressLine2 || "").trim(),
    city: String(raw.c || raw.city || "").trim(),
    state: String(raw.s || raw.state || "").trim(),
    pincode: String(raw.pin || raw.pincode || "").trim(),
    country: String(raw.co || raw.country || "India").trim() || "India"
  };
}
__name(expandCompactItem, "expandCompactItem");
function itemFromPrefixedNotes(notes, index) {
  const prefix = `item_${index}_`;
  const name = String(notes[`${prefix}name`] || "").trim();
  const addressLine1 = String(notes[`${prefix}addr1`] || notes[`${prefix}addressLine1`] || "").trim();
  const phone = String(notes[`${prefix}phone`] || "").trim();
  if (!name && !addressLine1 && !phone) return null;
  return {
    type: String(notes[`${prefix}type`] || "gift").trim() === "self" ? "self" : "gift",
    name,
    phone,
    addressLine1,
    addressLine2: String(notes[`${prefix}addr2`] || notes[`${prefix}addressLine2`] || "").trim(),
    city: String(notes[`${prefix}city`] || "").trim(),
    state: String(notes[`${prefix}state`] || "").trim(),
    pincode: String(notes[`${prefix}pin`] || notes[`${prefix}pincode`] || "").trim(),
    country: String(notes[`${prefix}country`] || "India").trim() || "India"
  };
}
__name(itemFromPrefixedNotes, "itemFromPrefixedNotes");
function buildRazorpayOrderNotes(email, itemsRaw) {
  const items = normalizeCheckoutItems(itemsRaw);
  const notes = {
    checkout_email: noteValue(String(email || "").trim().toLowerCase()),
    total_items: noteValue(items.length)
  };
  if (items.length === 1) {
    const item = items[0];
    Object.assign(notes, {
      item_0_type: noteValue(item.type),
      item_0_name: noteValue(item.name),
      item_0_phone: noteValue(item.phone),
      item_0_addr1: noteValue(item.addressLine1),
      item_0_addr2: noteValue(item.addressLine2),
      item_0_city: noteValue(item.city),
      item_0_state: noteValue(item.state),
      item_0_pin: noteValue(item.pincode),
      item_0_country: noteValue(item.country)
    });
  } else if (items.length > 1) {
    let payload = JSON.stringify(items.map(compactItemForNotes));
    if (payload.length > NOTE_VALUE_MAX) {
      payload = JSON.stringify(
        items.map((item) => {
          const compact = compactItemForNotes(item);
          return {
            ...compact,
            a1: compact.a1.slice(0, 48),
            a2: compact.a2.slice(0, 32)
          };
        })
      );
    }
    notes.items_json = noteValue(payload);
  }
  const entries = Object.entries(notes).slice(0, NOTE_KEY_MAX);
  return Object.fromEntries(entries);
}
__name(buildRazorpayOrderNotes, "buildRazorpayOrderNotes");
function parseCheckoutItemsFromNotes(notesRaw) {
  const notes = notesRaw && typeof notesRaw === "object" && !Array.isArray(notesRaw) ? notesRaw : {};
  const items = [];
  const jsonRaw = String(notes.items_json || "").trim();
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const item = expandCompactItem(entry);
          if (item) items.push(item);
        }
      }
    } catch (_error) {
    }
  }
  if (!items.length) {
    for (let index = 0; index < 4; index += 1) {
      const item = itemFromPrefixedNotes(notes, index);
      if (item) items.push(item);
    }
  }
  return items;
}
__name(parseCheckoutItemsFromNotes, "parseCheckoutItemsFromNotes");
function checkoutEmailFromNotes(notesRaw, fallbackEmail = "") {
  const notes = notesRaw && typeof notesRaw === "object" && !Array.isArray(notesRaw) ? notesRaw : {};
  const fromNotes = String(notes.checkout_email || notes.email || "").trim().toLowerCase();
  if (fromNotes.includes("@")) return fromNotes;
  return String(fallbackEmail || "").trim().toLowerCase();
}
__name(checkoutEmailFromNotes, "checkoutEmailFromNotes");

// api/admin-razorpay-reconcile.js
function unauthorized3() {
  return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
__name(unauthorized3, "unauthorized");
function readToken3(request, body) {
  const url = new URL(request.url);
  const queryToken = String(url.searchParams.get("token") || "").trim();
  if (queryToken) return queryToken;
  const authHeader = String(request.headers.get("authorization") || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  if (body && typeof body.token === "string") return String(body.token).trim();
  return "";
}
__name(readToken3, "readToken");
async function ensureOrdersTable2(db) {
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          order_id TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          total_items INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0,
          currency TEXT DEFAULT 'INR',
          status TEXT DEFAULT 'confirmed',
          items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_orders_email_created_at ON orders(email, created_at DESC)").run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id)").run();
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          payment_id TEXT NOT NULL,
          order_id TEXT NOT NULL,
          email TEXT NOT NULL,
          item_index INTEGER NOT NULL,
          item_type TEXT,
          recipient_name TEXT,
          recipient_phone TEXT,
          address_line1 TEXT,
          address_line2 TEXT,
          city TEXT,
          state TEXT,
          pincode TEXT,
          country TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_payment_id ON order_items(payment_id)").run();
}
__name(ensureOrdersTable2, "ensureOrdersTable");
function razorpayBasicAuth(env2) {
  const id = String(env2.RAZORPAY_KEY_ID || "").trim();
  const secret = String(env2.RAZORPAY_KEY_SECRET || "").trim();
  if (!id || !secret) return "";
  return `Basic ${btoa(`${id}:${secret}`)}`;
}
__name(razorpayBasicAuth, "razorpayBasicAuth");
function paymentEmail_(payment) {
  const email = String(payment?.email || payment?.contact || "").trim().toLowerCase();
  if (email.includes("@")) return email;
  const id = String(payment?.id || "").trim();
  return id ? `reconcile+${id}@sarvamsai.in` : "reconcile@sarvamsai.in";
}
__name(paymentEmail_, "paymentEmail_");
function amountInrFromRazorpayPayment(payment) {
  const paise = Number(payment?.amount);
  if (!Number.isFinite(paise)) return 0;
  return Math.max(0, paise / 100);
}
__name(amountInrFromRazorpayPayment, "amountInrFromRazorpayPayment");
async function sendOrderToGoogleScript(env2, row) {
  const googleScriptUrl = String(env2.GOOGLE_SCRIPT_URL || "").trim();
  if (!googleScriptUrl) return { skipped: true, reason: "no_GOOGLE_SCRIPT_URL" };
  if (!row?.email) return { skipped: true, reason: "no_email" };
  const items = Array.isArray(row?.items) ? row.items : [];
  const primary = items[0] || {};
  const shippingAddress = [
    String(primary.addressLine1 || "").trim(),
    String(primary.addressLine2 || "").trim(),
    String(primary.city || "").trim(),
    String(primary.state || "").trim(),
    String(primary.pincode || "").trim(),
    String(primary.country || "").trim()
  ].filter(Boolean).join(", ");
  const upstream = await fetch(googleScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "recordOrderPayment",
      id: row.orderId,
      payment_id: row.paymentId,
      email: row.email,
      amount_inr: row.totalAmount,
      status: "paid",
      total_items: row.totalItems,
      phone: String(primary.phone || "").trim(),
      shipping_address: shippingAddress,
      order_date: row.createdAt || (/* @__PURE__ */ new Date()).toISOString()
    })
  });
  const responseJson = await upstream.json().catch(() => ({}));
  const ok = upstream.ok && responseJson?.success !== false;
  if (!ok) {
    throw new Error(responseJson?.error || `Apps Script returned ${upstream.status}`);
  }
  return { skipped: false };
}
__name(sendOrderToGoogleScript, "sendOrderToGoogleScript");
async function orderExists(db, paymentId) {
  const res = await db.prepare("SELECT 1 as ok FROM orders WHERE payment_id = ? LIMIT 1").bind(paymentId).first();
  return Boolean(res?.ok);
}
__name(orderExists, "orderExists");
async function fetchRazorpayOrder(authHeader, orderId) {
  const id = String(orderId || "").trim();
  if (!id) return null;
  const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: authHeader }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data;
}
__name(fetchRazorpayOrder, "fetchRazorpayOrder");
async function resolveOrderNotes(authHeader, payment) {
  const paymentNotes = payment?.notes;
  if (paymentNotes && typeof paymentNotes === "object" && Object.keys(paymentNotes).length) {
    return paymentNotes;
  }
  const orderId = String(payment?.order_id || "").trim();
  if (!orderId) return {};
  const order = await fetchRazorpayOrder(authHeader, orderId);
  return order?.notes && typeof order.notes === "object" ? order.notes : {};
}
__name(resolveOrderNotes, "resolveOrderNotes");
async function insertOrderItems(db, orderId, paymentId, email, items) {
  await db.prepare("DELETE FROM order_items WHERE payment_id = ?").bind(paymentId).run();
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    await db.prepare(
      `
          INSERT INTO order_items (
            id, payment_id, order_id, email, item_index, item_type,
            recipient_name, recipient_phone, address_line1, address_line2,
            city, state, pincode, country, created_at
          )
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `
    ).bind(
      paymentId,
      orderId,
      email,
      index,
      String(item.type || ""),
      String(item.name || ""),
      String(item.phone || ""),
      String(item.addressLine1 || ""),
      String(item.addressLine2 || ""),
      String(item.city || ""),
      String(item.state || ""),
      String(item.pincode || ""),
      String(item.country || "")
    ).run();
  }
}
__name(insertOrderItems, "insertOrderItems");
async function insertOrderFromRazorpay(db, payment, authHeader) {
  const paymentId = String(payment?.id || "").trim();
  const orderId = String(payment?.order_id || "").trim();
  if (!paymentId || !orderId) return { ok: false, error: "missing_ids" };
  const orderNotes = await resolveOrderNotes(authHeader, payment);
  const items = parseCheckoutItemsFromNotes(orderNotes);
  const email = checkoutEmailFromNotes(orderNotes, paymentEmail_(payment));
  const totalAmount = amountInrFromRazorpayPayment(payment);
  const currency = String(payment?.currency || "INR").trim().toUpperCase() || "INR";
  const totalItems = Math.max(0, items.length);
  const itemsJson = JSON.stringify(items);
  await db.prepare(
    `
        INSERT INTO orders (
          id, email, order_id, payment_id, total_items, total_amount, currency, status, items_json, created_at
        )
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, 'confirmed', ?, datetime('now'))
      `
  ).bind(email, orderId, paymentId, totalItems, totalAmount, currency, itemsJson).run();
  if (items.length) {
    await insertOrderItems(db, orderId, paymentId, email, items);
  }
  return {
    ok: true,
    orderId,
    paymentId,
    email,
    totalAmount,
    totalItems,
    items,
    hasAddress: items.some((item) => item.addressLine1 || item.name),
    currency,
    createdAt: payment?.created_at ? new Date(Number(payment.created_at) * 1e3).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(insertOrderFromRazorpay, "insertOrderFromRazorpay");
async function fetchRazorpayPayments(authHeader, count3, skip) {
  const url = new URL("https://api.razorpay.com/v1/payments");
  url.searchParams.set("count", String(count3));
  url.searchParams.set("skip", String(skip));
  const res = await fetch(url.toString(), {
    headers: { Authorization: authHeader }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(data?.error?.description || data?.message || `Razorpay HTTP ${res.status}`));
  }
  return Array.isArray(data?.items) ? data.items : [];
}
__name(fetchRazorpayPayments, "fetchRazorpayPayments");
async function onRequestGet4({ request, env: env2 }) {
  return handle(request, env2, {});
}
__name(onRequestGet4, "onRequestGet");
async function onRequestPost({ request, env: env2 }) {
  const body = await request.json().catch(() => ({}));
  return handle(request, env2, body);
}
__name(onRequestPost, "onRequestPost");
async function handle(request, env2, body) {
  const expectedToken = String(env2.ADMIN_DASHBOARD_TOKEN || "").trim();
  if (!expectedToken) {
    return Response.json({ success: false, error: "ADMIN_DASHBOARD_TOKEN is not configured." }, { status: 500 });
  }
  const suppliedToken = readToken3(request, body);
  if (!suppliedToken || suppliedToken !== expectedToken) return unauthorized3();
  const authHeader = razorpayBasicAuth(env2);
  if (!authHeader) {
    return Response.json(
      { success: false, error: "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured." },
      { status: 500 }
    );
  }
  if (!env2.DB) {
    return Response.json({ success: false, error: "D1 database binding is not configured." }, { status: 500 });
  }
  const url = new URL(request.url);
  const countRaw = Number(body?.count ?? url.searchParams.get("count") ?? 100);
  const skipRaw = Number(body?.skip ?? url.searchParams.get("skip") ?? 0);
  const dryRun = body?.dryRun === true || url.searchParams.get("dryRun") === "1" || url.searchParams.get("dry_run") === "1";
  const syncToSheet = body?.syncToSheet === true || url.searchParams.get("syncToSheet") === "1";
  const count3 = Math.max(1, Math.min(100, Number.isFinite(countRaw) ? countRaw : 100));
  const skip = Math.max(0, Number.isFinite(skipRaw) ? skipRaw : 0);
  await ensureOrdersTable2(env2.DB);
  let items;
  try {
    items = await fetchRazorpayPayments(authHeader, count3, skip);
  } catch (e) {
    return Response.json({ success: false, error: String(e?.message || e) }, { status: 502 });
  }
  const summary = {
    success: true,
    dryRun,
    syncToSheet,
    razorpay_count: items.length,
    examined: 0,
    skipped_not_captured: 0,
    skipped_missing_order_id: 0,
    skipped_already_in_db: 0,
    inserted: 0,
    would_insert: 0,
    sheet_attempts: 0,
    sheet_errors: [],
    inserted_rows: []
  };
  for (const payment of items) {
    summary.examined += 1;
    const status = String(payment?.status || "").toLowerCase();
    if (status !== "captured") {
      summary.skipped_not_captured += 1;
      continue;
    }
    const paymentId = String(payment?.id || "").trim();
    if (!paymentId) continue;
    if (await orderExists(env2.DB, paymentId)) {
      summary.skipped_already_in_db += 1;
      continue;
    }
    const orderIdForPayment = String(payment?.order_id || "").trim();
    if (!orderIdForPayment) {
      summary.skipped_missing_order_id += 1;
      continue;
    }
    if (dryRun) {
      const orderNotes = await resolveOrderNotes(authHeader, payment);
      const items2 = parseCheckoutItemsFromNotes(orderNotes);
      summary.would_insert += 1;
      summary.inserted_rows.push({
        payment_id: paymentId,
        order_id: orderIdForPayment,
        email: checkoutEmailFromNotes(orderNotes, paymentEmail_(payment)),
        amount_inr: amountInrFromRazorpayPayment(payment),
        total_items: items2.length,
        has_address: items2.some((item) => item.addressLine1 || item.name)
      });
      continue;
    }
    try {
      const inserted = await insertOrderFromRazorpay(env2.DB, payment, authHeader);
      if (!inserted.ok) {
        continue;
      }
      summary.inserted += 1;
      summary.inserted_rows.push({
        payment_id: inserted.paymentId,
        order_id: inserted.orderId,
        email: inserted.email,
        amount_inr: inserted.totalAmount,
        total_items: inserted.totalItems,
        has_address: inserted.hasAddress
      });
      if (syncToSheet && String(env2.GOOGLE_SCRIPT_URL || "").trim()) {
        summary.sheet_attempts += 1;
        try {
          await sendOrderToGoogleScript(env2, {
            email: inserted.email,
            orderId: inserted.orderId,
            paymentId: inserted.paymentId,
            totalAmount: inserted.totalAmount,
            totalItems: inserted.totalItems,
            items: inserted.items,
            createdAt: inserted.createdAt
          });
        } catch (err) {
          summary.sheet_errors.push({ payment_id: paymentId, error: String(err?.message || err) });
        }
      }
    } catch (err) {
      if (String(err?.message || err).includes("UNIQUE")) {
        summary.skipped_already_in_db += 1;
      } else {
        summary.sheet_errors.push({ payment_id: paymentId, error: String(err?.message || err) });
      }
    }
  }
  summary.next_skip = skip + items.length;
  summary.hint = "Rows use Razorpay order notes for shipping when create-order saved them. Older payments may still have has_address=false. Run POST /api/sync-orders-to-sheet to push to Google Sheet, or use syncToSheet=true.";
  return Response.json(summary);
}
__name(handle, "handle");

// api/availability-today.js
var DAILY_CAPACITY = 100;
async function ensureOrdersTable3(db) {
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          order_id TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          total_items INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0,
          currency TEXT DEFAULT 'INR',
          status TEXT DEFAULT 'confirmed',
          items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
}
__name(ensureOrdersTable3, "ensureOrdersTable");
async function onRequestGet5({ env: env2 }) {
  if (!env2.DB) {
    return Response.json({ error: "D1 database binding is not configured." }, { status: 500 });
  }
  await ensureOrdersTable3(env2.DB);
  const result = await env2.DB.prepare(
    `
        SELECT COALESCE(SUM(total_items), 0) AS booked
        FROM orders
        WHERE status = 'confirmed'
          AND date(datetime(created_at, '+5 hours', '+30 minutes')) = date(datetime('now', '+5 hours', '+30 minutes'))
      `
  ).first();
  const booked = Math.max(0, Number(result?.booked) || 0);
  const remaining = Math.max(0, DAILY_CAPACITY - booked);
  return Response.json({
    capacity: DAILY_CAPACITY,
    booked,
    remaining
  });
}
__name(onRequestGet5, "onRequestGet");

// api/create-order.js
async function onRequestPost2(context2) {
  const { request, env: env2 } = context2;
  const body = await request.json();
  if (!env2.RAZORPAY_KEY_ID || !env2.RAZORPAY_KEY_SECRET) {
    return Response.json({ error: "Razorpay env vars are not configured." }, { status: 500 });
  }
  const amount = Number(body?.amount);
  const hasExplicitAmount = Number.isFinite(amount) && amount > 0;
  const totalAmount = Number(body?.totalAmount);
  const computedAmount = hasExplicitAmount ? Math.round(amount) : Math.round(totalAmount * 100);
  if (!Number.isFinite(computedAmount) || computedAmount < 100) {
    return Response.json({ error: "Minimum amount is 100 paise." }, { status: 400 });
  }
  const email = String(body?.email || "").trim().toLowerCase();
  const items = normalizeCheckoutItems(body?.items);
  const notes = buildRazorpayOrderNotes(email, items);
  const auth = btoa(`${env2.RAZORPAY_KEY_ID}:${env2.RAZORPAY_KEY_SECRET}`);
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: computedAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes
    })
  });
  const result = await response.json();
  if (!response.ok) {
    return Response.json({ error: result?.error?.description || "Could not create Razorpay order." }, { status: response.status });
  }
  return Response.json({
    order_id: result.id,
    amount: result.amount,
    currency: result.currency,
    key: env2.RAZORPAY_KEY_ID
  });
}
__name(onRequestPost2, "onRequestPost");

// api/orders-by-email.js
function parseItems(itemsJson) {
  if (!itemsJson) return [];
  try {
    const parsed = JSON.parse(String(itemsJson));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}
__name(parseItems, "parseItems");
async function ensureOrdersTable4(db) {
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          order_id TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          total_items INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0,
          currency TEXT DEFAULT 'INR',
          status TEXT DEFAULT 'confirmed',
          items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          payment_id TEXT NOT NULL,
          order_id TEXT NOT NULL,
          email TEXT NOT NULL,
          item_index INTEGER NOT NULL,
          item_type TEXT,
          recipient_name TEXT,
          recipient_phone TEXT,
          address_line1 TEXT,
          address_line2 TEXT,
          city TEXT,
          state TEXT,
          pincode TEXT,
          country TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
}
__name(ensureOrdersTable4, "ensureOrdersTable");
async function onRequestGet6({ request, env: env2 }) {
  const url = new URL(request.url);
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) {
    return Response.json({ error: "email query param is required." }, { status: 400 });
  }
  if (!env2.DB) {
    return Response.json({ error: "D1 database binding is not configured." }, { status: 500 });
  }
  await ensureOrdersTable4(env2.DB);
  const result = await env2.DB.prepare(
    `
        SELECT email, order_id, payment_id, total_items, total_amount, currency, status, items_json, created_at
        FROM orders
        WHERE email = ?
        ORDER BY datetime(created_at) DESC
      `
  ).bind(email).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  const itemRowsResult = await env2.DB.prepare(
    `
        SELECT payment_id, item_index, item_type, recipient_name, recipient_phone,
               address_line1, address_line2, city, state, pincode, country
        FROM order_items
        WHERE email = ?
        ORDER BY payment_id, item_index ASC
      `
  ).bind(email).all();
  const itemRows = Array.isArray(itemRowsResult?.results) ? itemRowsResult.results : [];
  const itemsByPaymentId = itemRows.reduce((acc, row) => {
    const paymentId = String(row.payment_id || "").trim();
    if (!paymentId) return acc;
    if (!acc[paymentId]) acc[paymentId] = [];
    acc[paymentId].push({
      type: String(row.item_type || "").trim() || "gift",
      name: String(row.recipient_name || "").trim(),
      phone: String(row.recipient_phone || "").trim(),
      addressLine1: String(row.address_line1 || "").trim(),
      addressLine2: String(row.address_line2 || "").trim(),
      city: String(row.city || "").trim(),
      state: String(row.state || "").trim(),
      pincode: String(row.pincode || "").trim(),
      country: String(row.country || "").trim()
    });
    return acc;
  }, {});
  const orders = rows.map((row) => ({
    email: String(row.email || "").trim().toLowerCase(),
    orderId: String(row.order_id || "").trim(),
    paymentId: String(row.payment_id || "").trim(),
    totalItems: Number(row.total_items) || 0,
    totalAmount: Number(row.total_amount) || 0,
    currency: String(row.currency || "INR").trim().toUpperCase(),
    status: String(row.status || "confirmed").trim(),
    items: itemsByPaymentId[String(row.payment_id || "").trim()] || parseItems(row.items_json),
    date: String(row.created_at || "")
  }));
  return Response.json({ orders });
}
__name(onRequestGet6, "onRequestGet");

// api/payment-config.js
async function onRequestGet7({ env: env2 }) {
  if (!env2.RAZORPAY_KEY_ID) {
    return Response.json({ error: "RAZORPAY_KEY_ID is not configured." }, { status: 503 });
  }
  return Response.json({ key: env2.RAZORPAY_KEY_ID });
}
__name(onRequestGet7, "onRequestGet");

// api/send-darshan-invite.js
async function onRequestPost3({ request, env: env2 }) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) {
    return Response.json({ success: false, error: "email is required." }, { status: 400 });
  }
  const appsScriptUrl = String(env2.APPS_SCRIPT_URL || "").trim();
  const internalToken = String(env2.INTERNAL_API_TOKEN || "").trim();
  if (!appsScriptUrl || !internalToken) {
    return Response.json(
      { success: false, error: "APPS_SCRIPT_URL or INTERNAL_API_TOKEN is not configured." },
      { status: 500 }
    );
  }
  const targetUrl = new URL(appsScriptUrl);
  targetUrl.searchParams.set("action", "generateDarshanInvite");
  targetUrl.searchParams.set("email", email);
  targetUrl.searchParams.set("token", internalToken);
  const upstream = await fetch(targetUrl.toString(), { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      {
        success: false,
        error: payload?.error || "Apps Script invite generation failed."
      },
      { status: upstream.status }
    );
  }
  if (!payload || payload.success !== true) {
    return Response.json(
      { success: false, error: payload?.error || "Failed to generate darshan invite." },
      { status: 400 }
    );
  }
  return Response.json(payload);
}
__name(onRequestPost3, "onRequestPost");

// api/sync-orders-to-sheet.js
function unauthorized4() {
  return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
__name(unauthorized4, "unauthorized");
function readToken4(request) {
  const url = new URL(request.url);
  const queryToken = String(url.searchParams.get("token") || "").trim();
  if (queryToken) return queryToken;
  const authHeader = String(request.headers.get("authorization") || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return "";
}
__name(readToken4, "readToken");
async function ensureOrdersTable5(db) {
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          order_id TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          total_items INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0,
          currency TEXT DEFAULT 'INR',
          status TEXT DEFAULT 'confirmed',
          items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
}
__name(ensureOrdersTable5, "ensureOrdersTable");
function parsePrimaryRecipientDetails2(itemsJsonRaw) {
  try {
    const items = JSON.parse(String(itemsJsonRaw || "[]"));
    if (!Array.isArray(items) || !items.length) {
      return { phone: "", shippingAddress: "" };
    }
    const first = items[0] || {};
    const shippingAddress = [
      String(first.addressLine1 || "").trim(),
      String(first.addressLine2 || "").trim(),
      String(first.city || "").trim(),
      String(first.state || "").trim(),
      String(first.pincode || "").trim(),
      String(first.country || "").trim()
    ].filter(Boolean).join(", ");
    return {
      phone: String(first.phone || "").trim(),
      shippingAddress
    };
  } catch (_error) {
    return { phone: "", shippingAddress: "" };
  }
}
__name(parsePrimaryRecipientDetails2, "parsePrimaryRecipientDetails");
async function onRequestPost4({ request, env: env2 }) {
  const expectedToken = String(env2.ADMIN_DASHBOARD_TOKEN || "").trim();
  if (!expectedToken) {
    return Response.json({ success: false, error: "ADMIN_DASHBOARD_TOKEN is not configured." }, { status: 500 });
  }
  const suppliedToken = readToken4(request);
  if (!suppliedToken || suppliedToken !== expectedToken) return unauthorized4();
  if (!env2.DB) {
    return Response.json({ success: false, error: "D1 database binding is not configured." }, { status: 500 });
  }
  const googleScriptUrl = String(env2.GOOGLE_SCRIPT_URL || "").trim();
  if (!googleScriptUrl) {
    return Response.json({ success: false, error: "GOOGLE_SCRIPT_URL is not configured." }, { status: 500 });
  }
  const body = await request.json().catch(() => ({}));
  const dryRun = Boolean(body?.dryRun);
  const emailFilter = String(body?.email || "").trim().toLowerCase();
  const limitRaw = Number(body?.limit ?? 200);
  const limit = Math.max(1, Math.min(5e3, Number.isFinite(limitRaw) ? limitRaw : 200));
  await ensureOrdersTable5(env2.DB);
  let query = `
    SELECT order_id, payment_id, email, total_amount, total_items, items_json, status, created_at
    FROM orders
  `;
  const binds = [];
  if (emailFilter) {
    query += " WHERE email = ? ";
    binds.push(emailFilter);
  }
  query += " ORDER BY datetime(created_at) DESC LIMIT ? ";
  binds.push(limit);
  const result = await env2.DB.prepare(query).bind(...binds).all();
  const orders = Array.isArray(result?.results) ? result.results : [];
  if (dryRun) {
    return Response.json({
      success: true,
      dryRun: true,
      fetched: orders.length,
      sample: orders.slice(0, 5).map((row) => ({
        id: String(row.order_id || "").trim(),
        payment_id: String(row.payment_id || "").trim(),
        email: String(row.email || "").trim().toLowerCase(),
        amount_inr: Math.max(0, Number(row.total_amount) || 0),
        status: String(row.status || "paid").trim() || "paid"
      }))
    });
  }
  let synced = 0;
  let failed = 0;
  const failures = [];
  for (const row of orders) {
    const recipientDetails = parsePrimaryRecipientDetails2(row.items_json);
    const payload = {
      action: "recordOrderPayment",
      id: String(row.order_id || "").trim(),
      payment_id: String(row.payment_id || "").trim(),
      email: String(row.email || "").trim().toLowerCase(),
      amount_inr: Math.max(0, Number(row.total_amount) || 0),
      status: String(row.status || "paid").trim() || "paid",
      total_items: Math.max(0, Number(row.total_items) || 0),
      phone: recipientDetails.phone,
      shipping_address: recipientDetails.shippingAddress,
      order_date: String(row.created_at || "").trim()
    };
    try {
      const upstream = await fetch(googleScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const responseJson = await upstream.json().catch(() => ({}));
      const ok = upstream.ok && responseJson?.success !== false;
      if (ok) {
        synced += 1;
      } else {
        failed += 1;
        if (failures.length < 20) {
          failures.push({
            orderId: payload.id,
            paymentId: payload.payment_id,
            email: payload.email,
            error: responseJson?.error || `Apps Script returned ${upstream.status}`
          });
        }
      }
    } catch (error3) {
      failed += 1;
      if (failures.length < 20) {
        failures.push({
          orderId: payload.id,
          paymentId: payload.payment_id,
          email: payload.email,
          error: String(error3?.message || error3)
        });
      }
    }
  }
  return Response.json({
    success: failed === 0,
    fetched: orders.length,
    synced,
    failed,
    failures
  });
}
__name(onRequestPost4, "onRequestPost");

// api/test-darshan-email.js
async function onRequestPost5({ env: env2 }) {
  const mailerUrl = String(env2.MAILER_WORKER_URL || "").trim();
  const mailerToken = String(env2.MAILER_WORKER_TOKEN || "").trim();
  const targetEmail = String(env2.TEST_EMAIL_TO || "sairam@sarvamsai.in").trim();
  if (!mailerUrl || !mailerToken) {
    return Response.json(
      {
        success: false,
        error: "MAILER_WORKER_URL or MAILER_WORKER_TOKEN is not configured."
      },
      { status: 500 }
    );
  }
  const response = await fetch(mailerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mailerToken}`
    },
    body: JSON.stringify({
      to: targetEmail,
      subject: "SarvamSai Cloudflare test email",
      text: "This is a test email sent from Cloudflare Worker mailer for Darshan queue flow."
    })
  });
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => ({}));
    return Response.json(payload, { status: response.status });
  }
  const text = await response.text();
  return Response.json(
    {
      success: response.ok,
      error: text || "Mailer worker returned a non-JSON response."
    },
    { status: response.status }
  );
}
__name(onRequestPost5, "onRequestPost");

// api/validate-access.js
async function onRequestPost6(context2) {
  const { request, env: env2 } = context2;
  const body = await request.json().catch(() => ({}));
  const { email, code } = body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCode = String(code || "").trim();
  if (!normalizedEmail || !normalizedCode) {
    return Response.json({ valid: false, error: "email and code are required." }, { status: 400 });
  }
  const appsScriptUrl = String(env2.APPS_SCRIPT_URL || "").trim();
  if (!appsScriptUrl) {
    return Response.json({ valid: false, error: "APPS_SCRIPT_URL is not configured." }, { status: 500 });
  }
  const targetUrl = new URL(appsScriptUrl);
  targetUrl.searchParams.set("action", "validateDarshanAccess");
  targetUrl.searchParams.set("email", normalizedEmail);
  targetUrl.searchParams.set("code", normalizedCode);
  const upstream = await fetch(targetUrl.toString(), { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      { valid: false, error: payload?.error || "Apps Script validation failed." },
      { status: upstream.status }
    );
  }
  if (!payload || payload.valid !== true) {
    return Response.json({ valid: false }, { status: 403 });
  }
  return Response.json({ valid: true, passphrase: String(payload.passphrase || "") });
}
__name(onRequestPost6, "onRequestPost");

// api/verify-passphrase.js
async function onRequestPost7(context2) {
  const { request, env: env2 } = context2;
  const body = await request.json().catch(() => ({}));
  const { email, selected } = body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedSelected = String(selected || "").trim();
  if (!normalizedEmail || !normalizedSelected) {
    return Response.json({ success: false, error: "email and selected are required." }, { status: 400 });
  }
  const appsScriptUrl = String(env2.APPS_SCRIPT_URL || "").trim();
  if (!appsScriptUrl) {
    return Response.json({ success: false, error: "APPS_SCRIPT_URL is not configured." }, { status: 500 });
  }
  const targetUrl = new URL(appsScriptUrl);
  targetUrl.searchParams.set("action", "verifyDarshanPassphrase");
  targetUrl.searchParams.set("email", normalizedEmail);
  targetUrl.searchParams.set("selected", normalizedSelected);
  const upstream = await fetch(targetUrl.toString(), { method: "GET" });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      { success: false, error: payload?.error || "Apps Script verification failed." },
      { status: upstream.status }
    );
  }
  if (!payload || payload.success !== true) {
    return Response.json(
      { success: false, error: payload?.error || "Passphrase verification failed." },
      { status: 400 }
    );
  }
  return Response.json({ success: true });
}
__name(onRequestPost7, "onRequestPost");

// api/verify-payment.js
function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
function timingSafeEqualHex(a, b) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let mismatch = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    mismatch |= aBytes[i] ^ bBytes[i];
  }
  return mismatch === 0;
}
__name(timingSafeEqualHex, "timingSafeEqualHex");
async function createRazorpaySignature(orderId, paymentId, secret) {
  const payload = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signed);
}
__name(createRazorpaySignature, "createRazorpaySignature");
function normalizeItems(itemsRaw) {
  if (!Array.isArray(itemsRaw)) return [];
  return itemsRaw.map((item) => ({
    type: item?.type === "self" ? "self" : "gift",
    name: String(item?.name || "").trim(),
    phone: String(item?.phone || "").trim(),
    addressLine1: String(item?.addressLine1 || "").trim(),
    addressLine2: String(item?.addressLine2 || "").trim(),
    city: String(item?.city || "").trim(),
    state: String(item?.state || "").trim(),
    pincode: String(item?.pincode || "").trim(),
    country: String(item?.country || "").trim()
  })).filter((item) => item.name || item.addressLine1 || item.phone);
}
__name(normalizeItems, "normalizeItems");
function toSingleLineAddress(item) {
  if (!item || typeof item !== "object") return "";
  return [
    String(item.addressLine1 || "").trim(),
    String(item.addressLine2 || "").trim(),
    String(item.city || "").trim(),
    String(item.state || "").trim(),
    String(item.pincode || "").trim(),
    String(item.country || "").trim()
  ].filter(Boolean).join(", ");
}
__name(toSingleLineAddress, "toSingleLineAddress");
async function ensureOrdersTable6(db) {
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          order_id TEXT NOT NULL,
          payment_id TEXT NOT NULL,
          total_items INTEGER DEFAULT 0,
          total_amount REAL DEFAULT 0,
          currency TEXT DEFAULT 'INR',
          status TEXT DEFAULT 'confirmed',
          items_json TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_orders_email_created_at ON orders(email, created_at DESC)").run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id)").run();
  await db.prepare(
    `
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          payment_id TEXT NOT NULL,
          order_id TEXT NOT NULL,
          email TEXT NOT NULL,
          item_index INTEGER NOT NULL,
          item_type TEXT,
          recipient_name TEXT,
          recipient_phone TEXT,
          address_line1 TEXT,
          address_line2 TEXT,
          city TEXT,
          state TEXT,
          pincode TEXT,
          country TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_payment_id ON order_items(payment_id)").run();
}
__name(ensureOrdersTable6, "ensureOrdersTable");
async function upsertOrderRecord(db, order) {
  await ensureOrdersTable6(db);
  await db.prepare(
    `
        INSERT INTO orders (
          id, email, order_id, payment_id, total_items, total_amount, currency, status, items_json, created_at
        )
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(payment_id)
        DO UPDATE SET
          email = excluded.email,
          order_id = excluded.order_id,
          total_items = excluded.total_items,
          total_amount = excluded.total_amount,
          currency = excluded.currency,
          status = excluded.status,
          items_json = excluded.items_json
      `
  ).bind(
    order.email,
    order.orderId,
    order.paymentId,
    order.totalItems,
    order.totalAmount,
    order.currency,
    order.status,
    JSON.stringify(order.items || [])
  ).run();
  await db.prepare("DELETE FROM order_items WHERE payment_id = ?").bind(order.paymentId).run();
  const items = Array.isArray(order.items) ? order.items : [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] || {};
    await db.prepare(
      `
          INSERT INTO order_items (
            id, payment_id, order_id, email, item_index, item_type,
            recipient_name, recipient_phone, address_line1, address_line2,
            city, state, pincode, country, created_at
          )
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `
    ).bind(
      order.paymentId,
      order.orderId,
      order.email,
      index,
      String(item.type || ""),
      String(item.name || ""),
      String(item.phone || ""),
      String(item.addressLine1 || ""),
      String(item.addressLine2 || ""),
      String(item.city || ""),
      String(item.state || ""),
      String(item.pincode || ""),
      String(item.country || "")
    ).run();
  }
}
__name(upsertOrderRecord, "upsertOrderRecord");
async function sendOrderToGoogleScript2(env2, order) {
  const googleScriptUrl = String(env2.GOOGLE_SCRIPT_URL || "").trim();
  if (!googleScriptUrl) return;
  if (!order?.email) return;
  const items = Array.isArray(order.items) ? order.items : [];
  const primaryRecipient = items[0] || {};
  const shippingAddress = toSingleLineAddress(primaryRecipient);
  await fetch(googleScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "recordOrderPayment",
      id: order.orderId,
      payment_id: order.paymentId,
      email: order.email,
      amount_inr: Math.max(0, Number(order.totalAmount) || 0),
      status: "paid",
      total_items: Math.max(0, Number(order.totalItems) || items.length),
      phone: String(primaryRecipient.phone || "").trim(),
      shipping_address: shippingAddress,
      order_date: (/* @__PURE__ */ new Date()).toISOString()
    })
  });
}
__name(sendOrderToGoogleScript2, "sendOrderToGoogleScript");
async function onRequestPost8(context2) {
  const { request, env: env2 } = context2;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    email,
    items,
    totalItems,
    totalAmount,
    currency
  } = await request.json();
  if (!env2.RAZORPAY_KEY_SECRET) {
    return Response.json({ success: false, error: "RAZORPAY_KEY_SECRET is not configured." }, { status: 500 });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json({ success: false, error: "Missing required payment verification fields." }, { status: 400 });
  }
  const expected = await createRazorpaySignature(razorpay_order_id, razorpay_payment_id, env2.RAZORPAY_KEY_SECRET);
  if (!timingSafeEqualHex(expected, String(razorpay_signature))) {
    return Response.json({ success: false }, { status: 400 });
  }
  if (!env2.DB) {
    return Response.json(
      { success: false, error: "Payment verified but D1 DB is not configured, so order cannot be stored." },
      { status: 500 }
    );
  }
  const orderRecord = {
    email: String(email || "").trim().toLowerCase(),
    orderId: String(razorpay_order_id || "").trim(),
    paymentId: String(razorpay_payment_id || "").trim(),
    totalItems: Math.max(0, Number(totalItems) || normalizeItems(items).length),
    totalAmount: Math.max(0, Number(totalAmount) || 0),
    currency: String(currency || "INR").trim().toUpperCase() || "INR",
    status: "confirmed",
    items: normalizeItems(items)
  };
  if (!orderRecord.email) {
    return Response.json(
      { success: false, error: "Payment verified but email is missing in verification payload." },
      { status: 400 }
    );
  }
  if (!orderRecord.items.length) {
    return Response.json(
      { success: false, error: "Payment verified but shipping details are missing. Please retry checkout." },
      { status: 400 }
    );
  }
  try {
    await upsertOrderRecord(env2.DB, orderRecord);
  } catch (error3) {
    return Response.json(
      { success: false, error: `Payment verified but order storage failed: ${String(error3?.message || error3)}` },
      { status: 500 }
    );
  }
  try {
    await sendOrderToGoogleScript2(env2, orderRecord);
  } catch (error3) {
    console.error("Google Script notification failed", {
      orderId: orderRecord.orderId,
      paymentId: orderRecord.paymentId,
      error: String(error3?.message || error3)
    });
  }
  return Response.json({ success: true });
}
__name(onRequestPost8, "onRequestPost");

// api/[[path]].js
async function onRequest() {
  return Response.json(
    {
      error: "API route not found."
    },
    { status: 404 }
  );
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-XVZ2UE/functionsRoutes-0.33989052697859556.mjs
var routes = [
  {
    routePath: "/api/access-profile",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin-orders",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/admin-orders-csv",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/admin-razorpay-reconcile",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/admin-razorpay-reconcile",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/availability-today",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/create-order",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/orders-by-email",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/payment-config",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/send-darshan-invite",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/sync-orders-to-sheet",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/test-darshan-email",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/validate-access",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/verify-passphrase",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/verify-payment",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
