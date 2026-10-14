import React, { useContext, useState, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import AppStateContext from '../../contexts/appStateContext';
import UserIdsTab from './UserIdsTab';
import ConfigTab from './UserIdsConfigTab';
import { GridCell } from '../bids/BidsComponent';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { download } from '../../utils';
import JSONViewerComponent from '../JSONViewerComponent';

const UserIdsComponent = (): JSX.Element => {
  const { prebid } = useContext(AppStateContext);
  const [tab, setTab] = useState<number>(0);
  const [query, setQuery] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const eidsCount = prebid?.eids?.length || 0;
  const modulesCount = prebid?.config?.userSync?.userIds?.length || 0;

  const options = useMemo(() => {
    const setOptions = new Set<string>();
    ['source:', 'id:', 'name:'].forEach((k) => setOptions.add(k));
    (prebid?.eids || []).forEach((e: any) => {
      if (e?.source) setOptions.add(`source:${e.source}`);
      (e?.uids || []).forEach((u: any) => {
        if (u?.id) setOptions.add(`id:${u.id}`);
      });
    });
    ((prebid?.config?.userSync as any)?.userIds || []).forEach((m: any) => {
      if (m?.name) setOptions.add(`name:${m.name}`);
      if (m?.storage?.name) setOptions.add(`name:${m.storage.name}`);
    });
    return Array.from(setOptions).sort();
  }, [prebid]);

  return (
    <Grid container spacing={0.75} sx={{ width: '100%', p: 0.5 }}>
      {/* Header Row aligned with AdUnits and Bids tabs */}
      <GridCell
        cols={2}
        variant="h2"
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
          border: '1px solid',
          borderColor: tab === 0 ? 'primary.main' : 'divider',
          backgroundColor: tab === 0 ? 'action.selected' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': { borderColor: 'primary.main' },
        }}
        onClick={() => setTab(0)}
      >
        <Tooltip title="View Active User IDs (EIDs)" arrow>
          <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: tab === 0 ? 'primary.main' : 'text.secondary' }}>
            User IDs: {eidsCount}
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
          borderColor: tab === 1 ? 'primary.main' : 'divider',
          backgroundColor: tab === 1 ? 'action.selected' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': { borderColor: 'primary.main' },
        }}
        onClick={() => setTab(1)}
      >
        <Tooltip title="View User ID Module Configuration" arrow>
          <Typography variant="h2" component="span" sx={{ fontSize: '0.8rem', fontWeight: 700, color: tab === 1 ? 'primary.main' : 'text.secondary' }}>
            Modules: {modulesCount}
          </Typography>
        </Tooltip>
      </GridCell>

      <Grid size={{ xs: 7 }} sx={{ display: 'flex', alignItems: 'center', border: 0, '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
        <AutoComplete query={query} onQueryChange={setQuery} options={options} fieldKeys={['source', 'id', 'name']} placeholder="Filter by source, ID or module name..." />
      </Grid>

      <GridCell cols={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', border: 0 }}>
        <Tooltip title={showRawJson ? 'Switch to list view' : 'Switch to raw JSON view'} arrow>
          <IconButton size="small" onClick={() => setShowRawJson(!showRawJson)} color={showRawJson ? 'primary' : 'default'} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
            <CodeIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download User ID session data as JSON" arrow>
          <IconButton size="small" onClick={() => download({ eids: prebid?.eids, userSync: prebid?.config?.userSync }, 'prebid-user-ids.json')} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
            <DownloadIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </GridCell>

      {/* Raw JSON Overlay */}
      {showRawJson && (
        <Grid size={{ xs: 12 }}>
          <Paper elevation={1} sx={{ p: 1.25, border: '1px solid', borderColor: 'primary.main' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Raw User ID Data Object:
            </Typography>
            <JSONViewerComponent src={{ eids: prebid?.eids, userSyncConfig: prebid?.config?.userSync }} name={false} collapsed={1} displayObjectSize={false} displayDataTypes={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} />
          </Paper>
        </Grid>
      )}

      {/* Tab Panels - Controlled by Grid container spacing */}
      {!showRawJson && (
        <Grid size={{ xs: 12 }}>
          {tab === 0 && <UserIdsTab searchQuery={query} />}
          {tab === 1 && <ConfigTab searchQuery={query} />}
        </Grid>
      )}
    </Grid>
  );
};

export default UserIdsComponent;
