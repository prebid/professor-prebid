import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import React from 'react';
import Box from '@mui/material/Box';
import ReactJson from 'react-json-view';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import logger from '../../../../logger';
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
  logger.log(`[PopUp][UserIdsComponent]: render `);
  if (prebid.eids && prebid.eids[0]) {
    return (
      <React.Fragment>
        <Grid container direction="row" justifyContent="start" spacing={1} sx={{ p: 1 }}>
          <Grid item xs={12}>
            <Tabs value={value} onChange={handleChange} sx={{ minHeight: 0, '& > div > div > button': { minHeight: 0 } }}>
              <Tab
                sx={{ p: 0, justifyContent: 'flex-start' }}
                label={
                  <Typography
                    variant="h2"
                    component={Paper}
                    sx={{ p: 1, border: '1px solid', borderColor: value === 0 ? 'primary.main' : 'info.main' }}
                  >
                    User Ids
                  </Typography>
                }
              />
              <Tab
                sx={{ p: 0, justifyContent: 'flex-start' }}
                label={
                  <Typography
                    variant="h2"
                    component={Paper}
                    sx={{ p: 1, border: '1px solid', borderColor: value === 1 ? 'primary.main' : 'info.main' }}
                  >
                    Config
                  </Typography>
                }
              />
            </Tabs>
          </Grid>

          {value === 0 && (
            <Grid item xs={12}>
              <TabPanel value={value} index={0}>
                <TableContainer sx={{ maxWidth: 1, backgroundColor: 'background.paper' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="h3">Source</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h3">User ID</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h3">Atype</Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {prebid.eids?.map((eid, i) =>
                        eid.uids.map((uid, index) => (
                          <TableRow key={`${index}_${i}`}>
                            <TableCell>
                              <Typography variant="body1">
                                <strong>{eid.source}</strong>
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              <Typography variant="body1">{uid.id}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1">{uid.atype}</Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </Grid>
          )}

          {value === 1 && (
            <Grid item xs={12}>
              <TabPanel value={value} index={1}>
                {prebid.config?.userSync?.userIds && prebid.config?.userSync?.userIds[0] && (
                  <TableContainer sx={{ maxWidth: 1, backgroundColor: 'background.paper' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <Typography variant="h3">Name</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h3">Storage Type</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h3">Storage Expires</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h3">Storage Name</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="h3">Params</Typography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {prebid.config?.userSync?.userIds?.map((userId, index) => (
                          <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>
                              <Typography variant="body1">
                                <strong>{userId.name}</strong>
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1">{userId.storage?.type}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1">{userId.storage?.expires}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1">{userId.storage?.name}</Typography>
                            </TableCell>
                            <TableCell>
                              {userId.params && JSON.stringify(userId.params) !== '{}' && (
                                <ReactJson
                                  src={userId.params}
                                  name={false}
                                  collapsed={2}
                                  enableClipboard={false}
                                  displayObjectSize={false}
                                  displayDataTypes={false}
                                  sortKeys={false}
                                  quotesOnKeys={false}
                                  indentWidth={2}
                                  collapseStringsAfterLength={100}
                                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            </Grid>
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
