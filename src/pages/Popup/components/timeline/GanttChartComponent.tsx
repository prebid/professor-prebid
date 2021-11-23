import {
  IPrebidDetails,
  IPrebidBidRequestedEventData,
  IPrebidAuctionEndEventData,
  IPrebidBidResponseEventData,
  IPrebidNoBidEventData,
} from '../../../../inject/scripts/prebid';
import { IGoogleAdManagerDetails } from '../../../../inject/scripts/googleAdManager';
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
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    '& .chart-values': {
      listStyleType: 'none',
      paddingLeft: 'unset',
      height: '100%',
      width: '100%',
      maxWidth: '100%',
      position: 'absolute',
      display: 'flex',
      alignItems: 'stretch',
    },
    '& .chart-bars': {
      listStyleType: 'none',
      paddingLeft: 'unset',
      height: '100 %',
      width: '100 %',
      maxWidth: '100%',
    },
    '& .chart-values li': {
      flex: 1,
      textAlign: 'start',
      borderLeft: '1px dotted lightgrey',
      padding: 0,
      alignItems: 'flex-end',
    },
    '& .chart-bars li': {
      cursor: 'default',
      position: 'relative',
      color: 'darkorange',
      border: 'darkorange 1px solid',
      backgroundColor: 'lightgrey',
      marginBottom: '15px',
      fontSize: '14px',
      borderRadius: '10px',
      padding: '10px 0px',
      width: 0,
      height: '10px',
      opacity: 1,
      transition: ' all 0.25s linear 0.2s',
      '& div': {
        marginLeft: '10px',
      },
    },
  },
});

const GanttChartComponent = ({ prebid, auctionEndEvent }: IGanttChartComponentProps): JSX.Element => {
  const classes = useStyles();
  const gridRef = useRef(null);
  const prebidEvents = prebid?.events || [];
  const gridStep = 10;
  const tableRows: ITableRow[] = [];
  const [open, setOpen] = React.useState(false);

  const createGridBarElements = () => {
    const min = auctionEndEvent.args.timestamp;
    const max = auctionEndEvent.args.auctionEnd;
    return createRangeArray(min, max, gridStep).map((val, index) => <ListItem key={index} {...{ 'data-timestamp': val }}></ListItem>);
  };

  const getGridBarElement = (input: number) => {
    const allGridBarsCollection = gridRef?.current?.children;
    const allGridBarsArray = Array.from(allGridBarsCollection || []) as HTMLLIElement[];
    const nearestGridBar = allGridBarsArray.sort(
      (a, b) => Math.abs(Number(a.dataset.timestamp) - input) - Math.abs(Number(b.dataset.timestamp) - input)
    )[0] as HTMLElement;
    return nearestGridBar;
  };

  const createBidderRowElements = () => {
    return (auctionEndEvent as IPrebidAuctionEndEventData).args.bidderRequests
      .sort((a, b) => a.start - b.start)
      .map((bidderRequest, index) => {
        const bidRequestEvent = prebidEvents.find(
          (event) =>
            event.eventType === 'bidRequested' &&
            event.args.auctionId === bidderRequest.auctionId &&
            ((event as IPrebidBidRequestedEventData).args.bidderCode === bidderRequest.bidderCode ||
              (event as IPrebidBidRequestedEventData).args.bidder === bidderRequest.bidderCode)
        );

        const bidResponseEvent = prebidEvents.find(
          (event) =>
            event.eventType === 'bidResponse' &&
            event.args.auctionId === bidderRequest.auctionId &&
            ((event as IPrebidBidResponseEventData).args.bidderCode === bidderRequest.bidderCode ||
              (event as IPrebidBidResponseEventData).args.bidder === bidderRequest.bidderCode)
        ) as IPrebidBidResponseEventData;

        const noBidEvent = prebidEvents.find(
          (event) =>
            event.eventType === 'noBid' &&
            event.args.auctionId === bidderRequest.auctionId &&
            ((event as IPrebidNoBidEventData).args.bidderCode === bidderRequest.bidderCode ||
              (event as IPrebidNoBidEventData).args.bidder === bidderRequest.bidderCode)
        );

        const endTimestamp = bidResponseEvent
          ? bidResponseEvent.args.responseTimestamp
          : Math.floor(bidderRequest.start + noBidEvent?.elapsedTime - bidRequestEvent?.elapsedTime);
        const startGridBar = getGridBarElement(bidderRequest.start);
        const endGridBar = getGridBarElement(endTimestamp);
        const left = startGridBar?.offsetLeft;
        const width = endGridBar?.offsetLeft + endGridBar?.offsetWidth - left;
        tableRows.push({
          bidderCode: bidderRequest.bidderCode,
          startTimeStamp: bidderRequest.start,
          endTimestamp,
          left,
          width,
        });
        return (
          <ListItem key={index} style={{ width: `${width}px`, left: `${left}px`, whiteSpace: 'nowrap', paddingLeft: '5px' }}>
            {`${bidderRequest.bidderCode}: ${endTimestamp - bidderRequest.start}ms`}
          </ListItem>
        );
      });
  };

  return auctionEndEvent.args.bidderRequests[0] ? (
    <React.Fragment>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Paper variant="outlined" sx={{ backgroundColor: '#a3b2b8' }}>
                  Auction Start: {new Date(auctionEndEvent.args.timestamp).toISOString()}
                </Paper>
              </TableCell>
              <TableCell>
                <Paper variant="outlined" sx={{ backgroundColor: '#a3b2b8' }}>
                  Auction Time: {auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp}
                </Paper>
              </TableCell>
              <TableCell>
                <Paper variant="outlined" sx={{ backgroundColor: '#a3b2b8' }}>
                  Auction End: {new Date(auctionEndEvent.args.auctionEnd).toISOString()}{' '}
                </Paper>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow onClick={() => setOpen(!open)}>
              <TableCell colSpan={3}>
                <Box className={classes.root}>
                  <List className="chart-values" ref={gridRef} dense={true}>
                    {createGridBarElements()}
                  </List>
                  <List className="chart-bars" dense={true}>
                    {createBidderRowElements()}
                  </List>
                </Box>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                  <Box>
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
                        {tableRows.map((row, index) => (
                          <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell>{row.bidderCode}</TableCell>
                            <TableCell>{row.startTimeStamp}</TableCell>
                            <TableCell>{row.endTimestamp}</TableCell>
                            <TableCell>{row.endTimestamp - row.startTimeStamp}ms</TableCell>
                          </TableRow>
                        ))}
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
  ) : (
    <span></span>
  );
};

interface IGanttChartComponentProps {
  prebid: IPrebidDetails;
  auctionEndEvent: IPrebidAuctionEndEventData;
}

interface ITableRow {
  bidderCode: string;
  startTimeStamp: number;
  endTimestamp: number;
  left: number;
  width: number;
}

export default GanttChartComponent;
