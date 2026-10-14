import { describe, it, expect } from 'vitest';
import { getProviderDiagnostics, normalizeToken } from './providerDiagnostics';
import { IPrebidDetails } from '../../../Injected/prebid';
import { EventRecord } from 'prebid.js/types.d.ts';

const AUCTION_START = 1_700_000_000_000;

interface IAuctionStub {
  auctionId?: string;
  eidSources?: string[];
  segmentNames?: string[];
  starts?: number[];

  imps?: any[];

  ortb2?: any;
}

const makeAuction = ({ auctionId = 'a1', eidSources = [], segmentNames = [], starts = [AUCTION_START + 10], imps = [], ortb2 = {} }: IAuctionStub = {}) =>
  ({
    eventType: 'auctionEnd',
    args: {
      auctionId,
      timestamp: AUCTION_START,
      auctionEnd: AUCTION_START + 1000,
      bidderRequests: starts.map((start) => ({
        start,
        ortb2: {
          user: { ext: { eids: eidSources.map((source) => ({ source })) }, data: segmentNames.map((name) => ({ name })) },
          ...ortb2,
        },
        bids: imps.map((ortb2Imp) => ({ ortb2Imp })),
      })),
    },
  } as unknown as EventRecord<'auctionEnd'>);

const makePrebid = (config: any, eids: { source: string }[] = []) => ({ config, eids } as unknown as IPrebidDetails);

describe('normalizeToken', () => {
  it('strips module suffixes and punctuation', () => {
    expect(normalizeToken('liveIntentId')).toBe('liveintent');
    expect(normalizeToken('id5Id')).toBe('id5');
    expect(normalizeToken('permutiveRtdProvider')).toBe('permutive');
    expect(normalizeToken('id5-sync.com')).toBe('id5synccom');
  });
});

describe('getProviderDiagnostics - awaited', () => {
  it('reports an rtd provider without waitForIt as not awaited', () => {
    const prebid = makePrebid({ realTimeData: { auctionDelay: 300, dataProviders: [{ name: 'permutive' }] } });
    const { providers } = getProviderDiagnostics(prebid, [makeAuction()]);
    expect(providers[0].awaited).toBe(false);
    expect(providers[0].awaitedReason).toContain('does not wait');
  });

  it('reports waitForIt as not awaited when the rtd auctionDelay is zero', () => {
    const prebid = makePrebid({ realTimeData: { auctionDelay: 0, dataProviders: [{ name: 'permutive', waitForIt: true }] } });
    const { providers } = getProviderDiagnostics(prebid, [makeAuction()]);
    expect(providers[0].awaited).toBe(false);
  });

  it('reports waitForIt with a delay as awaited, noting it is only a timeout', () => {
    const prebid = makePrebid({ realTimeData: { auctionDelay: 300, dataProviders: [{ name: 'permutive', waitForIt: true }] } });
    const { providers } = getProviderDiagnostics(prebid, [makeAuction()]);
    expect(providers[0].awaited).toBe(true);
    expect(providers[0].awaitedReason).toContain('300ms');
  });

  it('treats identity modules as awaited only when userSync.auctionDelay is positive', () => {
    const waiting = getProviderDiagnostics(makePrebid({ userSync: { auctionDelay: 500, userIds: [{ name: 'id5Id' }] } }), [makeAuction()]);
    const notWaiting = getProviderDiagnostics(makePrebid({ userSync: { auctionDelay: 0, userIds: [{ name: 'id5Id' }] } }), [makeAuction()]);
    expect(waiting.providers[0].awaited).toBe(true);
    expect(notWaiting.providers[0].awaited).toBe(false);
    expect(notWaiting.providers[0].awaitedReason).toContain('does not wait');
  });

  it('falls back to the prebid default when userSync.auctionDelay is absent', () => {
    const { userSyncAuctionDelay } = getProviderDiagnostics(makePrebid({ userSync: { userIds: [{ name: 'id5Id' }] } }), [makeAuction()]);
    expect(userSyncAuctionDelay).toBe(500);
  });
});

