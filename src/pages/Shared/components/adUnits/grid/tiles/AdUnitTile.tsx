import React, { useContext } from 'react';
import AdUnitChipComponent from '../../chips/AdUnitChipComponent';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { IPrebidAdUnit } from '../../../../../Content/scripts/prebid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../JSONViewerComponent';
import AppStateContext from '../../../../contexts/appStateContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const AdUnitTile = ({ adUnit, mdWidth }: IAdUnitGridRowProps): JSX.Element => {
  const { isPanel } = useContext(AppStateContext);
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Grid
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
          }}
        >
          {!expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </Box>
        <Box onClick={(e) => e.stopPropagation()}>
          <Box sx={{ p: 0.5 }}>
            {!expanded && (
              <>
                <Typography variant="caption">AdUnit Code:</Typography>
                <Stack direction="row" flexWrap={'wrap'} gap={1}>
                  <AdUnitChipComponent adUnit={adUnit} />
                </Stack>
              </>
            )}
            {expanded && (
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption">AdUnit JSON:</Typography>
                <JSONViewerComponent style={{ padding: 0 }} src={adUnit} collapsed={2} />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
};

export default AdUnitTile;
interface IAdUnitGridRowProps {
  adUnit: IPrebidAdUnit;
  mdWidth: number;
}
