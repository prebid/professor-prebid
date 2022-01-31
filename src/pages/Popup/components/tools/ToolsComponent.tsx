import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import DebugComponent from './debug/ModifyBidResponsesComponent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import logger from '../../../../logger';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import { TableBody } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import constants from '../../../../constants.json';

const ToolsComponent = ({ prebid }: ToolsComponentProps): JSX.Element => {
  const dfp_open_console = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const tabId = currentTab.id;
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
    });
  };
  const openDebugTab = async () => {
    const url = await chrome.runtime.getURL('app.html');
    chrome.tabs.create({ url });
  };
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
    <Box sx={{ backgroundColor: '#87CEEB', opacity: 0.8, p: 1, display: 'flex', justifyContent: 'center' }}>
      <Paper elevation={5} sx={{ m: 1, borderRadius: 2, textAlign: 'center', minWidth: 1 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell align="center">{prebid && <DebugComponent prebid={prebid} />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center">
                <Button variant="outlined" size="medium" onClick={dfp_open_console} startIcon={<FontAwesomeIcon icon={faGoogle} />}>
                  open google AdManager console
                </Button>
                <Button variant="outlined" size="medium" onClick={openDebugTab} startIcon={<BugReportIcon />}>
                  open debug tab
                </Button>
                <Button variant="outlined" size="medium" onClick={() => chrome.storage?.local.set({ tabInfos: null })} startIcon={<BugReportIcon />}>
                  delete tabInfos
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center">
                <FormControlLabel
                  control={<Switch checked={consoleState || false} onChange={handleConsoleChange} />}
                  label="Show AdUnit Info Overlay"
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

interface ToolsComponentProps {
  prebid: IPrebidDetails;
}

export default ToolsComponent;
