import React, { useContext, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AppStateContext from '../../../contexts/appStateContext';
import { getTabId } from '../../../../Shared/utils';
import { MCP_BRIDGE_ENABLE } from '../../../constants';

export const injectDevtoolsMcpScript = async (): Promise<boolean> => {
  try {
    const tabId = await getTabId();
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      args: [MCP_BRIDGE_ENABLE],
      func: (bridgeEnableEvent: string) => {
        document.dispatchEvent(new CustomEvent(bridgeEnableEvent));
        const win = window as any;
        if (win.__PREBID_DEVTOOLS_MCP_INITIALIZED__) {
          console.info('[Professor Prebid] DevTools MCP is already active on this page.');
          return;
        }
        win.__PREBID_DEVTOOLS_MCP_INITIALIZED__ = true;

        const pbjs = win.pbjs || (win._pbjsGlobals && win[win._pbjsGlobals[0]]);
        const events: any[] = [];
        const auctionMap = new Map<string, any>();

        const recordEvent = (eventType: string, args: any) => {
          events.push({ eventType, args, timestamp: Date.now() });
          if (args) {
            const auctionId = args.auctionId || args.auction?.auctionId;
            if (auctionId) {
              if (!auctionMap.has(auctionId)) {
                auctionMap.set(auctionId, {
                  auctionId,
                  timestamp: Date.now(),
                  timeout: args.timeout || null,
                  bidsReceived: [],
                  noBids: [],
                  winningBids: [],
                });
              }
              const record = auctionMap.get(auctionId);
              if (eventType === 'bidResponse') record.bidsReceived.push(args);
              else if (eventType === 'noBid') record.noBids.push(args);
              else if (eventType === 'bidWon') record.winningBids.push(args);
            }
          }
          try {
            if (typeof performance !== 'undefined' && performance.mark) {
              performance.mark(`prebid:${eventType}`);
            }
          } catch (e) {
            // Ignored
          }
        };

        const attachPbjs = (instance: any) => {
          if (!instance || typeof instance.onEvent !== 'function') return;
          ['auctionInit', 'auctionEnd', 'bidRequested', 'bidResponse', 'noBid', 'bidWon', 'bidTimeout', 'setTargeting'].forEach((evt) => {
            try {
              instance.onEvent(evt, (data: any) => recordEvent(evt, data));
            } catch (e) {
              // Ignored
            }
          });
          if (Array.isArray(instance.installedModules) && !instance.installedModules.includes('devtoolsMcp')) {
            instance.installedModules.push('devtoolsMcp');
          }
        };

        if (pbjs) attachPbjs(pbjs);
        if (win._pbjsGlobals && Array.isArray(win._pbjsGlobals)) {
          win._pbjsGlobals.forEach((g: string) => attachPbjs(win[g]));
        }

        win.__PREBID_DEVTOOLS_MCP__ = {
          version: '1.0.0',
          getEvents: () => [...events],
          getAuctions: () => Array.from(auctionMap.values()),
        };

        console.info('[Professor Prebid] DevTools MCP Module successfully attached to Prebid.js.');
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to inject DevTools MCP standalone script:', error);
    return false;
  }
};

export const generateMcpAiPrompt = (prebid: any, prebids: any): string => {
  const version = prebid?.version || 'unknown';
  const modules = prebid?.installedModules || [];
  const eventsUrl = prebid?.eventsUrl || '';
  const domain = eventsUrl ? eventsUrl.split('//')[1]?.split('/')[0] : 'inspected-page';
  const hasDevtoolsMcp = modules.includes('devtoolsMcp');

  let prompt = `## Prebid.js & AdTech Diagnostic Snapshot\n`;
  prompt += `**Domain:** \`${domain}\` | **Prebid Version:** \`${version}\` | **DevTools MCP Active:** \`${hasDevtoolsMcp ? 'Yes' : 'No'}\`\n`;
  prompt += `**Installed Modules (${modules.length}):** ${modules.slice(0, 12).join(', ')}${modules.length > 12 ? '...' : ''}\n\n`;

  prompt += `### Configuration & Session\n`;
  prompt += `- **Configured Timeout:** ${prebid?.timeout || 'default'}ms\n`;
  prompt += `- **Debug Mode:** ${prebid?.debug ? 'Enabled' : 'Disabled'}\n`;
  prompt += `- **User IDs / EIDs Configured:** ${prebid?.eids?.length || 0} providers\n\n`;

  if (prebids) {
    const namespaces = Object.keys(prebids);
    prompt += `### Prebid Instances on Page (${namespaces.length})\n`;
    namespaces.forEach((ns) => {
      const p = prebids[ns];
      prompt += `- Instance \`${ns}\`: Version \`${p?.version || 'N/A'}\` (${p?.installedModules?.length || 0} modules)\n`;
    });
    prompt += '\n';
  }

  prompt += `### Diagnostic Goal\n`;
  prompt += `Analyze this Prebid.js implementation for bidder latency bottlenecks, consent/privacy compliance, price granularity, and revenue optimization opportunities.`;

  return prompt;
};

export const McpToolsComponent: React.FC = () => {
  const { prebid, prebids } = useContext(AppStateContext);
  const [injected, setInjected] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const installedModules = prebid?.installedModules || [];
  const isMcpActive = installedModules.includes('devtoolsMcp') || injected;

  const handleInject = async () => {
    const success = await injectDevtoolsMcpScript();
    if (success) {
      setInjected(true);
      setSnackbarMessage('Prebid DevTools MCP Module successfully injected onto page!');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage('Failed to inject DevTools MCP module.');
      setSnackbarOpen(true);
    }
  };

  const handleCopySnapshot = async () => {
    const promptText = generateMcpAiPrompt(prebid, prebids);
    try {
      await navigator.clipboard.writeText(promptText);
      setSnackbarMessage('AI Diagnostic Snapshot copied to clipboard!');
      setSnackbarOpen(true);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };

  const handleDownloadMcpJson = () => {
    const data = {
      timestamp: Date.now(),
      prebidVersion: prebid?.version || 'unknown',
      isMcpActive,
      installedModules,
      config: prebid?.config || {},
      eids: prebid?.eids || [],
      eventsUrl: prebid?.eventsUrl,
      mcpBridgeVersion: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prebid-mcp-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper elevation={1} sx={{ p: 1.25, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <SmartToyIcon color="primary" sx={{ fontSize: '1.1rem' }} />
          <Typography variant="h3" sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Model Context Protocol (MCP) & AI Diagnostics
          </Typography>
        </Box>
        <Chip
          icon={isMcpActive ? <CheckCircleOutlineIcon /> : undefined}
          label={isMcpActive ? 'DevTools MCP Active' : 'MCP Standalone Inactive'}
          size="small"
          color={isMcpActive ? 'success' : 'default'}
          variant="outlined"
          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
        />
      </Box>

      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1.25 }}>
        Enables Chrome DevTools MCP (Prebid.js PR #15356) and autonomous AI coding agents (Gemini, Claude, Cursor) to query live auctions, bidder latency, and GAM targeting directly from the browser session.
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        <Tooltip title="Inject Prebid.js PR #15356 Standalone MCP Module onto the active page" arrow>
          <span>
            <Button size="small" variant="outlined" color="primary" onClick={handleInject} disabled={isMcpActive} startIcon={<PlayArrowIcon />} sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}>
              {isMcpActive ? 'MCP Module Injected' : 'Inject DevTools MCP Standalone'}
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Copy structured diagnostic snapshot formatted for AI Coding Agents (Markdown)" arrow>
          <Button size="small" variant="outlined" onClick={handleCopySnapshot} startIcon={<ContentCopyIcon />} sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}>
            Copy AI Diagnostic Snapshot
          </Button>
        </Tooltip>

        <Tooltip title="Download standardized MCP diagnostic telemetry as JSON" arrow>
          <Button size="small" variant="outlined" onClick={handleDownloadMcpJson} startIcon={<FileDownloadIcon />} sx={{ fontSize: '0.75rem', textTransform: 'none', fontWeight: 600, py: 0.25 }}>
            Export MCP JSON
          </Button>
        </Tooltip>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', fontSize: '0.8rem' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default McpToolsComponent;