describe('getProviderDiagnostics - identity verdicts', () => {
  const config = { userSync: { auctionDelay: 500, userIds: [{ name: 'id5Id' }] } };

  it('marks an eid present in the auction as landed', () => {
    const { providers } = getProviderDiagnostics(makePrebid(config, [{ source: 'id5-sync.com' }]), [makeAuction({ eidSources: ['id5-sync.com'] })]);
    expect(providers[0].eidSources).toContain('id5-sync.com');
    expect(providers[0].auctions[0].verdict).toBe('landed');
    expect(providers[0].landedCount).toBe(1);
  });

  it('marks an eid that resolved on the page but missed this auction as late', () => {
    const auctions = [makeAuction({ auctionId: 'a1', eidSources: [] }), makeAuction({ auctionId: 'a2', eidSources: ['id5-sync.com'] })];
    const { providers } = getProviderDiagnostics(makePrebid(config, [{ source: 'id5-sync.com' }]), auctions);
    expect(providers[0].auctions.map(({ verdict }) => verdict)).toEqual(['late', 'landed']);
  });

  it('marks a module that never produced an id as never', () => {
    const { providers } = getProviderDiagnostics(makePrebid(config, []), [makeAuction()]);
    expect(providers[0].auctions[0].verdict).toBe('never');
  });

  it('reports unknown rather than guessing when the eid source cannot be resolved', () => {
    const prebid = makePrebid({ userSync: { auctionDelay: 500, userIds: [{ name: 'someBespokeModule' }] } }, []);
    const { providers } = getProviderDiagnostics(prebid, [makeAuction()]);
    expect(providers[0].eidSources).toEqual([]);
    expect(providers[0].auctions[0].verdict).toBe('unknown');
  });

  it('resolves an unmapped module by token match against observed sources', () => {
    const prebid = makePrebid({ userSync: { auctionDelay: 500, userIds: [{ name: 'fooBarId' }] } }, [{ source: 'foobar.io' }]);
    const { providers } = getProviderDiagnostics(prebid, [makeAuction({ eidSources: ['foobar.io'] })]);
    expect(providers[0].eidSources).toEqual(['foobar.io']);
    expect(providers[0].auctions[0].verdict).toBe('landed');
  });

  it('credits a module that emits a whole family of partner sources', () => {
    const observed = ['bidswitch.net', 'pubmatic.com', 'liveintent.sovrn.com'];
    const prebid = makePrebid(
      { userSync: { auctionDelay: 500, userIds: [{ name: 'liveIntentId' }] } },
      observed.map((source) => ({ source }))
    );
    const { providers, unmatchedEidSources } = getProviderDiagnostics(prebid, [makeAuction({ eidSources: observed })]);
    expect(providers[0].auctions[0].verdict).toBe('landed');
    expect(providers[0].auctions[0].evidence).toEqual(observed);
    expect(unmatchedEidSources).toEqual([]);
  });

  it('credits connectId for the yahoo.com source it emits', () => {
    const prebid = makePrebid({ userSync: { auctionDelay: 500, userIds: [{ name: 'connectId' }] } }, [{ source: 'yahoo.com' }]);
    const { providers } = getProviderDiagnostics(prebid, [makeAuction({ eidSources: ['yahoo.com'] })]);
    expect(providers[0].auctions[0].verdict).toBe('landed');
  });

  it('surfaces eid sources that no configured module claims', () => {
    const { unmatchedEidSources } = getProviderDiagnostics(makePrebid(config, [{ source: 'id5-sync.com' }, { source: 'mystery.example' }]), [makeAuction()]);
    expect(unmatchedEidSources).toEqual(['mystery.example']);
  });
});

