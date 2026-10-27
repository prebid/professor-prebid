---
name: prebid-metadata
description: Regenerate, repair and validate the generated provider maps the Pre-Auction tab reads - eidSources.ts, providerHosts.ts and providerSignals.ts. Use when a provider reports unknown or never, when an ortb2 write shows as unattributable, when adding a curated write path, when running the vendor payload scanner, or when regenerating the maps after a prebid.js bump. Covers the judgment the extraction scripts cannot do.
---

# Prebid provider metadata

Three generated maps let the Pre-Auction tab attribute data to the module that produced it. All are
written by scripts in `utils/prebidMetadata/`, all read `node_modules/prebid.js`, and none of them
throws when prebid moves — a lost entry just downgrades a finding to a shrug.

| Map | Answers |
|---|---|
| `eidSources.ts` | which EID sources an identity module emits |
| `providerHosts.ts` | which endpoints a module calls, for attributing network requests |
| `providerSignals.ts` | **where a module writes**, for proving its data reached an auction |

```sh
node utils/prebidMetadata/extractEidSources.mjs
node utils/prebidMetadata/extractProviderHosts.mjs
node utils/prebidMetadata/extractProviderSignals.mjs
```

Idempotent and offline. Diff the output and account for every change — **check for lost entries, not
just added ones**. A module vanishing is usually correct but must be confirmed.

## Why `providerSignals.ts` carries the most weight

It decides the RTD verdict, and the two failure states are not equally useful:

- a module **with** a known write path and nothing at it → `never`, a real finding
- a module **with no** known write path → `unknown`, which says only that we cannot tell

So a path dropping out of this file silently converts a diagnosis into a shrug. That is the failure
mode to watch for on every regeneration.

## Where a path can come from

Four sources, strongest first. The extractor uses the first three; the fourth is curated.

1. **Module source** — a literal in `deepSetValue` / `mergeDeep` / an assignment. Strongest.
2. **The module's `.md`**, which prebid ships in the package. Needed because some submodules are pure
   shims: they hand `reqBidsConfigObj` to a vendor payload and hold no path themselves. Documentation
   can be stale or aspirational, so treat it as a claim to confirm.
3. **The vendor payload**, via `scanVendorPayloads.mjs` (below). Not part of the build.
4. **A live auction**, curated into `MANUAL_ORTB2` in `extractProviderSignals.mjs`. Last resort, for
   payloads that build their path at runtime.

## What the extractor gets wrong

It parses source, so it inherits source's ambiguities. Each of these has bitten it:

- **Reads counted as writes.** Reading a path is not evidence that the module set it. Only
  `deepSetValue`, `mergeDeep` and direct assignment count; a read treated as a signal marks the
  provider landed on any page where prebid itself writes that path.
- **Comments.** Documentation carries mistyped and aspirational values, so comments are stripped
  before extraction.
- **Container paths.** `ext` and `ext.data` exist on every adUnit once anything writes. Excluded via
  `CONTAINERS`; if a generic path starts appearing for every provider, add it there.
- **Core paths.** Prebid and its first-party-data enrichment write several paths on every page, and
  `.md` files mention them while describing surroundings. Filtered via `CORE_PATHS`, which must stay
  in step with `CORE_IMP_PATHS` / `CORE_ORTB2_PATHS` in `providerDiagnostics.ts`.

A path that survives should carry a vendor namespace of its own. A generic-looking one is usually a
parse artefact — check the source before accepting it.

**Indirections that hide a write.** Three are handled; a fourth will appear eventually:

- string constants — `const NAME = '<domain>'` … `name: NAME`
- local aliases — `const ortb2 = bidConfig.ortb2Fragments?.global`, then a write through `ortb2`
- EID sources published by RTD modules, which otherwise read as an unconfigured identity module

All three were found by running against a live page, not by reading source. **If a provider you know
delivers reports `unknown`, suspect a new one.**

## Repairing the other two maps

**EID sources declared via a constant** are invisible to the `source: '...'` scan and vanish with no
error. Known cases live in the `MANUAL` map in `extractEidSources.mjs`. Confirm those still hold, and
for any configured identity module that ends up with no sources, grep it for `source:` and follow the
constant.

**Endpoints** come from two mechanisms, so a gap in one is often covered: the static map, and
`hostsInConfig()` in `providerDiagnostics.ts`, which reads the live publisher config at runtime for
config-driven providers. Only add a static host when both miss it and the domain is genuinely fixed.
**Never add shared infrastructure** (`amazonaws.com`, `gstatic.com`, `doubleclick.net`, CDNs): a
missing attribution is better than a wrong one.

Modules with no endpoint are correct, not broken — some resolve from a first-party cookie or a
browser API and make no request.

## Scanning vendor payloads

```sh
node utils/prebidMetadata/scanVendorPayloads.mjs
```

Fetches every vendor script whose url is hardcoded in prebid and reports the ortb2 paths inside. The
object literal a payload hands back has to be in the shape prebid expects, so property names usually
survive minification even where the surrounding code is unreadable — expect a full path, not just a
key. A payload that builds its path dynamically yields nothing; that is the `MANUAL_ORTB2` case.

Network access, third-party code, and results change without notice. Run by hand, never in the build.
It prints suggestions only, writes no file, and never executes what it downloads.

## Validating against a live page

Static extraction cannot tell you whether a path is still where the data lands. One real page settles
it, and this is the only check that does. **It needs working RTD credentials** — an all-modules build
with no publisher config proves nothing, because the vendor payloads never authenticate.

Load the page with the extension and read the Pre-Auction tab:

- **The two "not attributable to a configured provider" footers** catch drift. Anything listed is a
  write whose path moved, or one the extractor never found. Both mean the map is now wrong — trace
  the path back to its module and fix the extractor rather than curating around it.
- **A provider showing `never`** — cross-check its timing chip. Requested but wrote nothing is a real
  finding. Never requested at all is a different problem this map cannot diagnose.
- **A provider showing `unknown`** — grep its module for `ortb2Imp` and `ortb2Fragments`. If it does
  write somewhere, the extractor missed it.

To dump what landed independently of the extension:

```js
(() => {
  const CORE = ['gpid', 'tid', 'ae'], seen = new Set();
  pbjs.getEvents().filter((e) => e.eventType === 'auctionEnd').forEach((e) =>
    (e.args.bidderRequests || []).forEach((br) => (br.bids || []).forEach((bid) => {
      const ext = bid.ortb2Imp?.ext || {};
      Object.keys(ext).filter((k) => k !== 'data' && !CORE.includes(k)).forEach((k) => seen.add(`ext.${k}`));
      Object.keys(ext.data || {}).forEach((k) => seen.add(`ext.data.${k}`));
    })));
  console.log('observed:', [...seen].sort());
  console.log('configured rtd:', (pbjs.getConfig('realTimeData')?.dataProviders || []).map((p) => p.name));
})();
```

Every observed path should be claimed by a configured provider. What is left over is the gap.

Config names matter: the maps are keyed by prebid's `componentName`, so a publisher config using a
different alias will not match, and the provider reports `unknown` however good the map is.

## Verify

```sh
npx tsc --noEmit 2>&1 | grep -cE "error TS"   # must not exceed the pre-existing baseline
npx vitest run
npm run build
```

The repo carries pre-existing type errors — establish the baseline first (`git stash` → count →
restore) and report the count rather than claiming clean. `npm run build` does not typecheck, so a
green build is not evidence the panel works.

A green test suite with a stale `providerSignals.ts` looks identical to a correct one. Only the live
page distinguishes them.
