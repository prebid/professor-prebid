import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LayerIcon from '@mui/icons-material/Layers';
import { CONSOLE_TOGGLE } from '../../constants';
import { sendChromeTabsMessage } from '../../utils';

const OverlayControlComponent = (): JSX.Element => {
  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage?.local.get(CONSOLE_TOGGLE, (result) => {
      const checked = result ? !!result[CONSOLE_TOGGLE] : false;
      setShowOverlay(checked);
    });
  }, []);

  const handleShowOverlayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setShowOverlay(checked);
    chrome.storage?.local.set({ [CONSOLE_TOGGLE]: checked }, () => {
      sendChromeTabsMessage(CONSOLE_TOGGLE, { consoleState: checked });
    });
  };

  return (
    <Card elevation={1} sx={{ border: '1px solid', borderColor: showOverlay ? 'primary.main' : 'divider' }}>
      <CardContent sx={{ p: '10px 14px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LayerIcon color={showOverlay ? 'primary' : 'action'} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h3" component="span" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                On-Page AdUnit Info Overlay
              </Typography>
              <Chip label={showOverlay ? 'ACTIVE' : 'DISABLED'} size="small" color={showOverlay ? 'primary' : 'default'} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Display interactive debugging badges and bid CPM metadata directly over ad slots on the page.
            </Typography>
          </Box>
        </Box>
        <FormControlLabel control={<Switch checked={showOverlay} onChange={handleShowOverlayChange} color="primary" size="small" />} label="" sx={{ mr: 0 }} />
      </CardContent>
    </Card>
  );
};

export default OverlayControlComponent;
