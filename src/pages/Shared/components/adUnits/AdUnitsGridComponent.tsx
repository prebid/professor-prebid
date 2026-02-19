import React, { useContext } from 'react';
import { AdUnit } from 'prebid.js';
import { Paper, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AppStateContext from '../../contexts/appStateContext';
import { AdUnitTile, MediaTypesTile, BiddersTile, AdServerTile, Ortb2ImpTile } from './AdUnitTiles';

export const AdUnitsGridComponent = ({ adUnits }: { adUnits: AdUnit[] }): JSX.Element => {
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

export const HeaderGridItem = ({ label, onClick, tooltip, xs, children }: { label?: string; onClick?: () => void; tooltip?: string; xs?: number; children?: React.ReactNode }) => (
  <Grid {...(xs ? { size: { xs } } : {})} onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
    {children ? (
      children
    ) : (
      <Paper sx={{ p: 0.5 }}>
        {tooltip ? (
          <Tooltip title={tooltip} arrow>
            <Typography variant="h2">{label}</Typography>
          </Tooltip>
        ) : (
          <Typography variant="h2">{label}</Typography>
        )}
      </Paper>
    )}
  </Grid>
);
