import React, { useContext, useState, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import AppStateContext from '../../contexts/appStateContext';
import UserIdsTab from './UserIdsTab';
import ConfigTab from './UserIdsConfigTab';
import JSONViewerComponent from '../JSONViewerComponent';
import { JsonViewToggle } from '../JsonViewToggle';
import { DownloadButton } from '../DownloadButton';
import { TabToolbar } from '../TabToolbar';

const UserIdsComponent = (): JSX.Element => {
  const { prebid } = useContext(AppStateContext);
  const [tab, setTab] = useState<number>(0);
  const [query, setQuery] = useState<string>('');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const eidsCount = prebid?.eids?.length || 0;
  const modulesCount = prebid?.config?.userSync?.userIds?.length || 0;

  const options = useMemo(() => {
    const setOptions = new Set<string>();
    ['source:', 'id:', 'name:', 'storage:'].forEach((k) => setOptions.add(k));
    (prebid?.eids || []).forEach((e: any) => {
      if (e?.source) setOptions.add(`source:${e.source}`);
      (e?.uids || []).forEach((u: any) => {
        if (u?.id) setOptions.add(`id:${u.id}`);
      });
    });
    ((prebid?.config?.userSync as any)?.userIds || []).forEach((m: any) => {
      if (m?.name) setOptions.add(`name:${m.name}`);
      // The Modules tab matches storage names under `storage:`, not `name:` (USER_ID_MODULE_FIELD_MAP).
      if (m?.storage?.name) setOptions.add(`storage:${m.storage.name}`);
    });
    return Array.from(setOptions).sort();
  }, [prebid]);

  return (
    <Grid container sx={{ width: '100%' }}>
      <TabToolbar
        stats={[
          { label: `User IDs: ${eidsCount}`, onClick: () => setTab(0), selected: tab === 0, tooltip: 'View Active User IDs (EIDs)' },
          { label: `Modules: ${modulesCount}`, onClick: () => setTab(1), selected: tab === 1, tooltip: 'View User ID Module Configuration' },
        ]}
        search={{ query, onQueryChange: setQuery, options, fieldKeys: ['source', 'id', 'name', 'storage'], placeholder: 'Filter by source, ID or module name...' }}
        actions={
          <>
            <JsonViewToggle active={showRawJson} onToggle={() => setShowRawJson(!showRawJson)} formattedView="list view" toolbar />
            <DownloadButton data={() => ({ eids: prebid?.eids, userSync: prebid?.config?.userSync })} fileName="prebid-user-ids.json" tooltip="Download User ID session data as JSON" />
          </>
        }
      />

      {/* Raw JSON Overlay */}
      {showRawJson && (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 1.25 }}>
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
