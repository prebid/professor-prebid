---
name: prebid-surface-validator
description: Audit and validate that live Prebid.js runtime data (config, events, bids, user IDs, installed modules, ad units, pre-auction signals) is captured by Professor Prebid and surfaced in its storage, MCP bridge and UI panels. Use when adding features, debugging dropped events or missing config keys, verifying data layer integrity after prebid.js bumps, or QA'ing against real publisher websites.
---

# Prebid Data Surface Validator

Checks that what the page's Prebid.js reports (`pbjs.getConfig()`, `pbjs.getEvents()`, `pbjs.getUserIdsAsEids()`, `pbjs.installedModules`, `pbjs.adUnits`, `pbjs.getAllWinningBids()`, `pbjs.bidderSettings`) is what Professor Prebid captures in the page, stores in `chrome.storage.local`, exposes on `window.__PROFESSOR_PREBID_MCP__`, and shows in its tabs.

## When to Use

- **After prebid upgrades**: Confirm new config blocks or event payloads are captured without serialization breaks.
- **When adding new extension features/tabs**: Verify newly introduced components consume the captured data.
- **When troubleshooting data drops**: Find whether the cause is the update throttle, event serialization, the events download in the panel, or a consent banner that keeps Prebid from loading.
- **QA against live publisher websites**: Run the reconciliation on a live URL with automated CMP consent handling.

---

## How the data flows

```
[ Page (main world) ]  src/pages/Injected/prebid.ts
  pbjs.getConfig(), getUserIdsAsEids(), installedModules, version, bidderSettings ─┐
  pbjs.getEvents() ─► safeStringify ─► Blob ─► object URL (eventsUrl) ─────────────┤
                                                                                     ▼
  sendDetailsToBackground (throttled to one update per 2500ms)
        │  EventBus ─► content script ─► background
        ▼
[ chrome.storage.local ]  tab_info_<tabId>[frameId].prebids[namespace]   (eventsUrl, not the events)
        │
        ▼
[ Popup / DevTools panel ]  src/pages/Shared/contexts/fetchEvents.ts
  downloads eventsUrl when its host matches the inspected tab (or the frame), then renders:
  Ad Units (/), Bids (/bids), Config (/config), Events (/events), Network Inspector (/initiator),
  Pre-Auction (/preAuction), Timeline (/timeline), Tools (/tools), User ID (/userId), Version (/version)

[ MCP bridge ]  src/pages/Injected/mcpBridge.ts — window.__PROFESSOR_PREBID_MCP__
  opt-in: created when the page receives the PP_MCP_BRIDGE_ENABLE event (Tools tab, "Inject DevTools MCP Standalone")
```

Things that shape what gets captured:

- Updates are sent on `auctionInit`, `bidRequested`, `bidResponse`, `noBid`, `auctionEnd` and `bidWon`, and when the popup or panel opens. A config change with no event after it reaches storage only when the popup or panel next opens.
- With `pbjs.getEvents()` (every current Prebid) the full event log is sent. Without it the script keeps only those six event types, at most 500 events.
- Old object URLs are revoked 30s after a newer one replaces them.

---

## 1. Quick Audit Commands

Build first; the e2e tests load `./build`.

```sh
npm run build
```

### A. Synthetic reconciliation (mock page, no network)

```sh
npm run audit:surface
```

Loads a synthetic Prebid page and compares version, modules, config, events, EIDs, winning bids and ad units between the page and the extension. The Markdown report is printed to the terminal and attached to the test result.

### B. Against a live publisher website

```sh
AUDIT_URL=https://www.eatpicks.com/ npm run audit:surface
```

Accepts the consent banner, waits for an auction to end, and prints the same report for that page. It fails on version, module or config mismatches; differences in events, EIDs, bids and ad units are reported but do not fail it, since live pages keep changing.

### C. The UI

`npm run test:e2e` includes `e2e/panel.spec.ts`. It opens the real DevTools panel for a mock page and checks that the Ad Units, Bids, Events and User ID tabs show what the page reported. Extend it when a tab starts showing new data.

To look at a tab yourself, load `./build` as an unpacked extension, open a publisher page, and open DevTools > Professor Prebid.

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

### Extract Extension Captured State (Extension Service Worker Console)

```js
chrome.storage.local.get(null, (data) => {
  Object.keys(data)
    .filter((k) => k.startsWith('tab_info_'))
    .forEach((k) => console.log(`[${k}] Prebid data:`, data[k]));
});
```

Storage holds an `eventsUrl` per instance, not the events. To see the events, open that URL from the page's console: `await (await fetch('<eventsUrl>')).json()`.

### Read via the MCP bridge (Page Console)

```js
(() => {
  // The bridge is opt-in; the Tools tab's "Inject DevTools MCP Standalone" button sends this event.
  document.dispatchEvent(new CustomEvent('PP_MCP_BRIDGE_ENABLE'));
  const mcp = window.__PROFESSOR_PREBID_MCP__;
  if (!mcp) return console.warn('Professor Prebid is not running on this page');
  console.log('MCP Snapshot:', mcp.getSnapshot());
  console.log('MCP Auctions:', mcp.getAuctions());
  console.log('MCP Latencies:', mcp.getLatencySummary());
})();
```

---

## 3. Failure Modes & Root-Cause Triage

| Symptom                                                          | Probable Cause                                                                                                                                                                                 | Fix Location                                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Events missing or count lower than page**                      | The last throttled update (2500ms) has not been sent yet, an event failed to stringify (it shows as "could not stringify"), or the page has no `getEvents()` and only six event types are kept | `Injected/prebid.ts`: `throttle`, `safeStringify`, `addEventListeners`               |
| **Config keys missing or stale**                                 | Config changed with no Prebid event after it, so no update was sent; functions and `undefined` values in the config do not survive the message to the background (the audit ignores them)      | `Injected/prebid.ts`: `sendDetailsToBackground` and its triggers                     |
| **Version shown, but Ad Units, Bids, Events and Timeline empty** | The panel skipped or failed the events download: the `eventsUrl` host did not match the inspected tab or frame, or the URL was revoked                                                         | `Shared/contexts/fetchEvents.ts`; `DOWNLOAD_FAILED` handling in `Injected/prebid.ts` |
| **Pre-Auction shows `unknown` or `never`**                       | Provider attribution maps drifted                                                                                                                                                              | Run the `prebid-metadata` skill to regenerate `providerSignals.ts`                   |
| **No Prebid data captured on live URL**                          | The consent banner was not accepted, so the ad stack never loaded                                                                                                                              | `e2e/fixtures/cmpConsentHandlers.ts` selector coverage                               |
| **`__PROFESSOR_PREBID_MCP__` undefined**                         | The bridge is opt-in and was never enabled on this page                                                                                                                                        | Dispatch `PP_MCP_BRIDGE_ENABLE` (see above)                                          |

---

## 4. Full Quality Gates

Always verify after making changes:

```sh
npm run typecheck
npm test
npm run build        # before the e2e tests, which load ./build
npm run test:e2e     # includes the synthetic surface audit and the panel test
```

Run `npm run test:e2e:live` as well when the change affects what is captured on real pages.
