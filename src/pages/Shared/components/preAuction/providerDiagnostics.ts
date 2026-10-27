import { EventRecord } from 'prebid.js/types.d.ts';
import { IPrebidDetails } from '../../../Injected/prebid';
import { EID_SOURCES_BY_MODULE } from './eidSources';
import { PROVIDER_HOSTS } from './providerHosts';
import { PROVIDER_SIGNALS } from './providerSignals';

export type ProviderType = 'identity' | 'rtd';

export type LandedVerdict = 'landed' | 'late' | 'never' | 'unknown';

export interface IEvidenceDetail {
  at: string;

  value?: unknown;
}

export interface IAuctionVerdict {
  auctionId: string;
  auctionIndex: number;
  verdict: LandedVerdict;
  evidence: string[];

  evidenceDetail?: { [item: string]: IEvidenceDetail };
}

export interface IProviderDiagnostic {
  name: string;
  type: ProviderType;

  hosts: string[];

  awaited: boolean;
  awaitedReason: string;

  eidSources?: string[];

  matchTokens: string[];
  auctions: IAuctionVerdict[];
  landedCount: number;
  config: unknown;
}

export interface IDiagnosedAuction {
  auctionId: string;
  index: number;
  timestamp: number;

  firstBidderStart: number;
}

export interface IProviderDiagnostics {
  providers: IProviderDiagnostic[];
  auctions: IDiagnosedAuction[];
  rtdAuctionDelay: number;
  userSyncAuctionDelay: number;

  unmatchedEidSources: string[];

  unmatchedImpPaths: string[];

  unmatchedOrtb2Paths: string[];

  segmentNames: string[];
}

const DOMAIN_IN_STRING = /(?:https?:)?\/\/([a-z0-9.-]*[a-z0-9-]\.[a-z]{2,})/i;
const BARE_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

const hostsInConfig = (value: unknown, depth = 4): string[] => {
  if (depth < 0 || value == null) return [];
  if (typeof value === 'string') {
    const fromUrl = DOMAIN_IN_STRING.exec(value);
    if (fromUrl) return [fromUrl[1].toLowerCase()];
    return BARE_DOMAIN.test(value) ? [value.toLowerCase()] : [];
  }
  if (typeof value !== 'object') return [];
  return Object.values(value as Record<string, unknown>).flatMap((entry) => hostsInConfig(entry, depth - 1));
};

const knownHosts = (type: ProviderType, name: string, config: unknown): string[] => distinct([...(PROVIDER_HOSTS[`${type === 'identity' ? 'userId' : 'rtd'}:${name}`] || []), ...hostsInConfig(config)]);

/** Prebid 10 defaults `userSync.auctionDelay` to 500ms (see prebid.js src/userSync.ts). */
const DEFAULT_USER_SYNC_AUCTION_DELAY = 500;

const asArray = <T>(input: unknown): T[] => (Array.isArray(input) ? (input as T[]) : []);

const distinct = (input: string[]): string[] => Array.from(new Set(input.filter(Boolean)));

/** Reduces a module name or hostname to comparable letters. */
export const normalizeToken = (input: string): string =>
  String(input || '')
    .toLowerCase()
    .replace(/idsystem$|rtdprovider$|rtd$|id$/, '')
    .replace(/[^a-z0-9]/g, '');

/**
 * A module can own several EID sources, so this returns all of them: the generated mapping plus
 * anything observed that token matches the module name, covering modules added after generation.
 */
const resolveEidSources = (moduleName: string, knownSources: string[]): string[] => {
  const mapped = EID_SOURCES_BY_MODULE[moduleName] || [];
  const token = normalizeToken(moduleName);
  const inferred = token ? knownSources.filter((source) => normalizeToken(source).includes(token)) : [];
  return distinct([...mapped, ...inferred]);
};

const getBidderRequests = (auctionEndEvent: EventRecord<'auctionEnd'>): any[] => asArray<any>(auctionEndEvent?.args?.bidderRequests);

