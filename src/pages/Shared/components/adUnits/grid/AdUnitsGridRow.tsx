import React, { useContext } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import AdUnitChipComponent from '../chips/AdUnitChipComponent';
import StateContext from '../../../contexts/appStateContext';
import InspectedPageContext from '../../../contexts/inspectedPageContext';
import { IPrebidAdUnit } from '../../../../Content/scripts/prebid';
import MediaTypes from './tiles/MediaTypesTile';
import BiddersTile from './tiles/BiddersTile';
import AdServerTile from './tiles/AdServerTile';

const AdUnitGridRow = ({ adUnit }: IAdUnitGridRowProps): JSX.Element => {
  const { isPanel } = useContext(StateContext);
  const { googleAdManager } = useContext(InspectedPageContext);
  const showAdServerComlumn = isPanel && googleAdManager?.slots?.length > 0;
  return (
    <React.Fragment>
      <Grid item xs={4} md={showAdServerComlumn ? 3 : 4}>
        <Paper sx={{ height: '100%' }}>
          <AdUnitChipComponent adUnit={adUnit} />
        </Paper>
      </Grid>

      <Grid item xs={4} md={showAdServerComlumn ? 3 : 4}>
        <Paper sx={{ height: '100%' }}>
          <MediaTypes adUnit={adUnit} />
        </Paper>
      </Grid>

      <Grid item xs={4} md={showAdServerComlumn ? 3 : 4}>
        <Paper sx={{ height: '100%' }}>
          <BiddersTile adUnit={adUnit} />
        </Paper>
      </Grid>

      {isPanel && googleAdManager?.slots?.length > 0 && (
        <Grid item xs={4} md={3}>
          <Paper sx={{ height: '100%' }}>
            <AdServerTile adUnit={adUnit} />
          </Paper>
        </Grid>
      )}
    </React.Fragment>
  );
};

export default AdUnitGridRow;
interface IAdUnitGridRowProps {
  adUnit: IPrebidAdUnit;
}
