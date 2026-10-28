import { preAuctionHarKey } from '../Shared/constants';
import { HAR_CHUNK_SIZE, harChunkKey, removeStoredHarLog } from '../Shared/harLogStorage';

/**
 * Records a rich log of network requests the inspected page makes, powering both:
 * - The Pre-Auction tab (latency and timing correlation with RTD/ID providers)
 * - The modernized Network Inspector tab (Prebid traffic categories, visual initiator cascades, privacy auditing)
 *
 * Privacy:
 * - Stored per inspected tab in chrome.storage.session (memory only, never written to disk)
 * - Credential headers and cookie values are redacted before storing
 *
 * Performance-optimized:
 * - Bound to MAX_ENTRIES ring buffer to prevent memory leaks on long sessions
 * - Batched writes to chrome.storage.session, in chunks so a write only touches the chunks that changed (see harLogStorage)
 * - String and payload truncation to keep storage serialization lightweight
 */

const MAX_ENTRIES = 1000;
const MAX_POST_TEXT_LENGTH = 10000;
const MAX_ARRAY_ITEMS = 50;
const MAX_CALL_FRAMES = 20;
const MAX_URL_LENGTH = 2000;
const REDACTED = '[redacted]';
const SENSITIVE_HEADERS = ['cookie', 'set-cookie', 'authorization', 'proxy-authorization'];

interface IHarLogChunk {
  id: number;
  entries: IHarLogEntry[];
}

// The log in log order; the last chunk is the one being filled.
let chunks: IHarLogChunk[] = [];
// Ids keep counting up across resets, so a new page never reuses the key of a chunk still being removed.
let nextChunkId = 0;
// What the next flush has to write or remove.
let changedChunkIds = new Set<number>();
let droppedChunkIds: number[] = [];
let indexChanged = false;
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let idCounter = 1;

export interface IHarTimingBreakdown {
  blocked?: number;
  dns?: number;
  connect?: number;
  send?: number;
  wait?: number;
  receive?: number;
  ssl?: number;
}

export interface IInitiatorInfo {
  type: string;
  url?: string;
  lineNumber?: number;
  stack?: any;
}

export interface IHarLogEntry {
  id: string;
  url: string;
  host: string;
  pathname: string;
  method: string;
  status: number;
  statusText?: string;
  startedDateTime: number;
  time: number;
  /** devtools resource type ('script', 'xhr', 'fetch', 'image', 'document'...). */
  resourceType?: string;
  mimeType?: string;
  queryString?: Array<{ name: string; value: string }>;
  requestHeaders?: Array<{ name: string; value: string }>;
  responseHeaders?: Array<{ name: string; value: string }>;
  requestCookies?: Array<{ name: string; value: string }>;
  responseCookies?: Array<{ name: string; value: string }>;
  redirectURL?: string;
  initiator?: IInitiatorInfo;
  postData?: {
    mimeType?: string;
    text?: string;
    params?: Array<{ name: string; value: string }>;
    /** OpenRTB privacy fields from the full body, kept only when `text` was truncated (truncated JSON no longer parses). */
    privacyFields?: IPostDataPrivacyFields;
  };
  timings?: IHarTimingBreakdown;
  contentSize?: number;
  bodySize?: number;
}

export interface IPostDataPrivacyFields {
  regs?: any;
  user?: { consent?: any; ext?: { consent?: any } };
}

export const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

export const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
};

/**
 * Only real network traffic belongs in the log. Excludes internal chrome extensions or data URIs.
 */
export const isRecordableUrl = (url: string): boolean => /^https?:\/\//i.test(url || '');

const truncate = (str?: string, maxLen = MAX_POST_TEXT_LENGTH): string | undefined => {
  if (typeof str !== 'string') return undefined;
  return str.length > maxLen ? str.slice(0, maxLen) + '... [truncated]' : str;
};

const sanitizeNameValuePairs = (arr?: any[]): Array<{ name: string; value: string }> | undefined => {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr.slice(0, MAX_ARRAY_ITEMS).map((item) => ({
    name: String(item?.name ?? '').slice(0, 150),
    value: String(item?.value ?? '').slice(0, 2000),
  }));
};

/**
 * Chrome's initiator carries the full JS stack, with every call frame and a chain of async parent stacks, which can
 * be several KB per request. Keep only what the panel reads: type, url, line and the top call frames.
 */
