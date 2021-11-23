import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const UserIdsComponent = ({ prebid }: IUserIdsComponentProps): JSX.Element => {
  return (
    <Box>
      {prebid.eids && prebid.eids[0] && (
        <Typography>
          <strong>User IDs</strong>
        </Typography>
      )}
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
        <Typography>
          <strong>Config</strong>
        </Typography>
      )}
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
                <TableCell><pre>{JSON.stringify(userId.params, null, 4)}</pre></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

interface IUserIdsComponentProps {
  prebid: IPrebidDetails;
}

export default UserIdsComponent;
