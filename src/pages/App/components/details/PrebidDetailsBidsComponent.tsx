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
import DataTreeView from '../DataTreeViewComponent'

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
                  <TableCell>Status</TableCell>
                  <TableCell>MediaType</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Net. Revenue</TableCell>
                  <TableCell>TTL</TableCell>
                  <TableCell>Meta</TableCell>
                  <TableCell>Adserver Targeting</TableCell>
                  {/* <TableCell>dealId</TableCell>
                  <TableCell>Params</TableCell>
                  <TableCell>adId</TableCell>
                  <TableCell>requestId</TableCell>
                  <TableCell>Creative Id</TableCell>
                  <TableCell>Auction Id</TableCell>
                  <TableCell>responseTimestamp</TableCell>
                  <TableCell>requestTimestamp</TableCell>
                  <TableCell>Ad Url</TableCell>
                  <TableCell>Ad</TableCell>
                  <TableCell>pbLg</TableCell>
                  <TableCell>pbMg</TableCell>
                  <TableCell>pbHg</TableCell>
                  <TableCell>pbAg</TableCell>
                  <TableCell>pbDg</TableCell>
                  <TableCell>pbCg</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{bid.bidder}</TableCell>
                  <TableCell>{Math.floor(bid.originalCpm * 100) / 100}</TableCell>
                  <TableCell>{bid.originalCurrency}</TableCell>
                  <TableCell>{bid.timeToRespond}</TableCell>
                  <TableCell>{bid.statusMessage}</TableCell>
                  <TableCell>{bid.status}</TableCell>
                  <TableCell>{JSON.stringify(bid.mediaType)}</TableCell>
                  <TableCell>{bid.source}</TableCell>
                  <TableCell>{JSON.stringify(bid.netRevenue)}</TableCell>
                  <TableCell>{bid.ttl}</TableCell>
                  <TableCell>
                    {/* {JSON.stringify(bid.meta)} */}
                    <DataTreeView treeItems={bid.meta}></DataTreeView>
                  </TableCell>
                  <TableCell>{JSON.stringify(bid.params)}</TableCell>
                  <TableCell>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
                      {bid.adserverTargeting && Object.keys(bid.adserverTargeting).map(key =>
                        <Chip key={key} label={key + ': ' + bid.adserverTargeting[key]} variant="outlined" size="small" />
                      )}</Stack>
                  </TableCell>
                  {/* 
                  <TableCell>{bid.dealId}</TableCell>
                  <TableCell>{bid.adId}</TableCell>
                  <TableCell>{bid.requestId}</TableCell>
                  <TableCell>{bid.creativeId}</TableCell>
                  <TableCell>{bid.auctionId}</TableCell>
                  <TableCell>{bid.responseTimestamp}</TableCell>
                  <TableCell>{bid.requestTimestamp}</TableCell>
                  <TableCell><a href={bid.adUrl}>click</a></TableCell>
                  <TableCell>{bid.ad}</TableCell>
                  <TableCell>{bid.pbLg}</TableCell>
                  <TableCell>{bid.pbMg}</TableCell>
                  <TableCell>{bid.pbHg}</TableCell>
                  <TableCell>{bid.pbAg}</TableCell>
                  <TableCell>{bid.pbDg}</TableCell>
                  <TableCell>{bid.pbCg}</TableCell> */}
                </TableRow>
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  )
}

const PrebidDetailsBidsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const bidsReceived = prebid.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.bidsReceived).flat() || [];
  const noBids = prebid.events.filter(event => event.eventType === 'auctionEnd').map(event => event.args.noBids).flat() || [];
  return (
    <Box>
      <Typography><strong>Received Bids</strong></Typography>
      <TableContainer sx={{ width: '100%' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Bidder Code</TableCell>
              <TableCell>Wwidth</TableCell>
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

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsBidsComponent;
