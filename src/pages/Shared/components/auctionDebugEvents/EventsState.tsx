import { useEffect, useState, useContext } from 'react';
import { IPrebidAdUnit } from '../../../Injected/prebid';
import StateContext from '../../contexts/appStateContext';

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

const EventsState = () => {
  const [eventsPopUpOpen, setEventsPopUpOpen] = useState(false);
  const [pbjsVersionPopUpOpen, setPbjsVersionPopUpOpen] = useState(false);
  const { auctionInitEvents } = useContext(StateContext);
  const [adUnits, setAdUnits] = useState<IPrebidAdUnit[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<string | null>(null);
  useEffect(() => {
    const adUnits = auctionInitEvents
      ?.reduce((previousValue, currentValue) => {
        return [...previousValue, ...currentValue.args.adUnits];
      }, [] as IPrebidAdUnit[])
      ?.reduce((previousValue, currentValue) => {
        let toUpdate = previousValue.find((adUnit) => {
          const adUnitBids = adUnit.bids.map(({ bidder, params }: any) => ({ bidder, params })) || [];
          const currentValueBids = currentValue.bids.map(({ bidder, params }: any) => ({ bidder, params })) || [];
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
      }, [])
      // "fix" https://github.com/prebid/professor-prebid/issues/104 ?
      .sort((a, b) => a.code.localeCompare(b.code));

    setAdUnits(adUnits);
  }, [auctionInitEvents]);

  return {
    adUnits,
    setAdUnits,
    query,
    setQuery,
    sort,
    setSort,
    eventsPopUpOpen,
    setEventsPopUpOpen,
    pbjsVersionPopUpOpen,
    setPbjsVersionPopUpOpen,
  };
};

export default EventsState;
