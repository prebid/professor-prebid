import React, { useContext, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import TableRowsIcon from '@mui/icons-material/TableRows';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SecurityIcon from '@mui/icons-material/Security';

import InspectedPageContext from '../../contexts/inspectedPageContext';
import AppStateContext from '../../contexts/appStateContext';
import JSONViewerComponent from '../JSONViewerComponent';
import { GridCell } from '../bids/BidsComponent';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { createQueryEngine, distinct } from '../autocomplete/utils';
import { download, getTabId } from '../../utils';
import { preAuctionHarKey } from '../../constants';

import { classifyRequest, IClassifiedNetworkEntry, NetworkCategory } from './networkClassifier';
import { NetworkWaterfallView } from './NetworkWaterfallView';
import { NetworkCascadeView } from './NetworkCascadeView';
import { NetworkPrivacyAuditView } from './NetworkPrivacyAuditView';
import { NetworkDetailDrawer } from './NetworkDetailDrawer';
import { decompressPayload } from './payloadDecompressor';

export const NETWORK_FIELD_MAP = {
  category: (entry: IClassifiedNetworkEntry) => entry.category,
  bidder: (entry: IClassifiedNetworkEntry) => entry.providerName.toLowerCase(),
  status: (entry: IClassifiedNetworkEntry) => String(entry.entry.status),
  method: (entry: IClassifiedNetworkEntry) => entry.entry.method.toLowerCase(),
  domain: (entry: IClassifiedNetworkEntry) => entry.entry.host.toLowerCase(),
  privacy: (entry: IClassifiedNetworkEntry) => entry.privacy.verdict,
  url: (entry: IClassifiedNetworkEntry) => entry.entry.url.toLowerCase(),
} as const;

const networkQueryEngine = createQueryEngine<IClassifiedNetworkEntry>(NETWORK_FIELD_MAP);

const buildSearchSuggestions = (entries: IClassifiedNetworkEntry[]): string[] => {
  return distinct([
    'category:',
    'bidder:',
    'status:',
    'domain:',
    'privacy:',
    'category:bid',
    'category:sync',
    'category:userId',
    'category:rtd',
    'category:analytics',
    'category:gam',
    'privacy:valid',
    'privacy:missing',
    'privacy:warning',
    'status:200',
    'status:302',
    ...entries.map((e) => `bidder:${e.providerName.toLowerCase().replace(/\s+/g, '')}`),
    ...entries.map((e) => `domain:${e.entry.host}`),
  ]).sort();
};

const InitiatorComponent = (): JSX.Element => {
  const { harLog } = useContext(InspectedPageContext);
  const { tcf } = useContext(AppStateContext);
  const cmpConsentString = ((tcf as any)?.v2?.consentData || (tcf as any)?.v1?.consentData || (tcf as any)?.gdpr?.consentData?.tcString || '') as string;

  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<NetworkCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<number>(0);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<IClassifiedNetworkEntry | null>(null);
  const [decompressedMap, setDecompressedMap] = useState<Record<string, string>>({});

  React.useEffect(() => {
    let active = true;
    const rawList = harLog || [];
    const entriesToDecompress = rawList.filter((e: any) => e.postData?.text && decompressedMap[e.id] === undefined);

    if (entriesToDecompress.length > 0) {
      Promise.all(
        entriesToDecompress.map(async (e: any) => {
          const res = await decompressPayload(e.postData!.text!);
          return { id: e.id, text: res.text, isDecompressed: res.isDecompressed };
        })
      ).then((results) => {
        if (active) {
          const updates: Record<string, string> = {};
          results.forEach((r) => {
            if (r.isDecompressed) {
              updates[r.id] = r.text;
            } else {
              updates[r.id] = '';
            }
          });
          if (Object.keys(updates).length > 0) {
            setDecompressedMap((prev) => ({ ...prev, ...updates }));
          }
        }
      });
    }

    return () => {
      active = false;
    };
  }, [harLog, decompressedMap]);

  // Classify all incoming HAR entries
  const classifiedEntries: IClassifiedNetworkEntry[] = useMemo(() => {
    const rawList = harLog || [];
    return rawList.map((entry: any) => classifyRequest(entry, decompressedMap[entry.id], cmpConsentString));
  }, [harLog, decompressedMap, cmpConsentString]);

  // Counts by category
  const counts = useMemo(() => {
    const map: Record<NetworkCategory | 'all', number> = {
      all: classifiedEntries.length,
      bid: 0,
      sync: 0,
      userId: 0,
      rtd: 0,
      analytics: 0,
      gam: 0,
      other: 0,
    };
    classifiedEntries.forEach((c) => {
      map[c.category] = (map[c.category] || 0) + 1;
    });
    return map;
  }, [classifiedEntries]);

  // Autocomplete search suggestions
  const suggestions = useMemo(() => buildSearchSuggestions(classifiedEntries), [classifiedEntries]);

  // Query engine predicate
  const filterFn = useMemo(() => networkQueryEngine.runQuery(query), [query]);

  // Filtered entries based on Category chip & Search query
  const filteredEntries = useMemo(() => {
    let result = classifiedEntries;

    if (selectedCategory !== 'all') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    if (query.trim()) {
      result = result.filter(filterFn);
    }

    return result;
  }, [classifiedEntries, selectedCategory, query, filterFn]);

  const handleClearLog = () => {
    setSelectedEntry(null);
    getTabId().then((tabId) => {
      if (tabId !== undefined) chrome.storage?.session?.set({ [preAuctionHarKey(tabId)]: JSON.stringify([]) });
    });
  };

  const handleReloadPage = () => {
    chrome.devtools?.inspectedWindow?.reload({ ignoreCache: true });
  };

  const handleExportJson = () => {
    const dataToExport = filteredEntries.map((c) => c.entry);
    download(dataToExport, `network_log_${Date.now()}`);
  };

  return (
    <Box
      sx={{
        width: '100%',
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        height: 'calc(100vh - 48px)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Category Metric Badges Header */}
      <Grid container spacing={0.75} sx={{ width: '100%', flexShrink: 0 }}>
        <GridCell
          cols={2}
          variant="h2"
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            border: '1px solid',
            borderColor: selectedCategory === 'all' ? 'primary.main' : 'divider',
            backgroundColor: selectedCategory === 'all' ? 'action.selected' : 'background.paper',
            '&:hover': { borderColor: 'primary.main' },
          }}
          onClick={() => setSelectedCategory('all')}
        >
          <Tooltip title="View all captured network requests" arrow>
            <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCategory === 'all' ? 'primary.main' : 'text.secondary' }}>
              All: {counts.all}
            </Typography>
          </Tooltip>
        </GridCell>

        <GridCell
          cols={2}
          variant="h2"
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            border: '1px solid',
            borderColor: selectedCategory === 'bid' ? 'primary.main' : 'divider',
            backgroundColor: selectedCategory === 'bid' ? 'action.selected' : 'background.paper',
            '&:hover': { borderColor: 'primary.main' },
          }}
          onClick={() => setSelectedCategory(selectedCategory === 'bid' ? 'all' : 'bid')}
        >
          <Tooltip title="Filter by Bid Requests (OpenRTB, PBS, Bidders)" arrow>
            <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCategory === 'bid' ? 'primary.main' : 'text.secondary' }}>
              Bids: {counts.bid}
            </Typography>
          </Tooltip>
        </GridCell>

        <GridCell
          cols={2}
          variant="h2"
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            border: '1px solid',
            borderColor: selectedCategory === 'sync' ? 'primary.main' : 'divider',
            backgroundColor: selectedCategory === 'sync' ? 'action.selected' : 'background.paper',
            '&:hover': { borderColor: 'primary.main' },
          }}
          onClick={() => setSelectedCategory(selectedCategory === 'sync' ? 'all' : 'sync')}
        >
          <Tooltip title="Filter by SSP User Sync Pixels and ID Syncs" arrow>
            <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCategory === 'sync' ? 'primary.main' : 'text.secondary' }}>
              Syncs: {counts.sync}
            </Typography>
          </Tooltip>
        </GridCell>

        <GridCell
          cols={2}
          variant="h2"
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            border: '1px solid',
            borderColor: selectedCategory === 'userId' ? 'primary.main' : 'divider',
            backgroundColor: selectedCategory === 'userId' ? 'action.selected' : 'background.paper',
            '&:hover': { borderColor: 'primary.main' },
          }}
          onClick={() => setSelectedCategory(selectedCategory === 'userId' ? 'all' : 'userId')}
        >
          <Tooltip title="Filter by User ID Modules (ID5, LiveRamp, SharedID)" arrow>
            <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCategory === 'userId' ? 'primary.main' : 'text.secondary' }}>
              User IDs: {counts.userId}
            </Typography>
          </Tooltip>
        </GridCell>

        <GridCell
          cols={2}
          variant="h2"
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            border: '1px solid',
            borderColor: selectedCategory === 'rtd' ? 'primary.main' : 'divider',
            backgroundColor: selectedCategory === 'rtd' ? 'action.selected' : 'background.paper',
            '&:hover': { borderColor: 'primary.main' },
          }}
          onClick={() => setSelectedCategory(selectedCategory === 'rtd' ? 'all' : 'rtd')}
        >
          <Tooltip title="Filter by Real-Time Data (RTD) modules" arrow>
            <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCategory === 'rtd' ? 'primary.main' : 'text.secondary' }}>
              RTD: {counts.rtd}
            </Typography>
          </Tooltip>
        </GridCell>

        <GridCell
          cols={2}
          variant="h2"
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
            border: '1px solid',
            borderColor: selectedCategory === 'analytics' ? 'primary.main' : 'divider',
            backgroundColor: selectedCategory === 'analytics' ? 'action.selected' : 'background.paper',
            '&:hover': { borderColor: 'primary.main' },
          }}
          onClick={() => setSelectedCategory(selectedCategory === 'analytics' ? 'all' : 'analytics')}
        >
          <Tooltip title="Filter by Prebid Analytics Beacons" arrow>
            <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: selectedCategory === 'analytics' ? 'primary.main' : 'text.secondary' }}>
              Analytics: {counts.analytics}
            </Typography>
          </Tooltip>
        </GridCell>
      </Grid>

      {/* Toolbar: Search, View Mode Tabs, Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 0.5, flexShrink: 0 }}>
        {/* Search Bar */}
        <Box sx={{ flex: 1, minWidth: 260 }}>
          <AutoComplete query={query} onQueryChange={setQuery} options={suggestions} fieldKeys={['category', 'bidder', 'status', 'domain', 'privacy']} placeholder="Filter requests (e.g. bidder:rubicon category:sync privacy:valid)..." />
        </Box>

        {/* View Switcher Tabs */}
        <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 1.5, fontSize: '0.75rem' } }}>
          <Tab icon={<TableRowsIcon fontSize="small" />} iconPosition="start" label="Waterfall" />
          <Tab icon={<AccountTreeIcon fontSize="small" />} iconPosition="start" label="Initiator Cascade" />
          <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="Privacy Audit" />
        </Tabs>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Reload Inspected Page" arrow>
            <IconButton size="small" onClick={handleReloadPage} color="default">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Filtered Network Requests as JSON" arrow>
            <IconButton size="small" onClick={handleExportJson} color="default">
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={showRawJson ? 'Switch to Table view' : 'Switch to Raw JSON view'} arrow>
            <IconButton size="small" onClick={() => setShowRawJson(!showRawJson)} color={showRawJson ? 'primary' : 'default'}>
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear Captured Network Log" arrow>
            <IconButton size="small" onClick={handleClearLog} color="default">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main View Area */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {showRawJson ? (
          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, p: 1.5, overflowY: 'auto' }}>
            <JSONViewerComponent src={filteredEntries.map((c) => c.entry)} collapsed={2} />
          </Paper>
        ) : classifiedEntries.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', my: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              No Network Activity Recorded Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 2 }}>
              Network traffic is captured automatically while DevTools is open. Reload the inspected page to capture ad auctions, bid requests, user syncs, and privacy signals.
            </Typography>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleReloadPage}>
              Reload Page
            </Button>
          </Paper>
        ) : viewMode === 0 ? (
          <NetworkWaterfallView entries={filteredEntries} selectedEntry={selectedEntry} onSelectEntry={setSelectedEntry} />
        ) : viewMode === 1 ? (
          <NetworkCascadeView entries={filteredEntries} selectedEntry={selectedEntry} onSelectEntry={setSelectedEntry} />
        ) : (
          <NetworkPrivacyAuditView entries={filteredEntries} selectedEntry={selectedEntry} onSelectEntry={setSelectedEntry} />
        )}
      </Box>

      {/* Detail Inspection Drawer */}
      <NetworkDetailDrawer selectedEntry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </Box>
  );
};

export default InitiatorComponent;
