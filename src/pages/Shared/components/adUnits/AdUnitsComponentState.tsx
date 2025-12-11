import { useState, useContext, useMemo } from 'react';
import type { AdUnit, EventRecord } from 'prebid.js/types.d.ts';
import StateContext from '../../contexts/appStateContext';
import { createQueryEngine, distinct, NUMERIC_FIELD_KEYS } from '../autocomplete/utils';

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
  return (
    auctionInitEvents
      .reduce((previousValue, currentValue) => {
        return [...previousValue, ...currentValue.args.adUnits] as AdUnit[];
      }, [] as AdUnit[])
      .reduce((previousValue: AdUnit[], currentValue: AdUnit) => {
        let toUpdate = previousValue.find((adUnit) => {
          const adUnitBids = adUnit.bids.map(({ bidder, params }) => ({ bidder, params })) || [];
          const currentValueBids = currentValue.bids.map(({ bidder, params }) => ({ bidder, params })) || [];
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
      // "fix" https://github.com/prebid/professor-prebid/issues/104 ?
      .sort((a: AdUnit, b: AdUnit) => a.code.localeCompare(b.code))
  );
};

const adUnitAllSizesStr = (adUnit: AdUnit): string =>
  Array.isArray(adUnit?.mediaTypes.banner.sizes)
    ? adUnit.mediaTypes.banner.sizes
        .filter((size) => {
          return Array.isArray(size) && size.length === 2;
        })
        .map((size) => {
          if (!Array.isArray(size)) return '';
          return `${size[0]}x${size[1]}`;
        })
        .join(',')
    : Array.isArray(adUnit?.mediaTypes.video?.playerSize)
    ? adUnit.mediaTypes.video.playerSize
        .filter((size) => {
          return Array.isArray(size) && size.length === 2;
        })
        .map((size) => {
          if (!Array.isArray(size)) return '';
          return `${size[0]}x${size[1]}`;
        })
        .join(',')
    : '';

const ADUNIT_FIELD_MAP = {
  adunitcode: (adUnit: AdUnit) => adUnit?.code,

  size: (adUnit: AdUnit) => adUnitAllSizesStr(adUnit),
  width: (adUnit: AdUnit) => adUnitAllSizesStr(adUnit)?.[0].split('x')[0] || null,
  height: (adUnit: AdUnit) => adUnitAllSizesStr(adUnit)?.[0].split('x')[1] || null,

  mediatype: (adUnit: AdUnit): string => (adUnit?.mediaTypes ? Object.keys(adUnit.mediaTypes).join(',') : ''),

  bidders: (adUnit: AdUnit) =>
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
  const numericStubs = (NUMERIC_FIELD_KEYS as readonly string[]).flatMap((key) => [`${key}>`, `${key}>=`, `${key}<`, `${key}<=`, `${key}=`]);
  const adUnitCodeSuggestions = distinct(adUnits.map((adUnit) => (adUnit?.code ? `adunitcode:${String(adUnit.code)}` : undefined)).filter((s) => s));
  const bidderSuggestions = distinct(adUnits.flatMap((adUnit) => (Array.isArray(adUnit?.bids) ? adUnit.bids.map((b) => (b?.bidder ? `bidder:${String(b.bidder)}` : undefined)) : [])));
  const mediaTypes = distinct(adUnits.flatMap((adUnit) => (adUnit?.mediaTypes ? Object.keys(adUnit.mediaTypes).map((mt) => `mediatype:${mt}`) : [])));

  const suggestions = Array.from(new Set<string>([...keySuggestions, ...numericStubs, ...adUnitCodeSuggestions, ...bidderSuggestions, ...mediaTypes, ...allSizes])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  console.log('Suggestions:', suggestions);
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
