import React, { useContext } from 'react';
import Grid from '@mui/material/Grid';
import StateContext from '../../contexts/appStateContext';
import AdUnitsHeaderComponent from './AdUnitsHeader';
import AdUnitsGridComponent from './grid/AdUnitsGridComponent';
import AdUnitCardsComponent from './cards/AdUnitCardsComponent';

const AdUnitsComponent = (): JSX.Element => {
  const { isSmallScreen } = useContext(StateContext);

  return (
    <Grid container direction="row" justifyContent="space-between" spacing={1} sx={{ p: 0.5 }}>
      <AdUnitsHeaderComponent />

      {!isSmallScreen && (
        <Grid item xs={12}>
          <AdUnitsGridComponent />
        </Grid>
      )}

      {isSmallScreen && (
        <Grid item xs={12}>
          <AdUnitCardsComponent />
        </Grid>
      )}
    </Grid>
  );
};

export default AdUnitsComponent;
