import React, { useContext, useRef, useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import AdUnitsTile from './tiles/AdUnitTile';
import StateContext from '../../../contexts/appStateContext';
import InspectedPageContext from '../../../contexts/inspectedPageContext';
import { IPrebidAdUnit } from '../../../../Content/scripts/prebid';
import MediaTypesTile from './tiles/MediaTypesTile';
import BiddersTile from './tiles/BiddersTile';
import AdServerTile from './tiles/AdServerTile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Box from '@mui/material/Box';

const GridItem = ({ mdWidth, children, isPanel }: IGridItemProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const contentRef = useRef(null);
  const gridItemRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [gridItemHeight, setGridItemHeight] = useState(0);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  useEffect(() => {
    const contentRefCurrent = contentRef.current;
    const handleResize = () => {
      setContentHeight(contentRefCurrent?.clientHeight);
      setGridItemHeight(gridItemRef.current?.clientHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    if (contentRefCurrent) {
      resizeObserver.observe(contentRefCurrent);
    }
    return () => {
      if (contentRefCurrent) {
        resizeObserver.unobserve(contentRefCurrent);
      }
    };
  }, []);

  const contentNeedsMoreHeight = contentHeight > gridItemHeight;

  return (
    <Grid
      ref={gridItemRef}
      item
      xs={4}
      md={mdWidth}
      sx={{
        minHeight: isPanel ? '250px' : 'unset',
        overflow: 'hidden',
        maxHeight: isPanel ? (!expanded ? 100 : 'unset') : 'unset',
        position: 'relative', // Ensure relative positioning for the overlay
        '&:after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '6px', // Adjust the height of the overlay as needed
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))',
          pointerEvents: 'none', // Allow interactions with underlying elements
        },
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <Paper sx={{ height: '100%', position: 'relative' }}>
        <Box
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
          sx={{
            zIndex: 100,
            position: 'absolute',
            right: '0px',
            top: '0px',
            display: isPanel ? 'block' : 'none',
            visibility: contentNeedsMoreHeight || expanded ? 'block' : 'hidden',
          }}
        >
          {!expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </Box>
        <Box ref={contentRef} onClick={(e) => e.stopPropagation()}>
          {children}
        </Box>
      </Paper>
    </Grid>
  );
};

const AdUnitGridRow = ({ adUnit }: IAdUnitGridRowProps): JSX.Element => {
  const { isPanel } = useContext(StateContext);
  const { googleAdManager } = useContext(InspectedPageContext);
  const showAdServerComlumn = isPanel && googleAdManager?.slots?.length > 0;
  const mdWidth = showAdServerComlumn ? 3 : 4;

  return (
    <React.Fragment>
      <GridItem mdWidth={mdWidth} isPanel={isPanel}>
        <AdUnitsTile adUnit={adUnit} />
      </GridItem>

      <GridItem mdWidth={mdWidth} isPanel={isPanel}>
        <MediaTypesTile adUnit={adUnit} />
      </GridItem>

      <GridItem mdWidth={mdWidth} isPanel={isPanel}>
        <BiddersTile adUnit={adUnit} />
      </GridItem>

      {showAdServerComlumn && (
        <GridItem mdWidth={mdWidth} isPanel={isPanel}>
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
  isPanel: boolean;
}
