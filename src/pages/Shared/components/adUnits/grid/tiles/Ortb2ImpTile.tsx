import React, { useContext } from 'react';
import StateContext from '../../../../contexts/appStateContext';
import { IPrebidAdUnit } from '../../../../../Injected/prebid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../JSONViewerComponent';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Ortb2ImpTile = ({ adUnit }: IOrtb2ImpTileProps): JSX.Element => {
  const { isPanel } = useContext(StateContext);
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  if (!adUnit?.ortb2Imp) return null;
  return (
    <Grid
      item
      xs={4}
      md={4}
      sx={{
        overflow: 'hidden',
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
          }}
        >
          {!expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </Box>
        <Box onClick={(e) => e.stopPropagation()}>
          <Box sx={{ p: 0.5 }}>
            <Box sx={{ p: 0.5 }}>
              <Typography variant="caption">ext:</Typography>
              <JSONViewerComponent style={{ padding: 0 }} src={adUnit.ortb2Imp?.ext} />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
};

export default Ortb2ImpTile;
interface IOrtb2ImpTileProps {
  adUnit: IPrebidAdUnit;
}