const extractInitiator = (initiator: any): IInitiatorInfo | undefined => {
  if (!initiator || typeof initiator !== 'object') return undefined;
  const callFrames = Array.isArray(initiator.stack?.callFrames)
    ? initiator.stack.callFrames.slice(0, MAX_CALL_FRAMES).map((frame: any) => ({
        functionName: String(frame?.functionName ?? '').slice(0, 150),
        url: String(frame?.url ?? '').slice(0, MAX_URL_LENGTH),
        lineNumber: frame?.lineNumber,
        columnNumber: frame?.columnNumber,
      }))
    : undefined;
  return {
    type: String(initiator.type ?? ''),
    url: typeof initiator.url === 'string' ? initiator.url.slice(0, MAX_URL_LENGTH) : undefined,
    lineNumber: initiator.lineNumber,
    stack: callFrames ? { callFrames } : undefined,
  };
};

const redactHeaders = (arr?: any[]): Array<{ name: string; value: string }> | undefined => sanitizeNameValuePairs(arr)?.map((h) => (SENSITIVE_HEADERS.includes(h.name.toLowerCase()) ? { name: h.name, value: REDACTED } : h));

const redactCookies = (arr?: any[]): Array<{ name: string; value: string }> | undefined => sanitizeNameValuePairs(arr)?.map((c) => ({ name: c.name, value: REDACTED }));

