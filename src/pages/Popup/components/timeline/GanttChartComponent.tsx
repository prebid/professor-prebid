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
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import BidderBarComponent from './BidderBarComponent';

const getNearestGridBarElement = (input: number, gridRef: React.MutableRefObject<HTMLElement>) => {
  const allGridBarsCollection = gridRef?.current?.children;
  const allGridBarsArray = Array.from(allGridBarsCollection || []) as HTMLLIElement[];
  const nearestGridBar = allGridBarsArray.sort(
    (a, b) => Math.abs(Number(a.dataset.timestamp) - input) - Math.abs(Number(b.dataset.timestamp) - input)
  )[0] as HTMLElement;
  return nearestGridBar;
};

const findEvent = (bidderRequest: IPrebidBidderRequest, eventType: string) => (event: any) => {
  return (
    event.eventType === eventType &&
    event.args.auctionId === bidderRequest.auctionId &&
    ((event as IPrebidBidRequestedEventData).args.bidderCode === bidderRequest.bidderCode ||
      (event as IPrebidBidRequestedEventData).args.bidder === bidderRequest.bidderCode)
  );
};

const GanttChartComponent = ({ prebidEvents, auctionEndEvent }: IGanttChartComponentProps): JSX.Element => {
  const { auctionEnd, bidderRequests, timestamp } = auctionEndEvent?.args;
  const gridStep = (auctionEnd - timestamp) / (window.innerWidth / 10);
  const gridRef = useRef(null);
  const [bidderArray, setBidderArray] = React.useState<ITableRow[]>([]);
  const [rangeArray, setRangeArray] = React.useState<number[]>([]);
  const [auctionEndLeft, setAuctionEndLeft] = React.useState<number>(0);

  useEffect(() => {
    setAuctionEndLeft(getNearestGridBarElement(auctionEnd, gridRef)?.offsetLeft);
    setRangeArray(createRangeArray(timestamp, auctionEnd, gridStep, 50));
    setBidderArray(
      bidderRequests
        .sort((a, b) => a.start - b.start)
        .map((bidderRequest) => {
          const { bidderCode, start } = bidderRequest;
          const bidRequestEvent = prebidEvents.find(findEvent(bidderRequest, 'bidRequested')) as IPrebidBidRequestedEventData;
          const bidResponseEvent = prebidEvents.find(findEvent(bidderRequest, 'bidResponse')) as IPrebidBidResponseEventData;
          const noBidEvent = prebidEvents.find(findEvent(bidderRequest, 'noBid')) as IPrebidNoBidEventData;
          const end = bidResponseEvent ? bidResponseEvent?.args?.responseTimestamp : start + noBidEvent?.elapsedTime - bidRequestEvent?.elapsedTime;
          return { bidderCode, start, end, bidderRequestId: bidRequestEvent?.args?.bidderRequestId };
        })
    );
  }, [auctionEnd, bidderRequests, gridStep, prebidEvents, timestamp]);

  return (
    <Grid container direction="row" justifyContent="space-between" spacing={1} sx={{ p: 1 }}>
      <Grid item>
        <Paper sx={{ p: 1 }} elevation={1}>
          <Typography variant="h2" component="span">
            Auction ID: {auctionEndEvent.args.auctionId}
          </Typography>
        </Paper>
      </Grid>
      <Grid item>
        <Paper sx={{ p: 1 }} elevation={1}>
          <Typography variant="h2" component="span">
            Auction Start: {new Date(auctionEndEvent.args.timestamp).toLocaleTimeString()}
          </Typography>
        </Paper>
      </Grid>
      <Grid item>
        <Paper sx={{ p: 1 }} elevation={1}>
          <Typography variant="h2" component="span">
            Auction Time: {auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp} ms
          </Typography>
        </Paper>
      </Grid>
      {auctionEndEvent?.args.bidderRequests.length === 0 && (
        <Grid xs={12} item>
          <Paper sx={{ p: 1, textAlign: 'center', color: 'warning.main' }} elevation={1}>
            <Typography variant="h3">No bidder-requests in this auction!</Typography>
          </Paper>
        </Grid>
      )}
      <Grid xs={12} item>
        <Paper sx={{ p: 1, pb: 3 }} elevation={1}>
          <Box sx={{ position: 'relative', width: 1, maxWidth: 1 }}>
            <List
              ref={gridRef}
              sx={{
                height: 1,
                width: 1,
                maxWidth: 1,
                listStyleType: 'none',
                paddingLeft: 'unset',
                paddingTop: 'unset',
                position: 'absolute',
                display: 'flex',
                alignItems: 'stretch',
              }}
            >
              {rangeArray.map((val, index) => {
                const isZero = Math.floor(val - auctionEndEvent.args.timestamp) === 0;
                const isAuctionEnd = Math.floor(val - auctionEndEvent.args.auctionEnd) === 0;
                const isLabeled = index % 10 === 0 || isAuctionEnd;
                return (
                  <ListItem
                    {...{ 'data-timestamp': Math.round(val) }}
                    key={index}
                    sx={{
                      display: 'flex',
                      borderLeft: '1px dotted lightgrey',
                      borderColor: isZero || isAuctionEnd ? 'warning.main' : 'text.secondary',
                      p: 0,
                      alignItems: 'flex-end',
                    }}
                  >
                    {(isLabeled || isZero) && (
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          color: isZero || isAuctionEnd ? 'warning.main' : 'text.secondary',
                          transform: 'rotate(45deg) translate(10px, 15px)',
                          position: 'absolute',
                        }}
                      >
                        {Math.floor(val - auctionEndEvent.args.timestamp)}
                      </Typography>
                    )}
                  </ListItem>
                );
              })}
            </List>
            <List sx={{ listStyleType: 'none', paddingLeft: 'unset', height: 1, width: 1, maxWidth: 1 }}>
              {bidderArray.map((item, index) => (
                <BidderBarComponent item={item} auctionEndLeft={auctionEndLeft} auctionEndEvent={auctionEndEvent} key={index} gridRef={gridRef} />
              ))}
            </List>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

interface IGanttChartComponentProps {
  prebidEvents: IPrebidDetails['events'];
  auctionEndEvent: IPrebidAuctionEndEventData;
}

interface ITableRow {
  bidderCode: string;
  start: number;
  end: number;
  bidderRequestId: string;
}

export default GanttChartComponent;