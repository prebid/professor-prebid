import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import DebuggingModuleComponent from './debuggingModule/DebuggingModuleComponent';
import ModifyBidResponsesComponent from './debugLegacy/ModifyBidResponsesComponent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import GoogleIcon from '@mui/icons-material/Google';
import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import constants from '../../../../constants.json';
import { getTabId } from '../../utils';
import Grid from '@mui/material/Grid';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Paper } from '@mui/material';
import OverlayControlComponent from './OverlayControlComponent';
import gte from 'semver/functions/gte';

const dfp_open_console = async () => {
  const tabId = await getTabId();
  const fileUrl = chrome.runtime.getURL('openDfpConsole.bundle.js');
  const func = (fileUrl: string) => {
    const script = document.createElement('script');
    script.src = fileUrl;
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => {
      script.remove();
    };
  };
  chrome.scripting.executeScript({ target: { tabId }, func, args: [fileUrl] });
};

const openDebugTab = async () => {
  const url = await chrome.runtime.getURL('app.html');
  chrome.tabs.create({ url });
};

const ToolsComponent = ({ prebid }: ToolsComponentProps): JSX.Element => {
  const [consoleState, setConsoleState] = useState<boolean>(null);

  useEffect(() => {
    chrome.storage.local.get(constants.CONSOLE_TOGGLE, (result) => {
      const checked = result ? result[constants.CONSOLE_TOGGLE] : false;
      setConsoleState(checked);
    });
  }, [consoleState]);

  return (
    <Box sx={{ m: 1 }}>
      <Grid container direction="row" rowSpacing={0} columnSpacing={0.5} justifyContent="stretch" alignItems="center">
        <Grid item sx={{ height: 36 }}>
          <Paper elevation={1} sx={{ alignItems: 'center' }}>
            <Button size="small" variant="outlined" onClick={dfp_open_console} startIcon={<GoogleIcon />}>
              <Typography variant="h3">open google AdManager console</Typography>
            </Button>
          </Paper>
        </Grid>
        <Grid item sx={{ height: 36 }}>
          <Paper elevation={1}>
            <Button size="small" variant="outlined" onClick={openDebugTab} startIcon={<BugReportIcon />}>
              <Typography variant="h3">open debug tab</Typography>
            </Button>
          </Paper>
        </Grid>
        <Grid item sx={{ height: 36 }}>
          <Paper elevation={1}>
            <Button size="small" variant="outlined" onClick={() => chrome.storage?.local.set({ tabInfos: null })} startIcon={<DeleteOutlineIcon />}>
              <Typography variant="h3"> delete tabInfos</Typography>
            </Button>
          </Paper>
        </Grid>

        <OverlayControlComponent />
        {prebid && !gte(prebid.version, '7.3.0') && <ModifyBidResponsesComponent prebid={prebid} />}
        {prebid && gte(prebid.version, '7.3.0') && <DebuggingModuleComponent prebid={prebid} />}
      </Grid>
    </Box>
  );
};

interface ToolsComponentProps {
  prebid: IPrebidDetails;
}

export default ToolsComponent;