/** EID sources carried by an auction, preferring ortb2 and falling back to the per-bid alias. */
const getAuctionEidSources = (auctionEndEvent: EventRecord<'auctionEnd'>): string[] =>
  distinct(
    getBidderRequests(auctionEndEvent).flatMap((bidderRequest) => [
      ...asArray<any>(bidderRequest?.ortb2?.user?.ext?.eids).map((eid) => eid?.source),
      ...asArray<any>(bidderRequest?.bids).flatMap((bid) => asArray<any>(bid?.userIdAsEids).map((eid) => eid?.source)),
    ])
  );

/** ortb2 data segment names, where RTD providers put the audience/context data they contribute. */
const getAuctionSegmentNames = (auctionEndEvent: EventRecord<'auctionEnd'>): string[] =>
  distinct(getBidderRequests(auctionEndEvent).flatMap((bidderRequest) => [...asArray<any>(bidderRequest?.ortb2?.user?.data).map((entry) => entry?.name), ...asArray<any>(bidderRequest?.ortb2?.site?.content?.data).map((entry) => entry?.name)]));

const valueAt = (root: unknown, path: string): unknown => path.split('.').reduce<any>((node, key) => (node == null || typeof node !== 'object' ? undefined : node[key]), root);

/** True when `path` resolves to something an RTD module actually wrote, rather than an empty container. */
const hasPath = (root: unknown, path: string): boolean => {
  const value = valueAt(root, path);
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return value !== '';
};

/** Where a segment name was found. A name alone does not say which branch carried it. */
const findSegment = (event: EventRecord<'auctionEnd'>, name: string): IEvidenceDetail | undefined => {
  for (const bidderRequest of getBidderRequests(event)) {
    const inUser = asArray<any>(bidderRequest?.ortb2?.user?.data).find((entry) => entry?.name === name);
    if (inUser) return { at: 'ortb2.user.data[]', value: inUser };
    const inSite = asArray<any>(bidderRequest?.ortb2?.site?.content?.data).find((entry) => entry?.name === name);
    if (inSite) return { at: 'ortb2.site.content.data[]', value: inSite };
  }
  return undefined;
};

/** Where an EID source was found; it can arrive on ortb2 or on the per-bid alias. */
const findEid = (event: EventRecord<'auctionEnd'>, source: string): IEvidenceDetail | undefined => {
  for (const bidderRequest of getBidderRequests(event)) {
    const onOrtb2 = asArray<any>(bidderRequest?.ortb2?.user?.ext?.eids).find((eid) => eid?.source === source);
    if (onOrtb2) return { at: 'ortb2.user.ext.eids[]', value: onOrtb2 };
    for (const bid of asArray<any>(bidderRequest?.bids)) {
      const onBid = asArray<any>(bid?.userIdAsEids).find((eid) => eid?.source === source);
      if (onBid) return { at: 'bids[].userIdAsEids[]', value: onBid };
    }
  }
  return undefined;
};

/** Every `ortb2Imp` in an auction. RTD enrichment is per adUnit, so it lands on the bids. */
const getAuctionImps = (auctionEndEvent: EventRecord<'auctionEnd'>): unknown[] =>
  getBidderRequests(auctionEndEvent)
    .flatMap((bidderRequest) => asArray<any>(bidderRequest?.bids).map((bid) => bid?.ortb2Imp))
    .filter(Boolean);

/** Written by prebid on every adUnit, so never RTD enrichment. */
const CORE_IMP_PATHS = ['ext.gpid', 'ext.tid', 'ext.ae', 'ext.data.adserver', 'ext.data.pbadslot'];

/** Written by prebid's first-party-data enrichment, never by a provider. */
const CORE_ORTB2_PATHS = ['site.ext.data.documentLang', 'device.ext.vpw', 'device.ext.vph', 'user.ext.eids'];

