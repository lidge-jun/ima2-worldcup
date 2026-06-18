export interface FFmpegAPI {
  writeFile(path: string, data: Uint8Array): Promise<void>;
  readFile(path: string): Promise<Uint8Array>;
  deleteFile(path: string): Promise<void>;
  exec(args: string[]): Promise<number>;
}

let api: FFmpegAPI | null = null;
let loadPromise: Promise<FFmpegAPI> | null = null;
let transactionQueue: Promise<void> = Promise.resolve();

export function checkCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
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

    const ffmpegAPI = wrapWorker(worker);

    try {
      await ffmpegAPI._send('load', { coreURL: coreBlobURL, wasmURL: wasmBlobURL });
    } catch (err) {
      loadPromise = null;
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

function wrapWorker(worker: Worker): FFmpegAPI & { _send: (op: string, p: any) => Promise<any> } {
  let nextId = 0;
  const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();

  worker.onmessage = ({ data }) => {
    if (data.t === 'log') {
      console.log('[ffmpeg]', data.d.message);
      return;
    }
    const h = pending.get(data.id);
    if (!h) return;
    pending.delete(data.id);
    data.t === 'err' ? h.reject(new Error(data.d)) : h.resolve(data.d);
  };

  function send(op: string, p: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
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
