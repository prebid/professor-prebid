import React, { useContext } from 'react';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import StateContext from '../../../../contexts/appStateContext';
import JSONViewerComponent from '../../../JSONViewerComponent';
import MediaTypeChipComponent from '../../chips/MediaTypeChipComponent';
import { IPrebidAdUnit } from '../../../../../Content/scripts/prebid';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Paper from '@mui/material/Paper';

const MediaTypesTile = ({ adUnit: { mediaTypes, code: adUnitCode }, mdWidth }: IMediaTypesTileComponentProps): JSX.Element => {
  const { allWinningBids, isPanel } = useContext(StateContext);
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
            {Object.keys(mediaTypes).map((mediaType, index) => (
              <React.Fragment key={index}>
                {mediaType === 'banner' && mediaTypes['banner'].sizes && (
                  <Box>
                    <Typography variant="caption">Banner Sizes:</Typography>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {mediaTypes['banner'].sizes?.map(([width, height], index) => (
                        <MediaTypeChipComponent
                          input={mediaTypes['banner']}
                          label={`${width}x${height}`}
                          key={index}
                          isWinner={allWinningBids.find(({ args }) => args.adUnitCode === adUnitCode)?.args?.size === `${width}x${height}`}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
                {mediaType === 'banner' &&
                  mediaTypes['banner'].sizeConfig?.map(({ minViewPort, sizes }, index) => (
                    <Box key={index}>
                      <Typography variant="caption">
                        minViewPort {minViewPort[0]}x{minViewPort[1]}:
                      </Typography>
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {sizes.map(([width, height], index) => (
                          <Chip size="small" variant="outlined" color="primary" label={`${width}x${height}`} key={index} />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                {mediaType === 'video' && (
                  <Box key={index}>
                    <Typography variant="caption">Video:</Typography>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {Object.keys(mediaTypes['video']).map((key, index) => (
                        <MediaTypeChipComponent
                          input={mediaTypes['video']}
                          label={`${key}: ${JSON.stringify(mediaTypes['video'][key as keyof typeof mediaTypes['video']])}`}
                          key={index}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
                {mediaType === 'native' && (
                  <Box key={index}>
                    <Typography variant="caption">Native:</Typography>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {Object.keys(mediaTypes['native']).map((key, index) => (
                        <MediaTypeChipComponent
                          input={mediaTypes['native']}
                          label={`${key}: ${JSON.stringify(mediaTypes['native'][key as keyof typeof mediaTypes['native']])}`}
                          key={index}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </React.Fragment>
            ))}
            {expanded && (
              <Box sx={{ padding: 0.5 }}>
                <Typography variant="caption">MediaType JSON:</Typography>
                <JSONViewerComponent style={{ padding: 0 }} src={mediaTypes} collapsed={4} />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
};

export default MediaTypesTile;
interface IMediaTypesTileComponentProps {
  adUnit: IPrebidAdUnit;
  mdWidth: number;
}
