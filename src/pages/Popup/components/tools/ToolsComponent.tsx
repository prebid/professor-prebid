import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import ModifyBidResponsesComponent from './debug/ModifyBidResponsesComponent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import logger from '../../../../logger';
import { Typography } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import constants from '../../../../constants.json';
import { getTabId } from '../../utils';
import { useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Paper } from '@mui/material';
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
  const theme = useTheme();
  const [consoleState, setConsoleState] = useState<boolean>(null);

  useEffect(() => {
    chrome.storage.local.get(constants.CONSOLE_TOGGLE, (result) => {
      const checked = result ? result[constants.CONSOLE_TOGGLE] : false;
      setConsoleState(checked);
    });
  }, [consoleState]);

  const handleConsoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsoleState(event.target.checked);
    const { checked } = event.target;
    try {
      chrome.storage.local.set({ [constants.CONSOLE_TOGGLE]: checked }, () => {
        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
          const tab = tabs[0];
          logger.log('[PopupHandler] Send onConsoleToggle', { tab }, { type: constants.CONSOLE_TOGGLE, consoleState: checked });
          chrome.tabs.sendMessage(tab.id as number, { type: constants.CONSOLE_TOGGLE, consoleState: checked });
        });
      });
    } catch (e) {
      logger.error('onConsoleToggle', e);
    }
  };
  logger.log(`[PopUp][ToolsComponent]: render `, consoleState);
  return (
    <Box sx={{ m: 1 }}>
      <Grid container direction="row" rowSpacing={0} columnSpacing={0.5} justifyContent="stretch" alignItems="center">
        <Grid item sx={{ height: 36 }}>
          <Paper elevation={1} sx={{ alignItems: 'center' }}>
            <Button size="small" variant="outlined" onClick={dfp_open_console} startIcon={<FontAwesomeIcon icon={faGoogle} />}>
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
        <Grid item xs={12}>
          <Box sx={{ backgroundColor: 'background.paper', borderRadius: 1, p: 1 }}>
            <Grid container rowSpacing={1} columnSpacing={0.5}>
              <Grid item xs={12}>
                <Grid container rowSpacing={1} columnSpacing={0.5}>
                  {prebid && <ModifyBidResponsesComponent prebid={prebid} />}
                </Grid>
              </Grid>
              <Grid item sm={1} xs={1}>
                <Box sx={{ alignContent: 'center', [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' } }}>
                  <FormControl>
                    <FormControlLabel control={<Switch checked={consoleState || false} onChange={handleConsoleChange} />} label="" />
                  </FormControl>
                </Box>
              </Grid>
              <Grid item xs={11} sm={11}>
                <Box sx={{ border: 1, borderColor: consoleState ? 'primary.main' : 'text.disabled', borderRadius: 1 }}>
                  <Typography variant='h4' sx={{ width: 1, p: 1.5, color: consoleState ? 'primary.main' : 'text.disabled' }}>
                    Show AdUnit Info Overlay
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

interface ToolsComponentProps {
  prebid: IPrebidDetails;
}

export default ToolsComponent;
