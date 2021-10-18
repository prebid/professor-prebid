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

const PrebidDetailsBidsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const bidsReceived = prebid?.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.bidsReceived).flat() || [];
  const noBids = prebid?.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.noBids).flat() || [];
  return (
    <Box>
      <Typography><strong>Received Bids</strong></Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>bidderCode</TableCell>
              <TableCell align="right">width</TableCell>
              <TableCell align="right">height</TableCell>
              <TableCell align="right">statusMessage</TableCell>
              <TableCell align="right">adId</TableCell>
              <TableCell align="right">requestId</TableCell>
              <TableCell align="right">mediaType</TableCell>
              <TableCell align="right">source</TableCell>
              <TableCell align="right">cpm</TableCell>
              <TableCell align="right">currency</TableCell>
              <TableCell align="right">netRevenue</TableCell>
              <TableCell align="right">ttl</TableCell>
              <TableCell align="right">creativeId</TableCell>
              <TableCell align="right">dealId</TableCell>
              <TableCell align="right">originalCpm</TableCell>
              <TableCell align="right">originalCurrency</TableCell>
              <TableCell align="right">meta</TableCell>
              <TableCell align="right">auctionId</TableCell>
              <TableCell align="right">responseTimestamp</TableCell>
              <TableCell align="right">requestTimestamp</TableCell>
              <TableCell align="right">bidder</TableCell>
              <TableCell align="right">adUnitCode</TableCell>
              <TableCell align="right">timeToRespond</TableCell>
              <TableCell align="right">pbLg</TableCell>
              <TableCell align="right">pbMg</TableCell>
              <TableCell align="right">pbHg</TableCell>
              <TableCell align="right">pbAg</TableCell>
              <TableCell align="right">pbDg</TableCell>
              <TableCell align="right">pbCg</TableCell>
              <TableCell align="right">size</TableCell>
              <TableCell align="right">adserverTargeting</TableCell>
              <TableCell align="right">status</TableCell>
              <TableCell align="right">adUrl</TableCell>
              <TableCell align="right">params</TableCell>
              <TableCell align="right">ad</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bidsReceived.map((bid, index) => (
              <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell align="right">{bid.bidderCode}</TableCell>
                <TableCell align="right">{bid.width}</TableCell>
                <TableCell align="right">{bid.height}</TableCell>
                <TableCell align="right">{bid.statusMessage}</TableCell>
                <TableCell align="right">{bid.adId}</TableCell>
                <TableCell align="right">{bid.requestId}</TableCell>
                <TableCell align="right">{bid.mediaType}</TableCell>
                <TableCell align="right">{bid.source}</TableCell>
                <TableCell align="right">{bid.cpm}</TableCell>
                <TableCell align="right">{bid.currency}</TableCell>
                <TableCell align="right">{JSON.stringify(bid.netRevenue)}</TableCell>
                <TableCell align="right">{bid.ttl}</TableCell>
                <TableCell align="right">{bid.creativeId}</TableCell>
                <TableCell align="right">{bid.dealId}</TableCell>
                <TableCell align="right">{bid.originalCpm}</TableCell>
                <TableCell align="right">{bid.originalCurrency}</TableCell>
                <TableCell align="right">{JSON.stringify(bid.meta)}</TableCell>
                <TableCell align="right">{bid.auctionId}</TableCell>
                <TableCell align="right">{bid.responseTimestamp}</TableCell>
                <TableCell align="right">{bid.requestTimestamp}</TableCell>
                <TableCell align="right">{bid.bidder}</TableCell>
                <TableCell align="right">{bid.adUnitCode}</TableCell>
                <TableCell align="right">{bid.timeToRespond}</TableCell>
                <TableCell align="right">{bid.pbLg}</TableCell>
                <TableCell align="right">{bid.pbMg}</TableCell>
                <TableCell align="right">{bid.pbHg}</TableCell>
                <TableCell align="right">{bid.pbAg}</TableCell>
                <TableCell align="right">{bid.pbDg}</TableCell>
                <TableCell align="right">{bid.pbCg}</TableCell>
                <TableCell align="right">{bid.size}</TableCell>
                <TableCell align="right">{JSON.stringify(bid.adserverTargeting)}</TableCell>
                <TableCell align="right">{bid.status}</TableCell>
                <TableCell align="right">{bid.adUrl}</TableCell>
                <TableCell align="right">{JSON.stringify(bid.params)}</TableCell>
                <TableCell align="right">{bid.ad}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography><strong>No Bids</strong></Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>auctionId</TableCell>
              <TableCell align="right">bidder</TableCell>
              <TableCell align="right">adUnitCode</TableCell>
              <TableCell align="right">params</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {noBids.map((bid, index) => (
              <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">{bid.auctionId}</TableCell>
                <TableCell align="right">{bid.bidder}</TableCell>
                <TableCell align="right">{bid.adUnitCode}</TableCell>
                <TableCell align="right">{JSON.stringify(bid.params)}</TableCell>
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

export default PrebidDetailsBidsComponent;
