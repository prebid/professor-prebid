import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import logger from '../../../../logger';
import { Typography } from '@mui/material';
import constants from '../../../../constants.json';
import { useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';

const OverlayControlComponent = (): JSX.Element => {
  const theme = useTheme();
  const [showOverlay, setShowOverlay] = useState<boolean>(null);

  useEffect(() => {
    chrome.storage.local.get(constants.CONSOLE_TOGGLE, (result) => {
      const checked = result ? result[constants.CONSOLE_TOGGLE] : false;
      setShowOverlay(checked);
    });
  }, [showOverlay]);

  const handleShowOverlayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOverlay(event.target.checked);
    const { checked } = event.target;
    chrome.storage.local.set({ [constants.CONSOLE_TOGGLE]: checked }, () => {
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        const tab = tabs[0];
        logger.log('[PopupHandler] Send onConsoleToggle', { tab }, { type: constants.CONSOLE_TOGGLE, consoleState: checked });
        chrome.tabs.sendMessage(tab.id as number, { type: constants.CONSOLE_TOGGLE, consoleState: checked });
      });
    });
  };

  return (
    <Grid item xs={12}>
      <Box sx={{ backgroundColor: 'background.paper', borderRadius: 1, p: 1 }}>
        <Grid container rowSpacing={1} columnSpacing={0.5}>
          <Grid item sm={1} xs={1}>
            <Box sx={{ alignContent: 'center', [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' } }}>
              <FormControl>
                <FormControlLabel control={<Switch checked={showOverlay || false} onChange={handleShowOverlayChange} />} label="" />
              </FormControl>
            </Box>
          </Grid>
          <Grid item xs={11} sm={11}>
            <Box sx={{ border: 1, borderColor: showOverlay ? 'primary.main' : 'text.disabled', borderRadius: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  width: 1,
                  p: 1,
                  color: showOverlay ? 'primary.main' : 'text.disabled',
                }}
              >
                Show AdUnit Info Overlay
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default OverlayControlComponent;