/** ortb2 branches worth inspecting for provider writes; `user.data` segments are handled separately. */
const ORTB2_BRANCHES = ['site.ext', 'site.ext.data', 'device.ext', 'user.ext', 'user.ext.data'];

/** `ext.*` and `ext.data.*` keys on an auction's imps, so unattributable writes are reported rather than dropped. */
const getImpKeys = (imps: unknown[]): string[] =>
  distinct(
    imps.flatMap((imp: any) => [
      ...Object.keys(imp?.ext || {})
        .filter((key) => key !== 'data')
        .map((key) => `ext.${key}`),
      ...Object.keys(imp?.ext?.data || {}).map((key) => `ext.data.${key}`),
    ])
  ).filter((path) => !CORE_IMP_PATHS.includes(path));

/** Each bidder request's merged ortb2 - global fragments plus that bidder's own. */
const getAuctionOrtb2 = (auctionEndEvent: EventRecord<'auctionEnd'>): unknown[] =>
  getBidderRequests(auctionEndEvent)
    .map((bidderRequest) => bidderRequest?.ortb2)
    .filter(Boolean);

/** Provider writes on an auction's ortb2. Also how vendor-determined paths are discovered. */
const getOrtb2Keys = (ortb2s: unknown[]): string[] =>
  distinct(
    ortb2s.flatMap((ortb2) =>
      ORTB2_BRANCHES.flatMap((branch) => {
        const node = branch.split('.').reduce<any>((value, key) => (value == null ? undefined : value[key]), ortb2);
        if (node == null || typeof node !== 'object') return [];
        return Object.keys(node)
          .filter((key) => !(key === 'data' && (branch === 'site.ext' || branch === 'user.ext')))
          .map((key) => `${branch}.${key}`);
      })
    )
  ).filter((path) => !CORE_ORTB2_PATHS.includes(path));

const getFirstBidderStart = (auctionEndEvent: EventRecord<'auctionEnd'>): number => {
  const starts = getBidderRequests(auctionEndEvent)
    .map((bidderRequest) => bidderRequest?.start)
    .filter((start) => typeof start === 'number');
  return starts.length ? Math.min(...starts) : auctionEndEvent?.args?.timestamp;
};

const detailFor = (evidence: string[], locate: (item: string) => IEvidenceDetail | undefined): { [item: string]: IEvidenceDetail } =>
  evidence.reduce<{ [item: string]: IEvidenceDetail }>((acc, item) => {
    const found = locate(item);
    if (found) acc[item] = found;
    return acc;
  }, {});

/**
 * Decides landed/late/never from per-auction hits: anything the page produced but this auction did
 * not carry arrived too late for it.
 */
const toVerdict = (hitHere: boolean, hitAnywhere: boolean, missingMeans: LandedVerdict): LandedVerdict => {
  if (hitHere) return 'landed';
  return hitAnywhere ? 'late' : missingMeans;
};

const describeRtdWait = (waitForIt: boolean, auctionDelay: number): string => {
  if (!waitForIt) return 'No `waitForIt`. Bidding does not wait for this provider.';
  if (!(auctionDelay > 0)) return '`waitForIt` set, but `realTimeData.auctionDelay` is 0.';
  return `Awaited up to ${auctionDelay}ms, then bidding proceeds.`;
};

const describeUserIdWait = (auctionDelay: number): string => (auctionDelay > 0 ? `Awaited up to ${auctionDelay}ms, then bidding proceeds.` : '`userSync.auctionDelay` is 0. Bidding does not wait.');

/**
 * Works out, per configured provider and per auction, whether prebid waited for it and whether its
 * data actually reached the bidders. Uses only config and auction data, so it is equally valid in the
 * popup and the devtools panel.
 */
