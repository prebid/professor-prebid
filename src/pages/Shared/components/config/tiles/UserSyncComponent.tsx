import React, { useContext } from 'react';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const UserSyncComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { config } = prebid || {};

  if (!config?.userSync) return null;
  const userSync = config.userSync as Record<string, any>;

  const { syncEnabled, iframeEnabled, pixelEnabled, aliasSyncEnabled, auctionDelay, syncDelay, syncsPerBidder, filterSettings } = userSync;

  const activeSyncTypes = [
    { label: 'iframe', enabled: iframeEnabled },
    { label: 'pixel', enabled: pixelEnabled },
    { label: 'aliasSync', enabled: aliasSyncEnabled },
    { label: 'syncEnabled', enabled: syncEnabled },
  ].filter((item) => item.enabled !== undefined);

  const filterRules = (filterSettings || {}) as Record<string, any>;
  const filterKeys = Object.keys(filterRules);

  return (
    <ExpandableTile icon={<PeopleOutlinedIcon />} title="User Sync" subtitle={syncEnabled === false ? 'Syncing disabled' : 'User sync rules'} defaultMaxWidth={4} expandedMaxWidth={8} json={userSync}>
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Sync Modes</SectionLabel>
        <ChipRow sx={{ mb: 1.25 }}>
          {activeSyncTypes.map((item) => (
            <Chip
              key={item.label}
              label={`${item.label}: ${item.enabled ? 'enabled' : 'disabled'}`}
              size="small"
              color={item.enabled ? 'success' : 'default'}
              variant={item.enabled ? 'filled' : 'outlined'}
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
            />
          ))}
        </ChipRow>

        {/* Delays & Constraints */}
        {(auctionDelay !== undefined || syncDelay !== undefined || syncsPerBidder !== undefined) && (
          <Box sx={{ mb: 1.25 }}>
            <SectionLabel>Delays & Limits</SectionLabel>
            <ChipRow>
              {auctionDelay !== undefined && <Chip label={`Auction Delay: ${auctionDelay}ms`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
              {syncDelay !== undefined && <Chip label={`Sync Delay: ${syncDelay}ms`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
              {syncsPerBidder !== undefined && <Chip label={`Syncs / Bidder: ${syncsPerBidder}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            </ChipRow>
          </Box>
        )}

        {/* Filter Settings Rules */}
        {filterKeys.length > 0 && (
          <Box>
            <SectionLabel>Filter Rules ({filterKeys.length})</SectionLabel>
            <ChipRow>
              {filterKeys.map((key) => {
                const rule = filterRules[key] || {};
                const biddersStr = Array.isArray(rule.bidders) ? rule.bidders.join(', ') : String(rule.bidders || '*');
                return (
                  <Chip
                    key={key}
                    label={
                      <>
                        <strong>{key}: </strong>
                        {rule.filter || 'include'} (bidders: {biddersStr})
                      </>
                    }
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', maxWidth: '100%' }}
                  />
                );
              })}
            </ChipRow>
          </Box>
        )}
      </Grid>
    </ExpandableTile>
  );
};

export default UserSyncComponent;
