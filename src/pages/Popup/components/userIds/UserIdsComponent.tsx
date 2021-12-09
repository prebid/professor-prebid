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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

// Styles
const paperElevation = 2;
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#FFF',
  width: '115%',
  height: '120%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: '#000',
  fontFamily: 'Roboto',
  fontSize: '15px',
  fontWeight: 'bold',
}));
const UserIdsComponent = ({ prebid }: IUserIdsComponentProps): JSX.Element => {
  logger.log(`[PopUp][UserIdsComponent]: render `);
  if (prebid.eids && prebid.eids[0]) {
    return (
      <Box sx={{ backgroundColor: '#87CEEB', opacity: 0.8, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper
          elevation={5}
          sx={{
            m: 1,
            borderRadius: 2,
            textAlign: 'center',
            minWidth: 100,
          }}
        >
          <Typography sx={{ padding: '2%' }}>
            <strong>User IDs</strong>
          </Typography>
          <TableContainer>
            <Table sx={{ maxWidth: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Source</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Atype</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prebid.eids?.map((eid) =>
                  eid.uids.map((uid, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <strong>{eid.source}</strong>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{uid.id}</TableCell>
                      <TableCell>{uid.atype}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <br />
          {prebid.config?.userSync?.userIds && prebid.config?.userSync?.userIds[0] && (
            <Typography variant="subtitle1" sx={{ padding: '2%' }}>
              Config
            </Typography>
          )}
          {/* <TableContainer>
          <Table>
            <TableBody>
              {prebid.config?.userSync?.userIds?.map((userId, index) => (
                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>{userId.name}</TableCell>
                  <TableCell>Storage Type</TableCell>
                  <TableCell>{userId.storage?.type}</TableCell>
                  <TableCell>Storage Expires</TableCell>
                  <TableCell>{userId.storage?.expires}</TableCell>
                  <TableCell>Storage Name</TableCell>
                  <TableCell>{userId.storage?.name}</TableCell>
                  <TableCell>Params</TableCell>
                  <TableCell>
                    <ReactJson
                      src={userId.params}
                      name={false}
                      collapsed={false}
                      enableClipboard={false}
                      displayObjectSize={false}
                      displayDataTypes={false}
                      sortKeys={false}
                      quotesOnKeys={false}
                      indentWidth={2}
                      collapseStringsAfterLength={100}
                      style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer> */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Storage Type</TableCell>
                  <TableCell>Storage Expires</TableCell>
                  <TableCell>Storage Name</TableCell>
                  <TableCell>Params</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prebid.config?.userSync?.userIds?.map((userId, index) => (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <strong>{userId.name}</strong>
                    </TableCell>
                    <TableCell>{userId.storage?.type}</TableCell>
                    <TableCell>{userId.storage?.expires}</TableCell>
                    <TableCell>{userId.storage?.name}</TableCell>
                    <TableCell>
                      {JSON.stringify(userId.params) !== '{}' && (
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
        </Paper>
      </Box>
    );
  } else {
    return (
      <Card>
        <CardContent sx={{ backgroundColor: '#87CEEB', opacity: 0.8 }}>
          <Grid container direction="row" justifyContent="space-evenly">
            <Grid item>
              <StyledPaper elevation={paperElevation}>
                <StyledTypography sx={{ fontSize: '18px', fontWeight: 'bold' }}>No User IDs detected</StyledTypography>
              </StyledPaper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }
};

interface IUserIdsComponentProps {
  prebid: IPrebidDetails;
}

export default UserIdsComponent;
