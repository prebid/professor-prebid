import { IDiagnosedAuction, IProviderDiagnostic, IProviderDiagnostics, normalizeToken } from './providerDiagnostics';

export interface IHarEntry {
  url: string;
  host: string;
  method: string;
  status: number;

  startedDateTime: number;

  time: number;

  resourceType?: string;
}

export type AttributionSource = 'endpoint' | 'host';

export interface IProviderRequest {
  url: string;
  host: string;
  start: number;
  end: number;
  duration: number;
  status: number;
  via: AttributionSource;
}

export interface IAuctionRace {
  auctionId: string;
  auctionIndex: number;

  hasRequest: boolean;

  finishedAfterBidding: boolean;

  marginMs: number;

  requestsBefore: number;
}

export interface IProviderTiming {
  name: string;
  requests: IProviderRequest[];

  slowestMs: number;

  totalDuration: number;
  firstStart: number;
  lastEnd: number;
  races: IAuctionRace[];

  via: AttributionSource;
}

export interface IHarCorrelation {
  available: boolean;
  timings: { [providerName: string]: IProviderTiming };

  unmatched: IHarEntry[];
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return '';
  }
};

export const toHarEntry = (raw: Partial<IHarEntry> & { url: string }): IHarEntry => ({
  url: raw.url,
  host: raw.host || hostOf(raw.url),
  method: raw.method || 'GET',
  status: raw.status ?? 0,
  startedDateTime: Number(raw.startedDateTime) || 0,
  time: Number(raw.time) || 0,
  resourceType: raw.resourceType,
});

const knownDomains = (provider: IProviderDiagnostic): string[] => (provider.hosts || []).map((host) => host.toLowerCase());

const candidateTokens = (provider: IProviderDiagnostic): string[] => {
  return Array.from(new Set(provider.matchTokens.map(normalizeToken).filter((token) => token.length > 2)));
};

const matchesDomain = (host: string, domains: string[]): boolean => {
  const lower = host.toLowerCase();
  return domains.some((domain) => lower === domain || lower.endsWith(`.${domain}`));
};

const matches = (host: string, tokens: string[]): boolean => {
  const normalizedHost = normalizeToken(host);
  return tokens.some((token) => normalizedHost.includes(token));
};

/**
 * Associates captured requests with providers and works out whether each provider's data could still
 * have reached the bidders. Matching is by hostname and therefore best effort; prebid never reports
 * which requests a module made. Unmatched entries are returned rather than discarded.
 */
export const correlateHar = (diagnostics: IProviderDiagnostics, harEntries: IHarEntry[]): IHarCorrelation => {
  const entries = Array.isArray(harEntries) ? harEntries.map(toHarEntry) : [];
  if (entries.length === 0) return { available: false, timings: {}, unmatched: [] };

  const timings: { [providerName: string]: IProviderTiming } = {};
  const claimed = new Set<IHarEntry>();

  const toRequest = (entry: IHarEntry, via: AttributionSource): IProviderRequest => {
    claimed.add(entry);
    return { url: entry.url, host: entry.host, start: entry.startedDateTime, end: entry.startedDateTime + entry.time, duration: entry.time, status: entry.status, via };
  };

  diagnostics.providers.forEach((provider) => {
    // Endpoints from prebid's source.
    const domains = knownDomains(provider);
    const byEndpoint = domains.length > 0 ? entries.filter((entry) => !claimed.has(entry) && matchesDomain(entry.host, domains)).map((entry) => toRequest(entry, 'endpoint')) : [];

    // Last resort: module name as a hostname fragment.
    const tokens = candidateTokens(provider);
    const guessed = tokens.length > 0 ? entries.filter((entry) => !claimed.has(entry) && matches(entry.host, tokens)).map((entry) => toRequest(entry, 'host')) : [];

    const requests = [...byEndpoint, ...guessed].sort((a, b) => a.start - b.start);
    if (requests.length === 0) return;

    timings[provider.name] = {
      name: provider.name,
      requests,
      slowestMs: Math.round(Math.max(...requests.map(({ duration }) => duration))),
      totalDuration: requests.reduce((acc, { duration }) => acc + duration, 0),
      firstStart: Math.min(...requests.map(({ start }) => start)),
      lastEnd: Math.max(...requests.map(({ end }) => end)),
      via: byEndpoint.length > 0 ? 'endpoint' : 'host',
      // Judge each auction only against requests that had started when it began bidding; anything
      // fired afterwards says nothing about whether this auction got its data.
      races: diagnostics.auctions.map((auction: IDiagnosedAuction) => {
        const started = requests.filter(({ start }) => start <= auction.firstBidderStart);
        if (started.length === 0) {
          return { auctionId: auction.auctionId, auctionIndex: auction.index, hasRequest: false, finishedAfterBidding: false, marginMs: 0, requestsBefore: 0 };
        }
        const relevantEnd = Math.max(...started.map(({ end }) => end));
        return {
          auctionId: auction.auctionId,
          auctionIndex: auction.index,
          hasRequest: true,
          finishedAfterBidding: relevantEnd > auction.firstBidderStart,
          marginMs: Math.round(relevantEnd - auction.firstBidderStart),
          requestsBefore: started.length,
        };
      }),
    };
  });

  return { available: true, timings, unmatched: entries.filter((entry) => !claimed.has(entry)) };
};