const extractQueryParams = (harEntry: any, url: string): Array<{ name: string; value: string }> | undefined => {
  const fromHar = sanitizeNameValuePairs(harEntry?.request?.queryString);
  if (fromHar && fromHar.length > 0) return fromHar;

  if (url) {
    try {
      const parsed = new URL(url);
      const params: Array<{ name: string; value: string }> = [];
      parsed.searchParams.forEach((val, key) => {
        if (params.length < MAX_ARRAY_ITEMS) {
          params.push({ name: key.slice(0, 150), value: val.slice(0, 2000) });
        }
      });
      return params.length > 0 ? params : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export const extractPrivacyFields = (text?: string): IPostDataPrivacyFields | undefined => {
  if (typeof text !== 'string' || text.length <= MAX_POST_TEXT_LENGTH) return undefined;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return undefined;
    const { regs, user } = parsed;
    const fields: IPostDataPrivacyFields = {};
    if (regs !== undefined) fields.regs = regs;
    if (user && (user.consent !== undefined || user.ext?.consent !== undefined)) {
      fields.user = { consent: user.consent, ext: user.ext?.consent !== undefined ? { consent: user.ext.consent } : undefined };
    }
    return Object.keys(fields).length > 0 ? fields : undefined;
  } catch {
    return undefined;
  }
};

const extractPostData = (postData: any): IHarLogEntry['postData'] => {
  if (!postData) return undefined;
  return {
    mimeType: postData.mimeType,
    text: truncate(postData.text),
    params: sanitizeNameValuePairs(postData.params),
    privacyFields: extractPrivacyFields(postData.text),
  };
};

const extractTimings = (timings: any): IHarTimingBreakdown | undefined => {
  if (!timings || typeof timings !== 'object') return undefined;
  return {
    blocked: typeof timings.blocked === 'number' ? Math.max(0, Math.round(timings.blocked * 10) / 10) : undefined,
    dns: typeof timings.dns === 'number' ? Math.max(0, Math.round(timings.dns * 10) / 10) : undefined,
    connect: typeof timings.connect === 'number' ? Math.max(0, Math.round(timings.connect * 10) / 10) : undefined,
    send: typeof timings.send === 'number' ? Math.max(0, Math.round(timings.send * 10) / 10) : undefined,
    wait: typeof timings.wait === 'number' ? Math.max(0, Math.round(timings.wait * 10) / 10) : undefined,
    receive: typeof timings.receive === 'number' ? Math.max(0, Math.round(timings.receive * 10) / 10) : undefined,
    ssl: typeof timings.ssl === 'number' ? Math.max(0, Math.round(timings.ssl * 10) / 10) : undefined,
  };
};

export const toLogEntry = (harEntry: any): IHarLogEntry => {
  const url = harEntry?.request?.url || '';
  const now = Date.now();
  const entryId = `req_${idCounter++}_${now}`;

  return {
    id: entryId,
    url,
    host: hostOf(url),
    pathname: pathOf(url),
    method: harEntry?.request?.method || 'GET',
    status: harEntry?.response?.status ?? 0,
    statusText: harEntry?.response?.statusText || '',
    startedDateTime: new Date(harEntry?.startedDateTime).getTime() || 0,
    time: Math.round((Number(harEntry?.time) || 0) * 100) / 100,
    resourceType: harEntry?._resourceType,
    mimeType: harEntry?.response?.content?.mimeType,
    queryString: extractQueryParams(harEntry, url),
    requestHeaders: redactHeaders(harEntry?.request?.headers),
    responseHeaders: redactHeaders(harEntry?.response?.headers),
    requestCookies: redactCookies(harEntry?.request?.cookies),
    responseCookies: redactCookies(harEntry?.response?.cookies),
    redirectURL: harEntry?.response?.redirectURL || undefined,
    initiator: extractInitiator(harEntry?._initiator),
    postData: extractPostData(harEntry?.request?.postData),
    timings: extractTimings(harEntry?.timings),
    contentSize: harEntry?.response?.content?.size,
    bodySize: harEntry?.response?.bodySize,
  };
};

const inspectedTabId = (): number | undefined => chrome.devtools?.inspectedWindow?.tabId;

const entryCount = () => chunks.reduce((count, chunk) => count + chunk.entries.length, 0);

const dropChunks = (count: number) => {
  chunks.splice(0, count).forEach((chunk) => {
    changedChunkIds.delete(chunk.id);
    droppedChunkIds.push(chunk.id);
  });
  indexChanged = true;
};

const clearMemory = () => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  chunks = [];
  changedChunkIds = new Set();
  droppedChunkIds = [];
  indexChanged = false;
};

/** Writes the changed chunks and the index if the chunk list changed, and removes dropped chunks. */
const write = async (): Promise<void> => {
  const tabId = inspectedTabId();
  if (tabId === undefined || !chrome.storage?.session) return;
  const items: Record<string, string> = {};
  chunks.filter((chunk) => changedChunkIds.has(chunk.id)).forEach((chunk) => (items[harChunkKey(tabId, chunk.id)] = JSON.stringify(chunk.entries)));
  if (indexChanged) items[preAuctionHarKey(tabId)] = JSON.stringify(chunks.map((chunk) => chunk.id));
  const dropped = droppedChunkIds.map((id) => harChunkKey(tabId, id));
  changedChunkIds = new Set();
  droppedChunkIds = [];
  indexChanged = false;

  if (dropped.length > 0) await chrome.storage.session.remove(dropped);
  if (Object.keys(items).length > 0) await chrome.storage.session.set(items);
};

/** Batched so high-frequency network bursts do not cause redundant writes. */
const flush = async () => {
  flushTimeout = null;
  try {
    await write();
  } catch {
    // storage.session has a 10 MB quota; keep the newest half of the entries and retry once.
    const kept = chunks.flatMap((chunk) => chunk.entries).slice(-Math.floor(entryCount() / 2));
    dropChunks(chunks.length);
    for (let i = 0; i < kept.length; i += HAR_CHUNK_SIZE) {
      const chunk = { id: nextChunkId++, entries: kept.slice(i, i + HAR_CHUNK_SIZE) };
      chunks.push(chunk);
      changedChunkIds.add(chunk.id);
    }
    try {
      await write();
    } catch {}
  }
};

const scheduleFlush = () => {
  if (flushTimeout) return;
  flushTimeout = setTimeout(flush, 300);
};

const record = (harEntry: any) => {
  const entry = toLogEntry(harEntry);
  if (!isRecordableUrl(entry.url)) return;
  let chunk = chunks[chunks.length - 1];
  if (!chunk || chunk.entries.length >= HAR_CHUNK_SIZE) {
    chunk = { id: nextChunkId++, entries: [] };
    chunks.push(chunk);
    indexChanged = true;
  }
  chunk.entries.push(entry);
  changedChunkIds.add(chunk.id);
  // Over MAX_ENTRIES, drop the oldest whole chunk.
  while (entryCount() > MAX_ENTRIES) dropChunks(1);
  scheduleFlush();
};

// Removing the keys (rather than writing '[]') keeps a navigation reset distinguishable from the panel's "Clear log",
// so the onChanged echo of our own reset cannot wipe requests recorded after it. Readers treat a missing index as an empty log.
export const reset = () => {
  clearMemory();
  idCounter = 1;
  const tabId = inspectedTabId();
  if (tabId !== undefined) removeStoredHarLog(tabId).catch(() => {});
};

export const collectHarLog = () => {
  if (!chrome.devtools?.network?.onRequestFinished) return;
  reset();
  chrome.devtools.network.onRequestFinished.addListener(record);
  chrome.tabs?.onUpdated.addListener((tabId, info) => {
    if (tabId === inspectedTabId() && info.status === 'loading') reset();
  });
  // The panel's "Clear log" button empties the stored index; drop the in-memory log and its stored chunks too,
  // so the next flush does not restore them.
  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    const tabId = inspectedTabId();
    if (areaName !== 'session' || tabId === undefined) return;
    if (changes[preAuctionHarKey(tabId)]?.newValue === '[]') {
      const stale = chunks.map((chunk) => harChunkKey(tabId, chunk.id));
      clearMemory();
      if (stale.length > 0) chrome.storage.session.remove(stale).catch(() => {});
    }
  });
};
