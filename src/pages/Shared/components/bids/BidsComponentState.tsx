import { useState, useContext, useMemo, useCallback } from 'react';
import AppStateContext from '../../contexts/appStateContext';
import { createQueryEngine, distinct, getSortValue, getWidthXHeightStringFromBid, NUMERIC_FIELD_KEYS } from '../autocomplete/utils';
import { Bid } from 'prebid.js/types.d.ts';

export const BID_FIELD_MAP = {
  bidder: (b: any) => b?.bidder,
  currency: (b: any) => b?.currency,
  adunitcode: (b: any) => b?.adUnitCode,
  mediatype: (b: any) => b?.mediaType,
  cpm: (b: any) => b?.cpm,
  width: (b: any) => b?.width,
  height: (b: any) => b?.height,
  ttl: (b: any) => b?.ttl,
  timetorespond: (b: any) => b?.timeToRespond,
  originalcpm: (b: any) => b?.originalCpm,
  size: (b: any) => b?.size ?? (b?.width && b?.height ? `${b.width}x${b.height}` : ''),
} as const;

export const getBidKey = (bid: Bid): string => bid.requestId ?? `${bid.adUnitCode || ''}-${bid.bidder || ''}-${bid.timeToRespond || ''}`;

const bidsQueryEngine = createQueryEngine<any>(BID_FIELD_MAP);

const buildBidSuggestions = (bids: any[]): string[] => {
  const keySuggestions = (Object.keys(BID_FIELD_MAP) as string[]).map((key) => `${key}:`);
  const numericStubs = (NUMERIC_FIELD_KEYS as readonly string[]).flatMap((key) => [`${key}>`, `${key}>=`, `${key}<`, `${key}<=`, `${key}=`]);

  const bidders = distinct(bids.map((b) => (b?.bidder ? `bidder:${String(b.bidder)}` : undefined)));
  const mediaTypes = distinct(bids.map((b) => (b?.mediaType ? `mediatype:${String(b.mediaType)}` : undefined)));
  const currencies = distinct(bids.map((b) => (b?.currency ? `currency:${String(b.currency)}` : undefined)));
  const adUnits = distinct(bids.map((b) => (b?.adUnitCode ? `adunitcode:${String(b.adUnitCode)}` : undefined)));
  const sizes = distinct(bids.map((bid) => (getWidthXHeightStringFromBid(bid) ? `size:${getWidthXHeightStringFromBid(bid)}` : undefined)));

  return Array.from(new Set<string>([...keySuggestions, ...numericStubs, ...bidders, ...mediaTypes, ...currencies, ...adUnits, ...sizes])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
};

const sortBids = (sort: { key: string; dir: 'asc' | 'desc' }, filteredBids: any[]) => {
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...filteredBids].sort((a: any, b: any) => {
    const va = getSortValue(a, sort.key);
    const vb = getSortValue(b, sort.key);

    const aMissing = typeof va === 'number' ? !Number.isFinite(va) : va === '';
    const bMissing = typeof vb === 'number' ? !Number.isFinite(vb) : vb === '';

    // Missing handling: end for ASC, start for DESC
    if (aMissing !== bMissing) {
      if (sort.dir === 'asc') return aMissing ? 1 : -1;
      return aMissing ? -1 : 1;
    }

    if (typeof va === 'number' && typeof vb === 'number') {
      if (va === vb) return 0;
      return (va < vb ? -1 : 1) * dir;
    }

    // String compare with numeric option (e.g., bidder2 before bidder10)
    const sa = String(va);
    const sb = String(vb);
    const cmp = sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' });
    return cmp * dir;
  });
};

const BidsComponentState = () => {
  const [globalOpen, setGlobalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'cpm', dir: 'desc' });

  const { auctionEndEvents } = useContext(AppStateContext);

  const bidsReceived = useMemo(() => auctionEndEvents.flatMap((e) => e.args?.bidsReceived ?? []), [auctionEndEvents]);
  const noBids = useMemo(() => auctionEndEvents.flatMap((e) => e.args?.noBids ?? []), [auctionEndEvents]);

  const counts = useMemo(
    () => ({
      all: bidsReceived.length + noBids.length,
      received: bidsReceived.length,
      nobid: noBids.length,
    }),
    [bidsReceived.length, noBids.length]
  );

  const suggestions = useMemo(() => buildBidSuggestions(bidsReceived as any[]), [bidsReceived]);

  const toggleSort = useCallback((key: string) => setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })), []);

  const filteredBids = useMemo(() => [...bidsReceived, ...noBids].filter(bidsQueryEngine.runQuery(query)), [bidsReceived, noBids, query]);

  const sortedBids = useMemo(() => sortBids(sort, filteredBids), [filteredBids, sort]);

  const toggleGlobalOpen = useCallback(() => setGlobalOpen((prev) => !prev), []);

  return {
    globalOpen,
    toggleGlobalOpen,
    query,
    setQuery,
    sort,
    toggleSort,
    counts,
    suggestions,
    sortedBids,
    filteredBids, // Exposed for download
    BID_FIELD_MAP,
  };
};

export default BidsComponentState;
