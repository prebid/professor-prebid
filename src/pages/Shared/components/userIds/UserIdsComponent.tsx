import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AppStateContext from '../../contexts/appStateContext';
import UserIdsTab from './UserIdsTab';
import ConfigTab from './UserIdsConfigTab';

const UserIdsComponent = (): JSX.Element => {
  const { prebid } = useContext(AppStateContext);
  const [tab, setTab] = React.useState(0);
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };
  if (prebid.eids && prebid.eids[0]) {
    return (
      <Grid container justifyContent="space-between">
        <Grid size={{ xs: 12 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{
              minHeight: 0,
              '& > div > div > button': { minHeight: 0 },
              '& > div  > span': { display: 'none' },
            }}
          >
            <Tab
              sx={{ p: 0, justifyContent: 'flex-start' }}
              label={
                <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: tab === 0 ? 'primary.main' : 'transparent' }}>
                  User Ids
                </Typography>
              }
            />
            <Tab
              sx={{ p: 0, justifyContent: 'flex-start' }}
              label={
                <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: tab === 1 ? 'primary.main' : 'transparent' }}>
                  Config
                </Typography>
              }
            />
          </Tabs>
        </Grid>

        {tab === 0 && <UserIdsTab />}

        {tab === 1 && <ConfigTab />}
      </Grid>
    );
  } else {
    return (
      <Grid container justifyContent="space-evenly">
        <Grid sx={{ p: 1 }}>
          <Paper elevation={1}>
            <Typography variant="h1" sx={{ p: 1 }}>
              No User IDs detected
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }
};

export default UserIdsComponent;
