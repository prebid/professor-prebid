import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import GoogleIcon from '@mui/icons-material/Google';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Tooltip from '@mui/material/Tooltip';
import { gte } from 'semver';
import OverlayControlComponent from './OverlayControlComponent';
import McpToolsComponent from './mcp/McpToolsComponent';
import AppStateContext from '../../contexts/appStateContext';
import { getTabId } from '../../../Shared/utils';
import DebuggingModuleComponent from './debugging/DebuggingModuleComponent';
import ModifyBidResponsesComponent from './legacyDebugging/ModifyBidResponsesComponent';

const isNewDebugVersion = (input?: string): boolean => {
  if (!input) return true;
  try {
    return gte(input, '7.3.0');
  } catch (error) {
    return true;
  }
};

const dfp_open_console = async () => {
  const tabId = await getTabId();
  await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: () => {
      const win = window as any;
      win.googletag = win.googletag || {};
      win.googletag.cmd = win.googletag.cmd || [];
      win.googletag.cmd.push(() => {
        if (typeof win.googletag.openConsole === 'function') {
          win.googletag.openConsole();
        } else {
          const url = new URL(window.location.href);
          if (!url.searchParams.has('google_console')) {
            url.searchParams.set('google_console', '1');
            window.location.href = url.toString();
          }
        }
      });
      if (typeof win.googletag.openConsole === 'function') {
        win.googletag.openConsole();
      }
    },
  });
};

const download = (input: any, fileName: string) => {
  if (!input) return;
  const clone = { ...input };
  delete clone.eventsUrl;
  const dataStr = JSON.stringify(clone, null, 2);
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

  const domainName = prebid?.eventsUrl ? prebid.eventsUrl.split('//')[1]?.split('/')[0] : 'prebid-session';

  return (
    <Grid container spacing={0.75} sx={{ width: '100%', p: 0.5 }}>
      {}
      <Grid size={{ xs: 12 }}>
        <Paper elevation={1} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h3" sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 0.75, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Actions & Utilities
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Tooltip title="Inject & open Google AdManager Publisher Console on page" arrow>
              <Button size="small" variant="outlined" onClick={dfp_open_console} startIcon={<GoogleIcon />} sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}>
                Google GAM Console
              </Button>
            </Tooltip>

            <Tooltip title="Download full Prebid session state & event logs as JSON file" arrow>
              <Button size="small" variant="outlined" onClick={() => download(prebids, `${domainName}.json`)} startIcon={<FileDownloadIcon />} sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}>
                Download Session JSON
              </Button>
            </Tooltip>

            <Tooltip title="Reset saved extension tab cache in local storage" arrow>
              <Button size="small" variant="outlined" color="error" onClick={() => chrome.storage?.local.set({ tabInfos: null })} startIcon={<DeleteOutlineIcon />} sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}>
                Reset Extension Storage
              </Button>
            </Tooltip>
          </Box>
        </Paper>
      </Grid>

      {/* Model Context Protocol (MCP) & AI Diagnostics */}
      <Grid size={{ xs: 12 }}>
        <McpToolsComponent />
      </Grid>

      {/* On-Page AdUnit Overlay Control */}
      <Grid size={{ xs: 12 }}>
        <OverlayControlComponent />
      </Grid>

      {/* Prebid Debugging Module (v7.3.0+ or Legacy Fallback) */}
      <Grid size={{ xs: 12 }}>{isNewDebugVersion(prebid?.version) ? <DebuggingModuleComponent /> : <ModifyBidResponsesComponent />}</Grid>
    </Grid>
  );
};

export default ToolsComponent;
