import React, { useContext } from 'react';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import { ExpandableTile } from './ExpandableTile';

const InstalledModulesComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { installedModules } = prebid;
  if (!installedModules?.length) return null;

  const sorted = (filter: string) => installedModules.filter((m) => m.includes(filter)).sort();

  return (
    <ExpandableTile icon={<BorderBottomIcon />} title="Installed Modules" subtitle="Adapters & ID Systems">
      <RenderKeyValueComponent label="Bid Adapters" value={sorted('BidAdapter')} columns={[12, 12]} expanded />
      <RenderKeyValueComponent label="Analytics Adapters" value={sorted('AnalyticsAdapter')} columns={[12, 12]} expanded />
      <RenderKeyValueComponent label="Id Systems" value={sorted('IdSystem')} columns={[12, 12]} expanded />
    </ExpandableTile>
  );
};

export default InstalledModulesComponent;
