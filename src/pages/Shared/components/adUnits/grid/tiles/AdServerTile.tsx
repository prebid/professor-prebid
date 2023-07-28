import React, { useContext, useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import InspectedPageContext from '../../../../contexts/inspectedPageContext';
import { IPrebidAdUnit } from '../../../../../Content/scripts/prebid';
import Box from '@mui/material/Box';
import { IGoogleAdManagerSlot } from '../../../../../Content/scripts/googleAdManager';
import JSONViewerComponent from '../../../JSONViewerComponent';
import Grid from '@mui/material/Grid';
import AppStateContext from '../../../../contexts/appStateContext';
import Paper from '@mui/material/Paper';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const AdServerTile = ({ adUnit, mdWidth }: IAdServerTileProps): JSX.Element => {
  const { googleAdManager } = useContext(InspectedPageContext);
  const [slot, setSlot] = useState<IGoogleAdManagerSlot | undefined>(undefined);
  const [expanded, setExpanded] = React.useState(false);
  const { isPanel } = useContext(AppStateContext);
  const { targeting, sizes, elementId, name } = slot as IGoogleAdManagerSlot;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  useEffect(() => {
    const slot = googleAdManager?.slots?.find(
      ({ name, elementId }) =>
        name === adUnit.code ||
        elementId === adUnit.code ||
        name.toLowerCase() === adUnit.code.toLowerCase() ||
        elementId.toLowerCase() === adUnit.code.toLowerCase()
    );
    const fallbackSlot = googleAdManager?.slots?.length === 1 ? googleAdManager?.slots[0] : undefined;
    setSlot(slot || fallbackSlot);
  }, [adUnit.code, googleAdManager?.slots]);

  if (!slot) {
    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption">Unable to match Prebid AdUnit with ad-server slot. </Typography>
        {googleAdManager?.slots?.length > 0 && (
          <JSONViewerComponent style={{ padding: 0 }} name="All detected ad-server slots:" src={googleAdManager.slots} collapsed={2} />
        )}
      </Box>
    );
  }

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
          <React.Fragment>
            {elementId && (
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption">ElementId:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip size="small" variant="outlined" color="primary" label={elementId} />
                </Stack>
              </Box>
            )}
            {name && (
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption">Name:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip size="small" variant="outlined" color="primary" label={name} />
                </Stack>
              </Box>
            )}
            {sizes?.length > 0 && (
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption">Sizes:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {sizes.map((sizeStr, index) => (
                    <Chip size="small" variant="outlined" color="primary" label={sizeStr} key={index} />
                  ))}
                </Stack>
              </Box>
            )}
            {targeting?.length > 0 && (
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption">Targeting:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {targeting
                    .filter(({ value }) => value)
                    .sort((a, b) => (a.key > b.key ? 1 : -1))
                    .map(({ key, value }, index) => (
                      <Chip size="small" variant="outlined" color="primary" label={`${key}: ${value}`} key={index} />
                    ))}
                  {targeting
                    .filter(({ value }) => !value)
                    .sort((a, b) => (a.key > b.key ? 1 : -1))
                    .map(({ key, value }, index) => (
                      <Chip size="small" variant="outlined" color="primary" label={`${key}: ${value}`} key={index} />
                    ))}
                </Stack>
              </Box>
            )}
          </React.Fragment>
        </Box>
      </Paper>
    </Grid>
  );
};

export default AdServerTile;
interface IAdServerTileProps {
  adUnit: IPrebidAdUnit;
  mdWidth: number;
}