describe('getProviderDiagnostics - rtd verdicts', () => {
  const config = { realTimeData: { auctionDelay: 300, dataProviders: [{ name: 'permutive', waitForIt: true }] } };

  it('matches ortb2 segment names back to the provider', () => {
    const { providers } = getProviderDiagnostics(makePrebid(config), [makeAuction({ segmentNames: ['permutive.com'] })]);
    expect(providers[0].auctions[0].verdict).toBe('landed');
    expect(providers[0].auctions[0].evidence).toEqual(['permutive.com']);
  });

  it('marks an auction that missed data seen in another auction as late', () => {
    const auctions = [makeAuction({ auctionId: 'a1', segmentNames: [] }), makeAuction({ auctionId: 'a2', segmentNames: ['permutive.com'] })];
    const { providers } = getProviderDiagnostics(makePrebid(config), auctions);
    expect(providers[0].auctions.map(({ verdict }) => verdict)).toEqual(['late', 'landed']);
  });

  it('reports unknown, not never, when nothing is attributable anywhere', () => {
    const { providers } = getProviderDiagnostics(makePrebid(config), [makeAuction({ segmentNames: ['somethingElse'] })]);
    expect(providers[0].auctions[0].verdict).toBe('unknown');
  });

  it('collects every segment name seen as raw evidence', () => {
    const { segmentNames } = getProviderDiagnostics(makePrebid(config), [makeAuction({ segmentNames: ['permutive.com', 'other.io'] })]);
    expect(segmentNames).toEqual(['permutive.com', 'other.io']);
  });
});

