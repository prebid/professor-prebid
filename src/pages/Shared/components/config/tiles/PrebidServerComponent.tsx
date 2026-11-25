import React, { useContext } from 'react';
import DnsIcon from '@mui/icons-material/Dns';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { Config } from 'prebid.js';
import { ChipRow, SectionLabel } from '../../Section';

interface RenderPrebidServerComponentProps {
  s2sConfig: Config['s2sConfig'] & Record<string, any>;
  index?: number;
}

const RenderPrebidServerComponent = ({ s2sConfig, index }: RenderPrebidServerComponentProps): JSX.Element => {
  const { accountId, endpoint, defaultVendor, adapter, timeout, bidders, syncUrl, ...otherProps } = s2sConfig;
  const biddersList: string[] = Array.isArray(bidders) ? bidders : bidders ? [String(bidders)] : [];
  const otherEntries = Object.entries(otherProps).filter(([, val]) => val !== undefined && val !== null);

  const subtitle = accountId ? `Account: ${accountId}` : endpoint ? `Endpoint: ${typeof endpoint === 'string' ? endpoint.replace(/^https?:\/\//, '') : 'Configured'}` : 'Server Config';

  return (
    <ExpandableTile icon={<DnsIcon />} title={index !== undefined ? `Prebid Server #${index + 1}` : 'Prebid Server'} subtitle={subtitle} defaultMaxWidth={4} expandedMaxWidth={8} json={s2sConfig}>
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Connection & Account</SectionLabel>
        <ChipRow sx={{ mb: 1.25 }}>
          {accountId && <Chip label={`Account ID: ${accountId}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />}
          {endpoint && <Chip label={`Endpoint: ${typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint)}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500, maxWidth: '100%' }} />}
          {timeout !== undefined && <Chip label={`Timeout: ${timeout}ms`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          {adapter && <Chip label={`Adapter: ${adapter}`} size="small" color="secondary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          {defaultVendor && <Chip label={`Vendor: ${defaultVendor}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          {syncUrl && <Chip label={`Sync URL: ${typeof syncUrl === 'string' ? syncUrl : 'Custom'}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
        </ChipRow>

        {biddersList.length > 0 && (
          <Box sx={{ mb: 1.25 }}>
            <SectionLabel>Server Bidders ({biddersList.length})</SectionLabel>
            <ChipRow>
              {biddersList.map((bidder) => (
                <Chip key={bidder} label={bidder} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
              ))}
            </ChipRow>
          </Box>
        )}

        {otherEntries.length > 0 && (
          <Box>
            <SectionLabel>Additional Settings</SectionLabel>
            <ChipRow>
              {otherEntries.map(([key, val]) => (
                <Chip key={key} label={`${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
              ))}
            </ChipRow>
          </Box>
        )}
      </Grid>
    </ExpandableTile>
  );
};

const PrebidServerComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const s2sConfig = prebid?.config?.s2sConfig;
  if (!s2sConfig) return null;

  return (
    <>
      {Array.isArray(s2sConfig) ? (
        s2sConfig.map((config, i) => <RenderPrebidServerComponent s2sConfig={config} index={s2sConfig.length > 1 ? i : undefined} key={(config as any).accountId || (config as any).endpoint || i} />)
      ) : (
        <RenderPrebidServerComponent s2sConfig={s2sConfig as any} />
      )}
    </>
  );
};

export default PrebidServerComponent;
