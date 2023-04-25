import { IGoogleAdManagerDetails } from '../../../Content/scripts/googleAdManager';
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
class GoogleAdManagerDetailsComponent extends React.Component<IGoogleAdManagerDetailsComponentProps> {
  render() {
    const { googleAdManager } = this.props;
    return (
      <Box>
        <Typography>
          <strong>Request Mode: </strong>
          {googleAdManager?.sra ? 'Single Request Architecture' : 'something else like Multi Request Architecture? '}
        </Typography>
        <Typography>
          <strong>Render Mode: </strong>
          {googleAdManager?.async ? 'Asynchronous' : 'Synchronous'}
        </Typography>
        <Typography>
          <strong>Fetch Before Request: </strong>
          {googleAdManager?.fetchBeforeRefresh ? 'YES' : 'NO'}
        </Typography>
        <Typography>
          <strong>Fetch Before Key/Value: </strong>
          {googleAdManager?.fetchBeforeKeyvalue ? 'YES' : 'NO'}
        </Typography>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>ElementId</TableCell>
                <TableCell align="right">CreativeRenderTime</TableCell>
                <TableCell align="right">Name</TableCell>
                <TableCell align="right">Sizes</TableCell>
                <TableCell align="right">Targeting</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {googleAdManager?.slots.map((slot, index) => (
                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {slot.elementId}
                  </TableCell>
                  <TableCell align="right">{slot.creativeRenderTime}</TableCell>
                  <TableCell align="right">{slot.name}</TableCell>
                  <TableCell align="right">
                    <List dense={true}>
                      {slot.sizes.map((size, index) => (
                        <ListItem key={index}>{size}</ListItem>
                      ))}
                    </List>
                  </TableCell>
                  <TableCell align="right">
                    <List dense={true}>
                      {slot.targeting.map((targeting, index) => (
                        <ListItem key={index}>
                          <Typography>
                            <strong>{targeting.key}: </strong>
                            {targeting.value}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }
}
interface IGoogleAdManagerDetailsComponentProps {
  googleAdManager: IGoogleAdManagerDetails;
}

export default GoogleAdManagerDetailsComponent;
