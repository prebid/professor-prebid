import {
  IPrebidDetails,
  IPrebidBidRequestedEventData,
  IPrebidAuctionEndEventData,
  IPrebidBidResponseEventData,
  IPrebidNoBidEventData,
  IPrebidBidderRequest,
} from '../../../../inject/scripts/prebid';
import React, { useEffect, useRef } from 'react';
import { createRangeArray } from '../../../../utils';
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
import Paper from '@mui/material/Paper';
import { makeStyles } from '@mui/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';

const useStyles = makeStyles({
  root: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    '& .chart-values': {
      listStyleType: 'none',
      paddingLeft: 'unset',
      paddingTop: 'unset',
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
      height: '100%',
      width: '100%',
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
      color: 'rgb(25, 118, 210)',
      border: 'rgb(25, 118, 210) 1px solid',
      backgroundColor: 'white',
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

const getNearestGridBarElement = (input: number, gridRef: React.MutableRefObject<any>) => {
  const allGridBarsCollection = gridRef?.current?.children;
  const allGridBarsArray = Array.from(allGridBarsCollection || []) as HTMLLIElement[];
  const nearestGridBar = allGridBarsArray.sort(
    (a, b) => Math.abs(Number(a.dataset.timestamp) - input) - Math.abs(Number(b.dataset.timestamp) - input)
  )[0] as HTMLElement;
  return nearestGridBar;
};

const findEvent = (bidderRequest: IPrebidBidderRequest, eventType: string) => (
  event: IPrebidBidRequestedEventData | IPrebidAuctionEndEventData | IPrebidBidResponseEventData | IPrebidNoBidEventData
) => {
  return (
    event.eventType === eventType &&
    event.args.auctionId === bidderRequest.auctionId &&
    ((event as IPrebidBidRequestedEventData).args.bidderCode === bidderRequest.bidderCode ||
      (event as IPrebidBidRequestedEventData).args.bidder === bidderRequest.bidderCode)
  );
};

const GanttChartComponent = ({ prebid, auctionEndEvent }: IGanttChartComponentProps): JSX.Element => {
  const prebidEvents = prebid.events || [];
  const gridStep = (auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp) / 100;
  const classes = useStyles();
  const gridRef = useRef(null);
  const [bidderArray, setBidderArray] = React.useState<ITableRow[]>([]);
  const [rangeArray, setRangeArray] = React.useState<number[]>([]);
  const [expanded, setExpanded] = React.useState(false);

  useEffect(() => {
    setRangeArray(createRangeArray(auctionEndEvent.args.timestamp, auctionEndEvent.args.auctionEnd, gridStep));
    setBidderArray(
      auctionEndEvent.args.bidderRequests
        .sort((a, b) => a.start - b.start)
        .map((bidderRequest) => {
          const { bidderCode, start } = bidderRequest;
          const bidRequestEvent = prebidEvents.find(findEvent(bidderRequest, 'bidRequested')) as IPrebidBidRequestedEventData;
          const bidResponseEvent = prebidEvents.find(findEvent(bidderRequest, 'bidResponse')) as IPrebidBidResponseEventData;
          const noBidEvent = prebidEvents.find(findEvent(bidderRequest, 'noBid')) as IPrebidNoBidEventData;
          const end = bidResponseEvent
            ? bidResponseEvent.args.responseTimestamp
            : Math.floor(bidderRequest.start + noBidEvent?.elapsedTime - bidRequestEvent?.elapsedTime);
          const startGridBar = getNearestGridBarElement(bidderRequest.start, gridRef);
          const endGridBar = getNearestGridBarElement(end, gridRef);
          const left = startGridBar?.offsetLeft;
          const width = endGridBar?.offsetLeft + endGridBar?.offsetWidth - left;
          return { bidderCode, left, width, start, end };
        })
    );
  }, [auctionEndEvent.args.bidderRequests, gridRef.current?.children]);

  return (
    <Card sx={{ width: 1, maxWidth: 1 }}>
      <CardContent>
        <Box
          sx={{
            color: 'rgb(25, 118, 210) ',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <Typography variant="subtitle1">Auction Start: {new Date(auctionEndEvent.args.timestamp).toLocaleTimeString()}</Typography>
          <Typography variant="subtitle1">Auction Time: {auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp}</Typography>
          <Typography variant="subtitle1">Auction End: {new Date(auctionEndEvent.args.auctionEnd).toLocaleTimeString()} </Typography>
        </Box>
        <Box className={classes.root} onClick={() => setExpanded(!expanded)}>
          <List className="chart-values" ref={gridRef} dense={true}>
            {rangeArray.map((val, index) => (
              <ListItem key={index} {...{ 'data-timestamp': val }}></ListItem>
            ))}
          </List>
          <List className="chart-bars" dense={true}>
            {bidderArray.map((item, index) => (
              <ListItem style={{ width: `${item.width}px`, left: `${item.left}px`, whiteSpace: 'nowrap', paddingLeft: '5px' }} key={index}>
                {`${item.bidderCode}: ${item.end - item.start}ms`}
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <TableContainer>
            <Paper>
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
                  {bidderArray.map((item, index) => (
                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>{item.bidderCode}</TableCell>
                      <TableCell>{item.start}</TableCell>
                      <TableCell>{item.end}</TableCell>
                      <TableCell>{item.end - item.start}ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </TableContainer>
        </CardContent>
      </Collapse>
    </Card>
  );
};

interface IGanttChartComponentProps {
  prebid: IPrebidDetails;
  auctionEndEvent: IPrebidAuctionEndEventData;
}

interface ITableRow {
  bidderCode: string;
  start: number;
  end: number;
  left: number;
  width: number;
}

export default GanttChartComponent;
