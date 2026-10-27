---
name: prebid-surface-validator
description: Audit and validate that 100% of live Prebid.js runtime data (config, events, bids, user IDs, installed modules, ad units, pre-auction signals) is accurately captured and surfaced across Professor Prebid extension storage, MCP bridge, and UI panels. Use when adding features, debugging dropped events or missing config keys, verifying data layer integrity after prebid.js bumps, or QA'ing against real publisher websites.
---

# Prebid Data Surface Validator

Ensures that **every data point** in the live Prebid.js runtime (`pbjs.getConfig()`, `pbjs.getEvents()`, `pbjs.getUserIdsAsEids()`, `pbjs.installedModules`, `pbjs.adUnits`, `pbjs.getAllWinningBids()`, bidder settings, etc.) is faithfully captured by Professor Prebid's content script, transferred across background workers, stored in `chrome.storage.local`, exposed on `window.__PROFESSOR_PREBID_MCP__`, and surfaced across the extension's UI tabs.

## When to Use

- **After prebid upgrades**: Confirm new config blocks or event payloads are captured without serialization breaks.
- **When adding new extension features/tabs**: Verify newly introduced components consume the full runtime truth.
- **When troubleshooting data drops**: Determine if an issue is caused by throttle timing (`2500ms`), blob object URL serialization, circular references in `pbjs.getEvents()`, or CMP consent delays.
- **QA against live publisher websites**: Run full surface reconciliation on live domains with automated CMP consent handling.

---

## Prebid Surface Architecture

```
[ Web Page Scope (Window) ]
  ├── pbjs.getConfig()         ──► Injected/prebid.ts
  ├── pbjs.getEvents()         ──► safeStringify & Blob URL  ──► chrome.storage.local
  ├── pbjs.getUserIdsAsEids()  ──► throttled message bus        (tab_info_<id>)
  ├── pbjs.installedModules    ──► MCP Bridge
  └── pbjs.adUnits / bids      ──► window.__PROFESSOR_PREBID_MCP__
                                          │
                                          ▼
                      [ Professor Prebid UI Panels & MCP ]
                      ├── Config Tab       (/config)
                      ├── Events Tab       (/events)
                      ├── Timeline Tab     (/timeline)
                      ├── Bids Tab         (/bids)
                      ├── User ID Tab      (/userId)
                      ├── Ad Units Tab     (/adUnits)
                      ├── Pre-Auction Tab  (/preAuction)
                      └── Version Info     (/version)
```

---

## 1. Quick Audit Commands

### A. Run Synthetic Matrix Audit (Automated 100% Reconciliation)
```sh
npm run audit:surface
```
*Validates that all configurations, multi-bidder events, EID sources, modules, and winning bids are captured with zero discrepancies.*

### B. Run Audit Against a Live Publisher Website
```sh
npm run audit:surface -- --url https://www.eatpicks.com/
# or
URL="https://www.heise.de/" npx playwright test e2e/specs/09_prebid_surface_audit.spec.ts
```

### C. Check Generated Audit Report
```sh
cat reports/surface-audit-report.md
```

---

## 2. Manual Surface Extraction & Inspection Protocol

When debugging in DevTools or browser console, compare **Page Truth** vs **Extension State**:

### Extract Page Truth (Page Console)
```js
(() => {
  const pb = window.pbjs || (window._pbjsGlobals && window[window._pbjsGlobals[0]]);
  if (!pb) return console.error('No Prebid detected');
  console.log('--- PREBID GROUND TRUTH ---');
  console.log('Version:', pb.version);
  console.log('Installed Modules:', pb.installedModules);
  console.log('Config:', pb.getConfig ? pb.getConfig() : {});
  console.log('EIDs:', pb.getUserIdsAsEids ? pb.getUserIdsAsEids() : []);
  console.log('AdUnits:', pb.adUnits || []);
  console.log('Events Count:', (pb.getEvents ? pb.getEvents() : []).length);
  console.log('Winning Bids:', pb.getAllWinningBids ? pb.getAllWinningBids() : []);
})();
```

### Extract Extension Captured State (Extension Service Worker Console / Storage)
```js
chrome.storage.local.get(null, (data) => {
  const tabKeys = Object.keys(data).filter(k => k.startsWith('tab_info_'));
  tabKeys.forEach(k => {
    console.log(`[${k}] Prebid data:`, data[k]);
  });
});
```

### Read via MCP DevTools Bridge (Page Console)
```js
(() => {
  if (!window.__PROFESSOR_PREBID_MCP__) {
    return console.warn('Professor Prebid MCP bridge not initialized yet');
  }
  console.log('MCP Snapshot:', window.__PROFESSOR_PREBID_MCP__.getSnapshot());
  console.log('MCP Auctions:', window.__PROFESSOR_PREBID_MCP__.getAuctions());
  console.log('MCP Latencies:', window.__PROFESSOR_PREBID_MCP__.getLatencySummary());
})();
```

---

## 3. Failure Modes & Root-Cause Triage

| Symptom | Probable Cause | Fix Location |
|---|---|---|
| **Events missing or count lower than page** | Throttle window (`updateRateInterval = 2500ms`) or circular reference stringify error | Check `Injected/prebid.ts` `safeStringify()` and event listener bindings. |
| **Config keys missing** | Config modified after auction init without firing update | Check `sendDetailsToBackground` trigger on `window.addEventListener('message')`. |
| **Pre-Auction shows `unknown` or `never`** | Provider attribution maps drifted | Run `prebid-metadata` skill to regenerate `providerSignals.ts`. |
| **No Prebid data captured on live URL** | CMP / GDPR consent banner blocked ad stack initialization | Check `e2e/fixtures/cmpConsentHandlers.ts` selector coverage. |
| **Object URL blob fetch failure (`eventsUrl`)** | Blob revoked before panel consumption | Ensure `URL.revokeObjectURL` timing allows extension panel load. |

---

## 4. Full Quality Gates

Always verify after making changes:

```sh
# 1. Run Surface Audit
npm run audit:surface

# 2. Run All Unit & E2E Tests
npm run test
npm run test:e2e

# 3. Check Type Error Baseline & Build
npx tsc --noEmit 2>&1 | grep -cE "error TS"
npm run build
```
