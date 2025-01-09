import React, { useEffect, useState } from 'react';
import { IPrebidAdUnit } from '../../../../Injected/prebid';
import Chip from '@mui/material/Chip';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import { Tooltip } from '@mui/material';

const InterstitialChipComponent = ({ adUnit }: IInterstitialChipComponentProps): JSX.Element => {
  const [labelText, setLabelText] = useState<string | null>();
  useEffect(() => {
    setLabelText('Interstitial');
  }, [adUnit]);

  return (
    <Tooltip title={`ortb2Imp.instl: ${JSON.stringify(adUnit.ortb2Imp.instl)}`}>
      <Chip
        size="small"
        variant="outlined"
        label={labelText}
        color="primary"
        icon={<ScreenshotMonitorIcon />}
        sx={{
          m: 0.5,
          height: 'unset',
          minHeight: '24px',
          '& .MuiChip-label': {
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
            textOverflow: 'clip',
          },
        }}
      />
    </Tooltip>
  );
};

interface IInterstitialChipComponentProps {
  adUnit: IPrebidAdUnit;
}
export default InterstitialChipComponent;
