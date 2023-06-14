import React, { useContext } from 'react';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import StateContext from '../../../../contexts/appStateContext';
import JSONViewerComponent from '../../../JSONViewerComponent';
import MediaTypeChipComponent from '../../chips/MediaTypeChipComponent';
import { IPrebidAdUnit } from '../../../../../Content/scripts/prebid';
import Box from '@mui/material/Box';

const MediaTypesTile = ({ adUnit: { mediaTypes, code: adUnitCode } }: IMediaTypesTileComponentProps): JSX.Element => {
  const { allWinningBids, isPanel } = useContext(StateContext);

  return (
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
      {isPanel && (
        <Box sx={{ padding: 0.5 }}>
          <Typography variant="caption">AdUnit JSON:</Typography>
          <JSONViewerComponent style={{ padding: 0 }} src={mediaTypes} collapsed={4} />
        </Box>
      )}
    </Box>
  );
};

export default MediaTypesTile;
interface IMediaTypesTileComponentProps {
  adUnit: IPrebidAdUnit;
}
