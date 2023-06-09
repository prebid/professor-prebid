import React, { useContext } from 'react';
import Grid from '@mui/material/Grid';
import StateContext from '../../contexts/appStateContext';
import InspectedPageContext from '../../contexts/inspectedPageContext';
import AdUnitsHeaderComponent from './AdUnitsHeader';
import AdUnitsGridComponent from './grid/AdUnitsGridComponent';
import AdUnitCardsComponent from './cards/AdUnitCardsComponent';

const AdUnitsComponent = (): JSX.Element => {
  const { isSmallScreen } = useContext(StateContext);
  const { googleAdManager } = useContext(InspectedPageContext);

  return (
    <Grid container direction="row" justifyContent="space-between" spacing={1} sx={{ p: .5 }}>
      <AdUnitsHeaderComponent />

      {!isSmallScreen && (
        <Grid item xs={12}>
          <AdUnitsGridComponent />
        </Grid>
      )}

      {isSmallScreen && googleAdManager.slots.length > 0 && (
        <Grid item xs={12}>
          <AdUnitCardsComponent />
        </Grid>
      )}
    </Grid>
  );
};

export default AdUnitsComponent;