describe('getProviderDiagnostics - ortb2Imp evidence', () => {
  const withProvider = (name: string) => ({ realTimeData: { auctionDelay: 300, dataProviders: [{ name, waitForIt: true }] } });

  it('proves landing from the path the module writes, not from its name', () => {
    const auction = makeAuction({ imps: [{ ext: { data: { browsi: { pvd: '0.42' } } } }] });
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('browsi')), [auction]);
    expect(providers[0].auctions[0].verdict).toBe('landed');
    expect(providers[0].auctions[0].evidence).toEqual(['ext.data.browsi']);
  });

  it('reports never - not unknown - when the module has a known write path and used none of it', () => {
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('browsi')), [makeAuction({ imps: [{ ext: { gpid: '/123/slot' } }] })]);
    expect(providers[0].auctions[0].verdict).toBe('never');
  });

  it('still reports unknown for a provider with no known write path', () => {
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('permutive')), [makeAuction({ imps: [{ ext: {} }] })]);
    expect(providers[0].auctions[0].verdict).toBe('unknown');
  });

  it('does not count an empty container as a write', () => {
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('browsi')), [makeAuction({ imps: [{ ext: { data: { browsi: {} } } }] })]);
    expect(providers[0].auctions[0].verdict).toBe('never');
  });

  it('marks an auction that missed an ortb2Imp write seen in another auction as late', () => {
    const auctions = [makeAuction({ auctionId: 'a1', imps: [{ ext: { data: {} } }] }), makeAuction({ auctionId: 'a2', imps: [{ ext: { data: { browsi: { pvd: '0.9' } } } }] })];
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('browsi')), auctions);
    expect(providers[0].auctions.map(({ verdict }) => verdict)).toEqual(['late', 'landed']);
  });

  it('reports where each piece of evidence was found, and what was there', () => {
    const auction = makeAuction({ imps: [{ ext: { data: { browsi: { pvd: '0.42' } } } }] });
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('browsi')), [auction]);
    expect(providers[0].auctions[0].evidenceDetail).toEqual({ 'ext.data.browsi': { at: 'bids[].ortb2Imp.ext.data.browsi', value: { pvd: '0.42' } } });
  });

  it('locates a global ortb2 write', () => {
    const auction = makeAuction({ ortb2: { device: { ext: { wurfl: { is_robot: false } } } } });
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('wurfl')), [auction]);
    expect(providers[0].auctions[0].evidenceDetail?.['device.ext.wurfl']).toEqual({ at: 'ortb2.device.ext.wurfl', value: { is_robot: false } });
  });

  it('locates a segment name and carries the entry that held it', () => {
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('permutive')), [makeAuction({ segmentNames: ['permutive.com'] })]);
    expect(providers[0].auctions[0].evidenceDetail?.['permutive.com']).toEqual({ at: 'ortb2.user.data[]', value: { name: 'permutive.com' } });
  });

  it('locates an EID published by an rtd module', () => {
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('a1Media')), [makeAuction({ eidSources: ['a1mediagroup.com'] })]);
    expect(providers[0].auctions[0].evidenceDetail?.['a1mediagroup.com']).toEqual({ at: 'ortb2.user.ext.eids[]', value: { source: 'a1mediagroup.com' } });
  });

  it('surfaces ortb2Imp writes no configured provider claims', () => {
    const auction = makeAuction({ imps: [{ ext: { data: { browsi: { pvd: '1' }, mysteryVendor: { x: 1 } } } }] });
    const { unmatchedImpPaths } = getProviderDiagnostics(makePrebid(withProvider('browsi')), [auction]);
    expect(unmatchedImpPaths).toEqual(['ext.data.mysteryVendor']);
  });

  it('proves landing from a global ortb2 path the vendor payload writes', () => {
    const auction = makeAuction({ ortb2: { device: { ext: { wurfl: { is_robot: false, wurfl_id: 'chrome' } } } } });
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('wurfl')), [auction]);
    expect(providers[0].auctions[0].verdict).toBe('landed');
    expect(providers[0].auctions[0].evidence).toEqual(['device.ext.wurfl']);
  });

  it('reports never for a curated ortb2 path the provider did not write', () => {
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('wurfl')), [makeAuction({ ortb2: { device: { ext: {} } } })]);
    expect(providers[0].auctions[0].verdict).toBe('never');
  });

  it('surfaces ortb2 writes no configured provider claims', () => {
    const auction = makeAuction({ ortb2: { device: { ext: { wurfl: { is_robot: false }, mystery: { x: 1 } } } } });
    const { unmatchedOrtb2Paths } = getProviderDiagnostics(makePrebid(withProvider('wurfl')), [auction]);
    expect(unmatchedOrtb2Paths).toEqual(['device.ext.mystery']);
  });

  it('credits an rtd module for an EID it publishes, rather than leaving it unattributed', () => {
    const auction = makeAuction({ eidSources: ['a1mediagroup.com'] });
    const { providers, unmatchedEidSources } = getProviderDiagnostics(makePrebid(withProvider('a1Media')), [auction]);
    expect(providers[0].auctions[0].verdict).toBe('landed');
    expect(providers[0].auctions[0].evidence).toEqual(['a1mediagroup.com']);
    expect(unmatchedEidSources).toEqual([]);
  });

  it('proves landing through a path reached via a local ortb2Fragments alias', () => {
    const auction = makeAuction({ ortb2: { user: { ext: { data: { im_segments: ['a', 'b'] } } } } });
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('im')), [auction]);
    expect(providers[0].auctions[0].verdict).toBe('landed');
    expect(providers[0].auctions[0].evidence).toEqual(['user.ext.data.im_segments']);
  });

  it('does not count a provider that wrote its keys but left them empty', () => {
    const auction = makeAuction({ ortb2: { user: { ext: { data: { im_segments: [], im_uid: '' } } } } });
    const { providers } = getProviderDiagnostics(makePrebid(withProvider('im')), [auction]);
    expect(providers[0].auctions[0].verdict).toBe('never');
  });

  it('does not report prebid first-party-data enrichment as unattributed', () => {
    const auction = makeAuction({ ortb2: { device: { ext: { vpw: 1280, vph: 800 } }, site: { ext: { data: { documentLang: 'en' } } } } });
    const { unmatchedOrtb2Paths } = getProviderDiagnostics(makePrebid(withProvider('wurfl')), [auction]);
    expect(unmatchedOrtb2Paths).toEqual([]);
  });

  it('does not report prebid core and gptPreAuction writes as unattributed', () => {
    const auction = makeAuction({ imps: [{ ext: { gpid: '/123/slot', tid: 'abc', data: { adserver: { name: 'gam' }, pbadslot: '/123/slot' } } }] });
    const { unmatchedImpPaths } = getProviderDiagnostics(makePrebid(withProvider('browsi')), [auction]);
    expect(unmatchedImpPaths).toEqual([]);
  });
});

