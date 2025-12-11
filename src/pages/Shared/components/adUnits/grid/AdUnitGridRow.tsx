import React, { useContext } from 'react';
import AppStateContext from '../../../contexts/appStateContext';
import AdServerTile from './tiles/AdServerTile';
import AdUnitTile from './tiles/AdUnitTile';
import BiddersTile from './tiles/BiddersTile';
import MediaTypesTile from './tiles/MediaTypesTile';
import Ortb2ImpTile from './tiles/Ortb2ImpTile';
import { AdUnit } from 'prebid.js';

export const AdUnitGridRow = ({ adUnit }: { adUnit: AdUnit }): JSX.Element => {
  const { isPanel, googleAdManager } = useContext(AppStateContext);
  const showAdServerColumn = isPanel && googleAdManager?.slots?.length > 0;
  const showOrtb2Imp = isPanel && !!adUnit.ortb2Imp;
  const colCount = 3 + (showAdServerColumn ? 1 : 0) + (showOrtb2Imp ? 1 : 0);

  return (
    <>
      <AdUnitTile adUnit={adUnit} colCount={colCount} />
      <MediaTypesTile adUnit={adUnit} colCount={colCount} />
      <BiddersTile adUnit={adUnit} colCount={colCount} />
      {showAdServerColumn && <AdServerTile adUnit={adUnit} colCount={colCount} />}
      {showOrtb2Imp && <Ortb2ImpTile adUnit={adUnit} colCount={colCount} />}
    </>
  );
};
