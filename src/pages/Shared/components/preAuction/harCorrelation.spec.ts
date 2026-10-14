import { describe, it, expect } from 'vitest';
import { correlateHar, IHarEntry, toHarEntry } from './harCorrelation';
import { IProviderDiagnostics } from './providerDiagnostics';

const AUCTION_START = 1_700_000_000_000;
const FIRST_BIDDER_START = AUCTION_START + 200;

const diagnostics = (providers: any[], auctions: any[] = [{ auctionId: 'a1', index: 1, timestamp: AUCTION_START, firstBidderStart: FIRST_BIDDER_START }]) =>
  ({ providers, auctions, rtdAuctionDelay: 0, userSyncAuctionDelay: 0, unmatchedEidSources: [], segmentNames: [] } as IProviderDiagnostics);

const entry = (url: string, startedDateTime: number, time: number): IHarEntry => toHarEntry({ url, startedDateTime, time });

describe('toHarEntry', () => {
  it('derives the host from the url and defaults the rest', () => {
    expect(toHarEntry({ url: 'https://id5-sync.com/g/v2' })).toEqual({ url: 'https://id5-sync.com/g/v2', host: 'id5-sync.com', method: 'GET', status: 0, startedDateTime: 0, time: 0, resourceType: undefined });
  });

  it('does not throw on a malformed url', () => {
    expect(toHarEntry({ url: 'not a url' }).host).toBe('');
  });
});

