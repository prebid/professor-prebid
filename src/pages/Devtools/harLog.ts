import { preAuctionHarKey } from '../Shared/constants';

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
 * - Batched writes to chrome.storage.session
 * - String and payload truncation to keep storage serialization lightweight
 */

const MAX_ENTRIES = 1000;
const MAX_POST_TEXT_LENGTH = 10000;
const MAX_ARRAY_ITEMS = 50;
const REDACTED = '[redacted]';
const SENSITIVE_HEADERS = ['cookie', 'set-cookie', 'authorization', 'proxy-authorization'];

let entries: IHarLogEntry[] = [];
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

const redactHeaders = (arr?: any[]): Array<{ name: string; value: string }> | undefined =>
  sanitizeNameValuePairs(arr)?.map((h) => (SENSITIVE_HEADERS.includes(h.name.toLowerCase()) ? { name: h.name, value: REDACTED } : h));

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
    initiator: harEntry?._initiator || undefined,
    postData: extractPostData(harEntry?.request?.postData),
    timings: extractTimings(harEntry?.timings),
    contentSize: harEntry?.response?.content?.size,
    bodySize: harEntry?.response?.bodySize,
  };
};

const inspectedTabId = (): number | undefined => chrome.devtools?.inspectedWindow?.tabId;

// Removing the key (rather than writing '[]') keeps a navigation reset distinguishable from the panel's "Clear log",
// so the onChanged echo of our own reset cannot wipe requests recorded after it. Readers treat a missing key as an empty log.
const clearStored = async (): Promise<void> => {
  const tabId = inspectedTabId();
  if (tabId === undefined || !chrome.storage?.session) return;
  await chrome.storage.session.remove(preAuctionHarKey(tabId));
};

const write = async (list: IHarLogEntry[]): Promise<void> => {
  const tabId = inspectedTabId();
  if (tabId === undefined || !chrome.storage?.session) return;
  await chrome.storage.session.set({ [preAuctionHarKey(tabId)]: JSON.stringify(list) });
};

/** Batched so high-frequency network bursts do not cause redundant writes. */
const flush = async () => {
  flushTimeout = null;
  try {
    await write(entries);
  } catch {
    // storage.session has a 10 MB quota; keep the newest half and retry once.
    entries = entries.slice(-Math.floor(entries.length / 2));
    try {
      await write(entries);
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
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
  scheduleFlush();
};

export const reset = () => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  entries = [];
  idCounter = 1;
  clearStored().catch(() => {});
};

export const collectHarLog = () => {
  if (!chrome.devtools?.network?.onRequestFinished) return;
  reset();
  chrome.devtools.network.onRequestFinished.addListener(record);
  chrome.tabs?.onUpdated.addListener((tabId, info) => {
    if (tabId === inspectedTabId() && info.status === 'loading') reset();
  });
  // The panel's "Clear log" button empties the stored list; drop the in-memory copy too so the next flush does not restore it.
  chrome.storage?.onChanged?.addListener((changes, areaName) => {
    const tabId = inspectedTabId();
    if (areaName !== 'session' || tabId === undefined) return;
    if (changes[preAuctionHarKey(tabId)]?.newValue === '[]') {
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
      entries = [];
    }
  });
};
