import React, { useContext } from 'react';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import { ExpandableTile } from './ExpandableTile';

const UserSyncComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { config } = prebid;
  if (!config?.userSync) return null;

  return (
    <ExpandableTile icon={<PeopleOutlinedIcon />} title="User Sync" subtitle="User sync configuration" defaultMaxWidth={4} expandedMaxWidth={8}>
      <RenderKeyValueComponent label="User Sync" value={config.userSync} columns={[12, 12]} expanded />
    </ExpandableTile>
  );
};

export default UserSyncComponent;
