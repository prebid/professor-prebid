import React, { useContext } from 'react';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import { ExpandableTile } from './ExpandableTile';

const InstalledModulesComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { installedModules } = prebid;
  if (!installedModules?.length) return null;

  const moduleTypes = [
    { filter: 'BidAdapter', label: 'Bid Adapters' },
    { filter: 'AnalyticsAdapter', label: 'Analytics Adapters' },
    { filter: 'IdSystem', label: 'Id Systems' },
    { filter: 'RtdProvider', label: 'Rtd Providers' },
  ];

  const sorted = (filter: string) => installedModules.filter((m) => m.includes(filter)).sort();
  const others = installedModules.filter((m) => !moduleTypes.some((t) => m.includes(t.filter))).sort();

  return (
    <ExpandableTile icon={<BorderBottomIcon />} title="Installed Modules" subtitle="Adapters & ID Systems" defaultMaxWidth={4} expandedMaxWidth={8}>
      {moduleTypes.map((type) => (
        <RenderKeyValueComponent key={type.filter} label={type.label} value={sorted(type.filter)} columns={[12, 12]} expanded />
      ))}
      {others.length > 0 && <RenderKeyValueComponent label="Other Modules" value={others} columns={[12, 12]} expanded />}
    </ExpandableTile>
  );
};

export default InstalledModulesComponent;
