---
name: prebid-upgrade
description: Upgrade the prebid.js dependency and bring the Pre-Auction and Timeline tabs back in sync with it. Use when bumping prebid.js, or when the pre-auction waterfall or provider attribution looks wrong after a bump. Covers the behavioural assumptions and new auction phases the extraction scripts cannot detect. For the generated provider maps themselves, use the prebid-metadata skill.
---

# Upgrading prebid.js

Two features read prebid's internals and drift silently when prebid changes:

- **Timeline** pre-auction waterfall — `src/pages/Shared/components/timeline/preAuctionTimeline.ts`
- **Pre-Auction** tab — `src/pages/Shared/components/preAuction/*`

Nothing here throws when prebid moves. A renamed metric becomes a missing bar; a moved endpoint
becomes an unattributed request. **Silent degradation is the failure mode — assume nothing survived
until checked.**

Prebid's full source is in `node_modules/prebid.js`. Read it there, not on GitHub: it is the exact
version being shipped, and needs no network.

## 1. Bump and regenerate (mechanical)

```sh
npm install --save-dev prebid.js@latest
```

Then regenerate the three provider maps and work through what the extractors miss — **that is the
`prebid-metadata` skill**, which also covers validating the result against a live page. Do it before
the steps below; a stale map makes every verdict below untrustworthy.

Establish the type-error baseline before the bump (`git stash` → `npx tsc --noEmit 2>&1 | grep -cE
"error TS"` → restore), because the check in step 4 compares against it.

## 2. Verify the behavioural assumptions

Each of these underpins a feature. Check all of them; report any that moved.

| Assumption | Check | Breaks |
|---|---|---|
| RTD awaited only if `waitForIt` **and** `auctionDelay > 0` | `grep -n "waitForIt\|shouldDelayAuction" node_modules/prebid.js/modules/rtdModule/index.ts` | "NOT awaited" verdict |
| `userSync.auctionDelay` default | `grep -n "auctionDelay:" node_modules/prebid.js/src/userSync.ts` | identity awaited verdict |
| metric names `requestBids.total` / `.callBids` / `.makeRequests` / `.validate` | `grep -rn "requestBids\." node_modules/prebid.js/src/auction.ts node_modules/prebid.js/src/prebid.ts` | whole waterfall |
| `Metrics.toJSON()` still flattens, and `getProperties()` still returns `metrics` | `grep -n "toJSON()" .../src/utils/perfMetrics.ts; grep -n "metrics: metrics" .../src/auction.ts` | whole waterfall |
| RTD enrichment still lands on `bid.ortb2Imp` | `grep -n "ortb2Imp: mergeDeep" node_modules/prebid.js/src/adapterManager.ts` | every ortb2Imp verdict |
| `deepSetValue` / `mergeDeep` are still how modules write | `grep -c "deepSetValue" node_modules/prebid.js/modules/*RtdProvider.*` | signal extraction |

Prebid moves files between releases (v10 `src/utils.js` → v11 `src/utils/logging.ts`). If a grep
finds nothing, the file moved — locate it before concluding the behaviour is gone.

## 3. Find new pre-auction phases (the script cannot)

Every `timedAuctionHook('<name>', ...)` is a phase that appears as a `requestBids.<name>` metric.

```sh
grep -rn "timedAuctionHook('" node_modules/prebid.js/src node_modules/prebid.js/modules node_modules/prebid.js/libraries | grep -v spec
```

Compare against `PRE_AUCTION_PHASES` in `preAuctionTimeline.ts`. For anything new, find its
registration to place it correctly — order is by **descending priority**:

```sh
grep -rn "getHook('startAuction').before\|getHook('requestBids').before" node_modules/prebid.js/modules
```

`requestBids` hooks run before `startAuction` hooks; within a hook, higher priority first; ties run in
module load order and are therefore nominal.

> v11 added a `rules` module at priority 50 on both hooks, placing `requestBids.rules` between
> `userId` (100) and `rtd` (20). Missing it would have silently folded that time into "Unattributed".

## 4. Verify

```sh
npx tsc --noEmit 2>&1 | grep -cE "error TS"   # must not exceed the pre-existing baseline
npx vitest run
npm run build
```

The repo carries pre-existing type errors. Establish the baseline **before** the bump
(`git stash` → count → restore) and compare; adding none is the bar. Report the count either way
rather than claiming clean.

The live-page validation in the `prebid-metadata` skill is not optional dressing on this — it is the
only check that shows attribution resolving against real data. A green test suite with a stale
`providerSignals.ts` looks identical to a correct one.
