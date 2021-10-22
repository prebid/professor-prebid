import './GanttChartComponent.scss';
import { IPrebidDetails, IBidderEvent } from "../../../../inject/scripts/prebid";
import { IGoogleAdManagerDetails } from "../../../../inject/scripts/googleAdManager";
import React, { useEffect, useRef } from 'react';
import { createRangeArray, getMinAndMaxNumber } from '../../../../utils';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const GanttChartComponent = ({ prebid, auctionEndEvent }: IGanttChartComponentProps): JSX.Element => {
  const gridRef = useRef(null)
  const prebidEvents = prebid?.events || [];
  const gridStep = 10;
  const tableRows: any[] = [];
  const [open, setOpen] = React.useState(false);

  const createGridBarElements = () => {
    const min = auctionEndEvent.args.timestamp;
    const max = auctionEndEvent.args.auctionEnd;
    return createRangeArray(min, max, gridStep).map((val, index) =>
      <ListItem key={index} {...{ 'data-timestamp': val }}>
      </ListItem>
    )
  }

  const getGridBarElement = (input: number) => {
    const allGridBarsCollection = gridRef?.current?.children as HTMLCollection;
    const allGridBarsArray = Array.from(allGridBarsCollection || []);
    const nearestGridBar = allGridBarsArray.sort((a: any, b: any) => Math.abs(Number(a.dataset.timestamp) - input) - Math.abs(Number(b.dataset.timestamp) - input))[0] as HTMLElement;
    return nearestGridBar;
  }

  const createBidderRowElements = () => {
    return auctionEndEvent.args.bidderRequests
      .sort((a, b) => a.start - b.start)
      .map((bidderRequest, index) => {
        const bidRequestEvent = prebidEvents.find(event =>
          event.eventType === 'bidRequested'
          && event.args.auctionId === bidderRequest.auctionId
          && (
            event.args.bidderCode === bidderRequest.bidderCode || event.args.bidder === bidderRequest.bidderCode
          ));

        const bidResponseEvent = prebidEvents.find(event =>
          event.eventType === 'bidResponse'
          && event.args.auctionId === bidderRequest.auctionId
          && (
            event.args.bidderCode === bidderRequest.bidderCode || event.args.bidder === bidderRequest.bidderCode
          ));

        const noBidEvent = prebidEvents.find(event =>
          event.eventType === 'noBid'
          && event.args.auctionId === bidderRequest.auctionId
          && (
            event.args.bidderCode === bidderRequest.bidderCode || event.args.bidder === bidderRequest.bidderCode
          ));

        const endTimestamp = bidResponseEvent ? bidResponseEvent.args.responseTimestamp : Math.floor(bidderRequest.start + noBidEvent?.elapsedTime - bidRequestEvent?.elapsedTime);
        const startGridBar = getGridBarElement(bidderRequest.start);
        const endGridBar = getGridBarElement(endTimestamp);
        const left = startGridBar?.offsetLeft;
        const width = endGridBar?.offsetLeft + endGridBar?.offsetWidth - left;
        tableRows.push({
          bidderCode: bidderRequest.bidderCode,
          startTimeStamp: bidderRequest.start,
          endTimestamp,
          left,
          width
        });
        return (
          <ListItem key={index} style={{ width: `${width}px`, left: `${left}px` }}>
            <Typography>{bidderRequest.bidderCode}: {endTimestamp - bidderRequest.start}ms</Typography>
          </ListItem>
        )
      }
      );
  }

  return (
    auctionEndEvent.args.bidderRequests[0] ?
      <React.Fragment>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Auction Start: {new Date(auctionEndEvent.args.timestamp).toISOString()}</TableCell>
                <TableCell >Auction Time: {auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp}</TableCell>
                <TableCell >Auction End: {new Date(auctionEndEvent.args.auctionEnd).toISOString()} </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow onClick={() => setOpen(!open)}>
                <TableCell colSpan={3}>
                  <Box className="chart-wrapper">
                    <List className="chart-values" ref={gridRef}>
                      {createGridBarElements()}
                    </List>
                    <List className="chart-bars">
                      {createBidderRowElements()}
                    </List>
                  </Box>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3}>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box >
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Bidder</TableCell>
                            <TableCell>Request Timestamp</TableCell>
                            <TableCell>Response Timestamp</TableCell>
                            <TableCell>Response Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tableRows.map((row, index) =>
                            <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                              <TableCell>{row.bidderCode}</TableCell>
                              <TableCell>{row.startTimeStamp}</TableCell>
                              <TableCell>{row.endTimestamp}</TableCell>
                              <TableCell>{row.endTimestamp - row.startTimeStamp}ms</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
              <TableRow></TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </React.Fragment>
      :
      <span></span>
  );
};

interface IGanttChartComponentProps {
  prebid: IPrebidDetails;
  auctionEndEvent: IBidderEvent;
}

export default GanttChartComponent;
