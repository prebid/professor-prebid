import { chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';

export interface ExtensionContextInfo {
  browserContext: BrowserContext;
  extensionId: string;
  serviceWorker: any;
}

export interface LaunchOptions {
  customUserDataDir?: string;
  headless?: boolean;
}

/**
 * Launches Chromium with Professor Prebid unpacked extension loaded.
 */
export const launchExtensionContext = async function(options?: LaunchOptions | string): Promise<ExtensionContextInfo> {
  const customUserDataDir = typeof options === 'string' ? options : options?.customUserDataDir;
  const isHeadless = process.env.HEADED === 'true' || process.env.HEADLESS === 'false' ? false : typeof options === 'object' && options?.headless !== undefined ? options.headless : true;

  const pathToExtension = path.join(__dirname, '../../build');
  const userDataDir = customUserDataDir || path.join(__dirname, '../../test-results/ext_user_dir_' + Date.now());

  const args = [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`, '--no-sandbox', '--disable-web-security'];

  if (isHeadless) {
    args.push('--headless=new');
  }

  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Must remain false for persistent context extension loading; headless is controlled via args
    bypassCSP: true,
    args,
  });

  // Poll for Service Worker
  let serviceWorker = null;
  let retries = 15;
  while (retries > 0) {
    const workers = browserContext.serviceWorkers();
    if (workers.length > 0) {
      serviceWorker = workers[0];
      break;
    }
    await new Promise((r) => setTimeout(r, 400));
    retries--;
  }

  if (!serviceWorker) {
    serviceWorker = await browserContext.waitForEvent('serviceworker', { timeout: 8000 }).catch(() => null);
  }

  if (!serviceWorker) {
    throw new Error('Professor Prebid extension Service Worker could not be loaded.');
  }

  const extensionId = serviceWorker.url().split('/')[2];

  return {
    browserContext,
    extensionId,
    serviceWorker,
  };
}

/**
 * Retrieves all stored key-values from chrome.storage.local.
 */
export const getExtensionStorage = async function(serviceWorker: any): Promise<Record<string, any>> {
  return await serviceWorker.evaluate(async () => {
    return await chrome.storage.local.get(null);
  });
}

/**
 * Opens Professor Prebid's DevTools Panel page.
 */
export const openExtensionPanel = async function(browserContext: BrowserContext, extensionId: string): Promise<Page> {
  const page = await browserContext.newPage();
  await page.goto(`chrome-extension://${extensionId}/panel.html`);
  await page.waitForLoadState('domcontentloaded');
  return page;
}

/**
 * Opens Professor Prebid's Popup window page.
 */
export const openExtensionPopup = async function(browserContext: BrowserContext, extensionId: string): Promise<Page> {
  const page = await browserContext.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForLoadState('domcontentloaded');
  return page;
}
