import { test, expect, chromium,  Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
const DEFAULT_SITES = [
  {
    name: 'eatpicks.com',
    url: 'https://eatpicks.com/',
    description: 'Food blog with Prebid.js header bidding',
  },
  {
    name: 'idrlabs.com',
    url: 'https://www.idrlabs.com/anti-hero/test.php',
    description: 'Personality tests platform',
  },
  {
    name: 'recipetineats.com',
    url: 'https://www.recipetineats.com/easy-maple-sticky-glazed-ham/',
    description: 'Recipe publisher with ads & header bidding',
  },
  {
    name: 'linuxhint.com',
    url: 'https://linuxhint.com/install-alpine-linux-vmware-workstation-17-pro-virtual-machine/',
    description: 'Tech tutorial site',
  },
  {
    name: 'accuweather.com',
    url: 'https://www.accuweather.com/',
    description: 'Global weather portal',
  },
  {
    name: 'trumpexcel.com',
    url: 'https://trumpexcel.com/excel-functions/',
    description: 'Excel tutorial resource',
  },
  {
    name: 'macrumors.com',
    url: 'https://www.macrumors.com/',
    description: 'Apple news and rumors',
  },
  {
    name: 'fut.gg',
    url: 'https://www.fut.gg/players/150516-lukas-podolski/24-50482164/',
    description: 'FIFA / EA FC gaming database',
  },
  {
    name: 'biancazapatka.com',
    url: 'https://biancazapatka.com/en/bircher-muesli-recipe/',
    description: 'Food & recipe blog',
  },
  {
    name: 'britannica.com',
    url: 'https://www.britannica.com/quiz/that-90s-quiz',
    description: 'Encyclopaedia Britannica quiz',
  },
  {
    name: 'expressandstar.com',
    url: 'https://www.expressandstar.com/news/business/2024/01/10/wolverhampton-shop-to-have-its-licence-reviewed-after-being-caught-selling-single-cans-of-high-strength-alcohol-out-of-hours/?criteo=true',
    description: 'Regional news site with Criteo / Prebid',
  },
  {
    name: 'voici.fr',
    url: 'https://www.voici.fr/',
    description: 'French entertainment and celebrity magazine',
  },
  {
    name: 'welingelichtekringen.nl',
    url: 'https://www.welingelichtekringen.nl/',
    description: 'Dutch news publication',
  },
  {
    name: 'heise.de',
    url: 'https://www.heise.de/hintergrund/Die-Entwickler-des-Open-Source-Lautsprechers-Teufel-Mynd-im-Interview-10490607.html',
    description: 'German tech journalism portal',
  },
  {
    name: 'figma.com (proto)',
    url: 'https://www.figma.com/proto/SPBOeYuFeApTozU8cD53Kg/COMPAS---Healthcare-Exchange?node-id=695-93367',
    description: 'Figma interactive web prototype',
  },
];
const ITERATIONS = parseInt(process.env.PERF_ITERATIONS || '3', 10);
const SETTLE_TIME_MS = 5000;
interface PerformanceRunResult {
  ttfb: number;
  fcp: number;
  lcp: number;
  dcl: number;
  loadTime: number;
  longTasksCount: number;
  tbt: number;
  jsHeapUsedMB: number;
  scriptDurationMs: number;
  layoutDurationMs: number;
  taskDurationMs: number;
  domNodes: number;
  jsEventListeners: number;
}
interface SiteBenchmarkSummary {
  site: string;
  url: string;
  baseline: PerformanceRunResult;
  withExtension: PerformanceRunResult;
  delta: {
    fcp: { val: number; pct: number };
    lcp: { val: number; pct: number };
    dcl: { val: number; pct: number };
    loadTime: { val: number; pct: number };
    tbt: { val: number; pct: number };
    longTasksCount: { val: number; pct: number };
    scriptDurationMs: { val: number; pct: number };
    jsHeapUsedMB: { val: number; pct: number };
  };
}
const acceptConsentDialog = async function(page: Page): Promise<void> {
  const consentSelectors = [
    '[data-testid="uc-accept-all-button"]',
    '.cmpboxbtn.cmpboxbtnyes',
    '#onetrust-accept-btn-handler',
    'button.fc-cta-consent',
    '.qc-cmp2-summary-buttons button:first-child',
    'button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    'button.sp_choice_type_11',
    'button[mode="primary"]',
    'button.accept-all',
    '[aria-label="Accept all"]',
    '[data-gdpr-consent="accept"]',
    'button:has-text("Accept All")',
    'button:has-text("Alle akzeptieren")',
    'button:has-text("Alles akzeptieren")',
    'button:has-text("Zustimmen")',
    'button:has-text("Einverstanden")',
    'button:has-text("AGREE")',
    'button:has-text("I Accept")',
    'button:has-text("Accept")',
    'button:has-text("OK")',
  ];
  for (const selector of consentSelectors) {
    try {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 1500 });
        await page.waitForTimeout(1000);
        return;
      }
    } catch (_) {}
  }
  for (const frame of page.frames()) {
    for (const selector of consentSelectors.slice(0, 10)) {
      try {
        const btn = frame.locator(selector).first();
        if (await btn.isVisible({ timeout: 300 })) {
          await btn.click({ timeout: 1500 });
          await page.waitForTimeout(1000);
          return;
        }
      } catch (_) {}
    }
  }
}
const measurePagePerformance = async function(url: string, withExtension: boolean, pathToExtension: string): Promise<PerformanceRunResult> {
  const userDataDir = path.join(os.tmpdir(), `perf_profile_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const launchArgs = ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--enable-precise-memory-info'];
  if (withExtension) {
    launchArgs.push(`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`);
  }
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: launchArgs,
    viewport: { width: 1440, height: 900 },
  });
  if (withExtension) {
    // Enable InjectedApp AdUnit Overlays in extension storage
    let sw = context.serviceWorkers()[0];
    if (!sw) {
      try {
        sw = await context.waitForEvent('serviceworker', { timeout: 3000 });
      } catch (_) {}
    }
    if (sw) {
      try {
        await sw.evaluate(() => {
          return chrome.storage.local.set({ PP_CONSOLE_STATE: true });
        });
      } catch (_) {}
    }
  }
  const page = await context.newPage();
  // Attach CDP session to gather Chrome DevTools performance metrics
  const client = await context.newCDPSession(page);
  await client.send('Performance.enable');
  // Injected script to capture Long Tasks & LCP before page scripts start running
  await page.addInitScript(
    ({ withExtension: isExt }) => {
      (window as any).__perfData = {
        longTasks: [] as number[],
        lcp: 0,
      };
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            (window as any).__perfData.longTasks.push(entry.duration);
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (_) {}
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            (window as any).__perfData.lcp = entries[entries.length - 1].startTime;
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (_) {}
      if (isExt) {
        window.addEventListener('DOMContentLoaded', () => {
          document.dispatchEvent(new CustomEvent('PP_CONSOLE_STATE', { detail: true }));
        });
      }
    },
    { withExtension }
  );
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  } catch (e) {
    console.warn(`    Navigation timeout on ${url}, continuing to capture collected metrics`);
  }
  // Dismiss any consent banner to let auctions fire
  await acceptConsentDialog(page);
  // Allow background auction and script execution to settle
  await page.waitForTimeout(SETTLE_TIME_MS);
  // Retrieve browser-side Web Vitals and Navigation Timings
  const browserMetrics = await page.evaluate(() => {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const nav = navEntries.length > 0 ? navEntries[0] : null;
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((p) => p.name === 'first-contentful-paint');
    const fcp = fcpEntry ? fcpEntry.startTime : 0;
    const perfData = (window as any).__perfData || { longTasks: [], lcp: 0 };
    const longTasks: number[] = perfData.longTasks || [];
    const tbt = longTasks.reduce((acc, duration) => acc + Math.max(0, duration - 50), 0);
    return {
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
      fcp: Math.round(fcp),
      lcp: Math.round(perfData.lcp || fcp),
      dcl: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0,
      loadTime: nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0,
      longTasksCount: longTasks.length,
      tbt: Math.round(tbt),
    };
  });
  // Retrieve CDP Performance Metrics
  const cdpMetricsResponse = await client.send('Performance.getMetrics');
  const cdpMap = new Map<string, number>();
  for (const m of cdpMetricsResponse.metrics) {
    cdpMap.set(m.name, m.value);
  }
  const jsHeapUsedMB = Number(((cdpMap.get('JSHeapUsedSize') || 0) / (1024 * 1024)).toFixed(2));
  const scriptDurationMs = Math.round((cdpMap.get('ScriptDuration') || 0) * 1000);
  const layoutDurationMs = Math.round((cdpMap.get('LayoutDuration') || 0) * 1000);
  const taskDurationMs = Math.round((cdpMap.get('TaskDuration') || 0) * 1000);
  const domNodes = cdpMap.get('Nodes') || 0;
  const jsEventListeners = cdpMap.get('JSEventListeners') || 0;
  await context.close();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch (_) {}
  return {
    ...browserMetrics,
    jsHeapUsedMB,
    scriptDurationMs,
    layoutDurationMs,
    taskDurationMs,
    domNodes,
    jsEventListeners,
  };
}
/**
 * Calculates median of an array of numbers.
 */
const median = function(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
/**
 * Aggregates multiple run results into median metrics.
 */
const aggregateRuns = function(runs: PerformanceRunResult[]): PerformanceRunResult {
  return {
    ttfb: Math.round(median(runs.map((r) => r.ttfb))),
    fcp: Math.round(median(runs.map((r) => r.fcp))),
    lcp: Math.round(median(runs.map((r) => r.lcp))),
    dcl: Math.round(median(runs.map((r) => r.dcl))),
    loadTime: Math.round(median(runs.map((r) => r.loadTime))),
    longTasksCount: Math.round(median(runs.map((r) => r.longTasksCount))),
    tbt: Math.round(median(runs.map((r) => r.tbt))),
    jsHeapUsedMB: Number(median(runs.map((r) => r.jsHeapUsedMB)).toFixed(2)),
    scriptDurationMs: Math.round(median(runs.map((r) => r.scriptDurationMs))),
    layoutDurationMs: Math.round(median(runs.map((r) => r.layoutDurationMs))),
    taskDurationMs: Math.round(median(runs.map((r) => r.taskDurationMs))),
    domNodes: Math.round(median(runs.map((r) => r.domNodes))),
    jsEventListeners: Math.round(median(runs.map((r) => r.jsEventListeners))),
  };
}
const calcDelta = function(base: number, ext: number) {
  const val = ext - base;
  const pct = base > 0 ? Number(((val / base) * 100).toFixed(1)) : 0;
  return { val: Number(val.toFixed(2)), pct };
}
test.describe('Real-World Performance Benchmark', () => {
  test('Measures A/B performance on live publisher sites', async () => {
    const pathToExtension = path.join(__dirname, '../build');
    expect(fs.existsSync(pathToExtension), 'Build directory must exist. Run npm run build first.').toBe(true);
    const customUrls = process.env.PERF_URLS ? process.env.PERF_URLS.split(',').map((u) => u.trim()) : null;
    const targetSites = customUrls ? customUrls.map((u) => ({ name: new URL(u).hostname, url: u, description: 'Custom test URL' })) : DEFAULT_SITES;
    // Dynamically scale timeout based on site count and iterations
    test.setTimeout(targetSites.length * ITERATIONS * 2 * 50000 + 60000);
    const summaries: SiteBenchmarkSummary[] = [];
    for (const site of targetSites) {
      // 1. Baseline Runs (No Extension)
      const baselineRuns: PerformanceRunResult[] = [];
      for (let i = 1; i <= ITERATIONS; i++) {
        process.stdout.write(`    - Iteration ${i}/${ITERATIONS}... `);
        const res = await measurePagePerformance(site.url, false, pathToExtension);
        baselineRuns.push(res);
      }
      const baselineMedian = aggregateRuns(baselineRuns);
      // 2. Extension Runs (With Professor Prebid)
      const extRuns: PerformanceRunResult[] = [];
      for (let i = 1; i <= ITERATIONS; i++) {
        process.stdout.write(`    - Iteration ${i}/${ITERATIONS}... `);
        const res = await measurePagePerformance(site.url, true, pathToExtension);
        extRuns.push(res);
      }
      const extMedian = aggregateRuns(extRuns);
      // 3. Compute Deltas
      const summary: SiteBenchmarkSummary = {
        site: site.name,
        url: site.url,
        baseline: baselineMedian,
        withExtension: extMedian,
        delta: {
          fcp: calcDelta(baselineMedian.fcp, extMedian.fcp),
          lcp: calcDelta(baselineMedian.lcp, extMedian.lcp),
          dcl: calcDelta(baselineMedian.dcl, extMedian.dcl),
          loadTime: calcDelta(baselineMedian.loadTime, extMedian.loadTime),
          tbt: calcDelta(baselineMedian.tbt, extMedian.tbt),
          longTasksCount: calcDelta(baselineMedian.longTasksCount, extMedian.longTasksCount),
          scriptDurationMs: calcDelta(baselineMedian.scriptDurationMs, extMedian.scriptDurationMs),
          jsHeapUsedMB: calcDelta(baselineMedian.jsHeapUsedMB, extMedian.jsHeapUsedMB),
        },
      };
      summaries.push(summary);
      // Print Console Summary for this site
      console.table([
        { Metric: 'FCP (ms)', Baseline: baselineMedian.fcp, 'With Extension': extMedian.fcp, 'Delta (%)': `${summary.delta.fcp.pct > 0 ? '+' : ''}${summary.delta.fcp.pct}%` },
        { Metric: 'LCP (ms)', Baseline: baselineMedian.lcp, 'With Extension': extMedian.lcp, 'Delta (%)': `${summary.delta.lcp.pct > 0 ? '+' : ''}${summary.delta.lcp.pct}%` },
        { Metric: 'DOMContentLoaded (ms)', Baseline: baselineMedian.dcl, 'With Extension': extMedian.dcl, 'Delta (%)': `${summary.delta.dcl.pct > 0 ? '+' : ''}${summary.delta.dcl.pct}%` },
        { Metric: 'Total Load Time (ms)', Baseline: baselineMedian.loadTime, 'With Extension': extMedian.loadTime, 'Delta (%)': `${summary.delta.loadTime.pct > 0 ? '+' : ''}${summary.delta.loadTime.pct}%` },
        { Metric: 'Total Blocking Time (ms)', Baseline: baselineMedian.tbt, 'With Extension': extMedian.tbt, 'Delta (%)': `${summary.delta.tbt.pct > 0 ? '+' : ''}${summary.delta.tbt.pct}%` },
        { Metric: 'Long Tasks Count', Baseline: baselineMedian.longTasksCount, 'With Extension': extMedian.longTasksCount, 'Delta (%)': `${summary.delta.longTasksCount.pct > 0 ? '+' : ''}${summary.delta.longTasksCount.pct}%` },
        { Metric: 'Main Thread Scripting (ms)', Baseline: baselineMedian.scriptDurationMs, 'With Extension': extMedian.scriptDurationMs, 'Delta (%)': `${summary.delta.scriptDurationMs.pct > 0 ? '+' : ''}${summary.delta.scriptDurationMs.pct}%` },
        { Metric: 'JS Heap Used (MB)', Baseline: baselineMedian.jsHeapUsedMB, 'With Extension': extMedian.jsHeapUsedMB, 'Delta (%)': `${summary.delta.jsHeapUsedMB.pct > 0 ? '+' : ''}${summary.delta.jsHeapUsedMB.pct}%` },
      ]);
    }
    // Save detailed report
    const reportDir = path.join(__dirname, '../reports/performance');
    fs.mkdirSync(reportDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(reportDir, `perf-report-${timestamp}.json`);
    const mdPath = path.join(reportDir, `perf-report-${timestamp}.md`);
    fs.writeFileSync(jsonPath, JSON.stringify(summaries, null, 2));
    // Generate Markdown Report
    let mdReport = `# Professor Prebid - Performance Impact Benchmark Report (InjectedApp Overlays ACTIVE)\n\n`;
    mdReport += `**Date:** ${new Date().toUTCString()}  \n`;
    mdReport += `**Configuration:** On-Page InjectedApp AdUnit Overlays Active (\`PP_CONSOLE_STATE = true\`)  \n`;
    mdReport += `**Iterations:** ${ITERATIONS} per condition (Median values reported)  \n\n`;
    for (const s of summaries) {
      mdReport += `## ${s.site} (${s.url})\n\n`;
      mdReport += `| Metric | Baseline (Clean) | With Professor Prebid | Delta | Delta % |\n`;
      mdReport += `|---|---|---|---|---|\n`;
      mdReport += `| **FCP** | ${s.baseline.fcp} ms | ${s.withExtension.fcp} ms | ${s.delta.fcp.val > 0 ? '+' : ''}${s.delta.fcp.val} ms | ${s.delta.fcp.pct > 0 ? '+' : ''}${s.delta.fcp.pct}% |\n`;
      mdReport += `| **LCP** | ${s.baseline.lcp} ms | ${s.withExtension.lcp} ms | ${s.delta.lcp.val > 0 ? '+' : ''}${s.delta.lcp.val} ms | ${s.delta.lcp.pct > 0 ? '+' : ''}${s.delta.lcp.pct}% |\n`;
      mdReport += `| **DOMContentLoaded** | ${s.baseline.dcl} ms | ${s.withExtension.dcl} ms | ${s.delta.dcl.val > 0 ? '+' : ''}${s.delta.dcl.val} ms | ${s.delta.dcl.pct > 0 ? '+' : ''}${s.delta.dcl.pct}% |\n`;
      mdReport += `| **Load Time** | ${s.baseline.loadTime} ms | ${s.withExtension.loadTime} ms | ${s.delta.loadTime.val > 0 ? '+' : ''}${s.delta.loadTime.val} ms | ${s.delta.loadTime.pct > 0 ? '+' : ''}${s.delta.loadTime.pct}% |\n`;
      mdReport += `| **Total Blocking Time (TBT)** | ${s.baseline.tbt} ms | ${s.withExtension.tbt} ms | ${s.delta.tbt.val > 0 ? '+' : ''}${s.delta.tbt.val} ms | ${s.delta.tbt.pct > 0 ? '+' : ''}${s.delta.tbt.pct}% |\n`;
      mdReport += `| **Long Tasks Count** | ${s.baseline.longTasksCount} | ${s.withExtension.longTasksCount} | ${s.delta.longTasksCount.val > 0 ? '+' : ''}${s.delta.longTasksCount.val} | ${s.delta.longTasksCount.pct > 0 ? '+' : ''}${
        s.delta.longTasksCount.pct
      }% |\n`;
      mdReport += `| **Main Thread Scripting** | ${s.baseline.scriptDurationMs} ms | ${s.withExtension.scriptDurationMs} ms | ${s.delta.scriptDurationMs.val > 0 ? '+' : ''}${s.delta.scriptDurationMs.val} ms | ${s.delta.scriptDurationMs.pct > 0 ? '+' : ''}${
        s.delta.scriptDurationMs.pct
      }% |\n`;
      mdReport += `| **JS Heap Used** | ${s.baseline.jsHeapUsedMB} MB | ${s.withExtension.jsHeapUsedMB} MB | ${s.delta.jsHeapUsedMB.val > 0 ? '+' : ''}${s.delta.jsHeapUsedMB.val} MB | ${s.delta.jsHeapUsedMB.pct > 0 ? '+' : ''}${
        s.delta.jsHeapUsedMB.pct
      }% |\n\n`;
    }
    fs.writeFileSync(mdPath, mdReport);
  });
});
