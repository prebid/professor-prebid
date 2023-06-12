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

const GridItem = ({ mdWidth, children, expanded, setExpanded, isPanel }: IGridItemProps): JSX.Element => {
  return (
    <Grid
      item
      xs={4}
      md={mdWidth}
      sx={{ minHeight: isPanel ? '250px' : 'unset', overflow: 'hidden', maxHeight: isPanel ? (!expanded ? 100 : 'unset') : 'unset' }}
      onClick={() => setExpanded(!expanded)}
    >
      <Paper sx={{ height: '100%' }}>
        <span onClick={(e) => e.stopPropagation()}>{children}</span>
      </Paper>
    </Grid>
  );
};

const AdUnitGridRow = ({ adUnit }: IAdUnitGridRowProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState<boolean>(false);
  const { isPanel } = useContext(StateContext);
  const { googleAdManager } = useContext(InspectedPageContext);
  const showAdServerComlumn = isPanel && googleAdManager?.slots?.length > 0;
  const mdWidth = showAdServerComlumn ? 3 : 4;

  return (
    <React.Fragment>
      <GridItem mdWidth={mdWidth} expanded={expanded} setExpanded={setExpanded} isPanel={isPanel}>
        <AdUnitChipComponent adUnit={adUnit} />
      </GridItem>

      <GridItem mdWidth={mdWidth} expanded={expanded} setExpanded={setExpanded} isPanel={isPanel}>
        <MediaTypes adUnit={adUnit} />
      </GridItem>

      <GridItem mdWidth={mdWidth} expanded={expanded} setExpanded={setExpanded} isPanel={isPanel}>
        <BiddersTile adUnit={adUnit} />
      </GridItem>

      {showAdServerComlumn && (
        <GridItem mdWidth={mdWidth} expanded={expanded} setExpanded={setExpanded} isPanel={isPanel}>
          <AdServerTile adUnit={adUnit} />
        </GridItem>
      )}
    </React.Fragment>
  );
};

export default AdUnitGridRow;
interface IAdUnitGridRowProps {
  adUnit: IPrebidAdUnit;
}

interface IGridItemProps {
  mdWidth: number;
  children: React.ReactNode;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isPanel: boolean;
}
