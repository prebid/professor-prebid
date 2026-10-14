import React, { useContext } from 'react';
import ExtensionIcon from '@mui/icons-material/Extension';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';

const InstalledModulesComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { installedModules } = prebid;
  if (!installedModules?.length) return null;

  const moduleTypes = [
    { filter: 'BidAdapter', label: 'Bid Adapters', color: 'primary' as const },
    { filter: 'AnalyticsAdapter', label: 'Analytics Adapters', color: 'info' as const },
    { filter: 'IdSystem', label: 'ID Systems', color: 'secondary' as const },
    { filter: 'RtdProvider', label: 'RTD Providers', color: 'success' as const },
  ];

  const sorted = (filter: string) => installedModules.filter((m) => m.includes(filter)).sort();
  const others = installedModules.filter((m) => !moduleTypes.some((t) => m.includes(t.filter))).sort();

  return (
    <ExpandableTile icon={<ExtensionIcon />} title="Installed Modules" subtitle={`${installedModules.length} total modules`} defaultMaxWidth={4} expandedMaxWidth={8}>
      {moduleTypes.map((type) => {
        const modules = sorted(type.filter);
        if (!modules.length) return null;
        return (
          <Grid size={{ xs: 12 }} key={type.filter}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
              {type.label} ({modules.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              {modules.map((m) => (
                <Chip key={m} label={m.replace(type.filter, '') || m} size="small" variant="outlined" color={type.color} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
              ))}
            </Box>
          </Grid>
        );
      })}
      {others.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Other Modules ({others.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {others.map((m) => (
              <Chip
                key={m}
                label={m === 'devtoolsMcp' ? 'devtoolsMcp (AI MCP)' : m}
                size="small"
                variant={m === 'devtoolsMcp' ? 'filled' : 'outlined'}
                color={m === 'devtoolsMcp' ? 'success' : undefined}
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: m === 'devtoolsMcp' ? 600 : 400 }}
              />
            ))}
          </Box>
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default InstalledModulesComponent;
