import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const PrebidDetailsSlotsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const adUnits = prebid?.events?.filter(event => event.eventType === 'auctionEnd').map(event => event.args.adUnits).flat() || [];
  return (
    <Box>
      <Typography><strong>Prebid Slots</strong></Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>code</TableCell>
              <TableCell align="right">mediaTypes</TableCell>
              <TableCell align="right">bid</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adUnits.map((adUnit, index) => (
              <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">{adUnit.code}</TableCell>
                <TableCell align="right">{JSON.stringify(adUnit.mediaTypes)}</TableCell>
                <TableCell align="right">

                  <table width="100%">
                    <thead>
                      <tr>
                        <th>adId</th>
                        <th>bidder</th>
                        <th>cpm</th>
                        <th>params</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adUnit.bids.map((bid, index) =>
                        <tr key={index}>
                          <td key="adId">{bid.adId}</td>
                          <td key="bidder">{bid.bidder}</td>
                          <td key="cpm">{bid.cpm}</td>
                          <td key="params">{JSON.stringify(bid.params)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
};

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsSlotsComponent;
