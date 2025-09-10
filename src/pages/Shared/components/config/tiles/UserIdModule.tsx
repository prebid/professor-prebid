import React, { useContext } from 'react';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import AppStateContext from '../../../contexts/appStateContext';
import JSONViewerComponent from '../../JSONViewerComponent';
import { ExpandableTile } from './ExpandableTile';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

const UserIdModuleComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const {
    config: { userSync },
  } = prebid;
  if (!userSync) return null;

  return (
    <ExpandableTile icon={<ContactPageOutlinedIcon />} title="User IDs" subtitle={userSync.userIds?.length ? `${userSync.userIds.length} detected` : 'No UserIds detected'} expandedMaxWidth={12}>
      <Grid container>
        {userSync.userIds?.map((userId, index) => (
          <Grid size={{ xs: 12, sm: 6 }} key={index}>
            <Typography variant="body1">
              <strong>{userId.name}</strong> — {userId.storage?.type}
            </Typography>
            {userId.params && JSON.stringify(userId.params) !== '{}' && <JSONViewerComponent src={userId.params} name={''} collapsed={1} />}
          </Grid>
        ))}
      </Grid>
    </ExpandableTile>
  );
};

export default UserIdModuleComponent;
