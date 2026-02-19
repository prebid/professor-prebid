import React, { useEffect, useContext } from 'react';
import BusinessIcon from '@mui/icons-material/Business';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import { ExpandableTile } from './ExpandableTile';
import { TCString } from '@iabtcf/core';

const PrivacyComponent = (): JSX.Element | null => {
  const { prebid, tcf } = useContext(AppStateContext);
  const { consentManagement } = prebid.config;
  if (!consentManagement) return null;

  const { gdpr, usp } = consentManagement;
  const { cmpApi, defaultGdprScope, timeout } = gdpr || {};

  return (
    <ExpandableTile icon={<BusinessIcon />} title="Consent Management" subtitle="TCF, CPA, USP, …" defaultMaxWidth={4} expandedMaxWidth={12}>
      {/* <RenderKeyValueComponent label="Allow Auction Without Consent" value={allowAuctionWithoutConsent || gdpr?.allowAuctionWithoutConsent} columns={[4, 12]} expanded /> */}
      <RenderKeyValueComponent label="CMP API" value={cmpApi} columns={[4, 12]} expanded />
      <RenderKeyValueComponent label="Timeout" value={timeout} columns={[4, 12]} expanded />
      <RenderKeyValueComponent label="Default GDPR Scope" value={defaultGdprScope} columns={[4, 12]} expanded />
      {gdpr?.rules?.map((rule, index) => (
        <RenderKeyValueComponent key={index} label={`Rule #${index + 1}`} value={rule} columns={[4, 12]} expanded />
      ))}
      {tcf && Object.keys(tcf).map((key, index) => <TcfComponent key={index} tcf={tcf} tcfKey={key} />)}
    </ExpandableTile>
  );
};

const TcfComponent = ({ tcf, tcfKey }: { tcf: any; tcfKey: string }): JSX.Element => {
  const [decoded, setDecoded] = React.useState({});
  useEffect(() => {
    try {
      setDecoded(TCString.decode(tcf[tcfKey]?.consentData || '', null));
    } catch {}
  }, [tcf, tcfKey]);

  return (
    <>
      <RenderKeyValueComponent label="TCF Version" value={tcfKey} columns={[4, 12]} expanded />
      <RenderKeyValueComponent label="Consent Data" value={tcf[tcfKey]?.consentData || 'no consent string'} columns={[4, 12]} expanded />
      <RenderKeyValueComponent label="Decoded Consent String" value={decoded} columns={[4, 12]} expanded />
    </>
  );
};

export default PrivacyComponent;
