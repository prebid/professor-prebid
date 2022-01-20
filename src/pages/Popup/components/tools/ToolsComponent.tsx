import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import DebugComponent from './debug/ModifyBidResponsesComponent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Switch from '@mui/material/Switch';
import { popupHandler } from '../../popupHandler';
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

  const [consoleState, setConsoleState] = useState<boolean>(null);
  useEffect(() => {
    popupHandler.getToggleStateFromStorage((checked: boolean) => {
      setConsoleState(checked);
    });
  }, [consoleState]);

  const handleConsoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsoleState(event.target.checked);
    popupHandler.onConsoleToggle(event.target.checked);
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
                <Button variant="outlined" size="medium" onClick={popupHandler.openDebugTab} startIcon={<BugReportIcon />}>
                  open debug tab
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