describe('correlateHar', () => {
  it('reports unavailable when there are no entries', () => {
    expect(correlateHar(diagnostics([]), [])).toEqual({ available: false, timings: {}, unmatched: [] });
  });

  it('matches requests to a provider via its curated host', () => {
    const providers = [{ name: 'id5Id', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['id5'], hosts: [], auctions: [], landedCount: 0, config: {} }];
    const { timings } = correlateHar(diagnostics(providers), [entry('https://id5-sync.com/g/v2', AUCTION_START, 90)]);
    expect(timings.id5Id.requests).toHaveLength(1);
    expect(timings.id5Id.totalDuration).toBe(90);
  });

  it('flags a provider that finished after bidding had started', () => {
    const providers = [{ name: 'id5Id', type: 'identity', awaited: false, awaitedReason: '', matchTokens: ['id5'], hosts: [], auctions: [], landedCount: 0, config: {} }];
    const { timings } = correlateHar(diagnostics(providers), [entry('https://id5-sync.com/g/v2', AUCTION_START + 100, 250)]);
    expect(timings.id5Id.races[0]).toMatchObject({ finishedAfterBidding: true, marginMs: 150 });
  });

  it('does not flag a provider that finished in time, and reports a negative margin', () => {
    const providers = [{ name: 'id5Id', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['id5'], hosts: [], auctions: [], landedCount: 0, config: {} }];
    const { timings } = correlateHar(diagnostics(providers), [entry('https://id5-sync.com/g/v2', AUCTION_START, 50)]);
    expect(timings.id5Id.races[0]).toMatchObject({ finishedAfterBidding: false, marginMs: -150 });
  });

  it('uses the last request when a provider made several', () => {
    const providers = [{ name: 'permutive', type: 'rtd', awaited: false, awaitedReason: '', matchTokens: ['permutive'], hosts: [], auctions: [], landedCount: 0, config: {} }];
    const { timings } = correlateHar(diagnostics(providers), [entry('https://permutive.com/a', AUCTION_START, 20), entry('https://permutive.com/b', AUCTION_START + 100, 300)]);
    expect(timings.permutive.lastEnd).toBe(AUCTION_START + 400);
    expect(timings.permutive.races[0].finishedAfterBidding).toBe(true);
    expect(timings.permutive.totalDuration).toBe(320);
  });

  it('returns requests it could not attribute instead of dropping them', () => {
    const providers = [{ name: 'id5Id', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['id5'], hosts: [], auctions: [], landedCount: 0, config: {} }];
    const { unmatched } = correlateHar(diagnostics(providers), [entry('https://id5-sync.com/g/v2', AUCTION_START, 10), entry('https://cdn.example.com/x.js', AUCTION_START, 10)]);
    expect(unmatched.map(({ host }) => host)).toEqual(['cdn.example.com']);
  });

  it('ignores tokens too short to be meaningful, rather than matching everything', () => {
    const providers = [{ name: 'ab', type: 'rtd', awaited: false, awaitedReason: '', matchTokens: ['ab'], hosts: [], auctions: [], landedCount: 0, config: {} }];
    const { timings, unmatched } = correlateHar(diagnostics(providers), [entry('https://totally-unrelated.com/x', AUCTION_START, 10)]);
    expect(timings).toEqual({});
    expect(unmatched).toHaveLength(1);
  });

  it('marks host-only matches as guesses', () => {
    const providers = [{ name: 'id5Id', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['id5'], hosts: [], auctions: [], landedCount: 0, config: {} }];
    const { timings } = correlateHar(diagnostics(providers), [entry('https://id5-sync.com/g/v2', AUCTION_START, 40)]);
    expect(timings.id5Id.requests[0].via).toBe('host');
    expect(timings.id5Id.via).toBe('host');
  });

  it('does not double count a request that both the endpoint and the name would claim', () => {
    const providers = [{ name: 'permutive', type: 'rtd', awaited: false, awaitedReason: '', matchTokens: ['permutive'], hosts: ['permutive.app'], auctions: [], landedCount: 0, config: {} }];
    const har = [toHarEntry({ url: 'https://cdn.permutive.app/sdk.js', startedDateTime: AUCTION_START, time: 40 })];
    const { timings } = correlateHar(diagnostics(providers), har);
    expect(timings.permutive.requests).toHaveLength(1);
    expect(timings.permutive.requests[0].via).toBe('endpoint');
    expect(timings.permutive.totalDuration).toBe(40);
  });

  it('attributes by documented endpoint, ranking it above a name guess', () => {
    const providers = [{ name: 'optable', type: 'rtd', awaited: true, awaitedReason: '', matchTokens: ['optable'], hosts: ['acme-dmp.com'], auctions: [], landedCount: 0, config: {} }];
    const { timings } = correlateHar(diagnostics(providers), [entry('https://edge.acme-dmp.com/v1/targeting', AUCTION_START, 60)]);
    expect(timings.optable.requests[0].via).toBe('endpoint');
    expect(timings.optable.via).toBe('endpoint');
  });

  it('attributes non-script requests by endpoint, since only script detection is resource-type gated', () => {
    const providers = [{ name: 'hadronId', type: 'identity', awaited: true, awaitedReason: '', matchTokens: [], hosts: ['ad.gt'], auctions: [], landedCount: 0, config: {} }];
    const har = [toHarEntry({ url: 'https://api.ad.gt/api/v1/identity', startedDateTime: AUCTION_START, time: 30, resourceType: 'xhr' })];
    const { timings } = correlateHar(diagnostics(providers), har);
    expect(timings.hadronId.requests).toHaveLength(1);
    expect(timings.hadronId.via).toBe('endpoint');
  });

  it('matches subdomains of a known endpoint but not lookalike domains', () => {
    const providers = [{ name: 'id5Id', type: 'identity', awaited: true, awaitedReason: '', matchTokens: [], hosts: ['id5-sync.com'], auctions: [], landedCount: 0, config: {} }];
    const har = [entry('https://eu.id5-sync.com/g/v2', AUCTION_START, 10), entry('https://notid5-sync.com.evil.net/x', AUCTION_START, 10)];
    const { timings, unmatched } = correlateHar(diagnostics(providers), har);
    expect(timings.id5Id.requests.map(({ host }) => host)).toEqual(['eu.id5-sync.com']);
    expect(unmatched).toHaveLength(1);
  });

  it('does not let a request made after an auction make that auction look late', () => {
    const auctions = [
      { auctionId: 'a1', index: 1, timestamp: AUCTION_START, firstBidderStart: AUCTION_START + 100 },
      { auctionId: 'a2', index: 2, timestamp: AUCTION_START + 60_000, firstBidderStart: AUCTION_START + 60_000 },
    ];
    const providers = [{ name: 'criteo', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['criteo'], hosts: ['criteo.com'], auctions: [], landedCount: 0, config: {} }];
    const har = [entry('https://criteo.com/id', AUCTION_START, 50), entry('https://criteo.com/sync', AUCTION_START + 30_000, 200)];
    const { timings } = correlateHar(diagnostics(providers, auctions), har);
    expect(timings.criteo.races[0]).toMatchObject({ hasRequest: true, finishedAfterBidding: false, marginMs: -50, requestsBefore: 1 });
    expect(timings.criteo.races[1]).toMatchObject({ hasRequest: true, finishedAfterBidding: false, requestsBefore: 2 });
  });

  it('still flags a request that was genuinely in flight when bidding started', () => {
    const providers = [{ name: 'criteo', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['criteo'], hosts: ['criteo.com'], auctions: [], landedCount: 0, config: {} }];
    const har = [entry('https://criteo.com/id', AUCTION_START + 100, 400)];
    const { timings } = correlateHar(diagnostics(providers), har);
    expect(timings.criteo.races[0]).toMatchObject({ hasRequest: true, finishedAfterBidding: true, marginMs: 300 });
  });

  it('reports no request when the provider had not called anything before bidding', () => {
    const providers = [{ name: 'criteo', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['criteo'], hosts: ['criteo.com'], auctions: [], landedCount: 0, config: {} }];
    const har = [entry('https://criteo.com/id', FIRST_BIDDER_START + 5_000, 50)];
    const { timings } = correlateHar(diagnostics(providers), har);
    expect(timings.criteo.races[0]).toMatchObject({ hasRequest: false, finishedAfterBidding: false, requestsBefore: 0 });
  });

  it('reports the slowest request rather than presenting the sum as latency', () => {
    const providers = [{ name: 'criteo', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['criteo'], hosts: ['criteo.com'], auctions: [], landedCount: 0, config: {} }];
    const har = [entry('https://criteo.com/a', AUCTION_START, 40), entry('https://criteo.com/b', AUCTION_START + 10, 120), entry('https://criteo.com/c', AUCTION_START + 20, 90)];
    const { timings } = correlateHar(diagnostics(providers), har);
    expect(timings.criteo.slowestMs).toBe(120);
    expect(timings.criteo.totalDuration).toBe(250);
  });

  it('evaluates the race separately for each auction', () => {
    const auctions = [
      { auctionId: 'a1', index: 1, timestamp: AUCTION_START, firstBidderStart: AUCTION_START + 50 },
      { auctionId: 'a2', index: 2, timestamp: AUCTION_START + 900, firstBidderStart: AUCTION_START + 900 },
    ];
    const providers = [{ name: 'id5Id', type: 'identity', awaited: true, awaitedReason: '', matchTokens: ['id5'], hosts: [], auctions: [], landedCount: 0, config: {} }];
    const { timings } = correlateHar(diagnostics(providers, auctions), [entry('https://id5-sync.com/g/v2', AUCTION_START, 200)]);
    expect(timings.id5Id.races.map(({ finishedAfterBidding }) => finishedAfterBidding)).toEqual([true, false]);
  });
});