export const getProviderDiagnostics = (prebid: IPrebidDetails, auctionEndEvents: EventRecord<'auctionEnd'>[]): IProviderDiagnostics => {
  const config = (prebid?.config || {}) as any;
  const events = asArray<EventRecord<'auctionEnd'>>(auctionEndEvents);

  const rtdAuctionDelay = Number(config?.realTimeData?.auctionDelay) || 0;
  const userSyncAuctionDelay = typeof config?.userSync?.auctionDelay === 'number' ? config.userSync.auctionDelay : DEFAULT_USER_SYNC_AUCTION_DELAY;

  const auctions: IDiagnosedAuction[] = events.map((event, index) => ({
    auctionId: event?.args?.auctionId,
    index: index + 1,
    timestamp: event?.args?.timestamp,
    firstBidderStart: getFirstBidderStart(event),
  }));

  const eidSourcesPerAuction = events.map(getAuctionEidSources);
  const segmentNamesPerAuction = events.map(getAuctionSegmentNames);
  const impsPerAuction = events.map(getAuctionImps);
  const ortb2PerAuction = events.map(getAuctionOrtb2);

  const pageEidSources = distinct([...asArray<any>(prebid?.eids).map((eid) => eid?.source), ...eidSourcesPerAuction.flat()]);
  const segmentNames = distinct(segmentNamesPerAuction.flat());

  const buildVerdicts = (hits: boolean[], evidence: string[][], missingMeans: LandedVerdict): IAuctionVerdict[] => {
    const hitAnywhere = hits.some(Boolean);
    return auctions.map((auction, index) => ({
      auctionId: auction.auctionId,
      auctionIndex: auction.index,
      verdict: toVerdict(hits[index], hitAnywhere, missingMeans),
      evidence: evidence[index],
    }));
  };

  const identityProviders: IProviderDiagnostic[] = asArray<any>(config?.userSync?.userIds).map((userId) => {
    const name = userId?.name || 'unknown';
    const eidSources = resolveEidSources(name, pageEidSources);
    const evidence = eidSourcesPerAuction.map((sources) => sources.filter((source) => eidSources.includes(source)));
    const hits = evidence.map((matched) => matched.length > 0);
    // Without any known source we cannot judge this module at all, so say so rather than guess.
    const auctionVerdicts: IAuctionVerdict[] =
      eidSources.length > 0
        ? buildVerdicts(hits, evidence, 'never').map((verdict, index) => ({ ...verdict, evidenceDetail: detailFor(verdict.evidence, (source) => findEid(events[index], source)) }))
        : auctions.map((auction) => ({ auctionId: auction.auctionId, auctionIndex: auction.index, verdict: 'unknown' as LandedVerdict, evidence: [] as string[] }));

    return {
      name,
      type: 'identity' as ProviderType,
      awaited: userSyncAuctionDelay > 0,
      awaitedReason: describeUserIdWait(userSyncAuctionDelay),
      eidSources,
      hosts: knownHosts('identity', name, userId),
      matchTokens: distinct([normalizeToken(name), ...eidSources]),
      auctions: auctionVerdicts,
      landedCount: auctionVerdicts.filter(({ verdict }) => verdict === 'landed').length,
      config: userId,
    };
  });

  const rtdProviders: IProviderDiagnostic[] = asArray<any>(config?.realTimeData?.dataProviders).map((provider) => {
    const name = provider?.name || 'unknown';
    const token = normalizeToken(name);
    const signals = PROVIDER_SIGNALS[`rtd:${name}`] || { ortb2Imp: [], ortb2: [], segments: [], eidSources: [] };

    // A value at a known write path is proof, not a name guess.
    const impEvidence = impsPerAuction.map((imps) => signals.ortb2Imp.filter((path) => imps.some((imp) => hasPath(imp, path))));

    // The same at auction level, for providers that enrich globally.
    const ortb2Evidence = ortb2PerAuction.map((ortb2s) => signals.ortb2.filter((path) => ortb2s.some((ortb2) => hasPath(ortb2, path))));

    // Verbatim segment names, then a name-token match for modules that build theirs from config.
    const segmentEvidence = segmentNamesPerAuction.map((names) => names.filter((segment) => signals.segments.includes(segment.toLowerCase()) || (token && normalizeToken(segment).includes(token))));

    // A few RTD modules publish an EID instead of, or as well as, a segment.
    const eidEvidence = eidSourcesPerAuction.map((sources) => sources.filter((source) => signals.eidSources.includes(source.toLowerCase())));

    const evidence = impEvidence.map((paths, index) => distinct([...paths, ...ortb2Evidence[index], ...segmentEvidence[index], ...eidEvidence[index]]));
    const hits = evidence.map((found) => found.length > 0);

    // A known write path makes absence meaningful. Without one it proves nothing: the provider may
    // still contribute through bid params.
    const canProveAbsence = signals.ortb2Imp.length > 0 || signals.ortb2.length > 0 || signals.segments.length > 0 || signals.eidSources.length > 0;
    // Where each piece of evidence sits, and what is there. Taken from the first carrier found -
    // `ortb2Imp` is per adUnit, so another bid may hold a different value at the same path.
    const locate = (item: string, index: number): IEvidenceDetail | undefined => {
      if (signals.ortb2Imp.includes(item)) {
        const imp = impsPerAuction[index].find((candidate) => hasPath(candidate, item));
        return imp ? { at: `bids[].ortb2Imp.${item}`, value: valueAt(imp, item) } : undefined;
      }
      if (signals.ortb2.includes(item)) {
        const ortb2 = ortb2PerAuction[index].find((candidate) => hasPath(candidate, item));
        return ortb2 ? { at: `ortb2.${item}`, value: valueAt(ortb2, item) } : undefined;
      }
      return findSegment(events[index], item) || findEid(events[index], item);
    };

    const auctionVerdicts = buildVerdicts(hits, evidence, canProveAbsence ? 'never' : 'unknown').map((verdict, index) => ({
      ...verdict,
      evidenceDetail: detailFor(verdict.evidence, (item) => locate(item, index)),
    }));

    return {
      name,
      type: 'rtd' as ProviderType,
      awaited: Boolean(provider?.waitForIt) && rtdAuctionDelay > 0,
      awaitedReason: describeRtdWait(Boolean(provider?.waitForIt), rtdAuctionDelay),
      hosts: knownHosts('rtd', name, provider),
      matchTokens: distinct([token, ...segmentEvidence.flat().map(normalizeToken)]),
      auctions: auctionVerdicts,
      landedCount: auctionVerdicts.filter(({ verdict }) => verdict === 'landed').length,
      config: provider,
    };
  });

  const claimedSources = [...identityProviders.flatMap(({ eidSources }) => eidSources || []), ...rtdProviders.flatMap(({ name }) => PROVIDER_SIGNALS[`rtd:${name}`]?.eidSources || [])];
  const claimedImpPaths = rtdProviders.flatMap(({ name }) => PROVIDER_SIGNALS[`rtd:${name}`]?.ortb2Imp || []);
  const claimedOrtb2Paths = rtdProviders.flatMap(({ name }) => PROVIDER_SIGNALS[`rtd:${name}`]?.ortb2 || []);
  const observedOrtb2Paths = distinct(ortb2PerAuction.flatMap(getOrtb2Keys));
  // A write nobody claims means the generated map is out of date.
  const observedImpPaths = distinct(impsPerAuction.flatMap(getImpKeys));

  return {
    providers: [...identityProviders, ...rtdProviders],
    auctions,
    rtdAuctionDelay,
    userSyncAuctionDelay,
    unmatchedEidSources: pageEidSources.filter((source) => !claimedSources.includes(source)),
    unmatchedImpPaths: observedImpPaths.filter((path) => !claimedImpPaths.some((claimed) => claimed === path || claimed.startsWith(`${path}.`) || path.startsWith(`${claimed}.`))),
    unmatchedOrtb2Paths: observedOrtb2Paths.filter((path) => !claimedOrtb2Paths.some((claimed) => claimed === path || claimed.startsWith(`${path}.`) || path.startsWith(`${claimed}.`))),
    segmentNames,
  };
};
