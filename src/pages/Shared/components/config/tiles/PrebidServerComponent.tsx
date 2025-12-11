import React, { useContext } from 'react';
import DnsIcon from '@mui/icons-material/Dns';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import { ExpandableTile } from './ExpandableTile';
import { Config } from 'prebid.js';

const RenderPrebidServerComponent = ({ s2sConfig }: { s2sConfig: Config['s2sConfig'] }) => (
  <ExpandableTile icon={<DnsIcon />} title="Prebid Server" subtitle="Server Config" expandedMaxWidth={8}>
    {Object.entries(s2sConfig).map(([key, value], i) => (
      <RenderKeyValueComponent key={i} label={key} value={value} columns={[4, 12]} expanded />
    ))}
  </ExpandableTile>
);

const PrebidServerComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { s2sConfig } = prebid.config;
  if (!s2sConfig) return null;
  return <>{Array.isArray(s2sConfig) ? s2sConfig.map((config, i) => <RenderPrebidServerComponent s2sConfig={config} key={i} />) : <RenderPrebidServerComponent s2sConfig={s2sConfig} />}</>;
};

export default PrebidServerComponent;
