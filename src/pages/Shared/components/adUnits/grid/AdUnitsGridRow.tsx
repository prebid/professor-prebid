import React, { useContext } from 'react';

import AdUnitsTile from './tiles/AdUnitTile';
import StateContext from '../../../contexts/appStateContext';
import InspectedPageContext from '../../../contexts/inspectedPageContext';
import { IPrebidAdUnit } from '../../../../Content/scripts/prebid';
import MediaTypesTile from './tiles/MediaTypesTile';
import BiddersTile from './tiles/BiddersTile';
import AdServerTile from './tiles/AdServerTile';

const AdUnitGridRow = ({ adUnit }: IAdUnitGridRowProps): JSX.Element => {
  const { isPanel } = useContext(StateContext);
  const { googleAdManager } = useContext(InspectedPageContext);
  const showAdServerComlumn = isPanel && googleAdManager?.slots?.length > 0;
  const mdWidth = showAdServerComlumn ? 3 : 4;

  return (
    <React.Fragment>
      <AdUnitsTile adUnit={adUnit} mdWidth={mdWidth} />

      <MediaTypesTile adUnit={adUnit} mdWidth={mdWidth} />

      <BiddersTile adUnit={adUnit} mdWidth={mdWidth} />

      {showAdServerComlumn && <AdServerTile adUnit={adUnit} mdWidth={mdWidth} />}
    </React.Fragment>
  );
};

export default AdUnitGridRow;
interface IAdUnitGridRowProps {
  adUnit: IPrebidAdUnit;
}

