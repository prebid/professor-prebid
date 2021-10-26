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
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Chip from '@mui/material/Chip';

const Row = ({ bid }: any) => {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{bid.bidderCode}</TableCell>
        <TableCell>{bid.width}</TableCell>
        <TableCell>{bid.height}</TableCell>
        <TableCell>{bid.cpm ? (Math.floor(bid.cpm * 100) / 100) : bid.cpm}</TableCell>
        <TableCell>{bid.currency}</TableCell>
        <TableCell>{bid.adUnitCode}</TableCell>
        <TableCell>{bid.size}</TableCell>
      </TableRow>
      <TableRow>
        {/* <TableCell></TableCell> */}
        <TableCell colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Bidder</TableCell>
                  <TableCell>Org. Cpm</TableCell>
                  <TableCell>Org. Currency</TableCell>
                  <TableCell>Time to Respond</TableCell>
                  <TableCell>Status Message</TableCell>
                  <TableCell>Media Type</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>TTL</TableCell>
                  <TableCell>Adserver Targeting</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{bid.bidder}</TableCell>
                  <TableCell>{Math.floor(bid.originalCpm * 100) / 100}</TableCell>
                  <TableCell>{bid.originalCurrency}</TableCell>
                  <TableCell>{bid.timeToRespond}</TableCell>
                  <TableCell>{bid.statusMessage}</TableCell>
                  <TableCell>{bid.mediaType}</TableCell>
                  <TableCell>{bid.source}</TableCell>
                  <TableCell>{bid.ttl}</TableCell>
                  <TableCell>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px', }}>
                      {bid.adserverTargeting && Object.keys(bid.adserverTargeting).map(key =>
                        <Chip key={key} label={key + ': ' + bid.adserverTargeting[key]} variant="outlined" size="small" sx={{ maxWidth: '110px' }} />
                      )}</Stack>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  )
}

const BidsComponent = ({ prebid }: IBidsComponentProps): JSX.Element => {
  const bidsReceived = prebid.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.bidsReceived).flat() || [];
  const noBids = prebid.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.noBids).flat() || [];
  return (
    <Box>
      <Typography><strong>Received Bids</strong></Typography>
      <TableContainer sx={{ width: '100%', maxWidth: '100%' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Bidder Code</TableCell>
              <TableCell>Width</TableCell>
              <TableCell>Height</TableCell>
              <TableCell>Cpm</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>AdUnit Code</TableCell>
              <TableCell>Size</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bidsReceived.map((bid, index) =>
              <Row key={index} bid={bid} />
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography><strong>No Bids</strong></Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>auctionId</TableCell>
              <TableCell>bidder</TableCell>
              <TableCell>adUnitCode</TableCell>
              <TableCell>params</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {noBids.map((bid, index) => (
              <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">{bid.auctionId}</TableCell>
                <TableCell>{bid.bidder}</TableCell>
                <TableCell>{bid.adUnitCode}</TableCell>
                <TableCell><Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                  {bid.params && Object.keys(bid.params).map((key: any) =>
                    <Chip key={key} label={key + ': ' + JSON.stringify(bid.params[key])} variant="outlined" size="small" />
                  )}</Stack></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
};

interface IBidsComponentProps {
  prebid: IPrebidDetails;
}

export default BidsComponent;
