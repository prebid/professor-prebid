import React, { useContext } from 'react';
import AppStateContext from '../../../contexts/appStateContext';
import { HeaderGridItem } from './HeaderGridItem';
import { AdUnitGridRow } from './AdUnitGridRow';
import { IPrebidAdUnit } from '../../../../Injected/prebid';

export const AdUnitsGridComponent = ({ adUnits }: { adUnits: IPrebidAdUnit[] }): JSX.Element => {
  const headers = ['Code', 'Media Types', 'Bidders'];

  const { isPanel, googleAdManager } = useContext(AppStateContext);

  const showAdServerColumn = isPanel && googleAdManager?.slots?.length > 0;
  const showOrtb2ImpColumn = isPanel && adUnits.some(({ ortb2Imp }) => ortb2Imp);

  if (showAdServerColumn) headers.push('Ad Server');
  if (showOrtb2ImpColumn) headers.push('OpenRtb2 Imp');

  return (
    <>
      {headers.map((header, i) => (
        <HeaderGridItem key={i} label={header} xs={12 / headers.length} />
      ))}

      {adUnits.map((adUnit, index) => (
        <AdUnitGridRow adUnit={adUnit} key={index} />
      ))}
    </>
  );
};
