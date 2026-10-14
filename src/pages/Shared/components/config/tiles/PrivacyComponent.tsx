import React, { useEffect, useContext, useState } from 'react';
import BusinessIcon from '@mui/icons-material/Business';
import CodeIcon from '@mui/icons-material/Code';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import JSONViewerComponent from '../../JSONViewerComponent';
import { TCString } from '@iabtcf/core';

const PrivacyComponent = (): JSX.Element | null => {
  const { prebid, tcf } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);

  const consentManagement = prebid?.config?.consentManagement;
  if (!consentManagement && !tcf) return null;

  const { gdpr, usp, gpp } = consentManagement || {};
  const coppa = prebid?.config?.coppa;
  const { cmpApi, defaultGdprScope, timeout, rules } = gdpr || {};

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <ExpandableTile icon={<BusinessIcon />} title="Consent Management" subtitle="TCF, CPA, USP, …" defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={{ consentManagement, tcf, coppa }} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          {}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Frameworks & Scope
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
            {cmpApi && <Chip label={`CMP API: ${cmpApi}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />}
            {timeout !== undefined && <Chip label={`Timeout: ${timeout}ms`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            {defaultGdprScope !== undefined && (
              <Chip label={`Default GDPR Scope: ${String(defaultGdprScope)}`} size="small" color={defaultGdprScope ? 'warning' : 'default'} variant={defaultGdprScope ? 'filled' : 'outlined'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
            )}
            {usp && <Chip label={`USP CMP: ${usp.cmpApi || 'configured'}`} size="small" color="secondary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            {gpp && <Chip label={`GPP CMP: ${gpp.cmpApi || 'configured'}`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            {coppa !== undefined && <Chip label={`COPPA: ${coppa ? 'enabled' : 'disabled'}`} size="small" color={coppa ? 'warning' : 'default'} variant={coppa ? 'filled' : 'outlined'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          </Box>

          {/* GDPR Rules */}
          {rules && rules.length > 0 && (
            <Box sx={{ mb: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                GDPR Rules ({rules.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {rules.map((rule: any, index: number) => {
                  const ruleText = typeof rule === 'object' ? JSON.stringify(rule) : String(rule);
                  return <Chip key={`rule-${index}`} label={`Rule #${index + 1}: ${ruleText}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', maxWidth: '100%' }} />;
                })}
              </Box>
            </Box>
          )}

          {/* TCF Component */}
          {tcf && Object.keys(tcf).map((key) => <TcfComponent key={key} tcf={tcf} tcfKey={key} />)}
        </Grid>
      )}
    </ExpandableTile>
  );
};

const TcfComponent = ({ tcf, tcfKey }: { tcf: any; tcfKey: string }): JSX.Element => {
  const [decoded, setDecoded] = React.useState<any>({});
  useEffect(() => {
    try {
      setDecoded(TCString.decode(tcf[tcfKey]?.consentData || '', null));
    } catch {}
  }, [tcf, tcfKey]);

  const consentData = tcf[tcfKey]?.consentData || 'no consent string';

  return (
    <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75, flexWrap: 'wrap' }}>
        <Chip label={`TCF Version: ${tcfKey}`} size="small" color="primary" sx={{ height: 20, fontSize: '0.675rem', fontWeight: 600 }} />
        <Chip label={consentData !== 'no consent string' ? 'Consent String Present' : 'No Consent String'} size="small" color={consentData !== 'no consent string' ? 'success' : 'default'} variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />
      </Box>

      {consentData && (
        <Typography variant="body2" sx={{ fontSize: '0.7rem', wordBreak: 'break-all', mb: 0.75, color: 'text.secondary', fontFamily: 'monospace' }}>
          {consentData}
        </Typography>
      )}

      {decoded && Object.keys(decoded).length > 0 && (
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>
            Decoded Consent:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {decoded.cmpId !== undefined && <Chip label={`CMP ID: ${decoded.cmpId}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
            {decoded.cmpVersion !== undefined && <Chip label={`CMP Ver: ${decoded.cmpVersion}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
            {decoded.consentScreen !== undefined && <Chip label={`Screen: ${decoded.consentScreen}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
            {decoded.consentLanguage && <Chip label={`Lang: ${decoded.consentLanguage}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PrivacyComponent;
