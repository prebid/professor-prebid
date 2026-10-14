import React, { useContext, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import AppStateContext from '../../contexts/appStateContext';
import JSONViewerComponent from '../JSONViewerComponent';
import { createQueryEngine } from '../autocomplete/utils';

export const USER_ID_MODULE_FIELD_MAP = {
  name: (m: any) => m?.name,
  storage: (m: any) => [m?.storage?.name, m?.storage?.type].filter(Boolean).join(' '),
  bidder: (m: any) => (m?.bidders || []).join(' '),
} as const;

const userIdModuleQueryEngine = createQueryEngine<any>(USER_ID_MODULE_FIELD_MAP);

const ConfigTab = ({ searchQuery = '' }: { searchQuery?: string }): JSX.Element => {
  const { prebid } = useContext(AppStateContext);

  const modules = prebid?.config?.userSync?.userIds || [];
  const filterFn = useMemo(() => userIdModuleQueryEngine.runQuery(searchQuery), [searchQuery]);
  const filteredModules = useMemo(() => modules.filter((m) => m && filterFn(m)), [modules, filterFn]);

  if (!filteredModules || filteredModules.length === 0) {
    return (
      <Grid size={{ xs: 12 }}>
        <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery ? `No User ID modules match "${searchQuery}"` : 'No User ID module configuration found in pbjs.setConfig({ userSync })'}
          </Typography>
        </Box>
      </Grid>
    );
  }

  return (
    <Grid container spacing={0.75} sx={{ width: '100%' }}>
      {filteredModules.map((userId, index) => {
        const bidders = userId?.bidders || [];
        const params = userId?.params;

        return (
          <Grid key={userId?.name || index} size={{ xs: 12 }}>
            <Card elevation={1} sx={{ border: '1px solid', borderColor: 'divider', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 2 } }}>
              <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                {}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon color="primary" sx={{ fontSize: '1.2rem' }} />
                    <Typography variant="h3" sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      {userId?.name || 'Unnamed Module'}
                    </Typography>
                    <Chip label="User ID Module" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    {userId?.storage?.type && <Chip icon={<StorageIcon sx={{ fontSize: '0.75rem !important' }} />} label={`type: ${userId.storage.type}`} size="small" color="info" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 600 }} />}

                    {userId?.storage?.name && <Chip label={`key: ${userId.storage.name}`} size="small" color="secondary" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 600 }} />}

                    {userId?.storage?.expires !== undefined && <Chip label={`expires: ${userId.storage.expires}d`} size="small" color="default" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 600 }} />}
                  </Box>
                </Box>

                {/* Target Bidders Chips */}
                {bidders.length > 0 && (
                  <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Allowed Bidders:
                    </Typography>
                    {bidders.map((b) => (
                      <Chip key={b} label={b} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    ))}
                  </Box>
                )}

                {/* Module Parameters JSON Viewer */}
                {params && Object.keys(params).length > 0 && (
                  <Box sx={{ mt: 0.75, pt: 0.75, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
                      Module Parameters (params):
                    </Typography>
                    <JSONViewerComponent src={params} name={false} collapsed={1} displayObjectSize={false} displayDataTypes={false} style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ConfigTab;
