import React, { useContext } from 'react';
import AdUnitsTile from './tiles/AdUnitTile';
import StateContext from '../../../contexts/appStateContext';
import { IPrebidAdUnit } from '../../../../Injected/prebid';
import MediaTypesTile from './tiles/MediaTypesTile';
import BiddersTile from './tiles/BiddersTile';
import AdServerTile from './tiles/AdServerTile';
import Ortb2ImpTile from './tiles/Ortb2ImpTile';

const AdUnitGridRow = ({ adUnit, adUnit: { ortb2Imp } }: IAdUnitGridRowProps): JSX.Element => {
  const { isPanel, googleAdManager } = useContext(StateContext);
  const showAdServerComlumn = isPanel && googleAdManager?.slots?.length > 0;
  const showOrtb2Imp = isPanel && ortb2Imp;
  return (
    <React.Fragment>
      <AdUnitsTile adUnit={adUnit} />

      <MediaTypesTile adUnit={adUnit} />

      <BiddersTile adUnit={adUnit} />

      {showAdServerComlumn && <AdServerTile adUnit={adUnit} />}
      {showOrtb2Imp && <Ortb2ImpTile adUnit={adUnit} />}
    </React.Fragment>
  );
};

export default AdUnitGridRow;
interface IAdUnitGridRowProps {
  adUnit: IPrebidAdUnit;
}
