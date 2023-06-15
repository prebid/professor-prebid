import React from 'react';
import AdUnitChipComponent from '../../chips/AdUnitChipComponent';
import { IPrebidAdUnit } from '../../../../../Content/scripts/prebid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../JSONViewerComponent';
import { useContext } from 'react';
import AppStateContext from '../../../../contexts/appStateContext';

const AdUnitTile = ({ adUnit }: IAdUnitGridRowProps): JSX.Element => {
  const { isPanel } = useContext(AppStateContext);
  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption">AdUnit Code:</Typography>
      <Stack direction="row" flexWrap={'wrap'} gap={1}>
        <AdUnitChipComponent adUnit={adUnit} />
      </Stack>
      {isPanel && (
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption">AdUnit JSON:</Typography>
          <JSONViewerComponent style={{ padding: 0 }} src={adUnit} collapsed={2} />
        </Box>
      )}
    </Box>
  );
};

export default AdUnitTile;
interface IAdUnitGridRowProps {
  adUnit: IPrebidAdUnit;
}
