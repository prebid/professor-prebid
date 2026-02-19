import React, { useContext } from 'react';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import { ExpandableTile } from './ExpandableTile';

const FloorsModuleComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { floors } = prebid.config;
  if (!floors) return null;

  return (
    <ExpandableTile icon={<BorderBottomIcon />} title="Floors Module" subtitle="Dynamic Floors" defaultMaxWidth={4} expandedMaxWidth={8}>
      {Object.entries(floors).map(([key, value], i) => (
        <RenderKeyValueComponent key={i} label={key} value={value} columns={[4, 12]} expanded />
      ))}
    </ExpandableTile>
  );
};

export default FloorsModuleComponent;
