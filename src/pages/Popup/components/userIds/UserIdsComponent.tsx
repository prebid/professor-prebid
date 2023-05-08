import { IPrebidDetails } from '../../../Content/scripts/prebid';
import React from 'react';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../Shared/components/JSONViewerComponent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <Box role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Typography component="div">{children}</Typography>}
    </Box>
  );
};

const UserIdsComponent = ({ prebid }: IUserIdsComponentProps): JSX.Element => {
  const [value, setValue] = React.useState(0);
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  if (prebid.eids && prebid.eids[0]) {
    return (
      <React.Fragment>
        <Grid container direction="row" justifyContent="space-between" spacing={0.25} sx={{ p: 1 }}>
          <Grid item xs={12}>
            <Tabs
              value={value}
              onChange={handleChange}
              sx={{
                minHeight: 0,
                '& > div > div > button': { minHeight: 0 },
                '& > div  > span': { display: 'none' },
              }}
            >
              <Tab
                sx={{ p: 0, justifyContent: 'flex-start' }}
                label={
                  <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: value === 0 ? 'primary.main' : 'transparent' }}>
                    User Ids
                  </Typography>
                }
              />
              <Tab
                sx={{ p: 0, justifyContent: 'flex-start' }}
                label={
                  <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: value === 1 ? 'primary.main' : 'transparent' }}>
                    Config
                  </Typography>
                }
              />
            </Tabs>
          </Grid>

          {value === 0 && (
            <React.Fragment>
              <Grid item xs={4}>
                <TabPanel value={value} index={0}>
                  <Paper sx={{ p: 0.5 }}>
                    <Typography variant="h3">Source</Typography>
                  </Paper>
                </TabPanel>
              </Grid>
              <Grid item xs={4}>
                <TabPanel value={value} index={0}>
                  <Paper sx={{ p: 0.5 }}>
                    <Typography variant="h3">User ID</Typography>
                  </Paper>
                </TabPanel>
              </Grid>
              <Grid item xs={4}>
                <TabPanel value={value} index={0}>
                  <Paper sx={{ p: 0.5 }}>
                    <Typography variant="h3">Atype</Typography>
                  </Paper>
                </TabPanel>
              </Grid>

              {prebid.eids?.map((eid, i) => {
                return eid.uids.map((uid, index) => {
                  return (
                    <React.Fragment key={`${i}:${index}`}>
                      <Grid item xs={4}>
                        <Paper sx={{ height: 1 }}>
                          <Typography variant="body1" sx={{ p: 0.5 }}>
                            <strong>{eid.source}</strong>
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ height: 1 }}>
                          <Typography variant="body1" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', p: 0.5 }}>
                            {uid.id}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ height: 1 }}>
                          <Typography variant="body1" sx={{ p: 0.5 }}>
                            {uid.atype}
                          </Typography>
                        </Paper>
                      </Grid>
                    </React.Fragment>
                  );
                });
              })}
            </React.Fragment>
          )}

          {value === 1 && prebid.config?.userSync?.userIds && prebid.config?.userSync?.userIds[0] && (
            <React.Fragment>
              <Grid item xs={3}>
                <TabPanel value={value} index={1}>
                  <Paper sx={{ p: 0.5 }}>
                    <Typography variant="h3">Name</Typography>
                  </Paper>
                </TabPanel>
              </Grid>
              <Grid item xs={2}>
                <TabPanel value={value} index={1}>
                  <Paper sx={{ p: 0.5 }}>
                    <Typography variant="h3">Storage Type</Typography>
                  </Paper>
                </TabPanel>
              </Grid>
              <Grid item xs={2}>
                <TabPanel value={value} index={1}>
                  <Paper sx={{ p: 0.5 }}>
                    <Typography variant="h3">Storage Expires</Typography>
                  </Paper>
                </TabPanel>
              </Grid>
              <Grid item xs={2}>
                <TabPanel value={value} index={1}>
                  <Paper sx={{ p: 0.5 }}>
                    <Typography variant="h3">Storage Name</Typography>
                  </Paper>
                </TabPanel>
              </Grid>
              <Grid item xs={3}>
                <TabPanel value={value} index={1}>
                  <Paper sx={{ p: 0.5 }}>
                    <Typography variant="h3">Params</Typography>
                  </Paper>
                </TabPanel>
              </Grid>
              {prebid.config?.userSync?.userIds?.map((userId, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={3}>
                    <Paper sx={{ height: 1 }}>
                      <Typography variant="body1" sx={{ p: 0.5 }}>
                        <strong>{userId.name}</strong>
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={2}>
                    <Paper sx={{ height: 1 }}>
                      <Typography variant="body1" sx={{ p: 0.5 }}>
                        {userId.storage?.type}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={2}>
                    <Paper sx={{ height: 1 }}>
                      <Typography variant="body1" sx={{ p: 0.5 }}>
                        {userId.storage?.expires}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={2}>
                    <Paper sx={{ height: 1 }}>
                      <Typography variant="body1" sx={{ p: 0.5 }}>
                        {userId.storage?.name}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={3}>
                    <Paper sx={{ height: 1 }}>
                      {userId.params && JSON.stringify(userId.params) !== '{}' && (
                        <JSONViewerComponent
                          src={userId.params}
                          name={false}
                          collapsed={2}
                          displayObjectSize={false}
                          displayDataTypes={false}
                          sortKeys={false}
                          quotesOnKeys={false}
                          indentWidth={2}
                          collapseStringsAfterLength={100}
                          style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                        />
                      )}
                    </Paper>
                  </Grid>
                </React.Fragment>
              ))}
            </React.Fragment>
          )}
        </Grid>
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        <Grid container direction="row" justifyContent="space-evenly">
          <Grid item sx={{ p: 1 }}>
            <Paper elevation={1}>
              <Typography variant="h1" sx={{ p: 1 }}>
                No User IDs detected
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
};

interface IUserIdsComponentProps {
  prebid: IPrebidDetails;
}

export default UserIdsComponent;
