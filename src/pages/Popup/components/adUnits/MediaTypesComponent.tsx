import React from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import MediaTypeChipComponent from './MediaTypeChipComponent';
import { IPrebidAdUnitMediaTypes, IPrebidBidWonEventData } from '../../../../inject/scripts/prebid';

const MediaTypesComponent = ({ mediaTypes, winningBid }: IMediaTypesComponentProps): JSX.Element => {
  return (
    <Box sx={{ p: 0.5 }}>
      {Object.keys(mediaTypes).map((mediaType, index) => {
        switch (mediaType) {
          case 'banner': {
            return (
              <Box key={index}>
                {mediaTypes['banner'].sizes && (
                  <React.Fragment>
                    <Typography variant="caption">Banner Sizes:</Typography>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {mediaTypes['banner'].sizes?.map((size, index) => (
                        <MediaTypeChipComponent
                          input={mediaTypes['banner']}
                          label={`${size[0]}x${size[1]}`}
                          key={index}
                          isWinner={winningBid?.args?.size === `${size[0]}x${size[1]}`}
                        />
                      ))}
                    </Stack>
                  </React.Fragment>
                )}
                {mediaTypes['banner'].sizeConfig?.map((item, index) => (
                  <React.Fragment key={index}>
                    <Typography variant="caption">
                      minViewPort {item.minViewPort[0]}x{item.minViewPort[1]}:
                    </Typography>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {item.sizes.map((size, index) => (
                        <Chip size="small" variant="outlined" color="primary" label={`${size[0]}x${size[1]}`} key={index} />
                      ))}
                    </Stack>
                  </React.Fragment>
                ))}
              </Box>
            );
          }
          case 'video': {
            return (
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
            );
          }
          case 'native': {
            return (
              <Box key={index}>
                <Typography variant="caption">Native:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {Object.keys(mediaTypes[mediaType]).map((key, index) => (
                    <MediaTypeChipComponent
                      input={mediaTypes[mediaType]}
                      label={`${key}: ${JSON.stringify(mediaTypes['native'][key as keyof typeof mediaTypes['native']])}`}
                      key={index}
                    />
                  ))}
                </Stack>
              </Box>
            );
          }
        }
        return null;
      })}
    </Box>
  );
};

interface IMediaTypesComponentProps {
  mediaTypes: IPrebidAdUnitMediaTypes;
  winningBid?: IPrebidBidWonEventData;
}

export default MediaTypesComponent;
