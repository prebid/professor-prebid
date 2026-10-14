import { useState, useContext, useMemo } from 'react';
import type { AdUnit, EventRecord } from 'prebid.js/types.d.ts';
import StateContext from '../../contexts/appStateContext';
import { createQueryEngine, distinct } from '../autocomplete/utils';

const merge = (target: any, source: any) => {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
};

const processAdUnits = (auctionInitEvents: EventRecord<'auctionInit'>[]): AdUnit[] => {
  if (!auctionInitEvents) return [];
  return auctionInitEvents
    .reduce((previousValue, currentValue) => {
      const adUnits = currentValue?.args?.adUnits || [];
      return [...previousValue, ...adUnits] as AdUnit[];
    }, [] as AdUnit[])
    .reduce((previousValue: AdUnit[], currentValue: AdUnit) => {
      if (!currentValue) return previousValue;
      let toUpdate = previousValue.find((adUnit) => {
        const adUnitBids = (adUnit.bids || []).map(({ bidder, params }) => ({ bidder, params }));
        const currentValueBids = (currentValue.bids || []).map(({ bidder, params }) => ({ bidder, params }));
        return (
          adUnit.code === currentValue.code &&
          JSON.stringify(adUnit.mediaTypes) === JSON.stringify(currentValue.mediaTypes) &&
          JSON.stringify(adUnit.sizes) === JSON.stringify(currentValue.sizes) &&
          JSON.stringify(adUnitBids) === JSON.stringify(currentValueBids)
        );
      });

      if (toUpdate) {
        toUpdate = merge(toUpdate, currentValue);
        return previousValue;
      } else {
        return [...previousValue, currentValue];
      }
    }, [] as AdUnit[])
    .sort((a: AdUnit, b: AdUnit) => (a?.code || '').localeCompare(b?.code || ''));
};

const isTupleSize = (size: unknown): size is [number, number] => Array.isArray(size) && size.length === 2 && typeof size[0] === 'number' && typeof size[1] === 'number';

const adUnitAllSizesStr = (adUnit: AdUnit): string => {
  const bannerSizes = adUnit?.mediaTypes?.banner?.sizes;
  if (Array.isArray(bannerSizes)) {
    return bannerSizes
      .filter(isTupleSize)
      .map(([w, h]) => `${w}x${h}`)
      .join(',');
  }
  const playerSize = adUnit?.mediaTypes?.video?.playerSize;
  if (Array.isArray(playerSize)) {
    return playerSize
      .filter(isTupleSize)
      .map(([w, h]) => `${w}x${h}`)
      .join(',');
  }
  return '';
};

const ADUNIT_FIELD_MAP = {
  adunitcode: (adUnit: AdUnit) => adUnit?.code,

  size: (adUnit: AdUnit) => adUnitAllSizesStr(adUnit),
  width: (adUnit: AdUnit) => {
    const str = adUnitAllSizesStr(adUnit);
    return str ? str.split(',')[0]?.split('x')[0] || null : null;
  },
  height: (adUnit: AdUnit) => {
    const str = adUnitAllSizesStr(adUnit);
    return str ? str.split(',')[0]?.split('x')[1] || null : null;
  },

  mediatype: (adUnit: AdUnit): string => (adUnit?.mediaTypes ? Object.keys(adUnit.mediaTypes).join(',') : ''),

  bidder: (adUnit: AdUnit) =>
    Array.isArray(adUnit?.bids)
      ? adUnit.bids
          .map((b) => b?.bidder)
          .filter(Boolean)
          .join(',')
      : '',

  gpid: (adUnit: AdUnit) => adUnit?.ortb2Imp?.ext?.gpid,

  adunitid: (adUnit: AdUnit) => adUnit?.adUnitId,
  transactionid: (adUnit: AdUnit) => adUnit?.transactionId,
} as const;

const adUnitsQueryEngine = (() => createQueryEngine<any>(ADUNIT_FIELD_MAP))();

const buildAdUnitSuggestions = (adUnits: AdUnit[], allSizes: string[]): string[] => {
  const keySuggestions = (Object.keys(ADUNIT_FIELD_MAP) as string[]).map((key) => `${key}:`);
  const sizeSuggestions = allSizes.map((s) => `size:${s}`);
  const adUnitCodeSuggestions = distinct(adUnits.map((adUnit) => (adUnit?.code ? `adunitcode:${String(adUnit.code)}` : undefined)).filter((s): s is string => !!s));
  const bidderSuggestions = distinct(adUnits.flatMap((adUnit) => (Array.isArray(adUnit?.bids) ? adUnit.bids.map((b) => (b?.bidder ? `bidder:${String(b.bidder)}` : undefined)) : [])));
  const mediaTypes = distinct(adUnits.flatMap((adUnit) => (adUnit?.mediaTypes ? Object.keys(adUnit.mediaTypes).map((mt) => `mediatype:${mt}`) : [])));

  const suggestions = Array.from(new Set<string>([...keySuggestions, ...sizeSuggestions, ...adUnitCodeSuggestions, ...bidderSuggestions, ...mediaTypes, ...allSizes])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  return suggestions;
};

const AdUnitsComponentState = () => {
  const [eventsPopUpOpen, setEventsPopUpOpen] = useState(false);
  const [pbjsVersionPopUpOpen, setPbjsVersionPopUpOpen] = useState(false);
  const { auctionInitEvents, prebid, allBidderEvents, allAdUnitCodes } = useContext(StateContext);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<string | null>(null);
  const adUnits = useMemo(() => processAdUnits(auctionInitEvents), [auctionInitEvents]);
  const filteredAdUnits = useMemo(() => adUnits.filter(adUnitsQueryEngine.runQuery(query)), [adUnits, query]);

  const allSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    adUnits.forEach((adUnit) => {
      // Banner sizes
      if (adUnit.mediaTypes?.banner?.sizes) {
        adUnit.mediaTypes.banner.sizes.forEach((size) => {
          if (Array.isArray(size) && size.length === 2) {
            sizesSet.add(`${size[0]}x${size[1]}`);
          }
        });
      }
      // Video sizes
      if (adUnit.mediaTypes?.video?.playerSize) {
        adUnit.mediaTypes.video.playerSize.forEach((size) => {
          if (Array.isArray(size) && size.length === 2) {
            sizesSet.add(`${size[0]}x${size[1]}`);
          }
        });
      }
    });
    return Array.from(sizesSet).sort((a, b) => {
      const [aW, aH] = a.split('x').map(Number);
      const [bW, bH] = b.split('x').map(Number);
      return aW * aH - bW * bH;
    });
  }, [adUnits]);

  const suggestions = useMemo(() => buildAdUnitSuggestions(adUnits, allSizes), [adUnits]);
  return {
    adUnits,
    query,
    setQuery,
    sort,
    setSort,
    eventsPopUpOpen,
    setEventsPopUpOpen,
    pbjsVersionPopUpOpen,
    setPbjsVersionPopUpOpen,
    filteredAdUnits,
    suggestions,
    prebid,
    allBidderEvents,
    allAdUnitCodes,
    ADUNIT_FIELD_MAP,
    allSizes,
  };
};

export default AdUnitsComponentState;
