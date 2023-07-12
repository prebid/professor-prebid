import React, { useContext, useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import InspectedPageContext from '../../../../contexts/inspectedPageContext';
import { IPrebidAdUnit } from '../../../../../Content/scripts/prebid';
import Box from '@mui/material/Box';
import { IGoogleAdManagerSlot } from '../../../../../Content/scripts/googleAdManager';
import JSONViewerComponent from '../../../JSONViewerComponent';

const AdServerTile = ({ adUnit }: IAdServerTileProps): JSX.Element => {
  const { googleAdManager } = useContext(InspectedPageContext);
  const [slot, setSlot] = useState<IGoogleAdManagerSlot | undefined>(undefined);
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

  const { targeting, sizes, elementId, name } = slot as IGoogleAdManagerSlot;
  return (
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
  );
};

export default AdServerTile;
interface IAdServerTileProps {
  adUnit: IPrebidAdUnit;
}
