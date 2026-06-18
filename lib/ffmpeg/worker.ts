export interface FFmpegAPI {
  writeFile(path: string, data: Uint8Array): Promise<void>;
  readFile(path: string): Promise<Uint8Array>;
  deleteFile(path: string): Promise<void>;
  exec(args: string[]): Promise<number>;
}

// A single ffmpeg-core.wasm instance lives in one worker. A WASM abort (e.g. an
// encoder crash) permanently poisons that instance, so the worker must be torn
// down and rebuilt on the next use rather than left to hang every later call.
const EXEC_TIMEOUT_MS = 120_000;

let api: FFmpegAPI | null = null;
let loadPromise: Promise<FFmpegAPI> | null = null;
let activeWorker: Worker | null = null;
let transactionQueue: Promise<void> = Promise.resolve();

export function checkCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
}

/** Discard the current worker/instance so the next getFFmpeg() rebuilds cleanly. */
function resetFFmpeg(): void {
  if (activeWorker) {
    try { activeWorker.terminate(); } catch { /* already gone */ }
  }
  activeWorker = null;
  api = null;
  loadPromise = null;
}

export async function getFFmpeg(): Promise<FFmpegAPI> {
  if (api) return api;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!checkCrossOriginIsolated()) {
      throw new Error('SharedArrayBuffer not available. COOP/COEP headers required.');
    }

    console.log('[ffmpeg] loading via blob worker (bypasses Turbopack)...');

    const [coreBlobURL, wasmBlobURL] = await Promise.all([
      fetchAsBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
      fetchAsBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
    ]);

    const workerBlobURL = createWorkerBlob();
    const worker = new Worker(workerBlobURL, { type: 'module' });
    activeWorker = worker;

    const ffmpegAPI = wrapWorker(worker, resetFFmpeg);

    try {
      await ffmpegAPI._send('load', { coreURL: coreBlobURL, wasmURL: wasmBlobURL });
    } catch (err) {
      resetFFmpeg();
      console.error('[ffmpeg] load failed:', err);
      throw new Error(`FFmpeg load failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    console.log('[ffmpeg] loaded successfully');
    api = ffmpegAPI;
    return ffmpegAPI;
  })();

  return loadPromise;
}

export async function runWithFFmpeg<T>(task: (ffmpeg: FFmpegAPI) => Promise<T>): Promise<T> {
  const previous = transactionQueue;
  let release!: () => void;
  transactionQueue = new Promise<void>(resolve => {
    release = resolve;
  });

  await previous;

  try {
    const ffmpeg = await getFFmpeg();
    return await task(ffmpeg);
  } finally {
    release();
  }
}

async function fetchAsBlobURL(url: string, mime: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
  const blob = new Blob([await r.arrayBuffer()], { type: mime });
  return URL.createObjectURL(blob);
}

function createWorkerBlob(): string {
  // Self-contained module worker — no static imports, invisible to Turbopack
  const code = `
let ffmpeg;

async function loadCore(coreURL, wasmURL) {
  const mod = await import(coreURL);
  const factory = mod.default;
  if (!factory) throw new Error('ffmpeg-core.js missing default export');

  ffmpeg = await factory({
    mainScriptUrlOrBlob: coreURL + '#' + btoa(JSON.stringify({ wasmURL, workerURL: '' })),
  });

  ffmpeg.setLogger(({ type, message }) => {
    self.postMessage({ t: 'log', d: { type, message } });
  });
}

self.onmessage = async ({ data }) => {
  const { id, op, p } = data;
  const tx = [];
  try {
    let r;
    switch (op) {
      case 'load':
        await loadCore(p.coreURL, p.wasmURL);
        r = true;
        break;
      case 'writeFile':
        ffmpeg.FS.writeFile(p.path, p.data);
        r = true;
        break;
      case 'readFile':
        r = ffmpeg.FS.readFile(p.path);
        if (r instanceof Uint8Array) tx.push(r.buffer);
        break;
      case 'deleteFile':
        ffmpeg.FS.unlink(p.path);
        r = true;
        break;
      case 'exec':
        ffmpeg.setTimeout(-1);
        ffmpeg.exec(...p.args);
        r = ffmpeg.ret;
        ffmpeg.reset();
        break;
      default:
        throw new Error('unknown op: ' + op);
    }
    self.postMessage({ id, t: 'ok', d: r }, tx);
  } catch (e) {
    self.postMessage({ id, t: 'err', d: e.message || String(e) });
  }
};
`;
  return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
}

type PendingCall = { resolve: (v: any) => void; reject: (e: Error) => void; isExec: boolean; timer?: ReturnType<typeof setTimeout> };

function wrapWorker(
  worker: Worker,
  onDead: () => void,
): FFmpegAPI & { _send: (op: string, p: any) => Promise<any> } {
  let nextId = 0;
  let dead = false;
  const pending = new Map<number, PendingCall>();

  // Reject every in-flight call and tear the worker down. Called when the worker
  // crashes, emits a message error, or an exec stops responding (WASM abort).
  function failAll(reason: string): void {
    if (dead) return;
    dead = true;
    const err = new Error(reason);
    for (const h of pending.values()) {
      if (h.timer) clearTimeout(h.timer);
      h.reject(err);
    }
    pending.clear();
    onDead();
  }

  worker.onmessage = ({ data }) => {
    if (data.t === 'log') {
      console.log('[ffmpeg]', data.d.message);
      return;
    }
    const h = pending.get(data.id);
    if (!h) return;
    pending.delete(data.id);
    if (h.timer) clearTimeout(h.timer);
    if (data.t === 'err') {
      h.reject(new Error(data.d));
      // A thrown exec means the WASM instance aborted and is now poisoned;
      // tear it down so the next call rebuilds a fresh instance.
      if (h.isExec) failAll(`FFmpeg instance aborted: ${data.d}`);
    } else {
      h.resolve(data.d);
    }
  };
  worker.onerror = (e) => failAll(`FFmpeg worker crashed: ${(e as ErrorEvent).message || 'unknown error'}`);
  worker.onmessageerror = () => failAll('FFmpeg worker message channel error');

  function send(op: string, p: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (dead) {
        reject(new Error('FFmpeg worker is no longer available; retry to reload'));
        return;
      }
      const id = nextId++;
      // Only exec can run long enough to need a watchdog; an unresponsive exec
      // means the WASM instance aborted and will never reply.
      const timer = op === 'exec'
        ? setTimeout(() => {
            if (!pending.has(id)) return;
            pending.delete(id);
            reject(new Error('FFmpeg exec timed out (worker unresponsive)'));
            failAll('FFmpeg exec timed out (worker unresponsive)');
          }, EXEC_TIMEOUT_MS)
        : undefined;
      pending.set(id, { resolve, reject, timer, isExec: op === 'exec' });
      worker.postMessage({ id, op, p });
    });
  }

  return {
    _send: send,
    writeFile: (path, data) => send('writeFile', { path, data }),
    readFile: (path) => send('readFile', { path }),
    deleteFile: (path) => send('deleteFile', { path }),
    exec: (args) => send('exec', { args }),
  };
}
