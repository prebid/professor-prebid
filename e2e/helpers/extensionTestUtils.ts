import { chromium, BrowserContext, Page, Worker } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';

export interface ExtensionContextInfo {
  browserContext: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
  userDataDir: string;
}

export interface DetectedPrebid {
  tabKey: string;
  frameId: string;
  namespace: string;
  details: any;
}

export const PATH_TO_EXTENSION = path.join(__dirname, '../../build');

const isHeadless = () => process.env.HEADED !== 'true' && process.env.HEADLESS !== 'false';

/**
 * Launches Chromium with the unpacked Professor Prebid build loaded, in a fresh profile.
 * Close it with closeExtensionContext, which also deletes the profile.
 */
export const launchExtensionContext = async (): Promise<ExtensionContextInfo> => {
  if (!fs.existsSync(path.join(PATH_TO_EXTENSION, 'manifest.json'))) {
    throw new Error(`No extension build in ${PATH_TO_EXTENSION}. Run npm run build first.`);
  }
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'professor-prebid-e2e-'));
  const args = [`--disable-extensions-except=${PATH_TO_EXTENSION}`, `--load-extension=${PATH_TO_EXTENSION}`, '--no-sandbox', '--disable-web-security'];
  if (isHeadless()) args.push('--headless=new');

  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Extensions need a persistent, headed context; headless mode is set through --headless=new above.
    bypassCSP: true,
    args,
  });

  try {
    const serviceWorker = browserContext.serviceWorkers()[0] || (await browserContext.waitForEvent('serviceworker', { timeout: 15000 }));
    const extensionId = new URL(serviceWorker.url()).host;
    return { browserContext, extensionId, serviceWorker, userDataDir };
  } catch (error) {
    await browserContext.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
    throw new Error(`Professor Prebid service worker did not start: ${error}`);
  }
};

export const closeExtensionContext = async ({ browserContext, userDataDir }: ExtensionContextInfo): Promise<void> => {
  try {
    await browserContext.close();
  } finally {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
};

/** Everything in the extension's chrome.storage.local. */
export const getExtensionStorage = async (serviceWorker: Worker): Promise<Record<string, any>> => serviceWorker.evaluate(() => chrome.storage.local.get());

export const setExtensionStorage = async (serviceWorker: Worker, items: Record<string, unknown>): Promise<void> => serviceWorker.evaluate((values) => chrome.storage.local.set(values), items);

/** Every Prebid instance the extension stored, across all tabs and frames. */
export const getDetectedPrebids = async (serviceWorker: Worker): Promise<DetectedPrebid[]> => {
  const storage = await getExtensionStorage(serviceWorker);
  return Object.keys(storage)
    .filter((key) => key.startsWith('tab_info_'))
    .flatMap((tabKey) => Object.entries(storage[tabKey] || {}).flatMap(([frameId, frame]: [string, any]) => Object.entries(frame?.prebids || {}).map(([namespace, details]) => ({ tabKey, frameId, namespace, details }))));
};

/**
 * Waits until the extension has stored a Prebid instance for the tab showing `pageUrl`
 * (matched on the host of the tab's top-window URL), and returns it.
 */
export const waitForDetectedPrebid = async (serviceWorker: Worker, pageUrl: string, timeoutMs = 20000): Promise<DetectedPrebid | null> => {
  const host = new URL(pageUrl).host;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const storage = await getExtensionStorage(serviceWorker);
    const tabKeys = Object.keys(storage).filter((key) => {
      const url = storage[key]?.['top-window']?.url;
      return key.startsWith('tab_info_') && typeof url === 'string' && new URL(url).host === host;
    });
    const detected = (await getDetectedPrebids(serviceWorker)).find((prebid) => tabKeys.includes(prebid.tabKey));
    if (detected) return detected;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
};

/** Opens the extension popup as a regular tab. */
export const openExtensionPopup = async (browserContext: BrowserContext, extensionId: string): Promise<Page> => {
  const page = await browserContext.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForLoadState('domcontentloaded');
  return page;
};
