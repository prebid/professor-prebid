import React, { useContext } from 'react';
import ExtensionIcon from '@mui/icons-material/Extension';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const InstalledModulesComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { installedModules } = prebid || {};
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
            <SectionLabel>
              {type.label} ({modules.length})
            </SectionLabel>
            <ChipRow sx={{ mb: 1.5 }}>
              {modules.map((m) => (
                <Chip key={m} label={m.replace(type.filter, '') || m} size="small" variant="outlined" color={type.color} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
              ))}
            </ChipRow>
          </Grid>
        );
      })}
      {others.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <SectionLabel>Other Modules ({others.length})</SectionLabel>
          <ChipRow>
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
          </ChipRow>
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default InstalledModulesComponent;
