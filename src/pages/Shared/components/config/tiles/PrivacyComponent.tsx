import React, { useEffect, useContext } from 'react';
import BusinessIcon from '@mui/icons-material/Business';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import JSONViewerComponent from '../../JSONViewerComponent';
import { TCString } from '@iabtcf/core';
import { ChipRow, SectionLabel } from '../../Section';

const PrivacyComponent = (): JSX.Element | null => {
  const { prebid, tcf } = useContext(AppStateContext);

  const consentManagement = prebid?.config?.consentManagement;
  if (!consentManagement && !tcf) return null;

  const { gdpr, usp, gpp } = consentManagement || {};
  const coppa = prebid?.config?.coppa;
  const { cmpApi, defaultGdprScope, timeout, rules } = gdpr || {};

  return (
    <ExpandableTile icon={<BusinessIcon />} title="Consent Management" subtitle="TCF, CPA, USP, …" defaultMaxWidth={4} expandedMaxWidth={8} json={{ consentManagement, tcf, coppa }}>
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Frameworks & Scope</SectionLabel>
        <ChipRow sx={{ mb: 1.25 }}>
          {cmpApi && <Chip label={`CMP API: ${cmpApi}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />}
          {timeout !== undefined && <Chip label={`Timeout: ${timeout}ms`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          {defaultGdprScope !== undefined && (
            <Chip label={`Default GDPR Scope: ${String(defaultGdprScope)}`} size="small" color={defaultGdprScope ? 'warning' : 'default'} variant={defaultGdprScope ? 'filled' : 'outlined'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
          )}
          {usp && <Chip label={`USP CMP: ${usp.cmpApi || 'configured'}`} size="small" color="secondary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          {gpp && <Chip label={`GPP CMP: ${gpp.cmpApi || 'configured'}`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          {coppa !== undefined && <Chip label={`COPPA: ${coppa ? 'enabled' : 'disabled'}`} size="small" color={coppa ? 'warning' : 'default'} variant={coppa ? 'filled' : 'outlined'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
        </ChipRow>

        {/* GDPR Rules */}
        {rules && rules.length > 0 && (
          <Box sx={{ mb: 1.25 }}>
            <SectionLabel>GDPR Rules ({rules.length})</SectionLabel>
            <ChipRow>
              {rules.map((rule: any, index: number) => {
                const ruleText = typeof rule === 'object' ? JSON.stringify(rule) : String(rule);
                return <Chip key={`rule-${index}`} label={`Rule #${index + 1}: ${ruleText}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', maxWidth: '100%' }} />;
              })}
            </ChipRow>
          </Box>
        )}

        {/* TCF Component */}
        {tcf && Object.keys(tcf).map((key) => <TcfComponent key={key} tcf={tcf} tcfKey={key} />)}
      </Grid>
    </ExpandableTile>
  );
};

// TCModel keeps consents as bit vectors; list the ids that are set so they read as plain JSON.
const vectorIds = (vector: any): number[] => {
  const ids: number[] = [];
  vector?.forEach?.((isSet: boolean, id: number) => {
    if (isSet) ids.push(id);
  });
  return ids;
};

export const readableTcModel = (tcModel: any) => ({
  version: tcModel.version,
  cmpId: tcModel.cmpId,
  cmpVersion: tcModel.cmpVersion,
  consentScreen: tcModel.consentScreen,
  consentLanguage: tcModel.consentLanguage,
  vendorListVersion: tcModel.vendorListVersion,
  policyVersion: tcModel.policyVersion,
  isServiceSpecific: tcModel.isServiceSpecific,
  useNonStandardStacks: tcModel.useNonStandardStacks,
  publisherCountryCode: tcModel.publisherCountryCode,
  purposeOneTreatment: tcModel.purposeOneTreatment,
  created: tcModel.created?.toISOString?.() ?? tcModel.created,
  lastUpdated: tcModel.lastUpdated?.toISOString?.() ?? tcModel.lastUpdated,
  specialFeatureOptins: vectorIds(tcModel.specialFeatureOptins),
  purposeConsents: vectorIds(tcModel.purposeConsents),
  purposeLegitimateInterests: vectorIds(tcModel.purposeLegitimateInterests),
  vendorConsents: vectorIds(tcModel.vendorConsents),
  vendorLegitimateInterests: vectorIds(tcModel.vendorLegitimateInterests),
  vendorsDisclosed: vectorIds(tcModel.vendorsDisclosed),
  vendorsAllowed: vectorIds(tcModel.vendorsAllowed),
  publisherConsents: vectorIds(tcModel.publisherConsents),
  publisherLegitimateInterests: vectorIds(tcModel.publisherLegitimateInterests),
});

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
          <ChipRow>
            {decoded.cmpId !== undefined && <Chip label={`CMP ID: ${decoded.cmpId}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
            {decoded.cmpVersion !== undefined && <Chip label={`CMP Ver: ${decoded.cmpVersion}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
            {decoded.consentScreen !== undefined && <Chip label={`Screen: ${decoded.consentScreen}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
            {decoded.consentLanguage && <Chip label={`Lang: ${decoded.consentLanguage}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
          </ChipRow>
          <Box sx={{ mt: 0.5 }}>
            <JSONViewerComponent src={readableTcModel(decoded)} name="decoded" collapsed={1} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PrivacyComponent;
