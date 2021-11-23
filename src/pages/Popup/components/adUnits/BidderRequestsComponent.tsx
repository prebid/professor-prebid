import { IPrebidAuctionEndEventData, IPrebidDetails } from '../../../../inject/scripts/prebid';
import React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const BidderRequestsComponent = ({ prebid }: IBidderRequestsComponentProps): JSX.Element => {
  const auctionEndEvents = (prebid?.events.filter((event) => event.eventType === 'auctionEnd') || []) as IPrebidAuctionEndEventData[];
  return (
    <Box>
      {auctionEndEvents.map((event, index) => (
        <Box key={index}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bidder</TableCell>
                  <TableCell align="right">Request Timestamp</TableCell>
                  <TableCell align="right">Response Timestamp</TableCell>
                  <TableCell align="right">Response Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {event.args.bidderRequests.map((bidderRequest, index) => {
                  const maxBidReceivedResponseTimestamp = event.args.bidsReceived
                    .filter((bid) => bid.bidderCode === bidderRequest.bidderCode)
                    .map((bid) => bid.responseTimestamp)
                    .reduce((previous, value) => (previous > value ? previous : value), 0);

                  const maxTimeToRespondTimestamp = event.args.bidsReceived
                    .filter((bid) => bid.bidderCode === bidderRequest.bidderCode)
                    .map((bid) => bid.timeToRespond)
                    .reduce((previous, value) => (previous > value ? previous : value), 0);

                  return (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell align="right">{bidderRequest.bidderCode}</TableCell>
                      <TableCell align="right">{bidderRequest.start}</TableCell>
                      <TableCell align="right">{maxBidReceivedResponseTimestamp}</TableCell>
                      <TableCell align="right">{maxTimeToRespondTimestamp}ms</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
};
interface IBidderRequestsComponentProps {
  prebid: IPrebidDetails;
}

export default BidderRequestsComponent;
