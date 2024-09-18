import { useEffect, useState, useContext } from 'react';
import { IPrebidAdUnit } from '../../../Injected/prebid';
import merge from 'lodash/merge';
import StateContext from '../../contexts/appStateContext';

const AdUnitsComponentState = () => {
  const { auctionInitEvents } = useContext(StateContext);
  const [adUnits, setAdUnits] = useState<IPrebidAdUnit[]>([]);

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
    // .sort((a, b) => a.code.localeCompare(b.code));

    setAdUnits(adUnits);
  }, [auctionInitEvents]);

  return {
    adUnits,
    setAdUnits,
  };
};

export default AdUnitsComponentState;
