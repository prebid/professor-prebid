import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import GoogleIcon from '@mui/icons-material/Google';
import Typography from '@mui/material/Typography';
import BugReportIcon from '@mui/icons-material/BugReport';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { gte } from 'semver';
import OverlayControlComponent from './OverlayControlComponent';
import AppStateContext from '../../contexts/appStateContext';
import { getTabId } from '../../../Shared/utils';
import DebuggingModuleComponent from './debugging/DebuggingModuleComponent';
import ModifyBidResponsesComponent from './legacyDebugging/ModifyBidResponsesComponent';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const isNewDebugVersion = (input: string): boolean => {
  try {
    return gte(input, '7.3.0');
  } catch (error) {
    console.warn('invalid version string! enable legacy debug module');
    return false;
  }
};

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

const GridItemButton = ({ clickHandler, label, icon }: IGridItemButtonProps): JSX.Element => (
  <Grid sx={{ height: 36 }}>
    <Paper elevation={1} sx={{ alignItems: 'center' }}>
      <Button size="small" variant="outlined" onClick={clickHandler} startIcon={icon}>
        <Typography variant="h3">{label}</Typography>
      </Button>
    </Paper>
  </Grid>
);

const download = (input: any, fileName: string) => {
  delete input.eventsUrl;
  const dataStr = JSON.stringify(input, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const ToolsComponent = (): JSX.Element => {
  const { prebid, prebids } = useContext(AppStateContext);
  return (
    <Grid container justifyContent="stretch" alignItems="center">
      <GridItemButton label="open google AdManager console" clickHandler={dfp_open_console} icon={<GoogleIcon />} />
      <GridItemButton label="open debug tab" clickHandler={openDebugTab} icon={<BugReportIcon />} />
      <GridItemButton label="download" clickHandler={() => download(prebids, `${prebid.eventsUrl.split('//')[1].split('/')[0]}.json`)} icon={<FileDownloadIcon />} />
      <GridItemButton label="delete tabInfos" clickHandler={() => chrome.storage?.local.set({ tabInfos: null })} icon={<DeleteOutlineIcon />} />
      <OverlayControlComponent />

      {isNewDebugVersion(prebid.version) ? <DebuggingModuleComponent /> : <ModifyBidResponsesComponent />}
    </Grid>
  );
};

export default ToolsComponent;

interface IGridItemButtonProps {
  label: string;
  clickHandler: React.MouseEventHandler<HTMLButtonElement>;
  icon: JSX.Element;
}