describe('getProviderDiagnostics - endpoint hosts', () => {
  it('knows the documented endpoints of a generated module', () => {
    const { providers } = getProviderDiagnostics(makePrebid({ userSync: { auctionDelay: 500, userIds: [{ name: 'id5Id' }] } }), [makeAuction()]);
    expect(providers[0].hosts).toContain('id5-sync.com');
  });

  it('reads a host out of publisher config for providers that do not hardcode one', () => {
    const config = { realTimeData: { auctionDelay: 300, dataProviders: [{ name: 'optable', params: { host: 'edge.acme-dmp.com' } }] } };
    const { providers } = getProviderDiagnostics(makePrebid(config), [makeAuction()]);
    expect(providers[0].hosts).toContain('edge.acme-dmp.com');
  });

  it('reads a host out of a full url in publisher config', () => {
    const config = { realTimeData: { auctionDelay: 300, dataProviders: [{ name: 'gamera', params: { endpoint: 'https://api.gamera.example.io/v1/x?a=1' } }] } };
    const { providers } = getProviderDiagnostics(makePrebid(config), [makeAuction()]);
    expect(providers[0].hosts).toContain('api.gamera.example.io');
  });

  it('keeps config hosts at full length so a shared cdn is not claimed wholesale', () => {
    const config = { realTimeData: { auctionDelay: 300, dataProviders: [{ name: 'browsi', params: { url: 'browsi.somecdn.com' } }] } };
    const { providers } = getProviderDiagnostics(makePrebid(config), [makeAuction()]);
    expect(providers[0].hosts).toEqual(['browsi.somecdn.com']);
  });

  it('reports no hosts for providers that make no network call', () => {
    const config = { realTimeData: { auctionDelay: 300, dataProviders: [{ name: 'geolocation', waitForIt: true }] } };
    const { providers } = getProviderDiagnostics(makePrebid(config), [makeAuction()]);
    expect(providers[0].hosts).toEqual([]);
  });

  it('does not invent hosts from non-domain config values', () => {
    const config = { realTimeData: { auctionDelay: 300, dataProviders: [{ name: 'someRtd', params: { accountId: 12345, mode: 'fast' } }] } };
    const { providers } = getProviderDiagnostics(makePrebid(config), [makeAuction()]);
    expect(providers[0].hosts).toEqual([]);
  });
});

describe('getProviderDiagnostics - auctions', () => {
  it('finds eid evidence on bids.userIdAsEids when not present on ortb2.user.ext.eids', () => {
    const prebid = makePrebid({ userSync: { userIds: [{ name: 'sharedId' }] } });
    const auctionEvent: any = {
      eventType: 'auctionEnd',
      args: {
        auctionId: 'a1',
        timestamp: AUCTION_START,
        bidderRequests: [
          {
            bids: [
              {
                userIdAsEids: [{ source: 'sharedid.org', uids: [{ id: '123' }] }],
              },
            ],
          },
        ],
      },
    };

    const { providers } = getProviderDiagnostics(prebid, [auctionEvent]);
    expect(providers[0].auctions[0].verdict).toBe('landed');
    expect(providers[0].auctions[0].evidenceDetail?.['sharedid.org']?.at).toBe('bids[].userIdAsEids[]');
  });

  it('survives an empty config and no auctions', () => {
    const diagnostics = getProviderDiagnostics({} as IPrebidDetails, []);
    expect(diagnostics.providers).toEqual([]);
    expect(diagnostics.auctions).toEqual([]);
  });
});
